'use client';

import { useActionState } from 'react';
import { importExcel, type ImportResult } from '@/lib/actions/import';

export default function ImportForm() {
  const [result, formAction, pending] = useActionState<ImportResult, FormData>(importExcel, {});

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <input
          type="file"
          name="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-zinc-200"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="overwrite" value="1" className="h-4 w-4 rounded border-zinc-300" />
          アプリにすでにある工事番号も、エクセルの内容で上書きする
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? '取り込み中…' : '取り込む'}
        </button>
      </form>

      {result.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>}

      {result.sheets && (
        <div className="space-y-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">
            「{result.fileName}」を取り込みました：新規 {result.created}件
            {!!result.updated && `・上書き ${result.updated}件`}
            {!!result.skipped?.length && `・登録済みのため読み飛ばし ${result.skipped.length}件`}
          </p>
          <ul className="text-xs">
            {result.sheets.map((s) => (
              <li key={s.name}>
                {s.name}：{s.count}件
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!result.problems?.length && (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">確認してほしい行（{result.problems.length}件）</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {result.problems.slice(0, 50).map((p) => (
              <li key={p}>{p}</li>
            ))}
            {result.problems.length > 50 && <li>ほか{result.problems.length - 50}件</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
