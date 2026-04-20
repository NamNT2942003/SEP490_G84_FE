import React, { useState, useEffect, useCallback } from "react";
import { roomManagementApi } from "../api/roomManagementApi";

const BRAND = "#5C6F4E";

const STAT_CARDS = [
  { key: "total",    label: "Total Items",  icon: "bi-boxes",        color: BRAND,      bgAlpha: "rgba(92,111,78,0.08)" },
  { key: "premium",  label: "Premium",      icon: "bi-star-fill",    color: "#e09900",  bgAlpha: "rgba(224,153,0,0.08)" },
  { key: "standard", label: "Standard",     icon: "bi-check-circle", color: "#6c757d",  bgAlpha: "rgba(108,117,125,0.08)" },
  { key: "page",     label: "Showing",      icon: "bi-list-ul",      color: "#0d6efd",  bgAlpha: "rgba(13,110,253,0.08)" },
];

export default function FurnitureManagement() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalPages = Math.ceil(total / size);

  const fetchFurniture = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      if (search.trim()) {
        data = await roomManagementApi.searchFurniture(search.trim(), page, size);
      } else {
        data = await roomManagementApi.listFurniture(page, size);
      }
      setItems(data.content || []);
      setTotal(data.totalElements || 0);
    } catch (err) {
      setError("Failed to load furniture. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, size]);

  useEffect(() => { fetchFurniture(); }, [fetchFurniture]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(inputVal); setPage(0); };
  const handleClear  = () => { setInputVal(""); setSearch(""); setPage(0); };

  const premiumCount  = items.filter((i) => i.type === "Premium").length;
  const standardCount = items.filter((i) => i.type === "Standard").length;

  const statValues = { total, premium: premiumCount, standard: standardCount, page: items.length };

  return (
      <>
        <div className="container-fluid py-4 px-4">

          {/* ── Page Header ── */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>

              <h4 className="page-title">
                Furniture Management
              </h4>
            </div>
            <button
                className="btn fw-semibold d-flex align-items-center gap-2 px-4 py-2 rounded-3"
                style={{ backgroundColor: BRAND, color: "#fff", border: "none", boxShadow: `0 2px 8px rgba(92,111,78,0.35)` }}
            >
              <i className="bi bi-plus-lg"></i> Add Furniture
            </button>
          </div>

          {/* ── Stat Cards ── */}
          <div className="row g-3 mb-4">
            {STAT_CARDS.map((s) => (
                <div className="col-6 col-lg-3" key={s.key}>
                  <div className="card border-0 h-100" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderRadius: 12 }}>
                    <div className="card-body d-flex align-items-center gap-3 py-3 px-4">
                      <div
                          className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-3"
                          style={{ width: 48, height: 48, backgroundColor: s.bgAlpha }}
                      >
                        <i className={`bi ${s.icon} fs-5`} style={{ color: s.color }}></i>
                      </div>
                      <div>
                        <div className="fw-bold fs-4 lh-1 mb-1" style={{ color: s.color }}>
                          {loading ? <span className="placeholder col-4 rounded"></span> : statValues[s.key]}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.78rem" }}>{s.label}</div>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>

          {/* ── Table Card ── */}
          <div className="card border-0" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderRadius: 12 }}>

            {/* Toolbar */}
            <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between gap-3 flex-wrap py-3 px-4" style={{ borderRadius: "12px 12px 0 0" }}>
              <form className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 420 }} onSubmit={handleSearch}>
                <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                  <input
                      type="text"
                      className="form-control border-start-0 border-end-0 ps-0"
                      placeholder="Search by name..."
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                  />
                  {inputVal && (
                      <button type="button" className="btn btn-outline-secondary border-start-0" onClick={handleClear}>
                        <i className="bi bi-x"></i>
                      </button>
                  )}
                  <button type="submit" className="btn" style={{ backgroundColor: BRAND, color: "#fff", border: "none" }}>
                    Search
                  </button>
                </div>
              </form>
              <span className="text-muted small">
              {!loading && `${total} item${total !== 1 ? "s" : ""} found`}
            </span>
            </div>

            {/* Error */}
            {error && (
                <div className="alert border-0 m-3 d-flex align-items-center gap-2 py-2 small"
                     style={{ backgroundColor: "rgba(220,53,69,0.08)", color: "#842029", borderRadius: 8 }}>
                  <i className="bi bi-exclamation-circle-fill"></i> {error}
                </div>
            )}

            {/* Table */}
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                  <tr style={{ backgroundColor: "#f8f9fb" }}>
                    <th className="ps-4 text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", width: 52 }}>#</th>
                    <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", width: 120 }}>Code</th>
                    <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Name</th>
                    <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", width: 130 }}>Quality</th>
                    <th className="text-end pe-4 text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", width: 100 }}>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted">
                          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                          Loading furniture...
                        </td>
                      </tr>
                  ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                            <div className="d-flex align-items-center justify-content-center rounded-4 mb-3"
                                 style={{ width: 64, height: 64, backgroundColor: "rgba(92,111,78,0.08)" }}>
                              <i className="bi bi-boxes fs-3" style={{ color: BRAND }}></i>
                            </div>
                            <h6 className="fw-semibold mb-1">
                              {search ? `No items matching "${search}"` : "No furniture items found"}
                            </h6>
                          </div>
                        </td>
                      </tr>
                  ) : (
                      items.map((item, idx) => (
                          <tr key={item.furnitureId} style={{ borderTop: "1px solid #f0f0f4" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafbfd")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                            <td className="ps-4 text-muted small">{page * size + idx + 1}</td>
                            <td>
                              <code className="text-muted" style={{ fontSize: "0.75rem" }}>{item.furnitureCode}</code>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                     style={{ width: 32, height: 32, backgroundColor: item.type === "Premium" ? "rgba(224,153,0,0.1)" : "rgba(108,117,125,0.1)" }}>
                                  <i className={`bi ${item.type === "Premium" ? "bi-star-fill" : "bi-box"}`}
                                     style={{ color: item.type === "Premium" ? "#e09900" : "#6c757d", fontSize: "0.85rem" }}></i>
                                </div>
                                <span className="fw-semibold" style={{ fontSize: "0.88rem", color: "#1a1a2e" }}>{item.furnitorName}</span>
                              </div>
                            </td>
                            <td>
                              {item.type === "Premium" ? (
                                  <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill small fw-semibold"
                                        style={{ backgroundColor: "rgba(224,153,0,0.1)", color: "#b37700", fontSize: "0.72rem" }}>
                              <i className="bi bi-star-fill" style={{ fontSize: "0.6rem" }}></i> Premium
                            </span>
                              ) : (
                                  <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill small fw-semibold"
                                        style={{ backgroundColor: "rgba(108,117,125,0.1)", color: "#495057", fontSize: "0.72rem" }}>
                              <i className="bi bi-check-circle" style={{ fontSize: "0.6rem" }}></i> Standard
                            </span>
                              )}
                            </td>
                            <td className="text-end pe-4">
                              <button className="btn btn-sm me-1" title="Edit"
                                      style={{ width: 30, height: 30, padding: 0, backgroundColor: "rgba(13,110,253,0.08)", color: "#0d6efd", border: "none", borderRadius: 6 }}>
                                <i className="bi bi-pencil" style={{ fontSize: "0.75rem" }}></i>
                              </button>
                              <button className="btn btn-sm" title="Delete"
                                      style={{ width: 30, height: 30, padding: 0, backgroundColor: "rgba(220,53,69,0.08)", color: "#dc3545", border: "none", borderRadius: 6 }}>
                                <i className="bi bi-trash" style={{ fontSize: "0.75rem" }}></i>
                              </button>
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <div className="card-footer bg-white border-top d-flex align-items-center justify-content-between py-3 px-4" style={{ borderRadius: "0 0 12px 12px" }}>
                  <span className="text-muted small">Page {page + 1} of {totalPages}</span>
                  <nav>
                    <ul className="pagination pagination-sm mb-0 gap-1">
                      <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                        <button className="page-link rounded-2" onClick={() => setPage((p) => p - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i)
                          .filter((i) => Math.abs(i - page) <= 2)
                          .map((i) => (
                              <li key={i} className={`page-item ${i === page ? "active" : ""}`}>
                                <button className="page-link rounded-2"
                                        style={i === page ? { backgroundColor: BRAND, borderColor: BRAND } : {}}
                                        onClick={() => setPage(i)}>
                                  {i + 1}
                                </button>
                              </li>
                          ))}
                      <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                        <button className="page-link rounded-2" onClick={() => setPage((p) => p + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
            )}
          </div>
        </div>
      </>
  );
}