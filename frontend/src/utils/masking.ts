export interface MaskValueOptions {
  visible?: number;
  replacement?: string;
}

export function maskValue(
  value: unknown,
  { visible = 4, replacement = '•' }: MaskValueOptions = {}
): string {
  const text = String(value ?? '');
  if (!text) return '—';
  if (text.length <= visible) return replacement.repeat(text.length);
  return `${replacement.repeat(text.length - visible)}${text.slice(-visible)}`;
}
