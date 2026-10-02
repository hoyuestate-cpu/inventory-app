// 工事番号のしくみ: 年度2桁 + 種別1桁 + 連番3桁（例: 264139 = 26年度・小工事・139番）

export const JOB_KINDS = [
  { code: '1', label: '新築' },
  { code: '2', label: '住宅以外' },
  { code: '3', label: '増改築' },
  { code: '4', label: '小工事' },
  { code: '5', label: 'クレーム' },
  { code: '6', label: 'アパート・自社' },
  { code: '7', label: 'アパート・モデルハウス' },
  { code: '9', label: '販売' },
] as const;

export function kindLabel(code: string): string {
  return JOB_KINDS.find((k) => k.code === code)?.label ?? `種別${code}`;
}

export function isValidWorkNo(workNo: string): boolean {
  return /^\d{6}$/.test(workNo);
}

/** 工事番号の3桁目（種別） */
export function kindOf(workNo: string): string {
  return workNo.charAt(2);
}

/** 工事番号の先頭2桁（年度） */
export function yearPrefixOf(fiscalYear: number): string {
  return String(fiscalYear % 100).padStart(2, '0');
}

/** 工事番号の先頭3桁（年度＋種別）。この単位で連番を振る */
export function seriesOf(fiscalYear: number, kind: string): string {
  return `${yearPrefixOf(fiscalYear)}${kind}`;
}

/** 工事番号の先頭2桁から年度（西暦）を出す */
export function fiscalYearOfWorkNo(workNo: string): number {
  return 2000 + Number(workNo.slice(0, 2));
}
