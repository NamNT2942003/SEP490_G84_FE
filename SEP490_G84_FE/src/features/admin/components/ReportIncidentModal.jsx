import React, { useState } from "react";
import { roomManagementApi } from "../api/roomManagementApi";

const BRAND = "#dc3545";

export default function ReportIncidentModal({ room, onClose, onSubmitted }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await roomManagementApi.createIncident(room.roomId, { description });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        zIndex: 1060,
        backgroundColor: "rgba(15,20,40,0.55)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white"
        style={{
          width: "min(560px, 94vw)",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: 34,
                height: 34,
                backgroundColor: "rgba(220,53,69,0.1)",
                color: BRAND,
              }}
            >
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div>
              <div className="fw-bold" style={{ color: "#1a1a2e" }}>
                Báo cáo sự cố
              </div>
              <div className="text-muted small">
                {room?.roomName ? `${room.roomName}` : "Room"}{" "}
                {room?.floor ? `· Tầng ${room.floor}` : ""}
              </div>
            </div>
          </div>
          <button className="btn btn-light border-0" onClick={onClose} title="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form className="p-4" onSubmit={submit}>
          <label className="fw-semibold small mb-2">
            Mô tả sự cố <span style={{ color: BRAND }}>*</span>
          </label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Ví dụ: Điều hoà không chạy, cửa phòng bị kẹt, có mùi ẩm mốc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ borderRadius: 12, borderColor: "rgba(220,53,69,0.55)" }}
          />
          <div className="text-muted small mt-2">Bắt buộc nhập lý do</div>

          <div
            className="alert border-0 mt-3 mb-0 d-flex align-items-start gap-2"
            style={{
              backgroundColor: "rgba(255,193,7,0.18)",
              borderRadius: 12,
              color: "#6c4b00",
            }}
          >
            <i className="bi bi-exclamation-circle-fill mt-1"></i>
            <div className="small">
              Sau khi gửi, phòng sẽ tự động chuyển sang trạng thái{" "}
              <strong>Bảo trì</strong>.
            </div>
          </div>

          {error && (
            <div
              className="alert border-0 mt-3 mb-0 small"
              style={{ backgroundColor: "rgba(220,53,69,0.08)", color: "#842029" }}
            >
              {error}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
              Huỷ
            </button>
            <button
              type="submit"
              className="btn px-4 d-inline-flex align-items-center gap-2"
              disabled={loading}
              style={{
                backgroundColor: BRAND,
                color: "#fff",
                border: "none",
                boxShadow: "0 2px 10px rgba(220,53,69,0.25)",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Đang gửi...
                </>
              ) : (
                <>
                  <i className="bi bi-megaphone-fill"></i> Gửi báo cáo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

