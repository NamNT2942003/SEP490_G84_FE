import { useState, useRef, useEffect } from "react";

const SearchForm = ({ onSearch, loading, branches = [], branchId, onBranchChange }) => {
  const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const now = new Date(); now.setHours(0,0,0,0);
  const today = fmtYmd(now);
  const tom = new Date(now); tom.setDate(now.getDate()+1);
  const tomorrow = fmtYmd(tom);

  const [sp, setSp] = useState({ checkIn: today, checkOut: tomorrow, adults: 1, children: 0 });

  // guest picker
  const [guestOpen, setGuestOpen] = useState(false);
  const gRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (gRef.current && !gRef.current.contains(e.target)) setGuestOpen(false); };
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sp.checkIn || !sp.checkOut) { alert("Please select check-in and check-out dates"); return; }
    if (sp.checkOut <= sp.checkIn) { alert("Check-out date must be after check-in date"); return; }
    onSearch(sp);
  };

  return (
    <>
      <style>{`
        .sf{background:#fff;border-radius:18px;padding:24px 28px 20px;box-shadow:0 8px 40px rgba(0,0,0,.10);position:relative;overflow:visible}
        .sf-r{display:flex;align-items:flex-end;gap:10px;flex-wrap:nowrap}
        .sf-g{display:flex;flex-direction:column;min-width:0}
        .sf-g.br{flex:0 0 175px}
        .sf-g.dt{flex:1 1 auto;min-width:320px}
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

      <div className="sf" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" && !guestOpen) { e.preventDefault(); handleSubmit(e); } }}>
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
            <div className="sf-g dt">
              <span className="sf-l"><i className="bi bi-calendar-event"></i>Check-in &amp; Check-out</span>
              <div className="sf-dr">
                <div className="sf-db" onClick={() => { const el = document.getElementById("hci"); el.showPicker ? el.showPicker() : el.focus(); }}>
                  <i className="bi bi-box-arrow-in-right di"></i>
                  <div><div className="dm">{fmtDate(sp.checkIn).main}</div><div className="ds">{fmtDate(sp.checkIn).sub}</div></div>
                  <input type="date" id="hci" value={sp.checkIn} min={today}
                    onChange={(e) => setSp(p => {
                      const ci = e.target.value; let co = p.checkOut;
                      if (co && co <= ci) { const d = new Date(ci); d.setDate(d.getDate()+1); co = fmtYmd(d); }
                      return { ...p, checkIn: ci, checkOut: co };
                    })}
                    style={{ position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none" }}
                  />
                </div>
                <div className="sf-nb">{nights()} night{nights() !== 1 ? 's' : ''}</div>
                <div className="sf-db" onClick={() => { const el = document.getElementById("hco"); el.showPicker ? el.showPicker() : el.focus(); }}>
                  <i className="bi bi-box-arrow-right di"></i>
                  <div><div className="dm">{fmtDate(sp.checkOut).main}</div><div className="ds">{fmtDate(sp.checkOut).sub}</div></div>
                  <input type="date" id="hco" value={sp.checkOut} min={(() => { if (!sp.checkIn) return today; const d = new Date(sp.checkIn); d.setDate(d.getDate()+1); return fmtYmd(d); })()}
                    onChange={(e) => setSp(p => ({ ...p, checkOut: e.target.value }))}
                    style={{ position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none" }}
                  />
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="sf-g gu" ref={gRef}>
              <span className="sf-l"><i className="bi bi-people-fill"></i>Guests</span>
              <div className="sf-w">
                <i className="bi bi-people-fill si"></i>
                <div className={`gt ${guestOpen?"op":""}`} onClick={() => setGuestOpen(!guestOpen)}>
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
