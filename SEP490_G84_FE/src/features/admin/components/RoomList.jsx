import React, { useState } from "react";
import AdminRoomDetailModal from "./AdminRoomDetailModal";

const BRAND = "#5C6F4E";

const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Available",
    dot: "#198754",
    badgeBg: "rgba(25,135,84,0.1)",
    badgeColor: "#198754",
  },
  OCCUPIED: {
    label: "Occupied",
    dot: "#dc3545",
    badgeBg: "rgba(220,53,69,0.1)",
    badgeColor: "#dc3545",
  },
  MAINTENANCE: {
    label: "Maintenance",
    dot: "#fd7e14",
    badgeBg: "rgba(253,126,20,0.1)",
    badgeColor: "#c75000",
  }
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    dot: "#aaa",
    badgeBg: "#f0f0f0",
    badgeColor: "#555",
  };
  return (
    <span
      className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill small fw-semibold"
      style={{
        backgroundColor: cfg.badgeBg,
        color: cfg.badgeColor,
        fontSize: "0.72rem",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: cfg.dot,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {cfg.label}
    </span>
  );
}

function RoomList({ rooms, onRefresh }) {
  const [selectedRoom, setSelectedRoom] = useState(null);

  if (rooms.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
        <div
          className="d-flex align-items-center justify-content-center rounded-4 mb-3"
          style={{
            width: 64,
            height: 64,
            backgroundColor: "rgba(92,111,78,0.08)",
          }}
        >
          <i className="bi bi-door-open fs-3" style={{ color: BRAND }}></i>
        </div>
        <h6 className="fw-semibold mb-1">No rooms found</h6>
        <p className="small mb-0 opacity-75">
          Try adjusting your search or status filter.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive">
        <table
          className="table align-middle mb-0"
          style={{ borderCollapse: "separate" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8f9fb" }}>
              <th
                className="ps-4 text-muted fw-semibold border-0"
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  width: 52,
                }}
              >
                #
              </th>
              <th
                className="text-muted fw-semibold border-0"
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Room
              </th>
              <th
                className="text-muted fw-semibold border-0"
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Type
              </th>
              <th
                className="text-muted fw-semibold border-0"
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Floor
              </th>
              <th
                className="text-muted fw-semibold border-0"
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Status
              </th>
              <th
                className="text-end pe-4 text-muted fw-semibold border-0"
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  width: 80,
                }}
              >
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, idx) => (
              <tr
                key={room.roomId}
                style={{
                  borderTop: "1px solid #f0f0f4",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fafbfd")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                <td className="ps-4 text-muted small">{idx + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: "rgba(92,111,78,0.08)",
                      }}
                    >
                      <i
                        className="bi bi-door-open"
                        style={{ color: BRAND, fontSize: "0.9rem" }}
                      ></i>
                    </div>
                    <div>
                      <div
                        className="fw-semibold"
                        style={{ fontSize: "0.88rem", color: "#1a1a2e" }}
                      >
                        {room.roomName}
                      </div>
                      {room.roomCode && (
                        <code
                          className="text-muted"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {room.roomCode}
                        </code>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-muted" style={{ fontSize: "0.83rem" }}>
                  {room.roomTypeName || "—"}
                </td>
                <td>
                  <span
                    className="px-2 py-1 rounded-2 small fw-semibold"
                    style={{
                      backgroundColor: "rgba(92,111,78,0.08)",
                      color: BRAND,
                      fontSize: "0.75rem",
                    }}
                  >
                    Floor {room.floor}
                  </span>
                </td>
                <td>
                  <StatusPill status={room.status} />
                </td>
                <td className="text-end pe-4">
                  <button
                    className="btn btn-sm d-inline-flex align-items-center gap-1 px-3 py-1 rounded-2"
                    style={{
                      backgroundColor: "rgba(92,111,78,0.08)",
                      color: BRAND,
                      border: "none",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <i className="bi bi-eye"></i> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRoom && (
        <AdminRoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}

export default RoomList;
