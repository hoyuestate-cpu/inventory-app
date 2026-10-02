import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { currentPeriod, isValidPeriod, periodLabel, periodSheetName, shiftPeriod } from '@/lib/period';
import { formatWareki } from '@/lib/wareki';
import { formatDateTime, formatYen } from '@/lib/format';
import { kindLabel } from '@/lib/kinds';
import { jobWarnings, nameOverLength } from '@/lib/jobs/checks';

export const dynamic = 'force-dynamic';

export default async function ListPage({ searchParams }: PageProps<'/list'>) {
  const sp = await searchParams;
  const period = isValidPeriod(sp.period as string) ? (sp.period as string) : currentPeriod();
  const saved = typeof sp.saved === 'string' ? sp.saved : null;

  const [jobs, exported] = await Promise.all([
    prisma.job.findMany({ where: { period }, orderBy: [{ createdAt: 'asc' }, { workNo: 'asc' }] }),
    prisma.periodExport.findUnique({ where: { period } }),
  ]);

  const total = jobs.reduce((s, j) => s + (j.amount ?? 0), 0);
  const changedAfterExport = exported ? jobs.filter((j) => j.updatedAt > exported.exportedAt).length : 0;
  const isCurrent = period === currentPeriod();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">JDL取込用 工事リスト</p>
          <h1 className="text-xl font-bold text-zinc-900">
            {periodLabel(period)}
            {isCurrent && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle text-xs font-medium text-amber-800">今月</span>}
          </h1>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Link href={`/list?period=${shiftPeriod(period, -1)}`} className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100">
            ← 前の月
          </Link>
          {!isCurrent && (
            <Link href="/list" className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100">
              今月
            </Link>
          )}
          <Link href={`/list?period=${shiftPeriod(period, 1)}`} className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100">
            次の月 →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/jobs/new?period=${period}`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          ＋ 工事を登録
        </Link>
        {/* ファイルのダウンロードなので通常の a タグにする */}
        <a
          href={`/api/csv?period=${period}`}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            jobs.length === 0
              ? 'pointer-events-none border-zinc-200 text-zinc-300'
              : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          JDL取込用CSVをダウンロード
        </a>
        <span className="text-xs text-zinc-500">
          {exported ? (
            <>
              前回出力：{formatDateTime(exported.exportedAt)}（{exported.rowCount}件）
              {changedAfterExport > 0 && (
                <span className="ml-1 font-semibold text-amber-700">出力後に{changedAfterExport}件変更・追加あり</span>
              )}
            </>
          ) : (
            'まだ出力していません'
          )}
        </span>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">工事番号</th>
              <th className="px-3 py-2 font-medium">工事名</th>
              <th className="px-3 py-2 font-medium">契約先名</th>
              <th className="px-3 py-2 font-medium">契約</th>
              <th className="px-3 py-2 font-medium">着工</th>
              <th className="px-3 py-2 font-medium">竣工予定</th>
              <th className="px-3 py-2 font-medium">竣工</th>
              <th className="px-3 py-2 font-medium text-right">請負額（税抜）</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const warnings = jobWarnings(j);
              const over = nameOverLength(j.name);
              return (
                <tr key={j.workNo} className={`border-t border-zinc-100 ${saved === j.workNo ? 'bg-amber-50' : 'hover:bg-zinc-50'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link href={`/jobs/${j.workNo}`} className="font-mono text-sky-700 hover:underline">
                      {j.workNo}
                    </Link>
                    <span className="ml-1.5 text-[10px] text-zinc-400">{kindLabel(j.kind)}</span>
                  </td>
                  <td className="px-3 py-2 min-w-[16rem]">
                    <Link href={`/jobs/${j.workNo}`} className="text-zinc-900 hover:underline">
                      {j.name}
                    </Link>
                    {over && (
                      <span className="ml-1.5 text-[10px] text-zinc-400" title="JDLの工事名は全角12文字まで">
                        全角{over}文字
                      </span>
                    )}
                    {warnings.map((w) => (
                      <p key={w} className="text-[11px] text-amber-700">⚠ {w}</p>
                    ))}
                    {j.memo && <p className="text-[11px] text-zinc-400">メモ：{j.memo}</p>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-zinc-700">{j.clientName}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums text-zinc-700">{formatWareki(j.contractDate)}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums text-zinc-700">{formatWareki(j.startDate)}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums text-zinc-700">{formatWareki(j.plannedDate)}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums text-zinc-700">{formatWareki(j.completedDate)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums text-zinc-900">{formatYen(j.amount)}</td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-400">
                  この月（シート「{periodSheetName(period)}」）の工事はまだありません
                </td>
              </tr>
            )}
          </tbody>
          {jobs.length > 0 && (
            <tfoot className="border-t border-zinc-200 bg-zinc-50 text-sm">
              <tr>
                <td className="px-3 py-2 text-zinc-500" colSpan={7}>
                  {jobs.length}件
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-zinc-900">{formatYen(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </section>
    </div>
  );
}
