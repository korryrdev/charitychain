export function readCookie(
  name: string,
  source: string = typeof document === 'undefined' ? '' : document.cookie
): string | null {
  const value = source
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function csrfHeaders({ cookieName = 'charitychain_csrf' }: { cookieName?: string } = {}): Record<string, string> {
  const token = readCookie(cookieName);
  return token ? { 'x-csrf-token': token } : {};
}
