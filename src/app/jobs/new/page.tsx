import Link from 'next/link';
import JobForm from '@/components/JobForm';
import { JOB_KINDS } from '@/lib/kinds';
import { currentFiscalYear, currentPeriod, isValidPeriod } from '@/lib/period';
import { seriesStatus } from '@/lib/jobs/numbering';
import { periodOptions } from '@/lib/jobs/periods';

export const dynamic = 'force-dynamic';

export default async function NewJobPage({ searchParams }: PageProps<'/jobs/new'>) {
  const sp = await searchParams;
  const period = typeof sp.period === 'string' && (sp.period === '' || isValidPeriod(sp.period)) ? sp.period : currentPeriod();
  const kind = typeof sp.kind === 'string' && JOB_KINDS.some((k) => k.code === sp.kind) ? sp.kind : '4';
  const saved = typeof sp.saved === 'string' ? sp.saved : null;

  // 年度の切り替わり（4月）前後でも選べるように、前年度〜翌年度の番号を用意する
  const fy = currentFiscalYear();
  const years = [fy - 1, fy, fy + 1];
  const suggestions: Record<string, Record<string, { next: string | null; last: { workNo: string; name: string } | null }>> = {};
  for (const y of years) {
    const status = await seriesStatus(y);
    suggestions[String(y)] = Object.fromEntries(status.map((s) => [s.kind, { next: s.next, last: s.last }]));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">工事の登録</h1>
        <p className="mt-1 text-sm text-zinc-500">年度と種別を選ぶと、工事番号が自動で振られます（最後の番号＋1）。</p>
      </div>
      {saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {saved} を登録しました。続けて次の工事を入力できます。
        </p>
      )}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <JobForm
          originalWorkNo={null}
          initial={{
            workNo: suggestions[String(fy)][kind].next ?? '',
            name: '',
            clientCode: '',
            clientName: '',
            contractDate: '',
            startDate: '',
            plannedDate: '',
            completedDate: '',
            amount: '',
            period,
            memo: '',
          }}
          periods={await periodOptions(period)}
          suggestions={suggestions}
          initialFiscalYear={String(fy)}
          initialKind={kind}
        />
      </section>
      <Link href={period ? `/list?period=${period}` : '/list'} className="inline-block text-sm text-zinc-500 hover:underline">
        ← 工事リストへ戻る
      </Link>
    </div>
  );
}
