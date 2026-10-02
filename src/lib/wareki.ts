// JDLの日付形式（令和の「R＋年2桁＋月日」例: R080918 = 令和8年9月18日）と日付の変換。
// 日付はデータベースに日付だけ（UTCの0時）で保存しているので、UTCで扱う。

const REIWA_BASE = 2018;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 2026-09-18 → "R080918"（JDL取込CSV用） */
export function toJdlDate(d: Date | null | undefined): string {
  if (!d) return '';
  return `R${pad2(d.getUTCFullYear() - REIWA_BASE)}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

/** 2026-09-18 → "R8.9.18"（画面表示用） */
export function formatWareki(d: Date | null | undefined): string {
  if (!d) return '';
  return `R${d.getUTCFullYear() - REIWA_BASE}.${d.getUTCMonth() + 1}.${d.getUTCDate()}`;
}

/** 2026-09-18 → "2026-09-18"（input[type=date] 用） */
export function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

function utcDate(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d;
}

/**
 * エクセルに入っている日付を読む。
 * "R080918"（年2桁）・"R61221"（年1桁）・"R8.9.18"・"2026/9/18"・日付セルに対応。
 */
export function parseSheetDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return utcDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  const s = String(value)
    .replace(/[０-９Ａ-Ｚａ-ｚ．／]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .trim()
    .toUpperCase();
  let m = s.match(/^R(\d{1,2})(\d{2})(\d{2})$/);
  if (m) {
    // "R61221" のように7文字に満たないものは年1桁とみなす
    return utcDate(REIWA_BASE + Number(m[1]), Number(m[2]), Number(m[3]));
  }
  m = s.match(/^R(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
  if (m) return utcDate(REIWA_BASE + Number(m[1]), Number(m[2]), Number(m[3]));
  m = s.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
  if (m) return utcDate(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

/** "2026-09-18"（input[type=date] の値）→ 日付 */
export function parseDateInput(value: string | null): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? utcDate(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}
