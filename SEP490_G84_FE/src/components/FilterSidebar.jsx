import { useState } from "react";
import PropTypes from "prop-types";

const ROOM_TYPES = [
  { id: 4, label: "Standard Room" },
  { id: 1, label: "Deluxe Suite" },
  { id: 2, label: "Executive Suite" },
  { id: 5, label: "Family Room" },
];

const FilterSidebar = ({ onFilterChange, selectedRoomTypes }) => {
  const [localSelectedTypes, setLocalSelectedTypes] = useState(
    selectedRoomTypes || [],
  );

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
        <select className="form-select" defaultValue="all">
          <option value="all">All Locations</option>
          <option value="1">Hanoi</option>
          <option value="2">Ho Chi Minh City</option>
        </select>
      </div>

      <div>
        <h6 className="fw-bold mb-3">Room Type</h6>
        {ROOM_TYPES.map((type) => (
          <div className="form-check mb-2" key={type.id}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`room-type-${type.id}`}
              checked={localSelectedTypes.includes(type.id)}
              onChange={() => handleRoomTypeChange(type.id)}
            />
            <label
              className="form-check-label"
              htmlFor={`room-type-${type.id}`}
            >
              {type.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

FilterSidebar.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  selectedRoomTypes: PropTypes.array,
};

export default FilterSidebar;
