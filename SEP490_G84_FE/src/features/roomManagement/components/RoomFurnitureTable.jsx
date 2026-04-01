import React from "react";
import ConfirmChangeModal from "./ConfirmChangeModal";
import ReplaceFromInventoryModal from "./ReplaceFromInventoryModal";
import { roomManagementApi } from "../api/roomManagementApi";

const BRAND = "#5C6F4E";

const CONDITION_MAP = {
  need_repair: { label: "Need Repair", color: "#dc3545", dot: "#dc3545", icon: "bi-tools" },
  repair:      { label: "Need Repair", color: "#dc3545", dot: "#dc3545", icon: "bi-tools" },
  broken:      { label: "Broken",      color: "#dc3545", dot: "#dc3545", icon: "bi-x-circle-fill" },
  maintenance: { label: "Maintenance", color: "#c75000", dot: "#fd7e14", icon: "bi-wrench" },
  good:        { label: "Good",        color: "#198754", dot: "#198754", icon: "bi-check-circle-fill" },
  available:   { label: "Good",        color: "#198754", dot: "#198754", icon: "bi-check-circle-fill" },
};

function getCondition(condition) {
  const key = Object.keys(CONDITION_MAP).find((k) =>
    condition?.toLowerCase().includes(k),
  );
  return CONDITION_MAP[key] || { label: condition || "Unknown", color: "#6c757d", dot: "#aaa", icon: "bi-question-circle" };
}

const CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "BROKEN", label: "Broken" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "NEED_REPAIR", label: "Need Repair" },
];

function RoomFurnitureTable({ furnitureList, roomId, branchId, onChanged }) {
  const [pending, setPending] = React.useState(null); // { item, nextStatus }
  const [saving, setSaving] = React.useState(false);
  const [replaceFor, setReplaceFor] = React.useState(null); // item

  const applyStatusChange = async () => {
    if (!pending?.item || !pending?.nextStatus) return;
    try {
      setSaving(true);
      await roomManagementApi.updateRoomFurniture(roomId, pending.item.furnitureId, {
        status: pending.nextStatus,
      });
      setPending(null);
      onChanged?.();
    } finally {
      setSaving(false);
    }
  };

  if (!furnitureList || furnitureList.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
        <div className="d-flex align-items-center justify-content-center rounded-4 mb-3"
          style={{ width: 56, height: 56, backgroundColor: "rgba(92,111,78,0.08)" }}>
          <i className="bi bi-boxes fs-3" style={{ color: BRAND }}></i>
        </div>
        <p className="fw-semibold mb-1" style={{ fontSize: "0.88rem" }}>No furniture assigned</p>
        <p className="small mb-0 opacity-75">This room has no furniture items yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table align-middle mb-0">
        <thead>
          <tr style={{ backgroundColor: "#f8f9fb" }}>
            {["#", "Item", "Code", "Type", "Qty", "Condition", "Actions"].map((h, i) => (
              <th key={h}
                className={`text-muted fw-semibold border-0${i === 0 ? " ps-4" : ""}${i === 6 ? " text-end pe-4" : ""}`}
                style={{ fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase",
                  width: i === 0 ? 44 : i === 2 ? 110 : i === 3 ? 100 : i === 4 ? 60 : i === 5 ? 130 : i === 6 ? 80 : "auto" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {furnitureList.map((item, idx) => {
            const cond = getCondition(item.condition);
            const bad = ["maintenance", "repair", "broken", "hỏng", "bảo trì", "bao tri"].some((k) =>
              String(item.condition || "").toLowerCase().includes(k),
            );
            return (
              <tr key={`${item.furnitureId}-${idx}`}
                style={{ borderTop: "1px solid #f0f0f4" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafbfd")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                <td className="ps-4 text-muted" style={{ fontSize: "0.78rem" }}>{idx + 1}</td>
                <td className="fw-semibold" style={{ fontSize: "0.88rem", color: "#1a1a2e" }}>{item.furnitorName}</td>
                <td><code className="text-muted" style={{ fontSize: "0.72rem" }}>{item.furnitureCode}</code></td>
                <td>
                  <span className={`d-inline-block ${item.type === "Premium" ? "premium" : "standard"}`} style={{
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    backgroundColor: item.type === "Premium" ? "rgba(224,153,0,.1)" : "rgba(108,117,125,.1)",
                    color: item.type === "Premium" ? "#b37700" : "#495057"
                  }}>
                    {item.type === "Premium" && <i className="bi bi-star-fill me-1" style={{ fontSize: ".6rem" }}></i>}
                    {item.type || "—"}
                  </span>
                </td>
                <td>
                  <span className="d-inline-flex align-items-center justify-content-center fw-bold rounded-circle"
                    style={{ width: 26, height: 26, backgroundColor: "rgba(92,111,78,0.1)", color: BRAND, fontSize: "0.78rem" }}>
                    {item.quantity}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: "0.78rem", fontWeight: 600, color: cond.color }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: cond.dot, flexShrink: 0, display: "inline-block" }} />
                      {cond.label}
                    </span>
                  </div>
                </td>
                <td className="text-end pe-4">
                  {bad && (
                    <button
                      className="btn btn-sm me-2 px-3"
                      style={{
                        backgroundColor: "rgba(13,110,253,0.08)",
                        color: "#0d6efd",
                        border: "1px solid rgba(13,110,253,0.15)",
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: "0.78rem",
                      }}
                      onClick={() => setReplaceFor(item)}
                    >
                      <i className="bi bi-arrow-repeat me-1"></i> Thay từ kho
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {pending && (
        <ConfirmChangeModal
          message="Bạn có chắc chắn muốn thay đổi trạng thái thiết bị này?"
          detailLines={[
            `Thiết bị: ${pending.item?.furnitorName || "—"}`,
            `Mới: ${pending.nextStatus === "GOOD" ? "Tốt" : pending.nextStatus === "BROKEN" ? "Hỏng" : "Bảo trì"}`,
          ]}
          loading={saving}
          onCancel={() => !saving && setPending(null)}
          onConfirm={applyStatusChange}
        />
      )}

      {replaceFor && (
        <ReplaceFromInventoryModal
          roomId={roomId}
          branchId={branchId}
          oldItem={replaceFor}
          onClose={() => setReplaceFor(null)}
          onReplaced={onChanged}
        />
      )}
    </>
  );
}

export default RoomFurnitureTable;