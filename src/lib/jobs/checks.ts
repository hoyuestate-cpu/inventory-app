import { CLIENT_NAME_MAX_BYTES, NAME_MAX_BYTES, sjisBytes } from '@/lib/sjis';

/** 工事名が全角12文字を超えるとき、全角何文字分か（超えなければ null） */
export function nameOverLength(name: string): number | null {
  const bytes = sjisBytes(name);
  return bytes > NAME_MAX_BYTES ? Math.ceil(bytes / 2) : null;
}

type CheckedJob = {
  name: string;
  clientName: string | null;
  contractDate: Date | null;
  completedDate: Date | null;
};

/** CSVを出す前に気づいておきたいこと（保存は止めない） */
export function jobWarnings(job: CheckedJob): string[] {
  const out: string[] = [];
  if (job.clientName && sjisBytes(job.clientName) > CLIENT_NAME_MAX_BYTES) {
    out.push(`契約先名が全角10文字を超えています（全角${Math.ceil(sjisBytes(job.clientName) / 2)}文字分）`);
  }
  if (/[,"]/.test(job.name) || (job.clientName && /[,"]/.test(job.clientName))) {
    out.push('半角の「,」や「"」が入っています（JDLで読めないことがあるので全角にするのがおすすめ）');
  }
  if (!job.contractDate && !job.completedDate) out.push('契約年月日・竣工年月日がどちらも空です');
  return out;
}
