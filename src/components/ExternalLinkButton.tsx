/**
 * 外部サービスへのリンクボタン。ロゴ画像（またはアイコン）+ 短いラベルで表示する。
 */
export default function ExternalLinkButton({
  href,
  label,
  iconSrc,
  iconAlt,
  icon,
  showLabel = true,
}: {
  href: string;
  label: string;
  iconSrc?: string;
  iconAlt?: string;
  icon?: React.ReactNode;
  /** ロゴ画像自体に名称が書かれている場合はラベルを省略できる（title属性には残る） */
  showLabel?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
    >
      {iconSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconSrc} alt={iconAlt ?? label} className="h-5 w-auto" />
      ) : (
        icon
      )}
      {showLabel && <span>{label}</span>}
      <span className="text-xs text-zinc-400">↗</span>
    </a>
  );
}
