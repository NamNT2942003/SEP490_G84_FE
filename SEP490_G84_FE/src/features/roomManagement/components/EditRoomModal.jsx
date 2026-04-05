import React, { useState, useEffect } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import apiClient from "../../../services/apiClient";
import AddFurnitureToRoomModal from "./AddFurnitureToRoomModal";

const BRAND = "#5c6f4e";

export default function EditRoomModal({ room, onClose, onSubmitted }) {
  const [roomName, setRoomName] = useState(room?.roomName || "");
  const [floor, setFloor] = useState(room?.floor || "");
  const [branchId, setBranchId] = useState(room?.branchId || room?.roomType?.branch?.branchId || "");
  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId || room?.roomType?.id || "");
  const [furnitures, setFurnitures] = useState([]);
  
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isFurnitureModalOpen, setFurnitureModalOpen] = useState(false);

  useEffect(() => {
    // Fetch room types so user has a dropdown
    const fetchRoomTypes = async () => {
      try {
        const types = await roomManagementApi.getRoomTypes();
        setRoomTypes(types || []);
      } catch (err) {
        console.error("Failed to load room types", err);
      }
    };
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (room) {
      setRoomName(room.roomName || "");
      setFloor(room.floor || "");
      setBranchId(room.branchId || room?.roomType?.branch?.branchId || "");
      setRoomTypeId(room.roomTypeId || room?.roomType?.id || "");
      
      const mappedFurniture = (room.furnitureList || []).map(f => ({
        id: f.furnitureId,
        name: f.furnitorName || f.name,
        qty: f.quantity || 1
      }));
      setFurnitures(mappedFurniture);
    }
  }, [room]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        roomTypeId: parseInt(roomTypeId),
        furnitures: furnitures.map(f => ({
          furnitureId: f.id,
          quantity: f.qty
        }))
      };

      await apiClient.put(`/admin/rooms/` + room.roomId, payload);
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
          width: "min(640px, 94vw)",
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
          <div className="row mb-3">
            <div className="col">
              <label className="fw-semibold small mb-2">
                Room Name
              </label>
              <input
                type="text"
                className="form-control bg-light"
                value={roomName}
                readOnly
                disabled
                style={{ borderRadius: 12, borderColor: "rgba(92,111,78,0.25)" }} 
              />
            </div>
            <div className="col">
              <label className="fw-semibold small mb-2">
                Floor
              </label>
              <input
                type="text"
                className="form-control bg-light"
                value={"Floor " + floor}
                readOnly
                disabled
                style={{ borderRadius: 12, borderColor: "rgba(92,111,78,0.25)" }} 
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="fw-semibold small mb-2">
              Room Type <span style={{ color: BRAND }}>*</span>
            </label>
            <select
              className="form-select"
              value={roomTypeId}
              onChange={(e) => {
                const val = e.target.value;
                setRoomTypeId(val);
                const rt = roomTypes?.find(t => (t.roomTypeId || t.id).toString() === val.toString());
                if (rt?.branchId) {
                  setBranchId(rt.branchId);
                }
              }}
              required
              style={{ borderRadius: 12, borderColor: "rgba(92,111,78,0.55)" }}
            >
              <option value="">Select Room Type</option>
              {roomTypes?.map(rt => (
                <option key={rt.roomTypeId || rt.id} value={rt.roomTypeId || rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="m-0 fw-bold" style={{ color: "#1a1a2e" }}>Furniture (Modify):</h6>
              <button 
                type="button" 
                onClick={() => setFurnitureModalOpen(true)} 
                className="btn btn-sm btn-outline-warning fw-bold px-3"
                style={{ borderRadius: 20 }}
              >
                <i className="bi bi-plus-lg me-1"></i> Manage Furniture
              </button>
            </div>

            <div className="d-flex flex-wrap gap-2 p-3 rounded-3" style={{ border: "1px dashed #17a2b8", minHeight: "80px", backgroundColor: "#f8fdfd" }}>
              {furnitures.map((f, i) => (
                <div key={i} className="badge bg-warning text-dark px-3 py-2 fs-6 rounded-pill d-flex align-items-center shadow-sm">
                  {f.name} <span className="ms-2 px-2 py-1 bg-white rounded-pill text-muted small">{f.qty}</span>
                </div>
              ))}
              {furnitures.length === 0 && <span className="text-muted small align-self-center">No furniture assigned yet.</span>}
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
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} style={{ borderRadius: 12 }}>
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
                borderRadius: 12,
                boxShadow: "0 4px 14px rgba(92,111,78,0.35)",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle"></i> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <AddFurnitureToRoomModal
        isOpen={isFurnitureModalOpen}
        onClose={() => setFurnitureModalOpen(false)}
        selectedBranchId={branchId}
        currentSelections={furnitures}
        onConfirmSelection={(newSelections) => setFurnitures(newSelections)}
      />
    </div>
  );
}
