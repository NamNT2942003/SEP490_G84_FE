import React, { useState, useEffect } from "react";
import apiClient from "../../../services/apiClient";

export default function AddFurnitureToRoomModal({ isOpen, onClose, selectedBranchId, currentSelections, onConfirmSelection }) {
  const [availableFurniture, setAvailableFurniture] = useState([]);
  const [localSelections, setLocalSelections] = useState([...currentSelections]);

  useEffect(() => {
    if (isOpen && selectedBranchId) {
      setLocalSelections([...currentSelections]);
      // Note: fetching all inventory logic 
      apiClient.get(`/rooms-detail/furniture/branch/` + selectedBranchId + `/search?size=1000`)
        .then(res => {
             // Response might be { content: [...] }
             setAvailableFurniture(res.data?.content || res.data || []);
         })
        .catch(err => console.error(err));
    }
  }, [isOpen, selectedBranchId, currentSelections]);

  const handleQtyChange = (furniture, qtyStr) => {
    const qty = parseInt(qtyStr) || 0;
    const max = furniture.inStock || 0;
    const validQty = Math.max(0, Math.min(qty, max));

    setLocalSelections(prev => {
      const exists = prev.find(item => item.id === furniture.furnitureId);      
      if (validQty === 0) return prev.filter(item => item.id !== furniture.furnitureId);

      if (exists) {
        return prev.map(item => item.id === furniture.furnitureId ? { ...item, qty: validQty } : item);
      }
      return [...prev, { id: furniture.furnitureId, name: furniture.furnitorName || furniture.name, qty: validQty }];
    });
  };

  const currentQtyFor = (id) => {
    const f = localSelections.find(item => item.id === id);
    return f ? f.qty : "0";
  };

  const handleConfirm = () => {
    onConfirmSelection(localSelections);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060, display: "flex", justifyContent: "center", alignItems: "center"}}>
      <div style={{backgroundColor: "white", padding: "20px", borderRadius: "8px", width: "600px", position: "relative"}}>
        <h2 style={{fontSize:"20px", marginBottom:"15px"}}>Select furniture to room <span style={{float:"right", fontSize:"14px", background:"#ddd", padding:"2px 10px"}}>Branch-WareHouse</span></h2>

        {!selectedBranchId ? (
          <p className="text-danger">Please select a branch first.</p>
        ) : (
          <div style={{maxHeight: "400px", overflowY: "auto", border: "1px solid #17a2b8", padding: "10px", marginBottom: "20px"}}>
              {availableFurniture.map(f => (
                  <div key={f.furnitureId} style={{display:"flex", alignItems:"center", marginBottom:"10px", paddingBottom:"10px", borderBottom:"1px solid #eee"}}>
                     <input type="checkbox" checked={currentQtyFor(f.furnitureId) > 0} readOnly style={{marginRight: "10px", width: "20px", height:"20px"}}/>
                     <span style={{flex: 1, fontWeight:"bold"}}>{f.furnitorName || f.name}</span>
                     <div>
                      <input
                        type="number"
                        min="0"
                        max={f.inStock}
                        value={currentQtyFor(f.furnitureId)}
                        onChange={(e) => handleQtyChange(f, e.target.value)}    
                        style={{width: "70px", padding: "5px", border:"1px solid #ccc", borderRadius:"4px"}}
                        placeholder="0"
                        disabled={f.inStock <= 0}
                      />
                      <span style={{fontSize:"12px", color:"#999", marginLeft:"5px"}}>Max: {f.inStock}</span>
                     </div>
                  </div>
              ))}
              {availableFurniture.length === 0 && <p>No furniture available in warehouse for this branch.</p>}
          </div>
        )}

        <div style={{textAlign: "center"}}>
          <button onClick={handleConfirm} disabled={!selectedBranchId} className="btn" style={{backgroundColor: "#FFA500", color: "white", width: "100px", marginRight: "10px"}}>Add</button>
          <button onClick={onClose} className="btn" style={{backgroundColor:"#FF6B6B", color:"white", width:"100px"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
