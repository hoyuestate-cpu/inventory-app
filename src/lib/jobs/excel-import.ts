// これまで使っていた工事リストのエクセルの読み取り。
// - 「R8.9.21～」のような月のシート … 1行＝1工事。シート名からJDLへ送った月が分かる
// - 「工事種別一覧」シート … 番号と工事名の台帳。月のシートにない番号は「送らない」工事として取り込む
// 「原本」「最終工事番号一覧」「CSVデータ（サンプル)」は読まない（アプリが自動で作るため）。

import { isValidWorkNo, kindOf, JOB_KINDS } from '@/lib/kinds';
import { periodFromSheetName } from '@/lib/period';
import { parseSheetDate } from '@/lib/wareki';

type Cell = unknown;
export type Sheet = { sheet: string; data: Cell[][] };

export type ImportedJob = {
  workNo: string;
  kind: string;
  name: string;
  clientCode: string | null;
  clientName: string | null;
  contractDate: Date | null;
  startDate: Date | null;
  plannedDate: Date | null;
  completedDate: Date | null;
  amount: number | null;
  period: string | null;
  source: string; // 読み取ったシート名
};

export type ParsedWorkbook = {
  jobs: ImportedJob[];
  sheets: { name: string; period: string | null; count: number }[];
  problems: string[];
};

function text(c: Cell): string | null {
  if (c === null || c === undefined) return null;
  const s = String(c).trim();
  return s === '' ? null : s;
}

function workNoOf(c: Cell): string | null {
  if (typeof c === 'number' && Number.isInteger(c)) return isValidWorkNo(String(c)) ? String(c) : null;
  const s = text(c)?.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
  return s && isValidWorkNo(s) ? s : null;
}

function amountOf(c: Cell): number | null | 'invalid' {
  if (c === null || c === undefined || c === '') return null;
  if (typeof c === 'number') return Number.isFinite(c) ? Math.round(c) : 'invalid';
  const s = String(c)
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[,，円\s]/g, '');
  if (s === '') return null;
  return /^-?\d+(\.\d+)?$/.test(s) ? Math.round(Number(s)) : 'invalid';
}

const KIND_CODES = new Set<string>(JOB_KINDS.map((k) => k.code));

export function parseWorkbook(sheets: Sheet[]): ParsedWorkbook {
  const jobs = new Map<string, ImportedJob>();
  const problems: string[] = [];
  const summary: ParsedWorkbook['sheets'] = [];

  // 月のシート（古い月から読むので、同じ番号が2回あれば新しい月の行が残る）
  const monthly = sheets
    .map((s) => ({ ...s, period: periodFromSheetName(s.sheet) }))
    .filter((s): s is Sheet & { period: string } => s.period !== null)
    .sort((a, b) => a.period.localeCompare(b.period));

  for (const s of monthly) {
    const header = s.data.findIndex((row) => row.some((c) => text(c)?.includes('工事番号')));
    if (header < 0) {
      problems.push(`シート「${s.sheet}」に「＜工事番号＞」の見出しが見つかりませんでした`);
      continue;
    }
    let count = 0;
    for (let i = header + 1; i < s.data.length; i++) {
      const row = s.data[i];
      const first = text(row[0]);
      if (first?.includes('工事情報一覧終了')) break;
      if (!first && !text(row[1])) continue;
      const workNo = workNoOf(row[0]);
      const where = `シート「${s.sheet}」${i + 1}行目`;
      if (!workNo) {
        if (first && !first.startsWith('※')) problems.push(`${where}：工事番号「${first}」が6桁の数字ではないので読み飛ばしました`);
        continue;
      }
      const name = text(row[1]);
      if (!name) {
        problems.push(`${where}：${workNo} の工事名が空なので読み飛ばしました`);
        continue;
      }
      if (!KIND_CODES.has(kindOf(workNo))) problems.push(`${where}：${workNo} の3桁目「${kindOf(workNo)}」は種別にありません`);
      const amount = amountOf(row[8]);
      if (amount === 'invalid') problems.push(`${where}：${workNo} の請負額「${String(row[8])}」が数字ではないので空にしました`);
      const dates = [4, 5, 6, 7].map((col) => {
        const d = parseSheetDate(row[col]);
        if (!d && text(row[col])) problems.push(`${where}：${workNo} の日付「${String(row[col])}」が読めないので空にしました`);
        return d;
      });
      if (jobs.has(workNo)) problems.push(`${where}：${workNo} はシート「${jobs.get(workNo)!.source}」にもあります（こちらを使います）`);
      jobs.set(workNo, {
        workNo,
        kind: kindOf(workNo),
        name,
        clientCode: text(row[2]),
        clientName: text(row[3]),
        contractDate: dates[0],
        startDate: dates[1],
        plannedDate: dates[2],
        completedDate: dates[3],
        amount: amount === 'invalid' ? null : amount,
        period: s.period,
        source: s.sheet,
      });
      count++;
    }
    summary.push({ name: s.sheet, period: s.period, count });
  }

  // 工事種別一覧（番号のセルの右隣が工事名）
  const registry = sheets.find((s) => s.sheet.replace(/\s/g, '').includes('工事種別一覧'));
  if (registry) {
    let count = 0;
    for (const row of registry.data) {
      for (let c = 0; c < row.length - 1; c++) {
        const workNo = workNoOf(row[c]);
        const name = text(row[c + 1]);
        if (!workNo || !name || jobs.has(workNo)) continue;
        jobs.set(workNo, {
          workNo,
          kind: kindOf(workNo),
          name,
          clientCode: null,
          clientName: null,
          contractDate: null,
          startDate: null,
          plannedDate: null,
          completedDate: null,
          amount: null,
          period: null,
          source: registry.sheet,
        });
        count++;
      }
    }
    summary.push({ name: registry.sheet, period: null, count });
  }

  return { jobs: [...jobs.values()], sheets: summary, problems };
}
