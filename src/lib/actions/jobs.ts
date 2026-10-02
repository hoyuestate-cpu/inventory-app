'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { str } from '@/lib/form-utils';
import { JOB_KINDS, isValidWorkNo, kindOf } from '@/lib/kinds';
import { isValidPeriod } from '@/lib/period';
import { parseDateInput } from '@/lib/wareki';

export type JobFormState = { error?: string };

const MAX_AMOUNT = 999_999_999_999; // JDLの請負額は12桁まで

function parseAmount(raw: string | null): number | null | 'invalid' {
  if (raw === null) return null;
  const s = raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，円\s]/g, '');
  if (s === '') return null;
  if (!/^\d+$/.test(s)) return 'invalid';
  const n = Number(s);
  return n > MAX_AMOUNT ? 'invalid' : n;
}

function dateField(formData: FormData, key: string, label: string): Date | null | string {
  const raw = str(formData, key);
  if (raw === null) return null;
  return parseDateInput(raw) ?? `${label}の日付が正しくありません`;
}

/** 工事の登録（originalWorkNo が null）と修正 */
export async function saveJob(
  originalWorkNo: string | null,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const workNo = (str(formData, 'workNo') ?? '').replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
  if (!isValidWorkNo(workNo)) return { error: '工事番号は6桁の数字で入力してください' };
  const kind = kindOf(workNo);
  if (!JOB_KINDS.some((k) => k.code === kind)) {
    return { error: `工事番号の3桁目「${kind}」に当たる種別がありません` };
  }

  const name = str(formData, 'name');
  if (!name) return { error: '工事名を入力してください' };

  const amount = parseAmount(str(formData, 'amount'));
  if (amount === 'invalid') return { error: '請負額は12桁までの数字（コンマなし・税抜）で入力してください' };

  const dates = {
    contractDate: dateField(formData, 'contractDate', '契約年月日'),
    startDate: dateField(formData, 'startDate', '着工年月日'),
    plannedDate: dateField(formData, 'plannedDate', '竣工予定日'),
    completedDate: dateField(formData, 'completedDate', '竣工年月日'),
  };
  for (const v of Object.values(dates)) {
    if (typeof v === 'string') return { error: v };
  }

  const periodRaw = str(formData, 'period');
  if (periodRaw !== null && !isValidPeriod(periodRaw)) return { error: '送る月の指定が正しくありません' };

  const data = {
    workNo,
    kind,
    name,
    clientCode: str(formData, 'clientCode'),
    clientName: str(formData, 'clientName'),
    contractDate: dates.contractDate as Date | null,
    startDate: dates.startDate as Date | null,
    plannedDate: dates.plannedDate as Date | null,
    completedDate: dates.completedDate as Date | null,
    amount,
    period: periodRaw,
    memo: str(formData, 'memo'),
  };

  try {
    if (originalWorkNo === null) {
      await prisma.job.create({ data });
    } else {
      await prisma.job.update({ where: { workNo: originalWorkNo }, data });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { error: `工事番号 ${workNo} はすでに使われています。番号を確かめてください` };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return { error: 'この工事は削除されています' };
    }
    throw e;
  }

  revalidatePath('/', 'layout');
  const back = data.period ? `/list?period=${data.period}&saved=${workNo}` : `/registry?saved=${workNo}`;
  if (originalWorkNo === null && formData.get('continue') === '1') {
    redirect(`/jobs/new?period=${data.period ?? ''}&kind=${kind}&saved=${workNo}`);
  }
  redirect(back);
}

export async function deleteJob(workNo: string) {
  const job = await prisma.job.delete({ where: { workNo } });
  revalidatePath('/', 'layout');
  redirect(job.period ? `/list?period=${job.period}` : '/registry');
}
