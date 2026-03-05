import React, { useState } from "react";
import { roomManagementApi } from "../api/roomManagementApi";

const ReportIssueModal = ({ show, room, onHide, onSuccess }) => {
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!description.trim()) {
      newErrors.description = "Mô tả sự cố là bắt buộc";
    }
    if (!reason.trim()) {
      newErrors.reason = "Lý do là bắt buộc";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Get correct room ID - handle both roomId and id properties
      const roomId = room.roomId || room.id;
      if (!roomId) {
        setErrors({ submit: "Không tìm thấy thông tin phòng" });
        return;
      }
      
      // Call API to report issue with detailed payload
      const result = await roomManagementApi.reportIssue(roomId, {
        title: `Sự cố - ${room.roomName || room.roomNumber}`,
        description: description.trim(),
        reason: reason.trim(),
        reportedAt: new Date().toISOString(),
        roomId: roomId,
        reportedBy: 'Admin', // In real app, get from auth context
        severity: 'MEDIUM',
        category: 'EQUIPMENT', // Determine based on description
      });

      // Reset form
      setDescription("");
      setReason("");
      setErrors({});
      
      // Call success callback with updated room info
      onSuccess(result);
      
    } catch (error) {
      console.error("Error reporting issue:", error);
      setErrors({
        submit: error.response?.status === 404 
          ? "API chưa sẵn sàng. Tính năng đang được phát triển."
          : (error.message || "Không thể báo cáo sự cố. Vui lòng thử lại."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDescription("");
    setReason("");
    setErrors({});
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "500px" }}>
        <div 
          className="modal-content border-0" 
          style={{ 
            borderRadius: 15,
            border: "2px solid #dc3545",
            boxShadow: "0 10px 30px rgba(220, 53, 69, 0.2)",
          }}
        >
          {/* MODAL HEADER */}
          <div className="modal-header border-0 p-4 pb-2">
            <div className="w-100">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#dc354520",
                  }}
                >
                  <i className="bi bi-bell-fill text-danger"></i>
                </div>
                <h5 className="fw-bold mb-0" style={{ color: "#1a1a2e" }}>
                  Báo cáo sự cố
                </h5>
              </div>
              
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                {room.roomName} · Tầng {room.floor || 1} · {room.roomTypeName || "Phòng tiêu chuẩn"}
              </div>
            </div>
          </div>

          {/* MODAL BODY */}
          <div className="modal-body p-4 pt-2">
            <form onSubmit={handleSubmit}>
              {/* Issue Description */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-uppercase text-muted" style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
                  MÔ TẢ SỰ CỐ *
                </label>
                <textarea
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  rows="4"
                  placeholder="Ví dụ: Điều hòa không chạy, cửa phòng bị kẹt, có mùi ẩm mốc ở góc phòng tắm..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: null }));
                    }
                  }}
                  style={{
                    borderRadius: 8,
                    border: errors.description ? "2px solid #dc3545" : "2px solid #e9ecef",
                    resize: "vertical",
                  }}
                />
                {errors.description && (
                  <div className="invalid-feedback d-block">
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-uppercase text-muted" style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
                  LÍ DO *
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                  placeholder="Lý do ngắn gọn cho sự cố"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errors.reason) {
                      setErrors(prev => ({ ...prev, reason: null }));
                    }
                  }}
                  style={{
                    borderRadius: 8,
                    border: errors.reason ? "2px solid #dc3545" : "2px solid #e9ecef",
                  }}
                />
                {errors.reason && (
                  <div className="invalid-feedback d-block">
                    {errors.reason}
                  </div>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" style={{ borderRadius: 8 }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* Warning Alert */}
              <div 
                className="alert d-flex align-items-start gap-3 mb-4"
                style={{
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: 8,
                  color: "#664d03",
                }}
              >
                <i className="bi bi-exclamation-triangle-fill text-warning mt-1"></i>
                <div>
                  <strong>Cảnh báo:</strong> Sau khi gửi, <strong>{room.roomName}</strong> sẽ tự động chuyển sang trạng thái <strong>Bảo trì</strong>.
                </div>
              </div>
            </form>
          </div>

          {/* MODAL FOOTER */}
          <div className="modal-footer border-0 p-4 pt-0">
            <div className="d-flex gap-3 w-100">
              <button
                type="button"
                className="btn btn-outline-secondary flex-fill py-2 fw-semibold"
                onClick={handleCancel}
                disabled={loading}
                style={{ borderRadius: 8 }}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-danger flex-fill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                onClick={handleSubmit}
                disabled={loading || !description.trim() || !reason.trim()}
                style={{ borderRadius: 8 }}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="bi bi-bell-fill"></i>
                    Gửi báo cáo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssueModal;