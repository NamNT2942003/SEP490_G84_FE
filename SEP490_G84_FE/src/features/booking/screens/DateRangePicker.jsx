import { useState, useRef, useEffect } from "react";

const DateRangePicker = ({ checkIn, checkOut, onDateChange, minDate = new Date() }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currentYearNow = new Date().getFullYear();
  const minYear = Math.min(minDate ? minDate.getFullYear() : currentYearNow - 5, currentYearNow - 5);
  const maxYear = currentYearNow + 5;
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectingState, setSelectingState] = useState(checkIn && checkOut ? "complete" : checkIn ? "end" : "start");
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
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
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

    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const isDateInRange = (date) => {
    if (!checkIn || !checkOut || !date) return false;
    const checkInDate = parseYmdToLocalMidnight(checkIn);
    const checkOutDate = parseYmdToLocalMidnight(checkOut);
    return date >= checkInDate && date <= checkOutDate;
  };

  const isDateInHoverRange = (date) => {
    if (!checkIn || !hoveredDate || !date || selectingState !== "end") return false;
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
    const min = normalizeToLocalMidnight(minDate) || normalizeToLocalMidnight(new Date());
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
        const ordered = ensureOrderedRange(checkIn, dateStr);
        onDateChange({ checkIn: ordered.checkIn, checkOut: ordered.checkOut });
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
    if (selectingState === "end" && checkIn && date) setHoveredDate(date);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(currentMonth.getMonth() + 1);

  const days = getDaysInMonth(currentMonth);
  const daysNext = getDaysInMonth(nextMonth);

  const getDateClasses = (date) => {
    if (!date) return "";
    let classes = "date-cell";
    if (isDateDisabled(date)) classes += " disabled";
    else {
      classes += " selectable";
      if (isDateSelected(date)) {
        classes += " selected";
        if (formatYmdLocal(date) === checkIn) classes += " start";
        if (formatYmdLocal(date) === checkOut) classes += " end";
      } else if (isDateInRange(date)) classes += " in-range";
      else if (isDateInHoverRange(date)) classes += " hover-range";
    }
    return classes;
  };

  const getSelectedNights = () => {
    if (!checkIn || !checkOut) return null;
    const start = parseYmdToLocalMidnight(checkIn);
    const end = parseYmdToLocalMidnight(checkOut);
    if (!start || !end) return null;
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.round((end - start) / msPerDay);
    return Number.isFinite(diff) ? diff : null;
  };

  const ensureOrderedRange = (ci, co) => {
    if (!ci || !co) return { checkIn: ci || "", checkOut: co || "" };
    const d1 = parseYmdToLocalMidnight(ci);
    const d2 = parseYmdToLocalMidnight(co);
    if (!d1 || !d2) return { checkIn: ci, checkOut: co };
    if (d1 <= d2) return { checkIn: ci, checkOut: co };
    // swap
    return { checkIn: co, checkOut: ci };
  };

  return (
    <div className="date-range-picker" ref={dropdownRef}>
      <style>{`
        .date-range-picker { position: relative; }
        /* Input display */
        .date-input-display { border: 1px solid rgba(15,23,42,0.06); border-radius:10px; padding:10px 14px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:space-between; min-height:44px; box-shadow:0 1px 2px rgba(2,6,23,0.04); }
        .date-input-display:hover { box-shadow:0 6px 18px rgba(14,165,233,0.06); }
        .date-input-display.focused { box-shadow:0 10px 30px rgba(14,165,233,0.08); }
        .date-range-text { flex:1; color:#0f172a; font-weight:600; }
        .date-range-text.placeholder { color:#94a3b8; font-weight:500; }
        .dropdown-icon { color:#64748b; width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px; background:#f8fafc; margin-left:8px; }
        .dropdown-icon.open { transform:rotate(180deg); }
        .calendar-dropdown { position:absolute; top:100%; left:0; background:white; border:1px solid rgba(2,6,23,0.06); border-radius:12px; box-shadow:0 20px 40px rgba(2,6,23,0.08); z-index:1050; padding:12px; margin-top:8px; animation:fadeInDown 0.16s ease; width:640px; }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        .calendar-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .nav-button { background:none; border:none; color:#0f172a; font-size:1.1rem; padding:6px; border-radius:8px; cursor:pointer; }
        .nav-button:hover { background:rgba(2,6,23,0.04); }
        .month-year { font-weight:700; color:#0f172a; display:flex; align-items:center; gap:8px; }
        .month-select, .year-select { padding:6px 10px; border-radius:8px; border:1px solid rgba(2,6,23,0.06); background:#fff; font-weight:600; }
        .calendars { display:flex; gap:18px; justify-content:space-between; }
        .calendar-box { width:100%; max-width:300px; }
        .calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; width:100%; }
        .day-header { text-align:center; font-weight:700; color:#cbd5e1; font-size:0.72rem; padding:6px 0; text-transform:uppercase; }
        .date-cell { aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:0.95rem; position:relative; transition:all 0.12s ease; border-radius:999px; cursor:pointer; width:36px; height:36px; margin:0 auto; }
        .date-cell.disabled { color:#e2e8f0; cursor:not-allowed; background:transparent; }
        .date-cell.selectable:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(14,165,233,0.06); }
        .date-cell.selected { background:linear-gradient(180deg,#2563eb,#1e40af); color:white; font-weight:700; z-index:3; box-shadow:0 8px 24px rgba(14,165,233,0.12); }
        .date-cell.start, .date-cell.end { border-radius:999px; }
        .date-cell.in-range { background:rgba(37,99,235,0.08); color:#0f172a; border-radius:8px; }
        .date-cell.hover-range { background:rgba(37,99,235,0.12); color:#0f172a; border-radius:8px; }
        .range-info { text-align:center; margin-top:12px; padding-top:12px; border-top:1px solid #f1f5f9; color:#64748b; font-size:0.9rem; }
        .range-info.has-selection { color:#16a34a; font-weight:700; }
      `}</style>

      <div className={`date-input-display ${isOpen ? "focused" : ""}`} onClick={() => setIsOpen(!isOpen)}>
        <div className={`date-range-text ${!checkIn ? "placeholder" : ""}`}>
          {checkIn && checkOut
            ? `${formatDisplayDate(checkIn)} → ${formatDisplayDate(checkOut)}`
            : checkIn
            ? `${formatDisplayDate(checkIn)} → Select end date`
            : "Select dates"}
        </div>
        <i className={`bi bi-calendar-event dropdown-icon ${isOpen ? "open" : ""}`}></i>
      </div>

      {isOpen && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <button className="nav-button" onClick={() => navigateMonth(-1)} type="button">
              <i className="bi bi-chevron-left"></i>
            </button>

            <div className="month-year">
              <select
                className="month-select"
                value={currentMonth.getMonth()}
                onChange={(e) => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(Number(e.target.value));
                  setCurrentMonth(newMonth);
                }}
                aria-label="Select month"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("en-GB", { month: "long" })}
                  </option>
                ))}
              </select>

              <select
                className="year-select"
                value={currentMonth.getFullYear()}
                onChange={(e) => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setFullYear(Number(e.target.value));
                  setCurrentMonth(newMonth);
                }}
                aria-label="Select year"
              >
                {Array.from({ length: maxYear - minYear + 1 }).map((_, idx) => {
                  const y = minYear + idx;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>

            <button className="nav-button" onClick={() => navigateMonth(1)} type="button">
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="calendars">
            <div className="calendar-box">
              <div style={{ textAlign: "center", marginBottom: 8, fontWeight: 600 }}>
                {currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </div>
              <div className="calendar-grid">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="day-header">
                    {day}
                  </div>
                ))}

                {days.map((date, index) => (
                  <div
                    key={"l-" + index}
                    className={getDateClasses(date)}
                    onClick={() => date && handleDateClick(date)}
                    onMouseEnter={() => date && handleDateHover(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {date ? date.getDate() : ""}
                  </div>
                ))}
              </div>
            </div>

            <div className="calendar-box">
              <div style={{ textAlign: "center", marginBottom: 8, fontWeight: 600 }}>
                {nextMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </div>
              <div className="calendar-grid">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day + "r"} className="day-header">
                    {day}
                  </div>
                ))}

                {daysNext.map((date, index) => (
                  <div
                    key={"r-" + index}
                    className={getDateClasses(date)}
                    onClick={() => date && handleDateClick(date)}
                    onMouseEnter={() => date && handleDateHover(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {date ? date.getDate() : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`range-info ${checkIn && checkOut ? "has-selection" : ""}`}>
            {(() => {
              const nights = getSelectedNights();
              if (nights === null) {
                return selectingState === "end" && checkIn
                  ? "Select your check-out date"
                  : "Select your check-in date";
              }

              if (nights <= 0) {
                return "Please select a valid check-out date";
              }

              return `${nights} nights selected`;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
