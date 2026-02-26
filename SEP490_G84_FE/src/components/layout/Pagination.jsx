const Pagination = ({ currentPage, totalPages, totalElements, onPageChange, pageSize }) => {
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages - 1, start + maxVisible - 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (start > 0) {
        pages.unshift("...");
        pages.unshift(0);
      }

      if (end < totalPages - 1) {
        pages.push("...");
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  if (totalPages <= 1) return null;

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-2">
      <div className="text-muted small">Showing {startItem} to {endItem} of {totalElements} results</div>

      <nav aria-label="Pagination navigation">
        <ul className="pagination mb-0" style={{ gap: 6 }}>
          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
              aria-label="First"
              style={{ borderRadius: 8, padding: '6px 10px' }}
            >
              <i className="bi bi-chevron-double-left"></i>
            </button>
          </li>

          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="Previous"
              style={{ borderRadius: 8, padding: '6px 10px' }}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {generatePageNumbers().map((page, index) => (
            <li key={index} className={`page-item ${page === "..." ? "disabled" : ""}`}>
              {page === "..." ? (
                <span className="page-link" style={{ borderRadius: 8, padding: '6px 10px' }}>...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onPageChange(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                  style={{
                    backgroundColor: page === currentPage ? "#5C6F4E" : "transparent",
                    borderColor: page === currentPage ? "#5C6F4E" : "#dee2e6",
                    color: page === currentPage ? '#fff' : '#212529',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontWeight: page === currentPage ? 700 : 600,
                  }}
                >
                  {page + 1}
                </button>
              )}
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              aria-label="Next"
              style={{ borderRadius: 8, padding: '6px 10px' }}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>

          <li className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              aria-label="Last"
              style={{ borderRadius: 8, padding: '6px 10px' }}
            >
              <i className="bi bi-chevron-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
