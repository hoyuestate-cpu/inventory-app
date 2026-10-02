import Link from 'next/link';
import { daitecContractUrl } from '@/lib/daitec';

/** 工事名。ダイテックの契約台帳が登録されていればそちらを別タブで開き、なければ修正画面へ */
export default function JobNameLink({
  workNo,
  name,
  daitecLedgerId,
  className = '',
}: {
  workNo: string;
  name: string;
  daitecLedgerId: string | null;
  className?: string;
}) {
  if (daitecLedgerId) {
    return (
      <a
        href={daitecContractUrl(daitecLedgerId)}
        target="_blank"
        rel="noopener noreferrer"
        title="ダイテックの契約台帳を開く"
        className={`text-sky-800 hover:underline ${className}`}
      >
        {name}
        <span className="ml-1 text-xs text-zinc-400">↗</span>
      </a>
    );
  }
  return (
    <Link href={`/jobs/${workNo}`} title="ダイテックの契約台帳が未登録です（ここから登録できます）" className={`text-zinc-900 hover:underline ${className}`}>
      {name}
    </Link>
  );
}
