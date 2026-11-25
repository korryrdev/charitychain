export const STRENGTH_LABELS = ['Too short', 'Fair', 'Good', 'Strong'];

/** Length-based strength meter (min 12 characters per policy) with a nudge for mixed characters. */
export function passwordStrength(password = '') {
  const value = String(password);
  if (!value) return { level: 0, label: '', percent: 0 };
  if (value.length < 12) return { level: 0, label: 'Too short', percent: 25, needed: 12 - value.length };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
  let level = 1;
  if (value.length >= 14 || classes >= 3) level = 2;
  if (value.length >= 16 && classes >= 3) level = 3;
  return { level, label: STRENGTH_LABELS[level], percent: (level + 1) * 25 };
}
