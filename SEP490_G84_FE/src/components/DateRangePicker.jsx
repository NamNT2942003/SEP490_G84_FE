import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

const DateRangePicker = ({
  checkIn,
  checkOut,
  onDateChange,
  minDate = new Date(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectingState, setSelectingState] = useState(
    checkIn && checkOut ? "complete" : checkIn ? "end" : "start",
  );
  const dropdownRef = useRef(null);

  const formatYmdLocal = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseYmdToLocalMidnight = (ymd) => {
    if (!ymd) return null;
    const [year, month, day] = ymd.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const normalizeToLocalMidnight = (date) => {
    if (!date) return null;
    const local = new Date(date);
    local.setHours(0, 0, 0, 0);
    return local;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Select Date";
    const date = parseYmdToLocalMidnight(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectingState("start");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateInRange = (date) => {
    if (!checkIn || !checkOut || !date) return false;
    const checkInDate = parseYmdToLocalMidnight(checkIn);
    const checkOutDate = parseYmdToLocalMidnight(checkOut);
    return date >= checkInDate && date <= checkOutDate;
  };

  const isDateInHoverRange = (date) => {
    if (!checkIn || !hoveredDate || !date || selectingState !== "end")
      return false;
    const startDate = parseYmdToLocalMidnight(checkIn);
    const endDate = normalizeToLocalMidnight(hoveredDate);
    if (endDate < startDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const dateStr = formatYmdLocal(date);
    return dateStr === checkIn || dateStr === checkOut;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const min =
      normalizeToLocalMidnight(minDate) || normalizeToLocalMidnight(new Date());
    return date < min;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;

    const dateStr = formatYmdLocal(date);

    if (selectingState === "start") {
      onDateChange({ checkIn: dateStr, checkOut: "" });
      setSelectingState("end");
    } else if (selectingState === "end") {
      const checkInDate = parseYmdToLocalMidnight(checkIn);
      if (checkInDate && date < checkInDate) {
        onDateChange({ checkIn: dateStr, checkOut: "" });
        setSelectingState("end");
      } else {
        onDateChange({ checkIn: checkIn, checkOut: dateStr });
        setSelectingState("complete");
        setTimeout(() => {
          setIsOpen(false);
          setSelectingState("start");
        }, 500);
      }
    } else {
      onDateChange({ checkIn: dateStr, checkOut: "" });
      setSelectingState("end");
    }
  };

  const handleDateHover = (date) => {
    if (selectingState === "end" && checkIn && date) {
      setHoveredDate(date);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getDateClasses = (date) => {
    if (!date) return "";

    let classes = "date-cell";

    if (isDateDisabled(date)) {
      classes += " disabled";
    } else {
      classes += " selectable";

      if (isDateSelected(date)) {
        classes += " selected";
        if (formatYmdLocal(date) === checkIn) {
          classes += " start";
        }
        if (formatYmdLocal(date) === checkOut) {
          classes += " end";
        }
      } else if (isDateInRange(date)) {
        classes += " in-range";
      } else if (isDateInHoverRange(date)) {
        classes += " hover-range";
      }
    }

    return classes;
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="date-range-picker" ref={dropdownRef}>
      <style>
        {`
          .date-range-picker {
            position: relative;
          }
          
          .date-input-display {
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            background: white;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 38px;
          }
          
          .date-input-display:hover {
            border-color: #5C6F4E;
            box-shadow: 0 0 0 0.2rem rgba(92, 111, 78, 0.1);
          }
          
          .date-input-display.focused {
            border-color: #5C6F4E;
            box-shadow: 0 0 0 0.2rem rgba(92, 111, 78, 0.25);
          }
          
          .date-range-text {
            flex: 1;
            color: #495057;
          }
          
          .date-range-text.placeholder {
            color: #6c757d;
          }
          
          .dropdown-icon {
            color: #6c757d;
            transition: transform 0.2s ease;
          }
          
          .dropdown-icon.open {
            transform: rotate(180deg);
          }
          
          .calendar-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            z-index: 1050;
            padding: 1rem;
            margin-top: 0.25rem;
            animation: fadeInDown 0.3s ease;
          }
          
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .calendar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          
          .nav-button {
            background: none;
            border: none;
            color: #5C6F4E;
            font-size: 1.2rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .nav-button:hover {
            background: rgba(92, 111, 78, 0.1);
          }
          
          .month-year {
            font-weight: 600;
            color: #333;
            font-size: 1rem;
          }
          
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            width: 100%;
          }
          
          .day-header {
            text-align: center;
            font-weight: 600;
            color: #6c757d;
            font-size: 0.75rem;
            padding: 0.5rem 0.25rem;
            text-transform: uppercase;
          }
          
          .date-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            position: relative;
            transition: all 0.2s ease;
            border-radius: 0.25rem;
            cursor: pointer;
          }
          
          .date-cell.disabled {
            color: #ccc;
            cursor: not-allowed;
          }
          
          .date-cell.selectable:hover {
            background: rgba(92, 111, 78, 0.1);
            transform: scale(1.05);
          }
          
          .date-cell.selected {
            background: #5C6F4E !important;
            color: white;
            font-weight: 600;
            transform: scale(1.1);
            z-index: 2;
            box-shadow: 0 2px 8px rgba(92, 111, 78, 0.3);
          }
          
          .date-cell.start {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
          }
          
          .date-cell.end {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
          
          .date-cell.in-range {
            background: rgba(92, 111, 78, 0.2);
            color: #5C6F4E;
            border-radius: 0;
          }
          
          .date-cell.hover-range {
            background: rgba(92, 111, 78, 0.15);
            color: #5C6F4E;
            border-radius: 0;
          }
          
          .range-info {
            text-align: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            color: #6c757d;
            font-size: 0.875rem;
          }
          
          .range-info.has-selection {
            color: #5C6F4E;
            font-weight: 500;
          }
        `}
      </style>

      <div
        className={`date-input-display ${isOpen ? "focused" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`date-range-text ${!checkIn ? "placeholder" : ""}`}>
          {checkIn && checkOut
            ? `${formatDisplayDate(checkIn)} → ${formatDisplayDate(checkOut)}`
            : checkIn
              ? `${formatDisplayDate(checkIn)} → Select end date`
              : "Select dates"}
        </div>
        <i
          className={`bi bi-calendar-event dropdown-icon ${isOpen ? "open" : ""}`}
        ></i>
      </div>

      {isOpen && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <button
              className="nav-button"
              onClick={() => navigateMonth(-1)}
              type="button"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="month-year">{monthYear}</div>
            <button
              className="nav-button"
              onClick={() => navigateMonth(1)}
              type="button"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}

            {days.map((date, index) => (
              <div
                key={index}
                className={getDateClasses(date)}
                onClick={() => date && handleDateClick(date)}
                onMouseEnter={() => date && handleDateHover(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {date ? date.getDate() : ""}
              </div>
            ))}
          </div>

          <div
            className={`range-info ${checkIn && checkOut ? "has-selection" : ""}`}
          >
            {checkIn && checkOut
              ? `${Math.ceil((parseYmdToLocalMidnight(checkOut) - parseYmdToLocalMidnight(checkIn)) / (1000 * 60 * 60 * 24))} nights selected`
              : selectingState === "end" && checkIn
                ? "Select your check-out date"
                : "Select your check-in date"}
          </div>
        </div>
      )}
    </div>
  );
};

DateRangePicker.propTypes = {
  checkIn: PropTypes.string,
  checkOut: PropTypes.string,
  onDateChange: PropTypes.func.isRequired,
  minDate: PropTypes.instanceOf(Date),
};

export default DateRangePicker;
