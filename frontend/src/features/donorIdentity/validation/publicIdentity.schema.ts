export function validatePublicIdentity(values: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  const alias = String(values.publicAlias ?? '').trim();
  if (alias.length < 3 || alias.length > 60) errors.publicAlias = 'Use an alias between 3 and 60 characters.';
  if (!/^[\p{L}\p{N} ._-]+$/u.test(alias)) {
    errors.publicAlias = 'Use letters, numbers, spaces, dots, dashes, or underscores only.';
  }
  return errors;
}
