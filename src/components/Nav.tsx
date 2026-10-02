'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';

const links = [
  { href: '/list', label: '工事リスト' },
  { href: '/jobs/new', label: '工事の登録' },
  { href: '/registry', label: '工事種別一覧' },
  { href: '/import', label: 'エクセル取込' },
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-3">
          <Link href="/list" className="flex items-center gap-2 font-bold text-zinc-900 whitespace-nowrap">
            柴木材店
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-700">総務</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                  pathname === l.href ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 whitespace-nowrap"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
