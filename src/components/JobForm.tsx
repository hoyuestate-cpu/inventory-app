'use client';

import { useActionState, useState } from 'react';
import { saveJob, type JobFormState } from '@/lib/actions/jobs';
import { JOB_KINDS, kindOf } from '@/lib/kinds';
import { CLIENT_NAME_MAX_BYTES, NAME_MAX_BYTES, sjisBytes } from '@/lib/sjis';
import { formatWareki, parseDateInput } from '@/lib/wareki';

export type JobFormValues = {
  workNo: string;
  name: string;
  clientCode: string;
  clientName: string;
  contractDate: string;
  startDate: string;
  plannedDate: string;
  completedDate: string;
  amount: string;
  period: string;
  memo: string;
  daitecLedgerId: string;
};

type Suggestion = { next: string | null; last: { workNo: string; name: string } | null };

type Props = {
  /** 修正のときは元の工事番号。新規登録は null */
  originalWorkNo: string | null;
  initial: JobFormValues;
  periods: { value: string; label: string }[];
  /** 新規登録用: 年度 → 種別 → 次の番号 */
  suggestions?: Record<string, Record<string, Suggestion>>;
  initialFiscalYear?: string;
  initialKind?: string;
};

const DATE_FIELDS = [
  { key: 'contractDate', label: '契約年月日' },
  { key: 'startDate', label: '着工年月日' },
  { key: 'plannedDate', label: '竣工予定日' },
  { key: 'completedDate', label: '竣工年月日' },
] as const;

const inputClass =
  'w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500';

function ByteCounter({ value, max }: { value: string; max: number }) {
  const bytes = sjisBytes(value);
  const over = bytes > max;
  return (
    <span className={`text-xs tabular-nums ${over ? 'font-semibold text-amber-700' : 'text-zinc-400'}`}>
      全角{(bytes / 2).toFixed(bytes % 2 ? 1 : 0)}／{max / 2}文字{over && '（JDLでは切れる可能性があります）'}
    </span>
  );
}

export default function JobForm({ originalWorkNo, initial, periods, suggestions, initialFiscalYear, initialKind }: Props) {
  const isNew = originalWorkNo === null;
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(
    saveJob.bind(null, originalWorkNo),
    {},
  );
  const [values, setValues] = useState<JobFormValues>(initial);
  const [fiscalYear, setFiscalYear] = useState(initialFiscalYear ?? '');
  const [kind, setKind] = useState(initialKind ?? (initial.workNo ? kindOf(initial.workNo) : '4'));
  // 番号を手で書き換えたら、種別を変えても自動では上書きしない
  const [manualNo, setManualNo] = useState(!isNew);

  const set = (key: keyof JobFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function pickSeries(fy: string, k: string) {
    setFiscalYear(fy);
    setKind(k);
    const next = suggestions?.[fy]?.[k]?.next;
    if (!manualNo && next) setValues((v) => ({ ...v, workNo: next }));
  }

  const suggestion = suggestions?.[fiscalYear]?.[kind];
  const amountNumber = Number(values.amount.replace(/[,，\s]/g, ''));

  return (
    <form action={formAction} className="space-y-5">
      {isNew && suggestions && (
        <div className="rounded-md bg-zinc-50 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr]">
            <label className="block">
              <span className="block text-xs font-medium text-zinc-500 mb-1">年度</span>
              <select value={fiscalYear} onChange={(e) => pickSeries(e.target.value, kind)} className={inputClass}>
                {Object.keys(suggestions).map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}年度（{fy.slice(2)}）
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="block text-xs font-medium text-zinc-500 mb-1">種別</span>
              <div className="flex flex-wrap gap-1.5">
                {JOB_KINDS.map((k) => (
                  <button
                    key={k.code}
                    type="button"
                    onClick={() => pickSeries(fiscalYear, k.code)}
                    className={`rounded-md border px-2.5 py-1 text-sm ${
                      kind === k.code
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {k.code} {k.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            {suggestion?.last
              ? `この種別の最後の番号：${suggestion.last.workNo}　${suggestion.last.name}`
              : 'この種別はまだ番号がありません（001から）'}
            {suggestion && !suggestion.next && (
              <span className="ml-2 font-semibold text-red-600">999番まで使い切っています</span>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
        <label className="block">
          <span className="block text-xs font-medium text-zinc-500 mb-1">工事番号 *</span>
          <input
            name="workNo"
            value={values.workNo}
            onChange={(e) => {
              setManualNo(true);
              set('workNo')(e);
            }}
            required
            inputMode="numeric"
            maxLength={6}
            className={`${inputClass} font-mono text-base`}
          />
          {isNew && manualNo && suggestion?.next && values.workNo !== suggestion.next && (
            <button
              type="button"
              onClick={() => {
                setManualNo(false);
                setValues((v) => ({ ...v, workNo: suggestion.next! }));
              }}
              className="mt-1 text-xs text-sky-700 hover:underline"
            >
              自動の番号（{suggestion.next}）に戻す
            </button>
          )}
        </label>
        <label className="block">
          <span className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-zinc-500">工事名 *</span>
            <ByteCounter value={values.name} max={NAME_MAX_BYTES} />
          </span>
          <input name="name" value={values.name} onChange={set('name')} required className={inputClass} placeholder="例：小林様邸 ボロンデ延長点検" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
        <label className="block">
          <span className="block text-xs font-medium text-zinc-500 mb-1">契約先Ｃ（通常は空欄）</span>
          <input name="clientCode" value={values.clientCode} onChange={set('clientCode')} className={inputClass} />
        </label>
        <label className="block">
          <span className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-zinc-500">契約先名</span>
            <ByteCounter value={values.clientName} max={CLIENT_NAME_MAX_BYTES} />
          </span>
          <input name="clientName" value={values.clientName} onChange={set('clientName')} className={inputClass} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {DATE_FIELDS.map((f) => {
          const d = parseDateInput(values[f.key]);
          return (
            <label key={f.key} className="block">
              <span className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-zinc-500">{f.label}</span>
                <span className="text-xs text-zinc-400 tabular-nums">{formatWareki(d)}</span>
              </span>
              <input type="date" name={f.key} value={values[f.key]} onChange={set(f.key)} className={inputClass} />
            </label>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-zinc-500">請負額（税抜・円）</span>
            {values.amount && Number.isFinite(amountNumber) && (
              <span className="text-xs text-zinc-400 tabular-nums">{amountNumber.toLocaleString('ja-JP')}円</span>
            )}
          </span>
          <input
            name="amount"
            value={values.amount}
            onChange={set('amount')}
            inputMode="numeric"
            className={`${inputClass} text-right tabular-nums`}
            placeholder="コンマなしでOK"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-zinc-500 mb-1">JDLへ送る月（シート）</span>
          <select name="period" value={values.period} onChange={set('period')} className={inputClass}>
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-zinc-500 mb-1">ダイテック契約台帳（工事名を押すと開きます）</span>
        <input
          name="daitecLedgerId"
          value={values.daitecLedgerId}
          onChange={set('daitecLedgerId')}
          className={inputClass}
          placeholder="注文分譲クラウドDXで契約台帳を開いたときのURLをそのまま貼り付け（台帳IDの数字だけでもOK）"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-zinc-500 mb-1">メモ（総務用・CSVには出ません）</span>
        <textarea name="memo" value={values.memo} onChange={set('memo')} rows={2} className={inputClass} />
      </label>

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isNew ? '登録する' : '保存する'}
        </button>
        {isNew && (
          <button
            type="submit"
            name="continue"
            value="1"
            disabled={pending}
            className="rounded-md border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            登録して続けて入力
          </button>
        )}
      </div>
    </form>
  );
}
