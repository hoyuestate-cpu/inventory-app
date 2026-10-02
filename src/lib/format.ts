const numberFormatter = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 });

export function formatYen(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return numberFormatter.format(value);
}

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(value: Date | null | undefined): string {
  return value ? dateTimeFormatter.format(value) : '';
}
