import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-zinc-500">ページが見つかりません</p>
      <Link href="/list" className="mt-4 inline-block text-sm text-sky-700 hover:underline">
        工事リストへ
      </Link>
    </div>
  );
}
