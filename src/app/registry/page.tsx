import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { JOB_KINDS, fiscalYearOfWorkNo, yearPrefixOf } from '@/lib/kinds';
import { currentFiscalYear } from '@/lib/period';
import { formatWareki } from '@/lib/wareki';
import { seriesStatus } from '@/lib/jobs/numbering';
import JobNameLink from '@/components/JobNameLink';

export const dynamic = 'force-dynamic';

export default async function RegistryPage({ searchParams }: PageProps<'/registry'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const saved = typeof sp.saved === 'string' ? sp.saved : null;

  const years = (await prisma.job.findMany({ select: { workNo: true } }))
    .map((j) => fiscalYearOfWorkNo(j.workNo))
    .concat(currentFiscalYear());
  const yearList = [...new Set(years)].sort((a, b) => b - a);
  const fy = Number(sp.fy) && yearList.includes(Number(sp.fy)) ? Number(sp.fy) : currentFiscalYear();

  const [status, jobs] = await Promise.all([
    seriesStatus(fy),
    prisma.job.findMany({
      where: q
        ? {
            OR: [
              { workNo: { contains: q } },
              { name: { contains: q, mode: 'insensitive' } },
              { clientName: { contains: q, mode: 'insensitive' } },
              { memo: { contains: q, mode: 'insensitive' } },
            ],
          }
        : { workNo: { startsWith: yearPrefixOf(fy) } },
      orderBy: { workNo: 'asc' },
      select: { workNo: true, kind: true, name: true, contractDate: true, daitecLedgerId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">工事種別一覧</h1>
          <p className="mt-1 text-sm text-zinc-500">工事番号の台帳です。番号はここから自動で振られます。</p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="番号・工事名・契約先で検索（全年度）"
            className="w-72 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700">
            検索
          </button>
        </form>
      </div>

      {!q && (
        <>
          <div className="flex flex-wrap gap-1">
            {yearList.map((y) => (
              <Link
                key={y}
                href={`/registry?fy=${y}`}
                className={`rounded-md px-3 py-1 text-sm ${y === fy ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                {y}年度（{yearPrefixOf(y)}〜）
              </Link>
            ))}
          </div>

          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-x-auto">
            <h2 className="px-4 pt-4 font-semibold text-zinc-900">最終工事番号一覧（{fy}年度）</h2>
            <table className="mt-2 w-full text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">種別</th>
                  <th className="px-4 py-2 font-medium">次の番号</th>
                  <th className="px-4 py-2 font-medium">最後の番号</th>
                  <th className="px-4 py-2 font-medium">最後の工事名</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {status.map((s) => (
                  <tr key={s.kind} className="border-t border-zinc-100">
                    <td className="px-4 py-2 whitespace-nowrap text-zinc-700">
                      {yearPrefixOf(fy)}{s.kind} {s.label}
                    </td>
                    <td className="px-4 py-2 font-mono font-semibold text-zinc-900">{s.next ?? '（満杯）'}</td>
                    <td className="px-4 py-2 font-mono text-zinc-500">{s.last?.workNo ?? '—'}</td>
                    <td className="px-4 py-2 text-zinc-700">{s.last?.name}</td>
                    <td className="px-4 py-2 text-right">
                      {s.next && fy === currentFiscalYear() && (
                        <Link href={`/jobs/new?kind=${s.kind}`} className="text-xs text-sky-700 hover:underline whitespace-nowrap">
                          この種別で登録
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {JOB_KINDS.map((k) => {
          const list = jobs.filter((j) => j.kind === k.code);
          if (q && list.length === 0) return null;
          return (
            <section key={k.code} className="rounded-lg border border-zinc-200 bg-white shadow-sm">
              <h2 className="border-b border-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900">
                {q ? '' : yearPrefixOf(fy)}
                {k.code} {k.label}
                <span className="ml-2 text-xs font-normal text-zinc-400">{list.length}件</span>
              </h2>
              <ul className="max-h-96 overflow-y-auto text-sm">
                {list.map((j) => (
                  <li key={j.workNo} className={`flex gap-2 px-4 py-1 ${saved === j.workNo ? 'bg-amber-50' : ''}`}>
                    <Link href={`/jobs/${j.workNo}`} className="font-mono text-sky-700 hover:underline">
                      {j.workNo}
                    </Link>
                    <JobNameLink workNo={j.workNo} name={j.name} daitecLedgerId={j.daitecLedgerId} className="flex-1" />
                    <span title="契約年月日" className="whitespace-nowrap text-xs tabular-nums text-zinc-500">
                      {j.contractDate ? formatWareki(j.contractDate) : <span className="text-zinc-300">契約日なし</span>}
                    </span>
                  </li>
                ))}
                {list.length === 0 && <li className="px-4 py-3 text-xs text-zinc-400">まだありません</li>}
              </ul>
            </section>
          );
        })}
      </div>
      {q && jobs.length === 0 && <p className="text-center text-sm text-zinc-400">「{q}」に当てはまる工事はありません</p>}
    </div>
  );
}
