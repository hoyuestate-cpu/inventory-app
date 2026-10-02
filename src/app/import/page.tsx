import ImportForm from '@/components/ImportForm';

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">エクセルから取り込む</h1>
        <p className="mt-1 text-sm text-zinc-500">
          これまで使っていた工事リストのエクセル（.xlsx）をそのまま選んでください。最初に1回取り込めば、あとはアプリで登録できます。
        </p>
      </div>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <ImportForm />
      </section>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm space-y-2">
        <h2 className="font-semibold text-zinc-900">読み取るシート</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>「R8.9.21～」のような月のシート</b>：1行を1工事として取り込みます。シート名の月が「JDLへ送る月」になります。
          </li>
          <li>
            <b>「工事種別一覧」</b>：月のシートにない番号を、番号の台帳として取り込みます（JDLへは送らない扱い）。
          </li>
          <li>「原本」「最終工事番号一覧」「CSVデータ（サンプル)」はアプリが自動で作るので読みません。</li>
        </ul>
        <p>同じファイルを何回取り込んでも、すでにある工事番号は二重には登録されません。</p>
      </section>
    </div>
  );
}
