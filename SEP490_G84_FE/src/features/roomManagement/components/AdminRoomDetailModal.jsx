import React, { useState, useEffect } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import RoomFurnitureTable from "./RoomFurnitureTable";
import ReportIncidentModal from "./ReportIncidentModal";
import ResolveIncidentModal from "./ResolveIncidentModal";
import EditRoomModal from "./EditRoomModal";

const BRAND = "#5C6F4E";
const DANGER = "#dc3545";

const STATUS_CONFIG = {
  AVAILABLE:      { label: "Available",      dot: "#198754", bg: "rgba(25,135,84,0.1)",   color: "#198754" },
  OCCUPIED:       { label: "Occupied",       dot: "#dc3545", bg: "rgba(220,53,69,0.1)",   color: "#dc3545" },
  MAINTENANCE:    { label: "Maintenance",    dot: "#fd7e14", bg: "rgba(253,126,20,0.1)",  color: "#c75000" },
};

const COND_ITEMS = [
  { key: "good",      label: "Good",        color: "#198754", icon: "bi-check-circle-fill" },
  { key: "needRepair",label: "Need Repair",  color: "#dc3545", icon: "bi-tools" },
];

function countConditions(list) {
  const s = { total: list?.length || 0, good: 0, new: 0, average: 0, needRepair: 0 };
  (list || []).forEach((item) => {
    const c = item.condition?.toLowerCase() || "";
    if (c.includes("need") || c.includes("repair") || c.includes("broken")) s.needRepair++;
    else if (c.includes("average") || c.includes("trung")) s.average++;
    else if (c.includes("new") || c === "m") s.new++;
    else s.good++;
  });
  return s;
}

function AdminRoomDetailModal({ room, onClose, onRefresh }) {
  const [roomDetail, setRoomDetail] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error,   setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("furniture"); // furniture | incidents
  const [showReport, setShowReport] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false); console.log('showEditRoom:', showEditRoom);
  const [showResolve, setShowResolve] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidents, setIncidents] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [incidentPage, setIncidentPage] = useState(0);
  const [incidentLoading, setIncidentLoading] = useState(false);

  const refreshRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomManagementApi.getRoomDetailFull(room.roomId);
      setRoomDetail(data);
    } catch (err) {
      setError(err.message || "Error loading room details");
    } finally {
      setLoading(false);
    }
  };

  const refreshIncidents = async (page = incidentPage) => {
    try {
      setIncidentLoading(true);
      const data = await roomManagementApi.listIncidents(room.roomId, page, 10);
      setIncidents(data);
    } catch {
      setIncidents({ content: [], totalElements: 0, totalPages: 0 });
    } finally {
      setIncidentLoading(false);
    }
  };

  useEffect(() => {
    refreshRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.roomId]);

  useEffect(() => {
    if (activeTab === "incidents") refreshIncidents(incidentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, incidentPage]);

  const st      = STATUS_CONFIG[roomDetail?.status] || { label: roomDetail?.status, dot: "#aaa", bg: "#f0f0f0", color: "#555" };
  const summary = countConditions(roomDetail?.furnitureList);

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1055, backgroundColor: "rgba(15,20,40,0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="d-flex flex-column"
        style={{
          width: "min(900px, 95vw)",
          maxHeight: "92vh",
          backgroundColor: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div
          className="d-flex justify-content-between align-items-start px-5 py-4 flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #3d4f32 100%)`, color: "#fff" }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
              style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
            >
              <i className="bi bi-door-open fs-4"></i>
            </div>
            <div>
              <h5 className="mb-1 fw-bold" style={{ letterSpacing: "-0.3px" }}>
                {loading ? "Loading..." : roomDetail?.roomName || room.roomName}
              </h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {roomDetail?.roomCode && (
                  <span className="px-2 py-0 rounded small" style={{ backgroundColor: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>
                    {roomDetail.roomCode}
                  </span>
                )}
                {roomDetail?.roomTypeName && (
                  <span className="px-2 py-0 rounded small" style={{ backgroundColor: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>
                    {roomDetail.roomTypeName}
                  </span>
                )}
                {roomDetail?.status && (
                  <span
                    className="d-inline-flex align-items-center gap-1 px-2 py-0 rounded-pill small fw-semibold"
                    style={{ backgroundColor: st.bg, color: st.color, fontSize: "0.72rem" }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: st.dot, display: "inline-block" }} />
                    {st.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="btn-close btn-close-white mt-1"
            onClick={onClose}
            aria-label="Close"
          />
        </div>

        {/* ─── Body ─── */}
        <div className="overflow-auto flex-grow-1" style={{ backgroundColor: "#f8f9fb" }}>

          {/* Top actions + Tabs (match screenshots) */}
          <div className="px-4 pt-4">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                  style={{
                    backgroundColor: DANGER,
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 2px 10px rgba(220,53,69,0.25)",
                    fontWeight: 700,
                  }}
                  onClick={() => setShowReport(true)}
                >
                  <i className="bi bi-megaphone-fill"></i> Report Incident
                </button>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className={`btn btn-sm px-3 py-2 rounded-3 ${activeTab === "furniture" ? "" : "btn-light"}`}
                  style={
                    activeTab === "furniture"
                      ? { backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.08)", fontWeight: 700 }
                      : { border: "1px solid rgba(0,0,0,0.08)" }
                  }
                  onClick={() => setActiveTab("furniture")}
                >
                  <i className="bi bi-wrench-adjustable-circle me-2"></i> Equipment
                </button>
                <button
                  className={`btn btn-sm px-3 py-2 rounded-3 ${activeTab === "incidents" ? "" : "btn-light"}`}
                  style={
                    activeTab === "incidents"
                      ? { backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.08)", fontWeight: 700 }
                      : { border: "1px solid rgba(0,0,0,0.08)" }
                  }
                  onClick={() => setActiveTab("incidents")}
                >
                  <i className="bi bi-exclamation-triangle me-2"></i> Incidents
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="d-flex align-items-center justify-content-center py-5 gap-3 text-muted">
              <div className="spinner-border spinner-border-sm" role="status"></div>
              <span>Loading room details...</span>
            </div>
          )}

          {error && (
            <div className="m-4 alert border-0 d-flex align-items-center gap-2 py-2 small"
              style={{ backgroundColor: "rgba(220,53,69,0.08)", color: "#842029", borderRadius: 10 }}>
              <i className="bi bi-exclamation-circle-fill"></i>
              <div><strong>Error</strong> — {error}</div>
            </div>
          )}

          {!loading && !error && roomDetail && activeTab === "furniture" && (
            <div className="p-4 d-flex flex-column gap-4">

              {/* Room Info Row */}
              <div className="row g-3">
                {[
                  { icon: "bi-layers",       label: "Floor",      value: `Floor ${roomDetail.floor}` },
                  { icon: "bi-tag",          label: "Room Type",  value: roomDetail.roomTypeName  || "—" },
                  { icon: "bi-upc-scan",     label: "Room Code",  value: roomDetail.roomCode       || "—" },
                  { icon: "bi-boxes",        label: "Furniture",  value: `${summary.total} items` },
                ].map((info) => (
                  <div className="col-6 col-md-3" key={info.label}>
                    <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
                        <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                          style={{ width: 38, height: 38, backgroundColor: "rgba(92,111,78,0.08)" }}>
                          <i className={`bi ${info.icon}`} style={{ color: BRAND, fontSize: "0.95rem" }}></i>
                        </div>
                        <div>
                          <div className="text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{info.label}</div>
                          <div className="fw-semibold" style={{ fontSize: "0.88rem", color: "#1a1a2e" }}>{info.value}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Condition Summary */}
              {summary.total > 0 && (
                <div className="card border-0" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div className="card-header bg-white border-bottom py-3 px-4" style={{ borderRadius: "12px 12px 0 0" }}>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-bar-chart-line" style={{ color: BRAND }}></i>
                      <span className="fw-semibold small" style={{ color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>Furniture Condition</span>
                    </div>
                  </div>
                  <div className="card-body px-4 py-3">
                    <div className="row g-3">
                      {COND_ITEMS.map((c) => {
                        const val = summary[c.key];
                        const pct = summary.total ? Math.round((val / summary.total) * 100) : 0;
                        return (
                          <div className="col-6 col-md-3" key={c.key}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="d-flex align-items-center gap-1 small fw-semibold" style={{ color: c.color, fontSize: "0.78rem" }}>
                                <i className={`bi ${c.icon}`} style={{ fontSize: "0.7rem" }}></i> {c.label}
                              </span>
                              <span className="fw-bold" style={{ color: c.color, fontSize: "0.88rem" }}>{val}</span>
                            </div>
                            <div className="rounded-pill overflow-hidden" style={{ height: 6, backgroundColor: "#eee" }}>
                              <div className="h-100 rounded-pill" style={{ width: `${pct}%`, backgroundColor: c.color, transition: "width 0.4s ease" }} />
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.68rem" }}>{pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Furniture Table */}
              <div className="card border-0" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-3 px-4" style={{ borderRadius: "12px 12px 0 0" }}>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-list-check" style={{ color: BRAND }}></i>
                    <span className="fw-semibold small" style={{ color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>Furniture List</span>
                    <span className="badge rounded-pill px-2" style={{ backgroundColor: "rgba(92,111,78,0.12)", color: BRAND, fontWeight: 600 }}>
                      {roomDetail.furnitureList?.length || 0}
                    </span>
                  </div>
                  <span className="text-muted small">
                    {summary.needRepair > 0 ? (
                      <>
                        <i className="bi bi-tools me-1"></i>
                        Auto Maintenance — {summary.needRepair} broken item(s)
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-1"></i>
                        All equipment working normally
                      </>
                    )}
                  </span>
                </div>
                <div className="card-body p-0">
                  <RoomFurnitureTable
                    furnitureList={roomDetail.furnitureList}
                    roomId={roomDetail.roomId}
                    branchId={room.branchId}
                    onChanged={async () => {
                      await refreshRoom();
                      onRefresh?.();
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {!loading && !error && roomDetail && activeTab === "incidents" && (
            <div className="p-4">
              <div
                className="card border-0"
                style={{
                  borderRadius: 12,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-3 px-4" style={{ borderRadius: "12px 12px 0 0" }}>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle" style={{ color: DANGER }}></i>
                    <span className="fw-semibold small" style={{ color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>
                      Incident List
                    </span>
                    <span className="badge rounded-pill px-2" style={{ backgroundColor: "rgba(220,53,69,0.12)", color: DANGER, fontWeight: 700 }}>
                      {incidents?.totalElements || 0}
                    </span>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => refreshIncidents(incidentPage)}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                  </button>
                </div>
                <div className="card-body p-0">
                  {incidentLoading ? (
                    <div className="d-flex align-items-center justify-content-center py-5 text-muted gap-2">
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      Loading incidents...
                    </div>
                  ) : (incidents?.content || []).length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                      <div className="d-flex align-items-center justify-content-center rounded-4 mb-3" style={{ width: 64, height: 64, backgroundColor: "rgba(220,53,69,0.08)" }}>
                        <i className="bi bi-clipboard-x fs-3" style={{ color: DANGER }}></i>
                      </div>
                      <h6 className="fw-semibold mb-1">No incidents reported</h6>
                      <p className="small mb-0 opacity-75">Click "Report Incident" to create one.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr style={{ backgroundColor: "#f8f9fb" }}>
                            {["#", "Description", "Status", "Time", "Action"].map((h, i) => (
                              <th
                                key={h}
                                className={`text-muted fw-semibold border-0${i === 0 ? " ps-4" : ""}`}
                                style={{
                                  fontSize: "0.72rem",
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  width: i === 0 ? 44 : i === 2 ? 120 : i === 4 ? 110 : i === 3 ? 190 : "auto",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(incidents.content || []).map((it, idx) => (
                            <tr key={it.incidentId} style={{ borderTop: "1px solid #f0f0f4" }}>
                              <td className="ps-4 text-muted" style={{ fontSize: "0.78rem" }}>
                                {incidentPage * 10 + idx + 1}
                              </td>
                              <td style={{ color: "#1a1a2e", fontSize: "0.9rem" }}>{it.description}</td>
                              <td>
                                <span
                                  className="px-2 py-1 rounded-pill small fw-semibold"
                                  style={{
                                      backgroundColor: it.status === "OPEN" ? "rgba(255,193,7,0.2)" : "rgba(25,135,84,0.12)",
                                      color: it.status === "OPEN" ? "#856404" : "#198754",
                                    }}
                                  >
                                    {it.status === "OPEN" ? "Pending" : "Resolved"}
                                </span>
                              </td>
                              <td className="text-muted small">
                                {it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}
                              </td>
                              <td>
                                {it.status === "OPEN" ? (
                                  <button
                                    className="btn btn-sm"
                                    style={{
                                      backgroundColor: "rgba(25,135,84,0.1)",
                                      color: "#198754",
                                      border: "none",
                                      padding: "4px 10px",
                                      fontSize: "0.8rem",
                                      fontWeight: 600,
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                    }}
                                    onClick={() => {
                                      setSelectedIncident(it);
                                      setShowResolve(true);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "rgba(25,135,84,0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "rgba(25,135,84,0.1)";
                                    }}
                                  >
                                    <i className="bi bi-check-lg me-1"></i>Resolve
                                  </button>
                                ) : (
                                  <span className="text-muted small">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div
          className="d-flex justify-content-between align-items-center px-5 py-3 border-top flex-shrink-0"
          style={{ backgroundColor: "#fff" }}
        >
          <span className="text-muted small">
            {roomDetail && `Last updated: Room ID #${roomDetail.roomId}`}
          </span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary px-4" onClick={onClose}>Close</button>
            <button
              className="btn px-4" onClick={() => setShowEditRoom(true)}
              style={{ backgroundColor: BRAND, color: "#fff", border: "none", boxShadow: `0 2px 8px rgba(92,111,78,0.3)` }}
            >
              Edit Room
            </button>
          </div>
        </div>

        {/* Modals */} 
        {showEditRoom && <EditRoomModal
          room={{
            ...room,
            ...roomDetail,
            branchId: roomDetail?.branchId || room?.branchId,
            roomTypeId: roomDetail?.roomTypeId || room?.roomTypeId || room?.typeId
          }}
          onClose={() => setShowEditRoom(false)}
          onSubmitted={async () => {
            await refreshRoom();
            onRefresh?.();
          }}
        />}
        {showReport && (
          <ReportIncidentModal
            room={room}
            onClose={() => setShowReport(false)}
            onSubmitted={() => refreshIncidents(0)}
          />
        )}

        {showResolve && selectedIncident && (
          <ResolveIncidentModal
            incident={selectedIncident}
            room={room}
            onClose={() => {
              setShowResolve(false);
              setSelectedIncident(null);
            }}
            onResolved={() => refreshIncidents(incidentPage)}
          />
        )}
      </div>
    </div>
  );
}

export default AdminRoomDetailModal;
