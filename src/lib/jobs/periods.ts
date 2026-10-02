import 'server-only';
import { prisma } from '@/lib/prisma';
import { currentPeriod, periodLabel, shiftPeriod } from '@/lib/period';

/** 登録フォームで選べる期間（データのある期間＋今の前後） */
export async function periodOptions(include?: string | null): Promise<{ value: string; label: string }[]> {
  const cur = currentPeriod();
  const set = new Set<string>([shiftPeriod(cur, -1), cur, shiftPeriod(cur, 1)]);
  if (include) set.add(include);
  const used = await prisma.job.findMany({ where: { period: { not: null } }, distinct: ['period'], select: { period: true } });
  for (const u of used) if (u.period) set.add(u.period);
  const list = [...set].sort().reverse().map((p) => ({ value: p, label: `${periodLabel(p)}${p === cur ? '（今月）' : ''}` }));
  return [...list, { value: '', label: '送らない（工事種別一覧にだけ載せる）' }];
}
