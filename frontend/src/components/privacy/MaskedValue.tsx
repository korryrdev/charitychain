import { maskValue } from '../../utils/masking';

export interface PrivacyMaskedValueProps {
  value?: string | number | null;
  reveal?: boolean;
  visible?: number;
}

export function MaskedValue({ value, reveal = false, visible = 4 }: PrivacyMaskedValueProps) {
  return <span>{reveal ? value : maskValue(value, { visible })}</span>;
}
