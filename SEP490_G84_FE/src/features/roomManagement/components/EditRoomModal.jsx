import React, { useState, useEffect } from "react";
import { roomManagementApi } from "../api/roomManagementApi";

const BRAND = "#5c6f4e";

export default function EditRoomModal({ room, onClose, onSubmitted }) {
  const [roomName, setRoomName] = useState(room?.roomName || "");
  const [floor, setFloor] = useState(room?.floor || "");
  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId || room?.roomType?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // You might want to fetch room types from API, but for simplicity, we provide common ones or leave as text input if not available
  // Here we use a text input, ideally it should be a select dropdown fetching from an endpoint.
  // Assuming roomType has an id and name.

  useEffect(() => {
    if (room) {
      setRoomName(room.roomName || "");
      setFloor(room.floor || "");
      setRoomTypeId(room.roomTypeId || room?.roomType?.id || "");
    }
  }, [room]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await roomManagementApi.updateRoomBaseInfo(room.roomId, {
        roomName,
        floor: parseInt(floor),
        roomTypeId: parseInt(roomTypeId),
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update room");
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
                backgroundColor: "rgba(92,111,78,0.1)",
                color: BRAND,
              }}
            >
              <i className="bi bi-pencil-square"></i>
            </div>
            <div>
              <div className="fw-bold" style={{ color: "#1a1a2e" }}>
                Edit Room
              </div>
              <div className="text-muted small">
                {room?.roomName ? `${room.roomName}` : `Room #${room?.roomId}`}
              </div>
            </div>
          </div>
          <button className="btn btn-light border-0" onClick={onClose} title="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form className="p-4" onSubmit={submit}>
          <div className="mb-3">
            <label className="fw-semibold small mb-2">
              Room Name <span style={{ color: BRAND }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              style={{ borderRadius: 12, borderColor: "rgba(92,111,78,0.55)" }}
            />
          </div>

          <div className="mb-3">
            <label className="fw-semibold small mb-2">
              Floor <span style={{ color: BRAND }}>*</span>
            </label>
            <input
              type="number"
              className="form-control"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              required
              style={{ borderRadius: 12, borderColor: "rgba(92,111,78,0.55)" }}
            />
          </div>

          <div className="mb-3">
            <label className="fw-semibold small mb-2">
              Room Type ID <span style={{ color: BRAND }}>*</span>
            </label>
            <input
              type="number"
              className="form-control"
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              required
              style={{ borderRadius: 12, borderColor: "rgba(92,111,78,0.55)" }}
              placeholder="Enter Room Type ID"
            />
             <div className="text-muted small mt-1">Please enter the valid ID of the room type.</div>
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
              Cancel
            </button>
            <button
              type="submit"
              className="btn px-4 d-inline-flex align-items-center gap-2"
              disabled={loading}
              style={{
                backgroundColor: BRAND,
                color: "#fff",
                border: "none",
                boxShadow: `0 2px 10px rgba(92,111,78,0.25)`,
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save"></i> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}