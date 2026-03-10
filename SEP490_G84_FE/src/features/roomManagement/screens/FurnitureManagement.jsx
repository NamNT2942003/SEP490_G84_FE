import React, { useState, useEffect, useCallback } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import MainLayout from "../../../components/layout/MainLayout";

const BRAND = "#5C6F4E";

export default function FurnitureManagement() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("name");

  const fetchFurniture = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      if (search.trim()) {
        data = await roomManagementApi.searchFurniture(search.trim(), page, pageSize);
      } else {
        data = await roomManagementApi.listFurniture(page, pageSize);
      }
      setItems(data.content || []);
      setTotal(data.totalElements || 0);
      setTotalPages(data.totalPages || Math.ceil((data.totalElements || 0) / pageSize));
    } catch (err) {
      setError("Failed to load furniture. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => { fetchFurniture(); }, [fetchFurniture]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(inputVal); setPage(0); };
  const handleClear = () => { setInputVal(""); setSearch(""); setPage(0); };
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const premiumCount = items.filter((i) => i.type === "Premium").length;
  const standardCount = items.filter((i) => i.type === "Standard").length;

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const maxVisiblePages = 5;
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    return (
      <nav aria-label="Furniture pagination" className="d-flex justify-content-center mt-4">
        <ul className="pagination pagination-sm gap-1 mb-0">
          <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
            <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(0)}>
              <i className="bi bi-chevron-double-left"></i>
            </button>
          </li>
          <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
            <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(page - 1)}>
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {startPage > 0 && <li className="page-item disabled"><span className="page-link border-0">...</span></li>}
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(p => (
            <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
              <button 
                className="page-link border-0 rounded-3 px-3 fw-bold" 
                style={page === p ? { backgroundColor: BRAND, color: 'white' } : { color: BRAND }}
                onClick={() => handlePageChange(p)}
              >
                {p + 1}
              </button>
            </li>
          ))}
          {endPage < totalPages - 1 && <li className="page-item disabled"><span className="page-link border-0">...</span></li>}
          <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
            <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(page + 1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
          <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
            <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(totalPages - 1)}>
              <i className="bi bi-chevron-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };


  return (
    <MainLayout>
    <div style={{ background: '#f5f6f8', minHeight: '100vh' }}>
      <style>{`
        .hero {
          background: linear-gradient(135deg, #5C6F4E 0%, #3d4a33 100%);
          padding: 36px 0 48px;
          margin-bottom: -22px;
          position: relative;
          z-index: 10;
          overflow: visible;
        }
        .hero::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 36px;
          background: #f5f6f8;
          border-radius: 20px 20px 0 0;
          z-index: -1;
          pointer-events: none;
        }
        .hero-txt {
          text-align: center;
          margin-bottom: 20px;
          color: #fff;
        }
        .hero-txt h2 {
          font-weight: 800;
          font-size: 1.5rem;
          margin-bottom: 4px;
        }
        .hero-txt p {
          color: rgba(255, 255, 255, .7);
          font-size: .9rem;
          margin: 0;
        }
        .res-hdr {
          background: #fff;
          border-radius: 14px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
          border: 1px solid #eee;
          margin-bottom: 18px;
          backdrop-filter: blur(2px);
        }
        .res-cnt {
          font-size: .95rem;
          font-weight: 700;
          color: #333;
          display: flex;
          align-items: center;
        }
        .res-cnt span {
          color: #5C6F4E;
          font-weight: 800;
        }
        .sort-sel {
          border: 1.5px solid #e8e8e8;
          border-radius: 10px;
          padding: 9px 14px;
          font-size: .85rem;
          color: #555;
          background: #fafbfc;
          cursor: pointer;
          transition: all .25s ease;
          font-weight: 500;
        }
        .sort-sel:hover {
          border-color: #d0d0d0;
          background: #fff;
        }
        .sort-sel:focus {
          outline: none;
          border-color: #5C6F4E;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(92,111,78,.1);
        }
        .empty-st {
          background: #fff;
          border-radius: 16px;
          padding: 50px 30px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .empty-st i {
          font-size: 3.5rem;
          color: #ddd;
          margin-bottom: 12px;
        }
        .load-st {
          background: #fff;
          border-radius: 16px;
          padding: 50px 30px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .err-c {
          background: #fff;
          border-radius: 14px;
          border-left: 4px solid #dc3545;
          padding: 18px 22px;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .bc-bar {
          padding: 12px 0 0;
        }
        .bc-bar .breadcrumb {
          margin-bottom: 0;
          font-size: .85rem;
        }
        .bc-bar .breadcrumb a {
          color: #5C6F4E;
          text-decoration: none;
          font-weight: 500;
        }
        .bc-bar .breadcrumb a:hover {
          text-decoration: underline;
        }
        .fc {
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
          border: 1px solid #eee;
          margin-bottom: 12px;
          transition: all .25s;
        }
        .fc:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,.08);
          transform: translateY(-1px);
        }
        .fc-body {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .fc-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .fc-info {
          flex: 1;
          min-width: 0;
        }
        .fc-code {
          font-size: .7rem;
          color: #999;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .fc-name {
          font-weight: 700;
          font-size: .95rem;
          color: #222;
          margin-bottom: 4px;
        }
        .fc-type {
          display: inline-block;
          font-size: .7rem;
          font-weight: 600;
          margin: 0;
        }
        .fc-type.premium {
          background: rgba(224,153,0,.1);
          color: #b37700;
          padding: 3px 10px;
          border-radius: 6px;
        }
        .fc-type.standard {
          background: rgba(108,117,125,.1);
          color: #495057;
          padding: 3px 10px;
          border-radius: 6px;
        }
        .fc-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .fc-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .8rem;
          transition: all .2s;
        }
        .fc-btn-edit {
          background: rgba(13,110,253,.08);
          color: #0d6efd;
        }
        .fc-btn-edit:hover {
          background: rgba(13,110,253,.15);
        }
        .fc-btn-del {
          background: rgba(220,53,69,.08);
          color: #dc3545;
        }
        .fc-btn-del:hover {
          background: rgba(220,53,69,.15);
        }
        .furn-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .filter-box {
          background: #fff;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
          border: 1px solid #eee;
          position: sticky;
          top: 20px;
        }
        .filter-title {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 22px;
          color: #222;
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f5f5f5;
        }
        .filter-title i {
          color: #5C6F4E;
          font-size: 1.15rem;
        }
        .filter-group {
          margin-bottom: 24px;
        }
        .filter-label {
          font-size: .65rem;
          color: #999;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          display: block;
        }
        .filter-input-group {
          position: relative;
        }
        .filter-input-group input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1.5px solid #e8e8e8;
          border-radius: 10px;
          font-size: .9rem;
          background: #fafbfc;
          color: #333;
          transition: all .3s ease;
        }
        .filter-input-group input:focus {
          outline: none;
          border-color: #5C6F4E;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(92,111,78,.1);
        }
        .filter-input-group input::placeholder {
          color: #bbb;
        }
        .filter-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: .95rem;
          pointer-events: none;
        }
        .filter-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .filter-btn {
          flex: 1;
          padding: 11px 14px;
          border: none;
          border-radius: 9px;
          font-size: .8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all .25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .filter-btn-search {
          background: linear-gradient(135deg, #5C6F4E, #4a5b3f);
          color: #fff;
          box-shadow: 0 2px 8px rgba(92,111,78,.15);
        }
        .filter-btn-search:hover {
          box-shadow: 0 4px 14px rgba(92,111,78,.3);
          transform: translateY(-1px);
        }
        .filter-btn-clear {
          background: #f5f5f5;
          color: #666;
          border: 1.5px solid #e8e8e8;
        }
        .filter-btn-clear:hover {
          background: #efefef;
          border-color: #d0d0d0;
          color: #333;
        }
        .filter-badge {
          display: inline-block;
          background: rgba(92,111,78,.1);
          color: #5C6F4E;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: .7rem;
          font-weight: 600;
          margin-top: 14px;
        }
        .filter-badge i {
          margin-right: 4px;
        }
        @media(max-width: 768px) {
          .furn-grid {
            grid-template-columns: 1fr;
          }
          .filter-box {
            position: relative;
            top: 0;
          }
        }
      `}</style>

      <div className="hero">
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="hero-txt">
            <h2><i className="bi bi-box-seam me-2" style={{ fontSize: '1.2rem' }}></i>Furniture Inventory</h2>
            <p>Manage all furniture items efficiently</p>
          </div>
        </div>
      </div>

      <div className="container bc-bar" style={{ position: 'relative', zIndex: 1 }}>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/admin"><i className="bi bi-house-door me-1"></i>Admin</a></li>
            <li className="breadcrumb-item active">Furniture Management</li>
          </ol>
        </nav>
      </div>

      <div className="container pb-5">
        <div className="row g-4">
          {/* Left Sidebar with Filters */}
          <div className="col-lg-3 col-md-4">
            <div className="filter-box">
              <div className="filter-title">
                <i className="bi bi-funnel"></i>
                <span>Filters</span>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-search me-1"></i>By Name
                </label>
                <form onSubmit={handleSearch} className="filter-input-group">
                  <i className="filter-icon bi bi-search"></i>
                  <input
                    type="text"
                    placeholder="Search furniture..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                  />
                </form>
                <div className="filter-actions">
                  <button 
                    type="submit"
                    className="filter-btn filter-btn-search"
                    onClick={handleSearch}
                  >
                    <i className="bi bi-search"></i>Search
                  </button>
                  {inputVal && (
                    <button 
                      type="button"
                      className="filter-btn filter-btn-clear"
                      onClick={handleClear}
                    >
                      <i className="bi bi-x-lg"></i>Clear
                    </button>
                  )}
                </div>
              </div>

              {search && (
                <div className="filter-badge">
                  <i className="bi bi-check-circle"></i>
                  Active: "{search}"
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-9 col-md-8" style={{ position: 'relative', zIndex: 0 }}>
            {/* Results Header */}
            <div className="res-hdr d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="res-cnt">
                <i className="bi bi-boxes me-2" style={{ color: BRAND }}></i>
                Found <span>{total}</span> item{total !== 1 ? 's' : ''}
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '.82rem', fontWeight: '500' }}>
                  <i className="bi bi-sort-down me-1"></i>Sort by:
                </span>
                <select 
                  className="sort-sel" 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name"><i className="bi bi-sort-alpha-down me-1"></i>Name (A-Z)</option>
                  <option value="type">By Type</option>
                  <option value="code">By Code</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="load-st">
                <div className="spinner-border mb-3" role="status" style={{ color: BRAND, width: '2.5rem', height: '2.5rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mb-0">Loading furniture items...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="err-c">
                <div className="d-flex align-items-start gap-3">
                  <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.3rem', color: '#dc3545' }}></i>
                  <div>
                    <h6 className="mb-1 fw-bold" style={{ color: '#dc3545' }}>Unable to load furniture</h6>
                    <p className="mb-1 text-muted" style={{ fontSize: '.9rem' }}>{error}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '.8rem' }}>Please try again or refresh the page.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && items.length === 0 && (
              <div className="empty-st">
                <i className="bi bi-inbox d-block"></i>
                <h5 className="fw-bold mb-2" style={{ color: '#333' }}>No furniture items found</h5>
                <p className="text-muted mb-3">No items match your search criteria.</p>
                {search && (
                  <p className="text-muted small mb-0">
                    <i className="bi bi-lightbulb me-1"></i>Try a different search term.
                  </p>
                )}
              </div>
            )}

            {/* Furniture Grid */}
            {!loading && !error && items.length > 0 && (
              <div className="furn-grid">
                {items.map((item) => (
                  <div key={item.furnitureId || item.id} className="fc">
                    <div className="fc-body">
                      <div 
                        className="fc-icon"
                        style={{
                          backgroundColor: item.type === "Premium" 
                            ? "rgba(224,153,0,0.1)" 
                            : "rgba(108,117,125,0.1)"
                        }}
                      >
                        <i className={`bi ${
                          item.type === "Premium" ? "bi-star-fill" : "bi-box"
                        }`} style={{
                          color: item.type === "Premium" ? "#e09900" : "#6c757d"
                        }}></i>
                      </div>
                      <div className="fc-info">
                        <div className="fc-code">{item.furnitureCode}</div>
                        <div className="fc-name">{item.furnitorName}</div>
                        <p className={`fc-type ${item.type === "Premium" ? "premium" : "standard"}`}>
                          {item.type === "Premium" && <i className="bi bi-star-fill me-1" style={{ fontSize: '.6rem' }}></i>}
                          {item.type}
                        </p>
                      </div>
                      <div className="fc-actions">
                        <button 
                          className="fc-btn fc-btn-edit" 
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="fc-btn fc-btn-del" 
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && items.length > 0 && totalPages > 1 && (
              <div>
                {renderPagination()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
