import React, { useState, useEffect } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import ReplaceFromInventoryModal from "./ReplaceFromInventoryModal";

const BRAND = "#5C6F4E";

const RoomDetailModal = ({ show, room, onHide, onReportIssue, onRoomUpdated, onShowNotification }) => {
  const [activeTab, setActiveTab] = useState("equipment");
  const [actionQuantities, setActionQuantities] = useState({});
  const [equipmentList, setEquipmentList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // equipmentId being actioned
  const [replaceFor, setReplaceFor] = useState(null); // furniture item to replace
  const [currentRoomStatus, setCurrentRoomStatus] = useState(room?.status);

  useEffect(() => {
    if (show && room && (room.roomId || room.id)) {
      setCurrentRoomStatus(room.status);
      fetchRoomDetails();
    }
  }, [show, room]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      
      const roomId = room.roomId || room.id;
      if (!roomId) {
        console.error("No room ID available");
        return;
      }
      
      // Get room detail (includes equipment)
      const detail = await roomManagementApi.getRoomDetailFull(roomId);
      const eqList = detail?.furnitureList || detail?.equipment || [];
      setEquipmentList(eqList);
      
      // Sync the true status from the backend
      if (detail && detail.status) {
        setCurrentRoomStatus(detail.status);
      }

      // Fetch issues separately (may not exist yet)
      try {
        const issues = await roomManagementApi.getRoomIssues(roomId);
        setIssuesList(Array.isArray(issues) ? issues : []);
      } catch {
        setIssuesList([]);
      }

      // Auto-update room status: Maintenance → Available when all equipment is fixed
      if (currentRoomStatus?.toUpperCase() === "MAINTENANCE" && eqList.length > 0) {
        const brokenCount = eqList.filter(e => {
          const s = (e.status || e.condition || "").toLowerCase();
          return s.includes("broken") || s.includes("failed") || s.includes("need") || s.includes("repair") || s.includes("maintenance") || s.includes("bảo trì");
        }).length;

        if (brokenCount === 0) {
          try {
            await roomManagementApi.updateRoomStatus(roomId, "AVAILABLE");
            setCurrentRoomStatus("AVAILABLE");
            if (onRoomUpdated) onRoomUpdated();
          } catch (err) {
            console.warn("Auto-update room status failed:", err);
          }
        }
      }
      
    } catch (error) {
      console.warn("Room details APIs error:", error);
      setEquipmentList([]);
      setIssuesList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseFailAction = async (action, equipment, customQuantity) => {
    try {
      setActionLoading(equipment.furnitureId);
      const roomId = room.roomId || room.id;
      if (!roomId) return;

      if (action === 'fix') {
        const response = await roomManagementApi.fixWarehouseFailFurniture(roomId, equipment.furnitureId, customQuantity);
        if (onShowNotification) {
          onShowNotification({ type: 'success', message: response.message || 'Đã khôi phục thiết bị về kho', timestamp: Date.now() });
        }
      } else if (action === 'discard') {
        const response = await roomManagementApi.discardWarehouseFailFurniture(roomId, equipment.furnitureId, customQuantity);
        if (onShowNotification) {
          onShowNotification({ type: 'success', message: response.message || 'Đã loại bỏ thiết bị khỏi kho', timestamp: Date.now() });
        }
      }

      await fetchRoomDetails();
      if (onRoomUpdated) onRoomUpdated();
    } catch (error) {
      console.error(`Error performing ${action} on equipment:`, error);
      if (onShowNotification) {
        onShowNotification({ type: 'error', message: `Operation failed`, timestamp: Date.now() });
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Mark equipment as BROKEN
  const handleMarkBroken = async (equipmentId) => {
    try {
      setActionLoading(equipmentId);
      const roomId = room.roomId || room.id;
      if (!roomId) return;

      await roomManagementApi.updateRoomFurniture(roomId, equipmentId, { status: "BROKEN" });
      
      // Show success notification
      if (onShowNotification) {
        onShowNotification({
          type: 'warning',
          message: `Equipment marked as broken in room ${room.roomName}`,
          timestamp: Date.now()
        });
      }
      
      await fetchRoomDetails();
      if (onRoomUpdated) onRoomUpdated();
    } catch (error) {
      console.error("Error marking equipment as broken:", error);
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: `Failed to mark equipment as broken`,
          timestamp: Date.now()
        });
      }
      alert("Không thể chuyển trạng thái thiết bị. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  };



  const getStatusColor = (status) => {
    if (!status) return "#6c757d";
    const s = status.toUpperCase();
    switch(s) {
      case "AVAILABLE": return "#198754"; // Xanh lá - Sẵn sàng
      case "OCCUPIED": return "#0d6efd";  // Xanh dương - Có người
      case "MAINTENANCE": return "#dc3545"; // Đỏ - Bảo trì
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

  const getEquipmentConditionText = (condition) => {
    if (!condition) return "Unknown";
    const c = condition.toLowerCase();
    if (c.includes("good") || c.includes("available") || c.includes("working")) return "Good";
    if (c.includes("broken") || c.includes("failed")) return "Broken";
    if (c.includes("need") || c.includes("repair")) return "Need Repair";
    if (c.includes("maintenance") || c.includes("bảo trì") || c.includes("bao tri")) return "Maintenance";
    if (c.includes("new") || c.includes("mới")) return "New";
    if (c.includes("average") || c.includes("trung")) return "Average";
    return condition;
  };

  const getEquipmentConditionColor = (condition) => {
    if (!condition) return "#6c757d";
    const c = condition.toLowerCase();
    if (c.includes("good") || c.includes("available") || c.includes("working") || c.includes("new")) return "#198754"; // Green
    if (c.includes("broken") || c.includes("failed") || c.includes("need") || c.includes("repair")) return "#dc3545"; // Red
    if (c.includes("maintenance") || c.includes("bảo trì") || c.includes("bao tri")) return "#fd7e14"; // Orange
    if (c.includes("average") || c.includes("trung")) return "#ffc107"; // Yellow
    return "#6c757d";
  };

  const isEquipmentGood = (condition) => {
    if (!condition) return false;
    const c = condition.toLowerCase();
    return c.includes("good") || c.includes("available") || c.includes("working") || c.includes("new");
  };

  const isEquipmentBroken = (condition) => {
    if (!condition) return false;
    const c = condition.toLowerCase();
    return c.includes("broken") || c.includes("failed") || c.includes("need") || c.includes("repair") || c.includes("maintenance") || c.includes("bảo trì") || c.includes("bao tri");
  };

  const goodEquipment = equipmentList.filter(e => isEquipmentGood(e.condition)).length;
  const brokenEquipment = equipmentList.filter(e => isEquipmentBroken(e.condition)).length;

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 15 }}>
          {/* MODAL HEADER */}
          <div className="modal-header border-0 p-4 pb-3">
            <div className="d-flex justify-content-between align-items-start w-100">
              <div className="flex-grow-1">
                {/* Room Title and Status */}
                <div className="d-flex align-items-center gap-3 mb-2">
                  <h4 className="fw-bold mb-0" style={{ color: "#1a1a2e" }}>
                    {room.roomName}
                  </h4>
                  <span
                    className="badge px-3 py-2 rounded-pill d-flex align-items-center gap-1"
                    style={{
                      backgroundColor: `${getStatusColor(currentRoomStatus)}20`,
                      color: getStatusColor(currentRoomStatus),
                      border: `1px solid ${getStatusColor(currentRoomStatus)}40`,
                      fontSize: "0.85rem",
                    }}
                  >
                    <span
                      className="rounded-circle d-inline-block"
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: getStatusColor(currentRoomStatus),
                      }}
                    ></span>
                    {getStatusText(currentRoomStatus)}
                  </span>
                </div>

                {/* Room Info */}
                <div className="text-muted mb-0">
                  Floor {room.floor || 1} • {room.roomTypeName || "Standard Room"} • {equipmentList.length} items
                </div>
              </div>

              {/* Report Issue Button */}
              <div className="d-flex gap-2">
                {!room?.roomName?.includes('WAREHOUSE') && (
                  <button
                    className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2"
                    onClick={() => onReportIssue(room)}
                    style={{ borderRadius: 8 }}
                  >
                    <i className="bi bi-bell-fill"></i>
                    Report Issue
                  </button>
                )}
                
                <button
                  type="button"
                  className="btn-close"
                  onClick={onHide}
                  aria-label="Close"
                ></button>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="px-4">
            <ul className="nav nav-tabs border-0 gap-1">
              <li className="nav-item">
                <button
                  className={`nav-link border-0 px-3 py-2 ${
                    activeTab === "equipment"
                      ? "active text-white"
                      : "text-muted bg-light"
                  }`}
                  style={{
                    borderRadius: 8,
                    backgroundColor: activeTab === "equipment" ? BRAND : "transparent",
                  }}
                  onClick={() => setActiveTab("equipment")}
                >
                  Equipment ({equipmentList?.length || 0})
                </button>
              </li>
              {!room?.roomName?.includes('WAREHOUSE') && (
                <li className="nav-item">
                  <button
                    className={`nav-link border-0 px-3 py-2 ${
                      activeTab === "issues"
                        ? "active text-white"
                        : "text-muted bg-light"
                    }`}
                    style={{
                      borderRadius: 8,
                      backgroundColor: activeTab === "issues" ? BRAND : "transparent",
                    }}
                    onClick={() => setActiveTab("issues")}
                  >
                    Issues ({issuesList?.length || 0})
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* MODAL BODY */}
          <div className="modal-body p-4">
            <div className="tab-content">
              {/* Equipment tab */}
              {activeTab === "equipment" && (
                <div className="tab-pane fade show active">
                  <>
                    {/* Equipment Section Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h6 className="fw-bold mb-0 text-uppercase text-muted" style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}>
                        EQUIPMENT LIST
                      </h6>
                      <div className="d-flex gap-2">
                        <span
                          className="badge px-3 py-2 d-flex align-items-center gap-1"
                          style={{
                            backgroundColor: "#19875420",
                            color: "#198754",
                            border: "1px solid #19875440",
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>
                          Good: {goodEquipment}
                        </span>
                        {brokenEquipment > 0 && (
                          <span
                            className="badge px-3 py-2 d-flex align-items-center gap-1"  
                            style={{
                              backgroundColor: "#dc354520",
                              color: "#dc3545",
                              border: "1px solid #dc354540",
                            }}
                          >
                            <i className="bi bi-exclamation-triangle-fill"></i>
                              Broken: {brokenEquipment}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Equipment Table */}
                    {loading ? (
                      <div className="d-flex justify-content-center py-4">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              <th className="text-muted border-0">#</th>
                              <th className="text-muted border-0">EQUIPMENT NAME</th>
                              <th className="text-muted border-0 text-center">QTY</th>
                              <th className="text-muted border-0 text-center">STATUS</th>
                              <th className="text-muted border-0 text-center">ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {equipmentList && equipmentList.length > 0 ? (
                              equipmentList.map((equipment, index) => {
                                const eqGood = isEquipmentGood(equipment.condition);
                                const eqBroken = isEquipmentBroken(equipment.condition);
                                return (
                                <tr key={equipment.furnitureId || index}>
                                  <td className="border-0 text-muted">
                                    {String(index + 1).padStart(2, '0')}
                                  </td>
                                  <td className="border-0 fw-medium">
                                    {equipment.furnitorName || 'Không xác định'}
                                  </td>
                                  <td className="border-0 text-center">
                                    {equipment.quantity || 1}
                                  </td>
                                  <td className="border-0 text-center">
                                    <span
                                      className="badge px-3 py-2 d-flex align-items-center gap-1 justify-content-center"
                                      style={{
                                        backgroundColor: getEquipmentConditionColor(equipment.condition),
                                        color: "#fff",
                                        width: "120px",
                                        margin: "0 auto",
                                        borderRadius: "6px",
                                        fontWeight: "600"
                                      }}
                                    >
                                      <i className={`bi ${eqGood ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`}></i>
                                      {getEquipmentConditionText(equipment.condition)}
                                    </span>
                                  </td>
                                  <td className="border-0 text-center">
                                    {room?.roomName === 'WAREHOUSE_FAIL' ? (
                                      <div className="d-flex align-items-center gap-2 justify-content-center">
                                          <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            style={{ width: "60px", fontSize: "0.75rem" }}
                                            min={1}
                                            max={equipment.quantity}
                                            value={actionQuantities[equipment.furnitureId] || 1}
                                            onChange={(e) => setActionQuantities(prev => ({ ...prev, [equipment.furnitureId]: Number(e.target.value) }))}
                                            disabled={actionLoading === equipment.furnitureId}
                                          />
                                        <button
                                          className="btn btn-success btn-sm px-3"
                                          style={{ fontSize: "0.75rem", borderRadius: "6px", fontWeight: "600" }}
                                          onClick={() => handleWarehouseFailAction('fix', equipment, actionQuantities[equipment.furnitureId] || 1)}
                                          disabled={actionLoading === equipment.furnitureId}
                                        >
                                          {actionLoading === equipment.furnitureId ? 'Đang xử lý...' : 'Fixed'}
                                        </button>
                                        <button
                                          className="btn btn-danger btn-sm px-3"
                                          style={{ fontSize: "0.75rem", borderRadius: "6px", fontWeight: "600" }}
                                          onClick={() => handleWarehouseFailAction('discard', equipment, actionQuantities[equipment.furnitureId] || 1)}
                                          disabled={actionLoading === equipment.furnitureId}
                                        >
                                          {actionLoading === equipment.furnitureId ? 'Đang xử lý...' : 'Beyond fixed'}
                                        </button>
                                      </div>
                                    ) : eqGood ? (
                                      <button
                                        className="btn btn-outline-danger btn-sm px-3"
                                        style={{ fontSize: "0.75rem", borderRadius: "6px", fontWeight: "600" }}
                                        onClick={() => handleMarkBroken(equipment.furnitureId)}
                                        disabled={actionLoading === equipment.furnitureId}
                                      >
                                        {actionLoading === equipment.furnitureId ? (
                                          <>
                                            <div className="spinner-border spinner-border-sm me-1" role="status">
                                              <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            <i className="bi bi-x-circle me-1"></i>
                                            Report Damage
                                          </>
                                        )}
                                      </button>
                                    ) : eqBroken ? (
                                      <button
                                        className="btn btn-warning btn-sm px-3"
                                        style={{ fontSize: "0.75rem", borderRadius: "6px", fontWeight: "600" }}
                                        onClick={() => setReplaceFor(equipment)}
                                        disabled={actionLoading === equipment.furnitureId}
                                      >
                                        {actionLoading === equipment.furnitureId ? (
                                          <>
                                            <div className="spinner-border spinner-border-sm me-1" role="status">
                                              <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Replacing...
                                          </>
                                        ) : (
                                          <>
                                            <i className="bi bi-arrow-repeat me-1"></i>
                                            Replace from stock
                                          </>
                                        )}
                                      </button>
                                    ) : null}
                                  </td>
                                </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center text-muted py-4">
                                  <i className="bi bi-info-circle me-2"></i>
                                  {loading ? "Loading equipment..." : "No equipment data found"}
                                  {!loading && (
                                    <div className="small mt-1">
                                      Equipment API is not ready or this room has no items
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                </div>
              )}

              {/* Issues tab */}
              {activeTab === "issues" && (
                <div className="tab-pane fade show active">
                  <>
                    {/* Issues Section Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h6 className="fw-bold mb-0 text-uppercase text-muted" style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}>
                        INCIDENT LIST
                      </h6>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onReportIssue(room)}
                        >
                          <i className="bi bi-plus-circle me-1"></i>
                          Report New Incident
                        </button>
                      </div>
                    </div>

                    {/* Issues Table */}
                    {issuesList && issuesList.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              <th className="text-muted border-0">#</th>
                              <th className="text-muted border-0">MÔ TẢ</th>
                              <th className="text-muted border-0">ĐỘ ƯU TIÊN</th>
                              <th className="text-muted border-0">TRẠNG THÁI</th>
                              <th className="text-muted border-0">NGÀY TẠO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {issuesList.map((issue, index) => (
                              <tr key={issue.id || index}>
                                <td className="border-0 text-muted">
                                  {String(index + 1).padStart(2, '0')}
                                </td>
                                <td className="border-0">
                                  <div>
                                    <div className="fw-medium">{issue.description || 'Không có mô tả'}</div>
                                    {issue.equipment && (
                                      <small className="text-muted">Thiết bị: {issue.equipment}</small>
                                    )}
                                  </div>
                                </td>
                                <td className="border-0">
                                  <span className={`badge ${
                                    issue.priority === 'HIGH' ? 'bg-danger' :
                                    issue.priority === 'MEDIUM' ? 'bg-warning text-dark' :
                                    'bg-secondary'
                                  }`}>
                                    {issue.priority === 'HIGH' ? 'Cao' :
                                     issue.priority === 'MEDIUM' ? 'Trung bình' :
                                     'Thấp'}
                                  </span>
                                </td>
                                <td className="border-0">
                                  <span className={`badge ${
                                      (issue.status === 'RESOLVED' || issue.status === 'CLOSED') ? 'bg-success' :
                                      issue.status === 'IN_PROGRESS' ? 'bg-info' :
                                      'bg-warning text-dark'
                                    }`}>
                                      {(issue.status === 'RESOLVED' || issue.status === 'CLOSED') ? 'Đã giải quyết' :
                                     issue.status === 'IN_PROGRESS' ? 'Đang xử lý' :
                                     'Chờ xử lý'}
                                  </span>
                                </td>
                                <td className="border-0 text-muted">
                                  {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <i className="bi bi-info-circle me-2"></i>
                        <div>Không có dữ liệu sự cố</div>
                        <div className="small mt-1">
                          API sự cố chưa sẵn sàng hoặc phòng này không có sự cố nào
                        </div>
                      </div>
                    )}
                  </>
                </div>
              )}
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="modal-footer border-0 p-4 pt-0">
            <button
              type="button"
              className="btn px-4 py-2 fw-semibold"
              style={{
                backgroundColor: BRAND,
                color: "#fff",
                border: "none",
                borderRadius: 8,
              }}
              onClick={onHide}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* REPLACE FROM INVENTORY MODAL */}
      {replaceFor && (
        <ReplaceFromInventoryModal
          roomId={room.roomId || room.id}
          branchId={room.branchId}
          oldItem={replaceFor}
          onClose={() => setReplaceFor(null)}
          onReplaced={() => {
            setReplaceFor(null);
            if (onShowNotification) {
              onShowNotification({
                type: 'success',
                message: `Equipment replaced successfully`,
                timestamp: Date.now()
              });
            }
            fetchRoomDetails();
            if (onRoomUpdated) onRoomUpdated();
          }}
        />
      )}
    </div>
  );
};

export default RoomDetailModal;

