import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidPeriod, periodSheetName } from '@/lib/period';
import { buildJdlCsv, encodeSjis } from '@/lib/jobs/jdl-csv';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get('period');
  if (!isValidPeriod(period)) return new Response('期間の指定が正しくありません', { status: 400 });

  const jobs = await prisma.job.findMany({ where: { period }, orderBy: [{ createdAt: 'asc' }, { workNo: 'asc' }] });
  const body = encodeSjis(buildJdlCsv(jobs));

  await prisma.periodExport.upsert({
    where: { period },
    create: { period, exportedAt: new Date(), rowCount: jobs.length },
    update: { exportedAt: new Date(), rowCount: jobs.length },
  });

  const fileName = `工事リスト_${periodSheetName(period).replace('～', '')}.csv`;
  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': 'text/csv; charset=Shift_JIS',
      'Content-Disposition': `attachment; filename="koji-list-${period}.csv"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'no-store',
    },
  });
}
