// JDLへ送る工事リストは、毎月21日〜翌月20日を1枚のシートにまとめている。
// 期間は開始月で表す（"2026-09" = R8.9.21〜R8.10.20。エクセルのシート名「R8.9.21～」）。

const REIWA_BASE = 2018;
export const PERIOD_START_DAY = 21;

function parse(period: string): { year: number; month: number } {
  const [y, m] = period.split('-').map(Number);
  return { year: y, month: m };
}

function key(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isValidPeriod(period: string | null | undefined): period is string {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return false;
  const { month } = parse(period);
  return month >= 1 && month <= 12;
}

/** 日本時間の今日 */
export function todayJst(now = new Date()): { year: number; month: number; day: number } {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return { year: jst.getUTCFullYear(), month: jst.getUTCMonth() + 1, day: jst.getUTCDate() };
}

/** 今日が入っている期間 */
export function currentPeriod(now = new Date()): string {
  const t = todayJst(now);
  return t.day >= PERIOD_START_DAY ? key(t.year, t.month) : key(t.year, t.month - 1);
}

export function shiftPeriod(period: string, months: number): string {
  const { year, month } = parse(period);
  return key(year, month + months);
}

/** "2026-09" → "R8.9.21〜R8.10.20" */
export function periodLabel(period: string): string {
  const { year, month } = parse(period);
  const end = new Date(Date.UTC(year, month, PERIOD_START_DAY - 1));
  return `R${year - REIWA_BASE}.${month}.${PERIOD_START_DAY}〜R${end.getUTCFullYear() - REIWA_BASE}.${end.getUTCMonth() + 1}.${end.getUTCDate()}`;
}

/** "2026-09" → "R8.9.21～"（エクセルのシート名と同じ書き方） */
export function periodSheetName(period: string): string {
  const { year, month } = parse(period);
  return `R${year - REIWA_BASE}.${month}.${PERIOD_START_DAY}～`;
}

/** シート名「R8.9.21～」→ "2026-09"。期間のシートでなければ null */
export function periodFromSheetName(name: string): string | null {
  const s = name.replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  const m = s.match(/^\s*R(\d{1,2})\.(\d{1,2})\.21/i);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return key(REIWA_BASE + Number(m[1]), month);
}

/** 4月始まりの年度（今日） */
export function currentFiscalYear(now = new Date()): number {
  const t = todayJst(now);
  return t.month >= 4 ? t.year : t.year - 1;
}
