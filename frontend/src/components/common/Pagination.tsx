export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (nextPage: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="pagination">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span aria-current="page">
        Page {page} of {pageCount}
      </span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
        Next
      </button>
    </nav>
  );
}
