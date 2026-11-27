import { useMemo, useState } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  total?: number;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  pageCount: number;
  offset: number;
  setPage: (next: number) => void;
}

export function usePagination({
  initialPage = 1,
  pageSize = 25,
  total = 0,
}: UsePaginationOptions = {}): UsePaginationResult {
  const [page, setPage] = useState(initialPage);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  return useMemo(
    () => ({
      page: safePage,
      pageSize,
      pageCount,
      offset: (safePage - 1) * pageSize,
      setPage: (next: number) => setPage(Math.min(Math.max(1, next), pageCount)),
    }),
    [safePage, pageSize, pageCount]
  );
}
