import 'server-only';
import iconv from 'iconv-lite';
import type { Job } from '@prisma/client';
import { toJdlDate } from '@/lib/wareki';

// JDLに取り込む「工事情報一覧」のCSV。エクセルの「【工事リスト】CSVデータ（サンプル)」シートと同じ並び。
//   ＜工事情報一覧＞
//   ＜工事番号＞,＜工事名＞,…,＜請負額＞
//   264139,小林様邸 ボロンデ延長点検,,,R080918,,,,50000
//   ＜工事情報一覧終了＞
// 文字コードは Shift_JIS（㈱・髙なども使える Windows の拡張版）、改行は CRLF。

export const CSV_HEADERS = [
  '＜工事番号＞',
  '＜工事名＞',
  '＜契約先Ｃ＞',
  '＜契約先名＞',
  '＜契約年月日＞',
  '＜着工年月日＞',
  '＜竣工予定日＞',
  '＜竣工年月日＞',
  '＜請負額＞',
];

const COLUMNS = CSV_HEADERS.length;

function field(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function line(values: string[]): string {
  const cells = [...values];
  while (cells.length < COLUMNS) cells.push('');
  return cells.map(field).join(',');
}

type CsvJob = Pick<
  Job,
  'workNo' | 'name' | 'clientCode' | 'clientName' | 'contractDate' | 'startDate' | 'plannedDate' | 'completedDate' | 'amount'
>;

export function buildJdlCsv(jobs: CsvJob[]): string {
  const lines = [line(['＜工事情報一覧＞']), line(CSV_HEADERS)];
  for (const j of jobs) {
    lines.push(
      line([
        j.workNo,
        j.name,
        j.clientCode ?? '',
        j.clientName ?? '',
        toJdlDate(j.contractDate),
        toJdlDate(j.startDate),
        toJdlDate(j.plannedDate),
        toJdlDate(j.completedDate),
        // コンマなし・税抜の整数
        j.amount === null ? '' : String(Math.round(j.amount)),
      ]),
    );
  }
  lines.push(line(['＜工事情報一覧終了＞']));
  return lines.join('\r\n') + '\r\n';
}

export function encodeSjis(text: string): Buffer {
  return iconv.encode(text, 'cp932');
}

/** Shift_JIS にできない文字（絵文字・一部の旧字体など）。CSVでは「?」に化ける */
export function unencodableChars(text: string): string[] {
  const out = new Set<string>();
  for (const ch of text) {
    if (iconv.decode(iconv.encode(ch, 'cp932'), 'cp932') !== ch) out.add(ch);
  }
  return [...out];
}
