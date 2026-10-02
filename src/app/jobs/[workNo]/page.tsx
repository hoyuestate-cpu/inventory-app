import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import JobForm from '@/components/JobForm';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { deleteJob } from '@/lib/actions/jobs';
import { kindLabel } from '@/lib/kinds';
import { periodOptions } from '@/lib/jobs/periods';
import { jobWarnings } from '@/lib/jobs/checks';
import { toDateInputValue } from '@/lib/wareki';
import { formatDateTime } from '@/lib/format';
import { daitecContractUrl } from '@/lib/daitec';
import ExternalLinkButton from '@/components/ExternalLinkButton';

export const dynamic = 'force-dynamic';

export default async function EditJobPage({ params }: PageProps<'/jobs/[workNo]'>) {
  const { workNo } = await params;
  const job = await prisma.job.findUnique({ where: { workNo } });
  if (!job) notFound();
  const warnings = jobWarnings(job);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs text-zinc-500">{kindLabel(job.kind)}</p>
        <h1 className="text-xl font-bold text-zinc-900">
          <span className="font-mono">{job.workNo}</span> {job.name}
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          登録 {formatDateTime(job.createdAt)}／最終更新 {formatDateTime(job.updatedAt)}
        </p>
      </div>
        {job.daitecLedgerId && (
          <ExternalLinkButton
            href={daitecContractUrl(job.daitecLedgerId)}
            label="ダイテック契約台帳"
            iconSrc="/logos/daitec-dx.png"
            iconAlt="ダイテック"
          />
        )}
      </div>
      {warnings.length > 0 && (
        <ul className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <JobForm
          originalWorkNo={job.workNo}
          initial={{
            workNo: job.workNo,
            name: job.name,
            clientCode: job.clientCode ?? '',
            clientName: job.clientName ?? '',
            contractDate: toDateInputValue(job.contractDate),
            startDate: toDateInputValue(job.startDate),
            plannedDate: toDateInputValue(job.plannedDate),
            completedDate: toDateInputValue(job.completedDate),
            amount: job.amount === null ? '' : String(Math.round(job.amount)),
            period: job.period ?? '',
            memo: job.memo ?? '',
            daitecLedgerId: job.daitecLedgerId ?? '',
          }}
          periods={await periodOptions(job.period)}
        />
      </section>
      <div className="flex items-center justify-between">
        <Link href={job.period ? `/list?period=${job.period}` : '/registry'} className="text-sm text-zinc-500 hover:underline">
          ← 戻る
        </Link>
        <form action={deleteJob.bind(null, job.workNo)}>
          <ConfirmSubmitButton
            message={`${job.workNo}「${job.name}」を削除します。番号が最後の番号だった場合は、次の登録で同じ番号が使われます。よろしいですか？`}
            className="text-sm text-red-500 hover:underline"
          >
            この工事を削除
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
