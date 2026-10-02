import { login } from '@/lib/actions/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-zinc-900 mb-1">柴木材店 総務 工事リスト</h1>
        <p className="text-sm text-zinc-500 mb-6">パスワードを入力してください</p>
        <form action={login} className="space-y-4">
          <input
            type="password"
            name="password"
            autoFocus
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="パスワード"
          />
          {error && <p className="text-sm text-red-600">パスワードが違います</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            入室する
          </button>
        </form>
      </div>
    </div>
  );
}
