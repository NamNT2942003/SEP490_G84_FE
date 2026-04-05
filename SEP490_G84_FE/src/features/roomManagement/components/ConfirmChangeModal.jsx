import React from "react";

const BRAND = "#f59f00";

export default function ConfirmChangeModal({
  title = "Confirm Status Change",
  message,
  detailLines = [],
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1060, backgroundColor: "rgba(15,20,40,0.55)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white"
        style={{
          width: "min(520px, 92vw)",
          borderRadius: 18,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-4">
          <div className="d-flex align-items-start gap-3">
            <div
              className="rounded-4 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 54, height: 54, backgroundColor: "rgba(245,159,0,0.14)" }}
            >
              <i className="bi bi-wrench" style={{ color: BRAND, fontSize: "1.25rem" }}></i>
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold" style={{ color: "#1a1a2e", fontSize: "1.1rem" }}>
                {title}
              </div>
              {message && <div className="text-muted mt-1">{message}</div>}
              {detailLines?.length > 0 && (
                <div
                  className="mt-3 p-3 rounded-3"
                  style={{ backgroundColor: "#f8f9fb", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {detailLines.map((t, idx) => (
                    <div key={idx} className="text-muted small">
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-light border-0" onClick={onCancel} title="Close">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div className="px-4 pb-4 d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className="btn px-4"
            disabled={loading}
            onClick={onConfirm}
            style={{ backgroundColor: BRAND, color: "#fff", border: "none" }}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
