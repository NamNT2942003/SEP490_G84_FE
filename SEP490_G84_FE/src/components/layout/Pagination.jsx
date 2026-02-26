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
    <div className="pagination-container mt-5 pt-3 border-top">
      <style>
        {`
          .pagination-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
          }
          
          .pagination-info {
            font-size: 0.95rem;
            color: #6c757d;
            font-weight: 500;
          }
          
          .pagination-nav {
            display: flex;
            gap: 0.25rem;
          }
          
          .pagination-nav .page-item .page-link {
            border: 1px solid #dee2e6;
            color: #5C6F4E;
            min-width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s ease;
            font-weight: 500;
          }
          
          .pagination-nav .page-item .page-link:hover:not(.disabled) {
            background-color: #5C6F4E;
            color: white;
            border-color: #5C6F4E;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(92, 111, 78, 0.2);
          }
          
          .pagination-nav .page-item.active .page-link {
            background-color: #5C6F4E;
            border-color: #5C6F4E;
            color: white;
            box-shadow: 0 2px 8px rgba(92, 111, 78, 0.3);
          }
          
          .pagination-nav .page-item.disabled .page-link {
            color: #ccc;
            cursor: not-allowed;
            background-color: #f9f9f9;
            border-color: #e9ecef;
          }
          
          .pagination-nav .page-item .page-link.ellipsis {
            cursor: default;\n            background: transparent;
            border: none;
          }
          
          @media (max-width: 576px) {
            .pagination-container {
              justify-content: center;
            }
            .pagination-info {
              width: 100%;
              text-align: center;
            }
          }
        `}
      </style>

      <div className="pagination-info">
        <i className="bi bi-list-ul me-2"></i>
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalElements}</strong> rooms
      </div>

      <nav className="pagination-nav">
        <ul className="pagination mb-0" style={{gap: "0"}}>
          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              title="Previous page"
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
                <span className="page-link ellipsis">…</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onPageChange(page)}
                  title={`Go to page ${page + 1}`}
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
              title="Next page"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
