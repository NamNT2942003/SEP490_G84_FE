import React, { useState, useEffect } from "react";
import apiClient from "../../../services/apiClient";
import AddFurnitureToRoomModal from "./AddFurnitureToRoomModal";

export default function AddRoomModal({ isOpen, onClose, onRoomAdded, branches, roomTypes }) {
  const [formData, setFormData] = useState({
    branchId: "",
    floor: "",
    roomName: "",
    roomTypeId: "",
    furnitures: []
  });

  const [isFurnitureModalOpen, setFurnitureModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        branchId: "",
        floor: "",
        roomName: "",
        roomTypeId: "",
        furnitures: []
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, roomTypeId: "" }));
    }
  }, [formData.branchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomName || formData.roomName.trim() === "") {
        alert("Vui lòng nhập tên phòng");
        return;
    }
    try {
      const payload = {
        branchId: parseInt(formData.branchId),
        floor: parseInt(formData.floor),
        roomName: formData.roomName,
        roomTypeId: parseInt(formData.roomTypeId),
        furnitures: formData.furnitures.map(f => ({
          furnitureId: f.id,
          quantity: f.qty
        }))
      };

      await apiClient.post(`/admin/rooms`, payload);
      onRoomAdded();
      onClose();
    } catch (err) {
      console.error("Failed to add room", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      alert("Error adding room: " + errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" style={{position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050, display: "flex", justifyContent: "center", alignItems: "center"}}>
      <div className="bg-white p-6 rounded-lg w-full max-w-lg" style={{backgroundColor: "white", padding: "20px", borderRadius: "8px", width: "500px", position: "relative"}}>
        <h2 className="text-xl font-bold mb-4">Add New Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div style={{marginBottom: "10px"}}>
              <label>Branch</label>
              <select required className="form-select" value={formData.branchId} onChange={e => setFormData({ ...formData, branchId: e.target.value })}>
                <option value="">Select Branch</option>
                {branches?.map(b => (
                  <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                ))}
              </select>
            </div>

            <div style={{marginBottom: "10px"}}>
              <label>Floor</label>
              <select required className="form-select" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })}>
                 <option value="">Select floor</option>
                 <option value="1">Floor 1</option>
                 <option value="2">Floor 2</option>
                 <option value="3">Floor 3</option>
                 <option value="4">Floor 4</option>
                 <option value="5">Floor 5</option>
              </select>
            </div>

            <div style={{marginBottom: "10px"}}>
              <label>Room Name</label>
              <input required type="text" className="form-control" value={formData.roomName} onChange={e => setFormData({ ...formData, roomName: e.target.value })} placeholder="Enter Room Name" />
            </div>

            <div style={{marginBottom: "10px"}}>
              <label>Room Type</label>
              <select required className="form-select" value={formData.roomTypeId} onChange={e => setFormData({ ...formData, roomTypeId: e.target.value })}>
                <option value="">Select Room Type</option>
                {roomTypes?.filter(rt => !formData.branchId || rt.branchId === parseInt(formData.branchId)).map(rt => (
                  <option key={rt.roomTypeId || rt.id} value={rt.roomTypeId || rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "10px"}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:"10px"}}>
              <h5 style={{fontSize:"16px", margin: 0}}>Furniture:</h5>
              <button type="button" onClick={() => setFurnitureModalOpen(true)} className="btn" style={{backgroundColor: "#FFA500", color: "white", padding: "5px 15px", borderRadius: "4px"}}>
                + Add furniture
              </button>
            </div>

            <div style={{display:"flex", flexWrap:"wrap", gap:"10px", padding: "15px", border: "1px solid #17a2b8", minHeight: "100px"}}>
                {formData.furnitures.map((f, i) => (
                  <div key={i} style={{backgroundColor:"#FFA500", color:"white", padding:"5px 15px", borderRadius:"4px", fontWeight:"bold"}}>
                    {f.name}({f.qty})
                  </div>
                ))}
            </div>
          </div>

          <div style={{marginTop: "20px", textAlign: "right"}}>
            <button type="button" onClick={onClose} className="btn btn-secondary me-2">Cancel</button>
            <button type="submit" className="btn" style={{backgroundColor:"#5C6F4E", color:"white"}}>Save Room</button>
          </div>
        </form>
      </div>

      <AddFurnitureToRoomModal
        isOpen={isFurnitureModalOpen}
        onClose={() => setFurnitureModalOpen(false)}
        selectedBranchId={formData.branchId}
        currentSelections={formData.furnitures}
        onConfirmSelection={(newSelections) => setFormData({ ...formData, furnitures: newSelections })}
      />
    </div>
  );
}
