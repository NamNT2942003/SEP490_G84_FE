import React, { useState, useEffect, useRef } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import MainLayout from "../../../components/layout/MainLayout"; // eslint-disable-line no-unused-vars
import AdminRoomDetailModal from "../components/AdminRoomDetailModal";
import AddRoomModal from "../components/AddRoomModal";
import RoomList from "../components/RoomList";
import ReportIssueModal from "../components/ReportIssueModal";
import webSocketService from "../../../services/webSocketService";
import { useMyBranches } from "../../../hooks/useMyBranches";

const BRAND = "#5C6F4E";

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [equipmentBrokenFilter, setEquipmentBrokenFilter] = useState("");

  const { branches } = useMyBranches();

  // ── Refs to avoid stale closures in event/ws handlers ──────────────────
  const branchFilterRef = useRef("all");
  const branchesRef = useRef([]);
  const searchRef = useRef("");

  const [branchFilter, _setBranchFilter] = useState("all");
  const setBranchFilter = (v) => { branchFilterRef.current = v; _setBranchFilter(v); };

  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grouped"); // 'grouped' | 'grid' | 'list'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [page, setPage] = useState(0); // eslint-disable-line no-unused-vars

  const [statistics, setStatistics] = useState({
    totalRooms: 0, availableRooms: 0, occupiedRooms: 0,
    cleaningRooms: 0, maintenanceRooms: 0,
    totalEquipment: 0, brokenEquipment: 0, totalIssues: 0,
  });
  const [floors, setFloors] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [notification, setNotification] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsCleanupRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { branchesRef.current = branches; }, [branches]);
  useEffect(() => { branchFilterRef.current = branchFilter; }, [branchFilter]);
  useEffect(() => { searchRef.current = search; }, [search]);

  /* ─── Data Fetching ─────────────────────────────────────────────────── */

  const fetchRooms = async () => {
    const currentFilter = branchFilterRef.current;
    const currentSearch = searchRef.current;
    const managed = branchesRef.current;
    try {
      setLoading(true);
      setError(null);
      if (!currentFilter || currentFilter === "all") {
        if (managed.length === 0) { setRooms([]); return; }
        const results = await Promise.all(
          managed.map(b => roomManagementApi.listRooms(currentSearch, "", 0, 1000, b.branchId))
        );
        setRooms(results.flatMap(r => r.content || []));
      } else {
        const data = await roomManagementApi.listRooms(currentSearch, "", 0, 1000, currentFilter);
        setRooms(data.content || []);
      }
    } catch (err) {
      setError(
        err.response?.status === 400 || err.response?.status === 404
          ? "Backend APIs are not ready. Please check the backend connection."
          : err.message || "Error loading room data"
      );
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    const f = branchFilterRef.current;
    try {
      const stats = await roomManagementApi.getRoomStatistics(f === "all" ? "" : f);
      setStatistics({
        totalRooms: stats.totalRooms || 0,
        availableRooms: stats.availableRooms || 0,
        occupiedRooms: stats.occupiedRooms || 0,
        cleaningRooms: stats.cleaningRooms || 0,
        maintenanceRooms: stats.maintenanceRooms || 0,
        totalEquipment: stats.totalEquipment || 0,
        brokenEquipment: stats.brokenEquipment || 0,
        totalIssues: stats.totalIssues || 0,
      });
    } catch {
      setStatistics({ totalRooms: 0, availableRooms: 0, occupiedRooms: 0, cleaningRooms: 0, maintenanceRooms: 0, totalEquipment: 0, brokenEquipment: 0, totalIssues: 0 });
    }
  };

  const fetchFloors = async () => {
    try {
      const d = await roomManagementApi.getFloors();
      setFloors((d || []).filter(f => f && typeof f.floor === "number" && f.floor > 0 && f.label && typeof f.roomCount === "number"));
    } catch { setFloors([]); }
  };

  const fetchRoomTypes = async () => {
    try {
      const d = await roomManagementApi.getRoomTypes();
      setRoomTypes((d || []).filter(t => t && t.type && t.label && typeof t.roomCount === "number"));
    } catch { setRoomTypes([]); }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchRooms(), fetchStatistics(), fetchFloors(), fetchRoomTypes()]);
  };

  /* ─── Effects ───────────────────────────────────────────────────────── */

  // Validate: if a specific branch ID is selected but no longer managed, reset to 'all'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (branches && branches.length > 0 && branchFilter !== "all") {
      if (!branches.some(b => String(b.branchId) === String(branchFilter))) {
        setBranchFilter("all");
      }
    }
  }, [branches]);

  // Re-fetch rooms whenever search or branch changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRooms();
    fetchStatistics();
  }, [search, branchFilter]);

  // Initial load of floors/types + periodic stats refresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    Promise.all([fetchFloors(), fetchRoomTypes()]).catch(console.error);
    const interval = setInterval(() => fetchStatistics(), 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh on tab focus — uses fetchAllData which reads from refs (no stale closures)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchAllData().catch(console.error);
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // WebSocket
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        setWsConnected(true);
        const sub = webSocketService.subscribeToAllRooms((event) => {
          if (event.type === "ROOM_STATUS_CHANGE") {
            setNotification({ type: "success", message: `Room ${event.roomName}: ${event.oldStatus} → ${event.newStatus}`, timestamp: Date.now() });
            setTimeout(() => setNotification(null), 5000);
            fetchAllData().catch(console.error);
          }
        });
        return () => { if (sub) sub.unsubscribe(); setWsConnected(false); };
      } catch { setWsConnected(false); }
    };
    connectWebSocket()
      .then(fn => { wsCleanupRef.current = fn; })
      .catch(() => setWsConnected(false));
    return () => {
      if (wsCleanupRef.current) wsCleanupRef.current();
      webSocketService.disconnect();
      setWsConnected(false);
    };
  }, []);

  /* ─── Filtering & Grouping ──────────────────────────────────────────── */

  const filteredRooms = rooms.filter((room) => {
    if (room.roomName === "WAREHOUSE" || room.roomName === "WAREHOUSE_FAIL") return false;
    let match = true;
    if (floorFilter) match = match && room.floor?.toString() === floorFilter;
    if (roomTypeFilter) match = match && room.roomType === roomTypeFilter;
    if (equipmentBrokenFilter === "true") match = match && room.equipmentBroken > 0;
    if (equipmentBrokenFilter === "false") match = match && room.equipmentBroken === 0;
    return match;
  });

  // Group by branch → floor
  const groupedByBranch = filteredRooms.reduce((acc, room) => {
    const bName = room.branchName || "Unknown Branch";
    const bId = room.branchId || "unknown";
    if (!acc[bId]) acc[bId] = { branchId: bId, branchName: bName, floors: {} };
    const floor = room.floor || 0;
    if (!acc[bId].floors[floor]) acc[bId].floors[floor] = [];
    acc[bId].floors[floor].push(room);
    return acc;
  }, {});

  const branchGroups = Object.values(groupedByBranch).sort(
    (a, b) => (a.branchName || "").localeCompare(b.branchName || "")
  );

  /* ─── Handlers ──────────────────────────────────────────────────────── */

  const handleSearch = (e) => { e.preventDefault(); setSearch(inputVal); };

  const handleViewRoom = (room) => { setSelectedRoom(room); setShowDetailModal(true); };
  const handleReportIssue = (room) => { setSelectedRoom(room); setShowReportModal(true); };

  const showNotif = (message, type = "success") => {
    setNotification({ type, message, timestamp: Date.now() });
    setTimeout(() => setNotification(null), 5000);
  };

  const clearFilters = () => {
    setSearch(""); setInputVal(""); setFloorFilter(""); setRoomTypeFilter("");
    setBranchFilter("all"); setEquipmentBrokenFilter("");
  };

  /* ─── Utilities ─────────────────────────────────────────────────────── */

  const statusLabel = (s) => {
    const map = { AVAILABLE: "Available", OCCUPIED: "Occupied", CLEANING: "Cleaning", MAINTENANCE: "Maintenance" };
    return map[(s || "").toUpperCase()] || s || "Unknown";
  };
  const statusColor = (s) => {
    const map = { AVAILABLE: "#198754", OCCUPIED: "#0d6efd", CLEANING: "#fd7e14", MAINTENANCE: "#dc3545" };
    return map[(s || "").toUpperCase()] || "#6c757d";
  };

  /* ─── Render ────────────────────────────────────────────────────────── */

  const STAT_CARDS = [
    { key: "total", label: "Total Rooms", value: statistics.totalRooms, icon: "bi-building", color: "#5C6F4E" },
    { key: "available", label: "Available", value: statistics.availableRooms, icon: "bi-check-circle-fill", color: "#198754" },
    { key: "occupied", label: "Occupied", value: statistics.occupiedRooms, icon: "bi-person-fill-check", color: "#0d6efd" },
    { key: "cleaning", label: "Cleaning", value: statistics.cleaningRooms, icon: "bi-arrow-clockwise", color: "#fd7e14" },
    { key: "maintenance", label: "Maintenance", value: statistics.maintenanceRooms, icon: "bi-hammer", color: "#dc3545" },
    { key: "broken", label: "Broken Items", value: statistics.brokenEquipment, icon: "bi-exclamation-octagon-fill", color: "#ffc107" },
  ];

  const hasActiveFilters = search || floorFilter || roomTypeFilter || equipmentBrokenFilter ||
    (branchFilter && branchFilter !== "all");

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === "floor") return (a.floor || 0) - (b.floor || 0);
    if (sortBy === "type") return (a.roomType || "").localeCompare(b.roomType || "");
    return (a.roomName || "").localeCompare(b.roomName || "");
  });

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .rm-root * { font-family: 'DM Sans', sans-serif; }
        .rm-root { min-height: 100vh; }

        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rm-notif {
          position: fixed; top: 80px; right: 24px; z-index: 9999;
          width: 380px; border-radius: 14px;
          background: #fff; border-left: 4px solid #198754;
          box-shadow: 0 12px 40px rgba(0,0,0,0.14);
          padding: 16px 20px; display: flex; align-items: flex-start; gap: 14px;
          animation: slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .rm-stat-card {
          background: #fff; border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.06);
          padding: 20px; display: flex; align-items: center; gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: fadeUp 0.4s ease both;
        }
        .rm-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }

        .rm-search-input {
          width: 100%; padding: 11px 14px 11px 42px;
          border: 1.5px solid #e0e0da; border-radius: 10px;
          font-size: 0.9rem; background: #FAFAF8;
          transition: all 0.25s; color: #1a1a1a;
        }
        .rm-search-input:focus {
          outline: none; border-color: ${BRAND}; background: #fff;
          box-shadow: 0 0 0 3px rgba(92,111,78,0.12);
        }
        .rm-search-input::placeholder { color: #aaa; }

        .rm-select {
          width: 100%; padding: 9px 12px;
          border: 1.5px solid #e0e0da; border-radius: 10px;
          font-size: 0.85rem; background: #FAFAF8;
          cursor: pointer; transition: all 0.25s; color: #333;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 32px;
        }
        .rm-select:focus { outline: none; border-color: ${BRAND}; box-shadow: 0 0 0 3px rgba(92,111,78,0.12); }

        .rm-filter-label {
          display: block; font-size: 0.7rem; font-weight: 700;
          color: #888; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;
        }

        .rm-view-btn {
          padding: 8px 14px; border: none; border-radius: 8px;
          font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
          font-weight: 500; display: flex; align-items: center; gap: 6px;
        }
        .rm-view-btn.active { background: ${BRAND}; color: #fff; }
        .rm-view-btn:not(.active) { background: transparent; color: #666; }
        .rm-view-btn:not(.active):hover { background: #eee; }

        /* ── Grouped view styles ── */
        .rm-branch-block {
          border: 2px solid ${BRAND}; border-radius: 10px;
          overflow: hidden; margin-bottom: 20px;
        }
        .rm-branch-header {
          background: ${BRAND}; color: #fff;
          padding: 12px 18px;
          display: flex; justify-content: space-between; align-items: center;
          font-weight: 700; font-size: 0.95rem;
        }
        .rm-floor-header {
          background: #f0f4ec; padding: 8px 18px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.78rem; font-weight: 700; color: #5C6F4E;
          text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid #dde8d5;
        }
        .rm-floor-rooms {
          padding: 14px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          background: #f8faf6;
        }

        /* ── Room card ── */
        .rm-room-card {
          background: #fff; border-radius: 10px;
          border: 1px solid #e8ede4;
          overflow: hidden; transition: all 0.2s;
          display: flex; flex-direction: column;
          animation: fadeUp 0.3s ease both;
        }
        .rm-room-card:hover { box-shadow: 0 4px 16px rgba(92,111,78,0.15); transform: translateY(-1px); }

        .rm-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.2px;
        }

        .rm-action-btn {
          padding: 8px 14px; border-radius: 8px; border: 1px solid #d0dbc8;
          font-size: 0.8rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center;
          justify-content: center; gap: 6px; width: 100%;
          background: #fff; color: ${BRAND};
        }
        .rm-action-btn:hover { background: ${BRAND}; color: #fff; border-color: ${BRAND}; }

        .rm-filter-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; background: rgba(92,111,78,0.1);
          color: ${BRAND}; border-radius: 20px;
          font-size: 0.78rem; font-weight: 600;
        }
        .rm-clear-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; background: rgba(220,53,69,0.08);
          color: #dc3545; border-radius: 20px;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
        }
        .rm-clear-tag:hover { background: rgba(220,53,69,0.15); }
      `}</style>

      {/* ── Toast Notification ── */}
      {notification && (
        <div className="rm-notif">
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(25,135,84,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="bi bi-bell-fill" style={{ color: "#198754", fontSize: "1rem" }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111", marginBottom: 3 }}>Live Update</div>
            <div style={{ fontSize: "0.83rem", color: "#555" }}>{notification.message}</div>
          </div>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 0, fontSize: "1.1rem" }}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      <div className="rm-root">
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 28px" }}>

          {/* ── Page Header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: "1.65rem", fontWeight: 700, color: "#111", margin: 0, letterSpacing: "-0.5px" }}>
                Room Management
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>
                  Real-time monitoring of room status, equipment health &amp; incidents.
                </p>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
                  background: wsConnected ? "rgba(25,135,84,0.1)" : "rgba(108,117,125,0.1)",
                  color: wsConnected ? "#198754" : "#6c757d",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: wsConnected ? "#198754" : "#aaa", display: "inline-block" }}></span>
                  {wsConnected ? "Live" : "Offline"}
                </span>
              </div>
            </div>
            <button
              style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 12, padding: "11px 22px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s", boxShadow: "0 4px 14px rgba(92,111,78,0.35)" }}
              onMouseOver={e => e.currentTarget.style.opacity = "0.88"}
              onMouseOut={e => e.currentTarget.style.opacity = "1"}
              onClick={() => setShowAddRoomModal(true)}
            >
              <i className="bi bi-plus-circle-fill"></i> Add New Room
            </button>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 14, marginBottom: 24 }} className="rm-stats-grid">
            <style>{`
              @media (max-width:1200px) { .rm-stats-grid { grid-template-columns: repeat(3,1fr) !important; } }
              @media (max-width:640px)  { .rm-stats-grid { grid-template-columns: repeat(2,1fr) !important; } }
            `}</style>
            {STAT_CARDS.map((s, i) => (
              <div key={s.key} className="rm-stat-card" style={{ animationDelay: `${i * 60}ms` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: "1.15rem" }}></i>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#111", lineHeight: 1 }}>
                    {loading ? <div className="spinner-border spinner-border-sm text-secondary" style={{ width: 18, height: 18 }} /> : (s.value ?? 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div style={{ background: "rgba(220,53,69,0.07)", border: "1px solid rgba(220,53,69,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#dc3545", fontSize: "0.88rem" }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {/* ── Filters Panel ── */}
          <div style={{ background: "#fff", borderRadius: 18, border: "1px solid rgba(0,0,0,0.06)", padding: "20px 24px", marginBottom: 24 }}>

            {/* Search + View Toggle */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
                <label className="rm-filter-label">Search</label>
                <i className="bi bi-search" style={{ position: "absolute", left: 14, bottom: 11, color: "#aaa", fontSize: "0.85rem" }}></i>
                <form onSubmit={handleSearch} style={{ margin: 0 }}>
                  <input
                    className="rm-search-input"
                    type="text"
                    placeholder="Search by room name or ID…"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                  />
                </form>
              </div>

              {/* View Toggle */}
              <div style={{ display: "flex", background: "#F4F5F0", borderRadius: 10, padding: 5, gap: 4, alignSelf: "flex-end" }}>
                <button className={`rm-view-btn ${viewMode === "grouped" ? "active" : ""}`} onClick={() => setViewMode("grouped")}>
                  <i className="bi bi-diagram-3-fill"></i> Grouped
                </button>
                <button className={`rm-view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>
                  <i className="bi bi-grid-fill"></i> Grid
                </button>
                <button className={`rm-view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>
                  <i className="bi bi-list-task"></i> List
                </button>
              </div>
            </div>

            {/* Filter Selects */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
              <div>
                <label className="rm-filter-label"><i className="bi bi-building me-1"></i>Branch</label>
                <select className="rm-select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                  <option value="all">All My Branches</option>
                  {branches.map((b, i) => (
                    <option key={`${b.branchId || b.id}-${i}`} value={b.branchId || b.id}>
                      {b.branchName || b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="rm-filter-label"><i className="bi bi-layers me-1"></i>Floor</label>
                <select className="rm-select" value={floorFilter} onChange={e => setFloorFilter(e.target.value)}>
                  <option value="">All Floors</option>
                  {floors.map((f, i) => (
                    <option key={`floor-${f.floor}-${i}`} value={String(f.floor)}>Floor {f.floor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="rm-filter-label"><i className="bi bi-door-closed me-1"></i>Room Type</label>
                <select className="rm-select" value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {roomTypes.map((t, i) => (
                    <option key={`${t.type}-${i}`} value={t.type}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="rm-filter-label"><i className="bi bi-tools me-1"></i>Equipment</label>
                <select className="rm-select" value={equipmentBrokenFilter} onChange={e => setEquipmentBrokenFilter(e.target.value)}>
                  <option value="">All Conditions</option>
                  <option value="true">Has Broken Items</option>
                  <option value="false">All Working</option>
                </select>
              </div>

              <div>
                <label className="rm-filter-label"><i className="bi bi-sort-down me-1"></i>Sort By</label>
                <select className="rm-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="name">Room Name</option>
                  <option value="floor">Floor</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0ea" }}>
                <span style={{ fontSize: "0.75rem", color: "#aaa", fontWeight: 600, alignSelf: "center" }}>Active filters:</span>
                {search && <span className="rm-filter-tag"><i className="bi bi-search"></i>"{search}"</span>}
                {branchFilter && branchFilter !== "all" && (
                  <span className="rm-filter-tag">
                    <i className="bi bi-building"></i>
                    {branches.find(b => String(b.branchId || b.id) === String(branchFilter))?.branchName || "Branch"}
                  </span>
                )}
                {floorFilter && <span className="rm-filter-tag"><i className="bi bi-layers"></i>Floor {floorFilter}</span>}
                {roomTypeFilter && <span className="rm-filter-tag"><i className="bi bi-door-closed"></i>{roomTypes.find(t => t.type === roomTypeFilter)?.label || roomTypeFilter}</span>}
                {equipmentBrokenFilter === "true" && <span className="rm-filter-tag"><i className="bi bi-tools"></i>Has Broken Items</span>}
                <span className="rm-clear-tag" onClick={clearFilters}>
                  <i className="bi bi-x-circle"></i> Clear All
                </span>
              </div>
            )}
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 14 }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${BRAND}30`, borderTop: `3px solid ${BRAND}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
              <span style={{ color: "#aaa", fontSize: "0.85rem" }}>Syncing room data…</span>
            </div>
          )}

          {/* ── Room View ── */}
          {!loading && (
            <>
              {filteredRooms.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", padding: "60px 24px", textAlign: "center" }}>
                  <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ccc", display: "block", marginBottom: 16 }}></i>
                  <h5 style={{ color: "#888", fontWeight: 600, marginBottom: 12 }}>No rooms match your filters</h5>
                  <button style={{ background: "none", border: "none", color: BRAND, fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }} onClick={clearFilters}>
                    Clear all filters
                  </button>
                </div>
              ) : viewMode === "grouped" ? (
                /* ──── Grouped by branch → floor ──── */
                branchGroups.map(branchGroup => {
                  const totalCount = Object.values(branchGroup.floors).flat().length;
                  const availableCount = Object.values(branchGroup.floors).flat()
                    .filter(r => (r.status || "").toUpperCase() === "AVAILABLE").length;
                  const sortedFloors = Object.keys(branchGroup.floors).map(Number).sort((a, b) => a - b);
                  return (
                    <div key={branchGroup.branchId} className="rm-branch-block">
                      <div className="rm-branch-header">
                        <span><i className="bi bi-building me-2"></i>{branchGroup.branchName}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 600 }}>
                            {totalCount} rooms
                          </span>
                          <span style={{ color: "#a8f0c0", fontSize: "0.8rem", fontWeight: 700 }}>
                            &bull; {availableCount} available
                          </span>
                        </div>
                      </div>
                      {sortedFloors.map(floor => {
                        const floorRooms = branchGroup.floors[floor].sort((a, b) => (a.roomName || "").localeCompare(b.roomName || ""));
                        const floorAvail = floorRooms.filter(r => (r.status || "").toUpperCase() === "AVAILABLE").length;
                        return (
                          <div key={floor}>
                            <div className="rm-floor-header">
                              <span>FLOOR {floor}</span>
                              <span style={{ color: "#888", fontWeight: 500, textTransform: "none" }}>
                                {floorRooms.length} rooms &nbsp;&middot;&nbsp; {floorAvail} available
                              </span>
                            </div>
                            <div className="rm-floor-rooms">
                              {floorRooms.map(room => {
                                const sc = statusColor(room.status);
                                const sl = statusLabel(room.status);
                                const hasBroken = (room.equipmentBroken || 0) > 0;
                                const hasIssues = (room.totalIssues || 0) > 0;
                                return (
                                  <div key={room.roomId} className="rm-room-card" onClick={() => handleViewRoom(room)}>
                                    <div style={{ padding: "12px 14px" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2 }}>
                                          {room.roomTypeName || "Standard"}
                                        </div>
                                        <span className="rm-badge" style={{ color: sc, fontSize: "0.68rem" }}>
                                          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: sc }}></span>
                                          {sl}
                                        </span>
                                      </div>
                                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#222", marginBottom: 10 }}>
                                        {room.roomName}
                                      </div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #edf0ea", paddingTop: 8 }}>
                                        {[
                                          { label: "EQUIP", value: room.totalEquipment || 0, alert: false },
                                          { label: "BROKEN", value: room.equipmentBroken || 0, alert: hasBroken },
                                          { label: "ISSUES", value: room.totalIssues || 0, alert: hasIssues },
                                        ].map((m, mi) => (
                                          <div key={mi} style={{ textAlign: "center", borderRight: mi < 2 ? "1px solid #eee" : "none" }}>
                                            <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#bbb", letterSpacing: "0.4px", marginBottom: 2 }}>{m.label}</div>
                                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: m.alert ? "#dc3545" : "#333" }}>{m.value}</div>
                                          </div>
                                        ))}
                                      </div>
                                      <button
                                        className="rm-action-btn"
                                        style={{ marginTop: 10 }}
                                        onClick={e => { e.stopPropagation(); handleViewRoom(room); }}
                                      >
                                        <i className="bi bi-sliders2"></i> Manage Details
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : viewMode === "grid" ? (
                /* ──── Flat grid ──── */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
                  {sortedRooms.map((room, index) => {
                    const sc = statusColor(room.status);
                    const sl = statusLabel(room.status);
                    return (
                      <div key={room.roomId || `room-${index}`} className="rm-room-card" style={{ animationDelay: `${index * 40}ms` }}>
                        <div style={{ height: 4, background: sc }}></div>
                        <div style={{ padding: "18px 18px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                                {room.roomTypeName || "Standard"}
                              </div>
                              <h4 style={{ fontWeight: 700, fontSize: "1.15rem", color: "#111", margin: 0 }}>{room.roomName}</h4>
                            </div>
                            <span className="rm-badge" style={{ color: sc, fontSize: "0.7rem" }}>
                              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: sc }}></span>
                              {sl}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: 14 }}>
                            <i className="bi bi-layers-fill me-1"></i>Floor {room.floor}
                            <span style={{ margin: "0 6px" }}>&middot;</span>
                            <i className="bi bi-geo-alt-fill me-1"></i>{room.branchName || "—"}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#F8F9F5", borderRadius: 10, padding: "10px 0", marginBottom: 12 }}>
                            {[
                              { label: "Equipment", value: room.totalEquipment || 0, alert: false },
                              { label: "Broken", value: room.equipmentBroken || 0, alert: (room.equipmentBroken || 0) > 0 },
                              { label: "Issues", value: room.totalIssues || 0, alert: (room.totalIssues || 0) > 0 },
                            ].map((m, mi) => (
                              <div key={mi} style={{ textAlign: "center", borderRight: mi < 2 ? "1px solid #eee" : "none" }}>
                                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#bbb", textTransform: "uppercase", marginBottom: 2 }}>{m.label}</div>
                                <div style={{ fontWeight: 700, color: m.alert ? "#dc3545" : "#333" }}>{m.value}</div>
                              </div>
                            ))}
                          </div>
                          <button className="rm-action-btn" onClick={() => handleViewRoom(room)}>
                            <i className="bi bi-sliders2"></i> Manage Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ──── List view ──── */
                <RoomList rooms={sortedRooms} onRefresh={fetchAllData} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showDetailModal && selectedRoom && (
        <AdminRoomDetailModal
          room={selectedRoom}
          onClose={() => { setShowDetailModal(false); setSelectedRoom(null); }}
          onRefresh={() => fetchAllData().catch(console.error)}
        />
      )}

      {showReportModal && selectedRoom && (
        <ReportIssueModal
          show={showReportModal}
          room={selectedRoom}
          onHide={() => { setShowReportModal(false); setSelectedRoom(null); }}
          onShowNotification={n => { setNotification(n); setTimeout(() => setNotification(null), 5000); }}
          onSuccess={() => {
            setShowReportModal(false);
            setSelectedRoom(null);
            fetchAllData().catch(console.error);
          }}
        />
      )}

      <AddRoomModal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        onRoomAdded={() => fetchAllData().catch(console.error)}
        branches={branches}
        roomTypes={roomTypes}
      />
    </>
  );
}

export default RoomManagement;
