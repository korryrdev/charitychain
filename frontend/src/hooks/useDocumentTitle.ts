import { useEffect } from 'react';

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const prior = document.title;
    document.title = title ? `${title} | CharityChain` : 'CharityChain';
    return () => {
      document.title = prior;
    };
  }, [title]);
}
