export interface FormatDateOptions {
  locale?: string;
  includeTime?: boolean;
}

export function formatDate(
  value: unknown,
  { locale = 'en-KE', includeTime = false }: FormatDateOptions = {}
): string {
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(
    locale,
    includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }
  ).format(date);
}
