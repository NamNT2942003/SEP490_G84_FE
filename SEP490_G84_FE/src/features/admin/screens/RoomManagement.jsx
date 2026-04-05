import React, { useState, useEffect } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import RoomDetailModal from "../components/RoomDetailModal";
import ReportIssueModal from "../components/ReportIssueModal";

const BRAND = "#5C6F4E";

const STAT_CARDS = [
  {
    key: "total",
    label: "Total Rooms",
    icon: "bi-building",
    color: BRAND,
    bgAlpha: "rgba(92,111,78,0.08)",
  },
  {
    key: "available",
    label: "Available",
    icon: "bi-check-circle-fill",
    color: "#198754",
    bgAlpha: "rgba(25,135,84,0.08)",
  },
  {
    key: "occupied",
    label: "Occupied",
    icon: "bi-person-fill-check",
    color: "#0d6efd",
    bgAlpha: "rgba(13,110,253,0.08)",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    icon: "bi-hammer",
    color: "#dc3545",
    bgAlpha: "rgba(220,53,69,0.08)",
  },
];

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [equipmentBrokenFilter, setEquipmentBrokenFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [branches, setBranches] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Additional state for enhanced data
  const [statistics, setStatistics] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
  });
  const [floors, setFloors] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [apiStatus, setApiStatus] = useState({
    rooms: 'unknown',
    statistics: 'unknown',
    floors: 'unknown',
    types: 'unknown'
  });

  const pageSize = 20;

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomManagementApi.listRooms(
          search,
          "", // status filter - we'll handle this in UI if needed, but here we pass empty to get all
          page,
          pageSize,
          branchFilter
      );
      setRooms(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setApiStatus(prev => ({ ...prev, rooms: 'available' }));
    } catch (err) {
      console.warn("Rooms API not available:", err.response?.status);
      setError(err.response?.status === 400 || err.response?.status === 404
          ? "Backend APIs are not ready. Please check the backend connection."
          : err.message || "Error loading room data");
      setRooms([]);
      setApiStatus(prev => ({ ...prev, rooms: 'unavailable' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (branch) => {
    try {
      const stats = await roomManagementApi.getRoomStatistics(branch || branchFilter);
      setStatistics({
        totalRooms: stats.totalRooms || 0,
        availableRooms: stats.availableRooms || 0,
        occupiedRooms: stats.occupiedRooms || 0,
        maintenanceRooms: stats.maintenanceRooms || 0,
        totalEquipment: stats.totalEquipment || 0,
        brokenEquipment: stats.brokenEquipment || 0,
        totalIssues: stats.totalIssues || 0,
      });
      setApiStatus(prev => ({ ...prev, statistics: 'available' }));
    } catch (err) {
      console.warn("Statistics API not available:", err.response?.status);
      // Set default statistics when API is not available
      setStatistics({
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        totalEquipment: 0,
        brokenEquipment: 0,
        totalIssues: 0,
      });
      setApiStatus(prev => ({ ...prev, statistics: 'unavailable' }));
    }
  };

  const fetchFloors = async () => {
    try {
      const floorData = await roomManagementApi.getFloors();
      // ✅ Ensure unique keys and valid structure
      const validFloors = (floorData || []).filter(floor =>
          floor &&
          typeof floor.floor === 'number' &&
          floor.floor > 0 && // Filter out invalid floors
          floor.label &&
          typeof floor.roomCount === 'number'
      );
      setFloors(validFloors);
      setApiStatus(prev => ({ ...prev, floors: 'available' }));
    } catch (err) {
      console.warn("Floors API not available:", err.response?.status);
      setFloors([]); // Empty array when API not available
      setApiStatus(prev => ({ ...prev, floors: 'unavailable' }));
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const typeData = await roomManagementApi.getRoomTypes();
      // ✅ Ensure unique keys and valid structure
      const validTypes = (typeData || []).filter(type =>
          type &&
          type.type &&
          type.label &&
          typeof type.roomCount === 'number'
      );
      setRoomTypes(validTypes);
      setApiStatus(prev => ({ ...prev, types: 'available' }));
    } catch (err) {
      console.warn("Room types API not available:", err.response?.status);
      setRoomTypes([]); // Empty array when API not available
      setApiStatus(prev => ({ ...prev, types: 'unavailable' }));
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await roomManagementApi.listBranches();
      setBranches(data || []);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchRooms(),
      fetchStatistics(),
      fetchFloors(),
      fetchRoomTypes(),
      fetchBranches(),
    ]);
  };

  useEffect(() => {
    setPage(0);
  }, [search, floorFilter, roomTypeFilter, equipmentBrokenFilter, branchFilter]);

  useEffect(() => {
    fetchRooms();
    fetchStatistics();
  }, [page, search, branchFilter]);

  useEffect(() => {
    fetchAllData();

    // Set up periodic refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStatistics(branchFilter);
    }, 30000);

    return () => clearInterval(interval);
  }, []); // Load initial data on mount

  // Re-fetch data when page changes
  useEffect(() => {
    const fetchCurrentPageRooms = async () => {
      try {
        setLoading(true);
        const data = await roomManagementApi.listRooms(search, "", page, 12, branchFilter);

        setRooms(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentPageRooms();
  }, [page, search, branchFilter]);

  // Handle page change with smooth scroll to top of grid
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    return (
        <nav aria-label="Room navigation" className="mt-4">
          <ul className="pagination pagination-sm justify-content-center gap-1 mb-0">
            {/* First Page */}
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(0)}>
                <i className="bi bi-chevron-double-left"></i>
              </button>
            </li>

            {/* Previous Page */}
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(page - 1)}>
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>

            {/* Page Numbers */}
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

            {/* Next Page */}
            <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(page + 1)}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>

            {/* Last Page */}
            <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(totalPages - 1)}>
                <i className="bi bi-chevron-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
    );
  };

  // Re-fetch statistics when filters change (reset to page 0)
  useEffect(() => {
    setPage(0);
  }, [search, floorFilter, roomTypeFilter, equipmentBrokenFilter, branchFilter]);

  // Re-fetch data when user returns to tab (for better UX)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Filter rooms based on UI filters
  const filteredRooms = rooms.filter(room => {
    let match = true;
    if (floorFilter) match = match && room.floor?.toString() === floorFilter;
    if (roomTypeFilter) match = match && room.roomType === roomTypeFilter;
    if (equipmentBrokenFilter === "true") match = match && (room.equipmentBroken > 0);
    if (equipmentBrokenFilter === "false") match = match && (room.equipmentBroken === 0);
    return match;
  });

  // Sort filtered rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    switch(sortBy) {
      case "name":
        return (a.roomName || "").localeCompare(b.roomName || "");
      case "floor":
        return (a.floor || 0) - (b.floor || 0);
      case "type":
        return (a.roomType || "").localeCompare(b.roomType || "");
      default:
        return 0;
    }
  });

  const statValues = {
    total: statistics.totalRooms,
    available: statistics.availableRooms,
    occupied: statistics.occupiedRooms,
    maintenance: statistics.maintenanceRooms,
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
    setPage(0);
  };

  const handleViewRoom = (room) => {
    setSelectedRoom(room);
    setShowDetailModal(true);
  };

  const handleReportIssue = (room) => {
    setSelectedRoom(room);
    setShowReportModal(true);
  };

  const getStatusColor = (status) => {
    if (!status) return "#6c757d";
    const s = status.toUpperCase();
    switch(s) {
      case "AVAILABLE": return "#198754"; // Xanh lá - Sẵn sàng
      case "OCCUPIED": return "#0d6efd";  // Xanh dương - Có người
      case "MAINTENANCE": return "#dc3545"; // Đỏ - Bảo trì (Vì có đồ hỏng/sự cố)
      default: return "#6c757d";
    }
  };

  const getStatusText = (status) => {
    if (!status) return "Unknown";
    const s = status.toUpperCase();
    switch(s) {
      case "AVAILABLE": return "Available";
      case "OCCUPIED": return "Occupied";
      case "MAINTENANCE": return "Maintenance";
      default: return status;
    }
  };

  return (
      <>
        <div className="container-fluid py-4 px-xl-5" style={{ backgroundColor: "#fbfbfb", minHeight: "100vh" }}>
          {/* HEADER SECTION */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-2" style={{ fontSize: "0.8rem" }}>
                  <li className="breadcrumb-item"><a href="#" className="text-decoration-none text-muted">Admin Panel</a></li>
                  <li className="breadcrumb-item active fw-medium" aria-current="page" style={{ color: BRAND }}>Room Management</li>
                </ol>
              </nav>
              <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-1px", fontSize: "1.85rem" }}>
                Room Inventory Dashboard
              </h2>
              <p className="text-muted mb-0 small">Real-time monitoring of room status, equipment health, and maintenance incidents.</p>
            </div>
            <div className="d-flex gap-2">
              <button
                  className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 shadow-sm border-0"
                  style={{ backgroundColor: BRAND, borderRadius: "10px", fontWeight: "600", transition: "all 0.3s" }}
              >
                <i className="bi bi-plus-circle-fill"></i> Add New Room
              </button>
            </div>
          </div>

          {/* QUICK STATS - REFACTORED */}
          <div className="row g-3 mb-4">
            {[
              { key: "total", label: "Total Rooms", value: statistics.totalRooms, icon: "bi-building", color: "#6c757d" },
              { key: "available", label: "Available", value: statistics.availableRooms, icon: "bi-check-circle-fill", color: "#198754" },
              { key: "occupied", label: "Occupied", value: statistics.occupiedRooms, icon: "bi-person-fill-check", color: "#0d6efd" },
              { key: "maintenance", label: "Maintenance", value: statistics.maintenanceRooms, icon: "bi-hammer", color: "#dc3545" },
              { key: "broken", label: "Broken Items", value: statistics.brokenEquipment, icon: "bi-exclamation-octagon-fill", color: "#fd7e14" }
            ].map((stat, idx) => (
                <div key={idx} className="col-6 col-md-4 col-lg">
                  <div className="card border-0 shadow-sm h-100 overflow-hidden"
                       style={{ borderRadius: "16px", borderBottom: `4px solid ${stat.color}` }}>
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <div className="text-truncate">
                          <div className="text-muted fw-bold text-uppercase mb-1 text-truncate" style={{ letterSpacing: "0.5px", fontSize: "0.65rem" }}>{stat.label}</div>
                          <h4 className="fw-bold mb-0 text-dark">
                            {loading ? <div className="spinner-border spinner-border-sm" /> : stat.value}
                          </h4>
                        </div>
                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                             style={{ backgroundColor: `${stat.color}12`, color: stat.color, width: "40px", height: "40px" }}>
                          <i className={`bi ${stat.icon} fs-5`}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>

          {/* FILTERS & SEARCH - PROFESSIONAL BAR */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px" }}>
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                <div className="col-lg-4">
                  <form onSubmit={handleSearch} className="position-relative">
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input
                        type="text"
                        className="form-control ps-5 py-2 border-0 bg-light-subtle"
                        placeholder="Search by Room Name or ID..."
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0" }}
                    />
                  </form>
                </div>
                <div className="col-lg-8">
                  <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                    <select
                        className="form-select border-0 bg-light-subtle w-auto"
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                    >
                      <option value="">All Branches</option>
                      {branches.map((b, index) => (
                          <option key={`${b.branchId || b.id}-${index}`} value={b.branchId || b.id}>
                            {b.branchName || b.name}
                          </option>
                      ))}
                    </select>

                    <select
                        className="form-select border-0 bg-light-subtle w-auto"
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                        value={floorFilter}
                        onChange={(e) => setFloorFilter(e.target.value)}
                    >
                      <option value="">All Floors</option>
                      {floors.map((f, index) => (
                          <option key={`floor-${f.floor}-${index}`} value={String(f.floor)}>
                            Floor {f.floor}
                          </option>
                      ))}
                    </select>

                    <select
                        className="form-select border-0 bg-light-subtle w-auto"
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {roomTypes.map((t, index) => (
                          <option key={`${t.type}-${index}`} value={t.type}>
                            {t.label}
                          </option>
                      ))}
                    </select>

                    <div className="btn-group shadow-sm ms-lg-2" style={{ borderRadius: "10px", overflow: "hidden" }}>
                      <button
                          className={`btn btn-sm px-3 ${viewMode === "grid" ? "btn-dark" : "btn-light"}`}
                          onClick={() => setViewMode("grid")}
                          title="Grid View"
                      >
                        <i className="bi bi-grid-fill"></i>
                      </button>
                      <button
                          className={`btn btn-sm px-3 ${viewMode === "list" ? "btn-dark" : "btn-light"}`}
                          onClick={() => setViewMode("list")}
                          title="List View"
                      >
                        <i className="bi bi-list-task"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LOADING & ERROR - MODERN OVERLAY */}
          {loading && page === 0 && (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <div className="spinner-grow text-primary mb-3" style={{ color: BRAND }} role="status"></div>
                <h6 className="text-muted fw-medium">Syncing Room Data...</h6>
              </div>
          )}

          {/* ROOM CARDS GRID - PREMIUM DESIGN */}
          {!loading && (
              <>
                {sortedRooms.length === 0 ? (
                    <div className="text-center py-5 bg-white shadow-sm rounded-4">
                      <i className="bi bi-inbox text-muted display-1 mb-3"></i>
                      <h4 className="text-muted">No rooms found matching your criteria</h4>
                      <button className="btn btn-link link-primary" onClick={() => { setSearch(''); setBranchFilter(''); setPage(0); }}>Clear All Filters</button>
                    </div>
                ) : (
                    <div className="row g-4">
                      {sortedRooms.map((room, index) => (
                          <div key={room.roomId || room.id || `room-${index}`} className="col-12 col-md-6 col-lg-4 col-xl-3">
                            <div className="card border-0 shadow-sm h-100 room-card position-relative"
                                 style={{ borderRadius: "20px", overflow: "hidden", transition: "all 0.3s ease" }}>

                              {/* Status Indicator Bar */}
                              <div style={{ height: "6px", backgroundColor: getStatusColor(room.status) }}></div>

                              <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                            <span className="badge bg-light text-muted smallest text-uppercase mb-1" style={{ letterSpacing: "1px" }}>
                              {room.roomTypeName || "Standard"}
                            </span>
                                    <h4 className="fw-bold mb-0" style={{ color: "#1a1a2e" }}>{room.roomName}</h4>
                                  </div>
                                  <span
                                      className="badge px-3 py-2 rounded-pill shadow-sm"
                                      style={{
                                        backgroundColor: `${getStatusColor(room.status)}`,
                                        color: "#fff",
                                        fontSize: "0.7rem",
                                        fontWeight: "700"
                                      }}
                                  >
                            {getStatusText(room.status)}
                          </span>
                                </div>

                                <div className="d-flex align-items-center text-muted smallest mb-4">
                                  <i className="bi bi-layers-fill me-1"></i> Floor {room.floor}
                                  <span className="mx-2">•</span>
                                  <i className="bi bi-geo-alt-fill me-1"></i> Central Branch
                                </div>

                                {/* Visual Metrics */}
                                <div className="bg-light rounded-4 p-3 mb-4">
                                  <div className="row g-0 align-items-center">
                                    <div className="col-4 border-end border-white text-center">
                                      <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Equip</div>
                                      <div className="fw-bold text-dark mt-1" style={{ fontSize: "1rem" }}>{room.totalEquipment || 0}</div>
                                    </div>
                                    <div className="col-4 border-end border-white text-center">
                                      <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Broken</div>
                                      <div className={`fw-bold mt-1 ${(room.equipmentBroken || 0) > 0 ? "text-danger" : "text-dark"}`} style={{ fontSize: "1rem" }}>
                                        {room.equipmentBroken || 0}
                                      </div>
                                    </div>
                                    <div className="col-4 text-center">
                                      <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Issues</div>
                                      <div className={`fw-bold mt-1 ${(room.totalIssues || 0) > 0 ? "text-danger" : "text-dark"}`} style={{ fontSize: "1rem" }}>
                                        {room.totalIssues || 0}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="d-grid">
                                  <button
                                      className="btn btn-dark shadow-sm py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                      onClick={() => handleViewRoom(room)}
                                      style={{ borderRadius: "12px", fontSize: "0.85rem", letterSpacing: "0.5px" }}
                                  >
                                    <i className="bi bi-sliders"></i> Manage Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                )}

                {/* FOOTER & PAGINATION */}
                {sortedRooms.length > 0 && (
                    <div className="d-flex flex-column align-items-center mt-5 mb-5">
                      <p className="text-muted small">
                        Showing <strong>{sortedRooms.length}</strong> of <strong>{totalElements}</strong> rooms
                      </p>
                      {renderPagination()}
                    </div>
                )}
              </>
          )}
        </div>

        {/* MODALS */}
        {showDetailModal && selectedRoom && (
            <RoomDetailModal
                show={showDetailModal}
                room={selectedRoom}
                onHide={() => {
                  setShowDetailModal(false);
                  setSelectedRoom(null);
                }}
                onReportIssue={(room) => {
                  setShowDetailModal(false);
                  handleReportIssue(room);
                }}
                onRoomUpdated={() => {
                  fetchAllData();
                }}
            />
        )}

        {showReportModal && selectedRoom && (
            <ReportIssueModal
                show={showReportModal}
                room={selectedRoom}
                onHide={() => {
                  setShowReportModal(false);
                  setSelectedRoom(null);
                }}
                onSuccess={() => {
                  setShowReportModal(false);
                  setSelectedRoom(null);
                  fetchAllData();
                }}
            />
        )}
      </>
  );
}

export default RoomManagement;