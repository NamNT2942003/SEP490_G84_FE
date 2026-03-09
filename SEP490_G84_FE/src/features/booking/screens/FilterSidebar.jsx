import { useState, useEffect } from "react";
import { roomTypeService } from "../api/roomTypeService.js";

const FilterSidebar = ({ onFilterChange, selectedRoomTypes, selectedBranchId }) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [localSelectedTypes, setLocalSelectedTypes] = useState(selectedRoomTypes || []);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      if (!selectedBranchId) { setRoomTypes([]); return; }
      try {
        setLoadingRoomTypes(true);
        const data = await roomTypeService.getRoomTypesByBranch(selectedBranchId);
        setRoomTypes(data);
        setLocalSelectedTypes([]);
        onFilterChange({ roomTypeIds: undefined });
      } catch (error) {
        console.error("Failed to fetch room types:", error);
        setRoomTypes([]);
      } finally {
        setLoadingRoomTypes(false);
      }
    };
    fetchRoomTypes();
  }, [selectedBranchId]);

  const handleRoomTypeChange = (roomTypeId) => {
    const newSelection = localSelectedTypes.includes(roomTypeId)
      ? localSelectedTypes.filter((id) => id !== roomTypeId)
      : [...localSelectedTypes, roomTypeId];
    setLocalSelectedTypes(newSelection);
    onFilterChange({ roomTypeIds: newSelection.length > 0 ? newSelection : undefined });
  };

  const clearAll = () => {
    setLocalSelectedTypes([]);
    onFilterChange({ roomTypeIds: undefined });
  };

  return (
    <>
      <style>{`
        .fs-box{background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.04);border:1px solid #eee;position:sticky;top:20px}
        .fs-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #f0f4ec}
        .fs-hdr h6{font-weight:800;color:#333;margin:0;font-size:.95rem}
        .fs-clr{border:none;background:none;color:#5C6F4E;font-size:.78rem;font-weight:600;cursor:pointer;padding:0}
        .fs-clr:hover{text-decoration:underline}
        .fs-tip{background:#f8faf6;border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:.78rem;color:#777;line-height:1.4}
        .fs-tip i{color:#5C6F4E;margin-right:4px}
        .fs-chk{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;margin-bottom:6px;cursor:pointer;transition:background .15s;border:1px solid transparent}
        .fs-chk:hover{background:#f8faf6;border-color:#e8ede4}
        .fs-chk.active{background:#f0f4ec;border-color:#d6decf}
        .fs-chk input{accent-color:#5C6F4E;width:16px;height:16px;cursor:pointer;margin:0;flex-shrink:0}
        .fs-chk label{cursor:pointer;font-size:.88rem;font-weight:500;color:#444;margin:0}
        .fs-cnt{font-size:.72rem;font-weight:600;color:#5C6F4E;background:#e8ede4;border-radius:6px;padding:2px 7px;margin-left:auto}
        .fs-empty{text-align:center;padding:20px 8px;color:#999;font-size:.84rem}
        .fs-empty i{font-size:1.5rem;display:block;margin-bottom:6px;color:#ddd}
        .fs-load{text-align:center;padding:20px;color:#999}
      `}</style>
      <div className="fs-box">
        <div className="fs-hdr">
          <h6><i className="bi bi-funnel-fill me-2" style={{ color: '#5C6F4E' }}></i>Filters</h6>
          {localSelectedTypes.length > 0 && (
            <button className="fs-clr" onClick={clearAll}>Clear All</button>
          )}
        </div>

        <div className="fs-tip">
          <i className="bi bi-lightbulb-fill"></i>
          Select room types to filter your search results.
        </div>

        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>
          <i className="bi bi-door-open me-1" style={{ color: '#5C6F4E' }}></i>Room Type
        </div>

        {loadingRoomTypes ? (
          <div className="fs-load">
            <div className="spinner-border spinner-border-sm me-2" role="status" style={{ color: '#5C6F4E' }}></div>
            Loading...
          </div>
        ) : roomTypes.length > 0 ? (
          roomTypes.map((type) => (
            <div
              className={`fs-chk ${localSelectedTypes.includes(type.roomTypeId) ? "active" : ""}`}
              key={type.roomTypeId}
              onClick={() => handleRoomTypeChange(type.roomTypeId)}
            >
              <input
                type="checkbox"
                checked={localSelectedTypes.includes(type.roomTypeId)}
                onChange={() => handleRoomTypeChange(type.roomTypeId)}
                onClick={(e) => e.stopPropagation()}
              />
              <label>{type.name}</label>
            </div>
          ))
        ) : (
          <div className="fs-empty">
            <i className="bi bi-inbox"></i>
            {selectedBranchId ? "No room types available" : "Select a branch first"}
          </div>
        )}

        {localSelectedTypes.length > 0 && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <span className="fs-cnt">{localSelectedTypes.length} selected</span>
          </div>
        )}
      </div>
    </>
  );
};

export default FilterSidebar;
