import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Show up to 5 pages centred around current
  let start = Math.max(1, current - 2);
  let end = start + 4;

  if (end > total) {
    end = total;
    start = Math.max(1, end - 4);
  }

  if (start > 1) pages.push("...");

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < total) pages.push("...");

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        className={styles.btn}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        type="button"
      >
        Prev
      </button>
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis}>
            ...
          </span>
        ) : (
          <button
            key={page}
            className={`${styles.btn} ${styles.pageBtn} ${page === currentPage ? styles.active : ""}`}
            onClick={() => handlePageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            type="button"
          >
            {page}
          </button>
        )
      )}
      <button
        className={styles.btn}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        type="button"
      >
        Next
      </button>
    </nav>
  );
}
