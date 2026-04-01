import React, { useEffect, useMemo, useState } from "react";
import { roomManagementApi } from "../api/roomManagementApi";

const BRAND = "#0d6efd";

export default function ReplaceFromInventoryModal({
  roomId,
  oldItem,
  branchId = null,
  onClose,
  onReplaced,
}) {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await roomManagementApi.searchFurnitureInventoryByBranch(
        branchId,
        keyword,
        page,
        size,
        oldItem?.typeId
      );
      // Data format from searchFurnitureInventoryByBranch is { content: [], totalElements, totalPages, number, size }
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!branchId) {
      setError("Branch ID not found. Cannot load inventory.");
      return;
    }
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, branchId]);

  const filtered = useMemo(() => data?.content || [], [data]);

  const submitReplace = async () => {
    if (!selected) return;
    if (!selected.furnitureId) {
      setError("Selected item does not have ID. Please try again.");
      return;
    }
    if (!oldItem?.furnitureId) {
      setError("Original item does not have ID. Cannot process replacement.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await roomManagementApi.replaceFromInventory(roomId, oldItem.furnitureId, {
        furnitureId: selected.furnitureId, // We use furnitureId instead of inventoryId now
        quantity: 1,
      });
      onReplaced?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Replace failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1060, backgroundColor: "rgba(15,20,40,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white d-flex flex-column"
        style={{
          width: "min(680px, 96vw)",
          maxHeight: "86vh",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <div>
            <div className="fw-bold" style={{ color: "#1a1a2e" }}>
              Thay thế từ kho
            </div>
            <div className="text-muted small">
              Đang thay:{" "}
              <span className="fw-semibold" style={{ color: "#dc3545" }}>
                {oldItem?.furnitorName || "—"}
              </span>
            </div>
          </div>
          <button className="btn btn-light border-0" onClick={onClose} title="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="p-3 border-bottom">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control border-start-0"
              placeholder="Tìm trong kho..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setPage(0);
                  fetchList();
                }
              }}
            />
            <button
              className="btn"
              style={{ backgroundColor: BRAND, color: "#fff" }}
              onClick={() => {
                setPage(0);
                fetchList();
              }}
            >
              Tìm
            </button>
          </div>
        </div>

        {error && (
          <div
            className="alert border-0 m-3 small"
            style={{ backgroundColor: "rgba(220,53,69,0.08)", color: "#842029" }}
          >
            {error}
          </div>
        )}

        <div className="p-3 overflow-auto flex-grow-1">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center py-5 text-muted gap-2">
              <div className="spinner-border spinner-border-sm" role="status"></div>
              Loading inventory...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted text-center py-5">Không có item trong kho.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filtered.map((it) => {
                const isSel = selected?.furnitureId === it.furnitureId;
                return (
                  <label
                    key={it.furnitureId}
                    className="d-flex align-items-center gap-3 p-3 rounded-3"
                    style={{
                      border: `1px solid ${isSel ? "rgba(13,110,253,0.35)" : "rgba(0,0,0,0.06)"}`,
                      backgroundColor: isSel ? "rgba(13,110,253,0.05)" : "#fff",
                      cursor: "pointer",
                      opacity: it.inStock > 0 ? 1 : 0.6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      disabled={it.inStock <= 0}
                      onChange={() => {
                        if (it.inStock > 0) setSelected(isSel ? null : it);
                      }}
                      style={{ width: 18, height: 18, cursor: it.inStock > 0 ? "pointer" : "not-allowed" }}
                    />
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "rgba(92,111,78,0.08)",
                        color: "#5C6F4E",
                      }}
                    >
                      <i className="bi bi-box-seam"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold d-flex align-items-center gap-2" style={{ color: "#1a1a2e" }}>
                        {it.furnitorName}
                        {it.type && <span className="badge bg-secondary" style={{ fontSize: "0.65rem", padding: "3px 6px" }}>{it.type}</span>}
                      </div>
                      <div className="text-muted small">
                        Mã TB: {it.furnitureCode} {branchId ? `• Chi nhánh: ${branchId}` : ""}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold" style={{ color: it.inStock > 0 ? "#198754" : "#dc3545" }}>
                        {it.inStock}
                      </div>
                      <div className="text-muted small">trong kho</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between">
          <span className="text-muted small">
            {selected ? "Đã chọn" : "Chưa chọn"}
          </span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary px-4" onClick={onClose}>
              Huỷ
            </button>
            <button
              className="btn px-4"
              disabled={!selected || submitting}
              onClick={submitReplace}
              style={{ backgroundColor: BRAND, color: "#fff", border: "none" }}
            >
              {submitting ? "Đang thay..." : "Thay thế"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
