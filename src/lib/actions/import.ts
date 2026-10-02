'use server';

import { revalidatePath } from 'next/cache';
import readXlsxFile from 'read-excel-file/node';
import { prisma } from '@/lib/prisma';
import { parseWorkbook, type Sheet } from '@/lib/jobs/excel-import';
import { periodLabel } from '@/lib/period';

export type ImportResult = {
  error?: string;
  fileName?: string;
  sheets?: { name: string; count: number }[];
  created?: number;
  updated?: number;
  skipped?: { workNo: string; name: string }[];
  problems?: string[];
};

const MAX_BYTES = 10 * 1024 * 1024;

export async function importExcel(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'エクセルファイルを選んでください' };
  if (file.size > MAX_BYTES) return { error: 'ファイルが大きすぎます（10MBまで）' };
  const overwrite = formData.get('overwrite') === '1';

  let sheets: Sheet[];
  try {
    sheets = (await readXlsxFile(Buffer.from(await file.arrayBuffer()))) as Sheet[];
  } catch {
    return { error: 'エクセル（.xlsx）として読めませんでした。.xls の場合は .xlsx で保存し直してください' };
  }

  const parsed = parseWorkbook(sheets);
  if (parsed.jobs.length === 0) {
    return { error: '工事が見つかりませんでした。「R8.9.21～」のような月のシートか「工事種別一覧」シートが必要です', problems: parsed.problems };
  }

  const existing = new Map(
    (await prisma.job.findMany({ where: { workNo: { in: parsed.jobs.map((j) => j.workNo) } }, select: { workNo: true, name: true } })).map(
      (j) => [j.workNo, j],
    ),
  );

  // 一覧の並び順＝登録順なので、エクセルの行の順に少しずつ時刻をずらして登録する
  const base = Date.now() - parsed.jobs.length * 1000;
  const creates = [];
  const updates = [];
  const skipped: ImportResult['skipped'] = [];
  for (const [i, j] of parsed.jobs.entries()) {
    const { source, ...data } = j; // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!existing.has(j.workNo)) {
      creates.push({ ...data, createdAt: new Date(base + i * 1000) });
    } else if (overwrite) {
      updates.push(prisma.job.update({ where: { workNo: j.workNo }, data }));
    } else {
      skipped.push({ workNo: j.workNo, name: existing.get(j.workNo)!.name });
    }
  }

  await prisma.$transaction([prisma.job.createMany({ data: creates }), ...updates]);
  revalidatePath('/', 'layout');

  return {
    fileName: file.name,
    sheets: parsed.sheets.map((s) => ({ name: s.period ? `${s.name}（${periodLabel(s.period)}）` : `${s.name}（月のシートにない番号）`, count: s.count })),
    created: creates.length,
    updated: updates.length,
    skipped,
    problems: parsed.problems,
  };
}
