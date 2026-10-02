import 'server-only';
import { prisma } from '@/lib/prisma';
import { JOB_KINDS, seriesOf, yearPrefixOf } from '@/lib/kinds';

export type SeriesStatus = {
  kind: string;
  label: string;
  last: { workNo: string; name: string } | null;
  next: string | null; // 999番まで使い切ったら null
};

/** 年度ごとの「最終工事番号一覧」。種別ごとの最後の番号と次に使う番号 */
export async function seriesStatus(fiscalYear: number): Promise<SeriesStatus[]> {
  const jobs = await prisma.job.findMany({
    where: { workNo: { startsWith: yearPrefixOf(fiscalYear) } },
    select: { workNo: true, name: true },
  });
  return JOB_KINDS.map(({ code, label }) => {
    const series = seriesOf(fiscalYear, code);
    let last: SeriesStatus['last'] = null;
    for (const j of jobs) {
      if (j.workNo.startsWith(series) && (!last || j.workNo > last.workNo)) last = j;
    }
    const seq = last ? Number(last.workNo.slice(3)) + 1 : 1;
    return { kind: code, label, last, next: seq > 999 ? null : `${series}${String(seq).padStart(3, '0')}` };
  });
}
