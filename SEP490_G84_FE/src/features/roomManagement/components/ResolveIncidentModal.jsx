import React, { useState } from "react";
import { roomManagementApi } from "../api/roomManagementApi";

const BRAND = "#5C6F4E";
const DANGER = "#dc3545";
const SUCCESS = "#198754";

function ResolveIncidentModal({ incident, room, onClose, onResolved }) {
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResolve = async () => {
    if (!resolution.trim()) {
      setError("Vui lòng nhập giải pháp xử lý");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await roomManagementApi.closeIncident(room.roomId, incident.incidentId, resolution.trim());
      onResolved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Lỗi khi giải quyết sự cố");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1060, backgroundColor: "rgba(15,20,40,0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="d-flex flex-column"
        style={{
          width: "min(500px, 95vw)",
          backgroundColor: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-4 border-bottom"
          style={{ backgroundColor: "#f8f9fb" }}
        >
          <div>
            <h5 className="mb-1 fw-bold" style={{ color: "#1a1a2e" }}>
              <i className="bi bi-check-circle me-2" style={{ color: SUCCESS }}></i>
              Giải quyết sự cố
            </h5>
            <p className="mb-0 small text-muted">
              Phòng {room.roomName} • ID sự cố: {incident.incidentId}
            </p>
          </div>
          <button
            className="btn btn-sm btn-link text-muted p-0"
            onClick={onClose}
            style={{ fontSize: "1.5rem", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* ─── Body ─── */}
        <div className="p-4">
          {/* Incident Details */}
          <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: "rgba(220,53,69,0.08)" }}>
            <div className="mb-2">
              <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                Mô tả sự cố
              </small>
              <p className="mb-0 mt-1" style={{ color: "#1a1a2e", fontSize: "0.95rem" }}>
                {incident.description}
              </p>
            </div>
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                Ngày báo cáo
              </small>
              <p className="mb-0 mt-1 small text-muted">
                {incident.createdAt ? new Date(incident.createdAt).toLocaleString("vi-VN") : "—"}
              </p>
            </div>
          </div>

          {/* Resolution Input */}
          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ color: "#1a1a2e", fontSize: "0.95rem" }}>
              <i className="bi bi-tools me-2"></i>
              Giải pháp xử lý <span style={{ color: DANGER }}>*</span>
            </label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Mô tả chi tiết cách xử lý sự cố này, có thể bao gồm: vấn đề đã giải quyết, các biện pháp được thực hiện, tình trạng hiện tại..."
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value);
                setError(null);
              }}
              style={{
                borderColor: error ? DANGER : "#ddd",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "0.9rem",
              }}
            />
            {error && (
              <div className="mt-2 small" style={{ color: DANGER }}>
                <i className="bi bi-exclamation-circle me-1"></i>
                {error}
              </div>
            )}
          </div>

          {/* Character count */}
          <div className="mb-4 text-end small text-muted">
            {resolution.length}/500 ký tự
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div
          className="d-flex justify-content-end gap-2 px-4 py-3 border-top"
          style={{ backgroundColor: "#f8f9fb" }}
        >
          <button
            className="btn btn-outline-secondary px-4"
            onClick={onClose}
            disabled={loading}
          >
            Huỷ bỏ
          </button>
          <button
            className="btn px-4 fw-semibold"
            style={{
              backgroundColor: SUCCESS,
              color: "#fff",
              border: "none",
              boxShadow: `0 2px 8px rgba(25,135,84,0.3)`,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleResolve}
            disabled={loading || !resolution.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Giải quyết sự cố
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResolveIncidentModal;