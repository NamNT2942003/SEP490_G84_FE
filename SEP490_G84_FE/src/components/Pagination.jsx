import PropTypes from "prop-types";

const Pagination = ({
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  pageSize,
}) => {
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages - 1, start + maxVisible - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

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
    <div className="d-flex justify-content-between align-items-center mt-4">
      <div className="text-muted small">
        Showing {startItem} to {endItem} of {totalElements} results
      </div>

      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {generatePageNumbers().map((page, index) => (
            <li
              key={index}
              className={`page-item ${
                page === currentPage ? "active" : ""
              } ${page === "..." ? "disabled" : ""}`}
            >
              {page === "..." ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onPageChange(page)}
                  style={{
                    backgroundColor: page === currentPage ? "#5C6F4E" : "",
                    borderColor: page === currentPage ? "#5C6F4E" : "",
                  }}
                >
                  {page + 1}
                </button>
              )}
            </li>
          ))}

          <li
            className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalElements: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired,
};

export default Pagination;
