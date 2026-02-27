import { useState, useEffect } from "react";
import { branchService } from "../../booking/api/branchService.js";
import { roomTypeService } from "../../booking/api/roomTypeService.js";

const FilterSidebar = ({
  onFilterChange,
  selectedRoomTypes,
  selectedBranchId,
}) => {
  const [branches, setBranches] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [localBranchId, setLocalBranchId] = useState(selectedBranchId || "");
  const [localSelectedTypes, setLocalSelectedTypes] = useState(
    selectedRoomTypes || [],
  );
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const data = await branchService.getAllBranches();
        setBranches(data);
        // Set default branch to first one if none selected
        if (!selectedBranchId && data.length > 0) {
          setLocalBranchId(data[0].branchId);
          onFilterChange({ branchId: data[0].branchId });
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Fetch room types when branch changes
  useEffect(() => {
    const fetchRoomTypes = async () => {
      if (!localBranchId) {
        setRoomTypes([]);
        return;
      }
      try {
        setLoadingRoomTypes(true);
        const data = await roomTypeService.getRoomTypesByBranch(localBranchId);
        setRoomTypes(data);
        // Clear room type selection when branch changes
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
  }, [localBranchId]);

  const handleBranchChange = (e) => {
    const branchId = e.target.value ? parseInt(e.target.value) : "";
    setLocalBranchId(branchId);
    onFilterChange({ branchId: branchId || undefined });
  };

  const handleRoomTypeChange = (roomTypeId) => {
    const newSelection = localSelectedTypes.includes(roomTypeId)
      ? localSelectedTypes.filter((id) => id !== roomTypeId)
      : [...localSelectedTypes, roomTypeId];

    setLocalSelectedTypes(newSelection);
    onFilterChange({
      roomTypeIds: newSelection.length > 0 ? newSelection : undefined,
    });
  };

  return (
    <div className="filter-sidebar bg-white p-3 rounded shadow-sm">
      <div className="mb-4">
        <h6 className="fw-bold mb-3">Location</h6>
        {loadingBranches ? (
          <div className="text-muted small">Loading locations...</div>
        ) : (
          <select
            className="form-select"
            value={localBranchId}
            onChange={handleBranchChange}
          >
            <option value="">All Locations</option>
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.branchName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <h6 className="fw-bold mb-3">Room Type</h6>
        {loadingRoomTypes ? (
          <div className="text-muted small">Loading room types...</div>
        ) : roomTypes.length > 0 ? (
          roomTypes.map((type) => (
            <div className="form-check mb-2" key={type.roomTypeId}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`room-type-${type.roomTypeId}`}
                checked={localSelectedTypes.includes(type.roomTypeId)}
                onChange={() => handleRoomTypeChange(type.roomTypeId)}
              />
              <label
                className="form-check-label"
                htmlFor={`room-type-${type.roomTypeId}`}
              >
                {type.name}
              </label>
            </div>
          ))
        ) : (
          <div className="text-muted small">
            {localBranchId
              ? "No room types available"
              : "Select a location first"}
          </div>
        )}
      </div>
    </div>
  );
};



export default FilterSidebar;
