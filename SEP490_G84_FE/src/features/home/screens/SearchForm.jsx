import { useState, useRef, useEffect, useCallback } from "react";

/* ── Custom Bootstrap Calendar Dropdown ── */
const CalendarDropdown = ({ value, minDate, onSelect, onClose }) => {
  const parseDateStr = (str) => {
    if (!str) return new Date();
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const selected = parseDateStr(value);
  const minD = minDate ? parseDateStr(minDate) : null;

  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const fmtYmd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Build calendar grid (Monday-start)
  const buildDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startDay = firstDay.getDay(); // 0=Sun
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Mon=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    // Previous month trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false, date: null });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      cells.push({ day: d, current: true, date, ymd: fmtYmd(date) });
    }
    // Next month leading days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, current: false, date: null });
    }
    return cells;
  };

  const days = buildDays();
  const todayStr = fmtYmd(new Date());

  const isDisabled = (cell) => {
    if (!cell.current || !cell.date) return true;
    if (minD && cell.date < minD) return true;
    return false;
  };

  const handleSelect = (cell) => {
    if (isDisabled(cell)) return;
    onSelect(cell.ymd);
    onClose();
  };

  // Check if prev month button should be disabled
  const now = new Date();
  const canGoPrev = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth());

  return (
    <div className="cal-dropdown shadow-lg border-0 rounded-4 bg-white p-3" 
         style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 1070, minWidth: 320, animation: "calFadeIn .2s ease" }}
         onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <button type="button" className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 34, height: 34 }} onClick={prevMonth} disabled={!canGoPrev}>
          <i className="bi bi-chevron-left" style={{ fontSize: ".8rem" }}></i>
        </button>
        <span className="fw-bold" style={{ fontSize: ".95rem", color: "#2c3e50" }}>
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button type="button" className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 34, height: 34 }} onClick={nextMonth}>
          <i className="bi bi-chevron-right" style={{ fontSize: ".8rem" }}></i>
        </button>
      </div>

      {/* Day labels */}
      <div className="d-grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
        {dayLabels.map((d) => (
          <div key={d} className="text-center py-1" style={{ fontSize: ".72rem", fontWeight: 700, color: "#999", textTransform: "uppercase" }}>{d}</div>
        ))}

        {/* Day cells */}
        {days.map((cell, i) => {
          const disabled = isDisabled(cell);
          const isSelected = cell.current && cell.ymd === value;
          const isToday = cell.current && cell.ymd === todayStr;
          return (
            <div key={i}
              className={`text-center d-flex align-items-center justify-content-center rounded-circle mx-auto
                ${disabled ? "" : "cal-day-hover"}`}
              style={{
                width: 38, height: 38, fontSize: ".85rem", cursor: disabled ? "default" : "pointer",
                fontWeight: isSelected || isToday ? 700 : 500,
                color: !cell.current ? "#d0d0d0" : disabled ? "#c0c0c0" : isSelected ? "#fff" : isToday ? "#5C6F4E" : "#333",
                background: isSelected ? "#5C6F4E" : isToday ? "rgba(92,111,78,.1)" : "transparent",
                border: isToday && !isSelected ? "2px solid #5C6F4E" : "2px solid transparent",
                transition: "all .15s",
              }}
              onClick={() => handleSelect(cell)}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="d-flex justify-content-between align-items-center mt-3 pt-2" style={{ borderTop: "1px solid #f0f0f0" }}>
        <button type="button" className="btn btn-sm text-muted px-0" style={{ fontSize: ".8rem" }}
          onClick={() => { onSelect(""); onClose(); }}>
          Clear
        </button>
        <button type="button" className="btn btn-sm px-3 text-white fw-bold" 
          style={{ background: "#5C6F4E", borderRadius: 8, fontSize: ".8rem" }}
          onClick={() => { const t = fmtYmd(new Date()); if (!minD || new Date() >= minD) { onSelect(t); onClose(); } }}>
          Today
        </button>
      </div>
    </div>
  );
};

/* ── Main Search Form ── */
const SearchForm = ({ onSearch, loading, branches = [], branchId, onBranchChange }) => {
  const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const now = new Date(); now.setHours(0,0,0,0);
  const today = fmtYmd(now);
  const tom = new Date(now); tom.setDate(now.getDate()+1);
  const tomorrow = fmtYmd(tom);

  const [sp, setSp] = useState({ checkIn: today, checkOut: tomorrow, adults: 1, children: 0 });

  // Calendar dropdown state: null | "checkin" | "checkout"
  const [calOpen, setCalOpen] = useState(null);
  const calRef = useRef(null);

  // guest picker
  const [guestOpen, setGuestOpen] = useState(false);
  const gRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (gRef.current && !gRef.current.contains(e.target)) setGuestOpen(false);
      if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const adj = (f, d) => setSp(p => {
    const mn = f==="adults"?1:0, mx = f==="adults"?6:4;
    return { ...p, [f]: Math.min(mx, Math.max(mn, p[f]+d)) };
  });
  const guestText = () => {
    let t = `${sp.adults} adult${sp.adults > 1 ? 's' : ''}`;
    if (sp.children > 0) t += `, ${sp.children} child${sp.children > 1 ? 'ren' : ''}`;
    return t;
  };

  // date helpers
  const enDay = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const enMonth = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmtDate = (ymd) => {
    if (!ymd) return { main: "Select date", sub: "" };
    const [y,m,d] = ymd.split("-").map(Number);
    return { main: `${enMonth[m-1]} ${d}, ${y}`, sub: enDay[new Date(y,m-1,d).getDay()] };
  };
  const nights = () => {
    if (!sp.checkIn || !sp.checkOut) return 0;
    const [y1,m1,d1] = sp.checkIn.split("-").map(Number);
    const [y2,m2,d2] = sp.checkOut.split("-").map(Number);
    return Math.max(0, Math.round((new Date(y2,m2-1,d2) - new Date(y1,m1-1,d1)) / 864e5));
  };

  const handleSelectCheckIn = useCallback((val) => {
    setSp(p => {
      const ci = val; let co = p.checkOut;
      if (ci && co && co <= ci) { const d = new Date(ci.split("-").map(Number).reduce((_, v, i) => i === 0 ? new Date(v, 0, 1) : i === 1 ? (_.setMonth(v-1), _) : (_.setDate(v), _), new Date())); d.setDate(d.getDate()+1); co = fmtYmd(d); }
      return { ...p, checkIn: ci || p.checkIn, checkOut: co };
    });
  }, []);

  const handleSelectCheckOut = useCallback((val) => {
    setSp(p => ({ ...p, checkOut: val || p.checkOut }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sp.checkIn || !sp.checkOut) { alert("Please select check-in and check-out dates"); return; }
    if (sp.checkOut <= sp.checkIn) { alert("Check-out date must be after check-in date"); return; }
    onSearch(sp);
  };

  // Min date for checkout = checkIn + 1 day
  const checkOutMin = (() => {
    if (!sp.checkIn) return today;
    const [y,m,d] = sp.checkIn.split("-").map(Number);
    const dt = new Date(y, m-1, d); dt.setDate(dt.getDate()+1);
    return fmtYmd(dt);
  })();

  return (
    <>
      <style>{`
        .sf{background:#fff;border-radius:18px;padding:24px 28px 20px;box-shadow:0 8px 40px rgba(0,0,0,.10);position:relative;overflow:visible}
        .sf-r{display:flex;align-items:flex-end;gap:10px;flex-wrap:nowrap}
        .sf-g{display:flex;flex-direction:column;min-width:0}
        .sf-g.br{flex:0 0 175px}
        .sf-g.dt{flex:1 1 auto;min-width:320px;position:relative}
        .sf-g.gu{flex:0 0 170px;position:relative}
        .sf-g.ac{flex:0 0 auto}
        .sf-l{font-size:.7rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px;display:flex;align-items:center;gap:4px}
        .sf-l i{color:#5C6F4E;font-size:.78rem}
        .sf-w{position:relative}
        .sf-w .si{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#5C6F4E;font-size:.95rem;pointer-events:none;z-index:2}
        .sf-sel{width:100%;height:46px;border:2px solid #e8e8e8;border-radius:10px;background:#fafafa;padding:0 12px 0 38px;font-size:.88rem;font-weight:500;color:#333;cursor:pointer;transition:border-color .2s,box-shadow .2s;appearance:auto}
        .sf-sel:hover{border-color:#ccc;background:#fff}
        .sf-sel:focus{border-color:#5C6F4E;box-shadow:0 0 0 3px rgba(92,111,78,.1);background:#fff;outline:none}
        .sf-dr{display:flex;gap:6px;align-items:stretch}
        .sf-db{flex:1;display:flex;align-items:center;gap:8px;padding:6px 12px;border:2px solid #e8e8e8;border-radius:10px;background:#fafafa;cursor:pointer;transition:border-color .2s;height:46px;position:relative}
        .sf-db:hover{border-color:#ccc;background:#fff}
        .sf-db.active{border-color:#5C6F4E;box-shadow:0 0 0 3px rgba(92,111,78,.1);background:#fff}
        .sf-db .di{color:#5C6F4E;font-size:1rem;flex-shrink:0}
        .sf-db .dm{font-size:.82rem;font-weight:600;color:#333;line-height:1.2}
        .sf-db .ds{font-size:.66rem;color:#999}
        .sf-nb{display:flex;align-items:center;justify-content:center;background:#f0f4ec;color:#5C6F4E;border-radius:8px;font-size:.68rem;font-weight:700;padding:4px 8px;white-space:nowrap;height:46px}
        .gt{width:100%;height:46px;border:2px solid #e8e8e8;border-radius:10px;background:#fafafa;padding:0 12px 0 38px;font-size:.88rem;font-weight:500;color:#333;cursor:pointer;transition:border-color .2s;display:flex;align-items:center;user-select:none;position:relative}
        .gt:hover{border-color:#ccc;background:#fff}
        .gt.op{border-color:#5C6F4E;box-shadow:0 0 0 3px rgba(92,111,78,.1);background:#fff}
        .gt .ch{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#999;font-size:.7rem;transition:transform .2s}
        .gt.op .ch{transform:translateY(-50%) rotate(180deg)}
        .gdd{position:absolute;top:calc(100% + 6px);left:0;right:0;min-width:250px;background:#fff;border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.12);z-index:1060;padding:16px 20px;animation:gF .2s}
        @keyframes gF{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes calFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .cal-day-hover:hover{background:rgba(92,111,78,.12)!important;color:#333!important}
        .gr{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
        .gr+.gr{border-top:1px solid #f0f0f0}
        .grl{font-size:.9rem;font-weight:600;color:#333}
        .grh{font-size:.72rem;color:#999}
        .gc{display:flex;align-items:center;gap:12px}
        .gb{width:32px;height:32px;border:2px solid #ddd;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#5C6F4E;cursor:pointer;transition:all .15s;padding:0}
        .gb:hover:not(:disabled){border-color:#5C6F4E;background:rgba(92,111,78,.06)}
        .gb:disabled{border-color:#eee;color:#ccc;cursor:not-allowed}
        .gv{font-size:1rem;font-weight:700;color:#222;min-width:18px;text-align:center}
        .gdone{width:100%;margin-top:10px;padding:9px;border:none;border-radius:10px;background:#5C6F4E;color:#fff;font-size:.84rem;font-weight:700;cursor:pointer}
        .gdone:hover{background:#4a5b3f}
        .sf-btn{height:46px;padding:0 26px;background:linear-gradient(135deg,#5C6F4E,#4a5b3f);color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;transition:all .2s;box-shadow:0 4px 14px rgba(92,111,78,.3);white-space:nowrap}
        .sf-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(92,111,78,.4)}
        .sf-btn:disabled{opacity:.6;cursor:not-allowed}
        .sf-btn .spinner-border{width:16px;height:16px;border-width:2px}
        @media(max-width:992px){.sf-r{flex-wrap:wrap}.sf-g.br{flex:1 1 100%}.sf-g.dt{flex:1 1 100%;min-width:0}.sf-g.gu{flex:1 1 calc(50% - 5px)}.sf-g.ac{flex:1 1 calc(50% - 5px)}}
        @media(max-width:576px){.sf{padding:18px 14px 16px}.sf-g.gu,.sf-g.ac{flex:1 1 100%}}
      `}</style>

      <div className="sf" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" && !guestOpen && !calOpen) { e.preventDefault(); handleSubmit(e); } }}>
        <form onSubmit={handleSubmit}>
          <div className="sf-r">
            {/* Branch */}
            <div className="sf-g br">
              <span className="sf-l"><i className="bi bi-geo-alt-fill"></i>Branch</span>
              <div className="sf-w">
                <i className="bi bi-geo-alt-fill si"></i>
                <select className="sf-sel" value={branchId || ""} onChange={(e) => onBranchChange(e.target.value ? parseInt(e.target.value) : "")}>
                  <option value="">All Branches</option>
                  {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                </select>
              </div>
            </div>

            {/* Check-in / Check-out */}
            <div className="sf-g dt" ref={calRef}>
              <span className="sf-l"><i className="bi bi-calendar-event"></i>Check-in &amp; Check-out</span>
              <div className="sf-dr">
                <div className={`sf-db${calOpen === "checkin" ? " active" : ""}`} onClick={() => { setCalOpen(calOpen === "checkin" ? null : "checkin"); setGuestOpen(false); }}>
                  <i className="bi bi-box-arrow-in-right di"></i>
                  <div><div className="dm">{fmtDate(sp.checkIn).main}</div><div className="ds">{fmtDate(sp.checkIn).sub}</div></div>
                </div>
                <div className="sf-nb">{nights()} night{nights() !== 1 ? 's' : ''}</div>
                <div className={`sf-db${calOpen === "checkout" ? " active" : ""}`} onClick={() => { setCalOpen(calOpen === "checkout" ? null : "checkout"); setGuestOpen(false); }}>
                  <i className="bi bi-box-arrow-right di"></i>
                  <div><div className="dm">{fmtDate(sp.checkOut).main}</div><div className="ds">{fmtDate(sp.checkOut).sub}</div></div>
                </div>
              </div>

              {/* Custom Calendar Dropdown */}
              {calOpen === "checkin" && (
                <CalendarDropdown
                  value={sp.checkIn}
                  minDate={today}
                  onSelect={(val) => {
                    handleSelectCheckIn(val);
                    // Auto-open checkout calendar after selecting check-in
                    setTimeout(() => setCalOpen("checkout"), 100);
                  }}
                  onClose={() => {}}
                />
              )}
              {calOpen === "checkout" && (
                <CalendarDropdown
                  value={sp.checkOut}
                  minDate={checkOutMin}
                  onSelect={handleSelectCheckOut}
                  onClose={() => setCalOpen(null)}
                />
              )}
            </div>

            {/* Guests */}
            <div className="sf-g gu" ref={gRef}>
              <span className="sf-l"><i className="bi bi-people-fill"></i>Guests</span>
              <div className="sf-w">
                <i className="bi bi-people-fill si"></i>
                <div className={`gt ${guestOpen?"op":""}`} onClick={() => { setGuestOpen(!guestOpen); setCalOpen(null); }}>
                  {guestText()}<i className="bi bi-chevron-down ch"></i>
                </div>
              </div>
              {guestOpen && (
                <div className="gdd">
                  <div className="gr">
                    <div><div className="grl">Adults</div><div className="grh">Ages 13 and above</div></div>
                    <div className="gc">
                      <button type="button" className="gb" onClick={() => adj("adults",-1)} disabled={sp.adults<=1}>−</button>
                      <span className="gv">{sp.adults}</span>
                      <button type="button" className="gb" onClick={() => adj("adults",1)} disabled={sp.adults>=6}>+</button>
                    </div>
                  </div>
                  <div className="gr">
                    <div><div className="grl">Children</div><div className="grh">Ages 0 – 12</div></div>
                    <div className="gc">
                      <button type="button" className="gb" onClick={() => adj("children",-1)} disabled={sp.children<=0}>−</button>
                      <span className="gv">{sp.children}</span>
                      <button type="button" className="gb" onClick={() => adj("children",1)} disabled={sp.children>=4}>+</button>
                    </div>
                  </div>
                  <button type="button" className="gdone" onClick={() => setGuestOpen(false)}>Done</button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="sf-g ac">
              <span className="sf-l">&nbsp;</span>
              <button type="submit" className="sf-btn" disabled={loading}>
                {loading
                  ? <><span className="spinner-border" role="status"></span><span>Searching...</span></>
                  : <><i className="bi bi-search"></i><span>Search</span></>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default SearchForm;
