import type { ReactNode } from 'react';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface HighlightProps {
  text: string;
  query?: string;
}

/** Wraps matches of `query` in <mark>. Returns plain text when there is no query. */
export function Highlight({ text, query = '' }: HighlightProps): ReactNode {
  const needle = String(query ?? '').trim();
  if (!needle) return text;
  const parts = String(text).split(new RegExp(`(${escapeRegExp(needle)})`, 'ig'));
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark className="cc-mark" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}
