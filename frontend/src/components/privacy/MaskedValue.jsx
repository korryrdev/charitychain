import { maskValue } from '../../utils/masking.js';
export function MaskedValue({ value, reveal = false, visible = 4 }) { return <span>{reveal ? value : maskValue(value, { visible })}</span>; }
