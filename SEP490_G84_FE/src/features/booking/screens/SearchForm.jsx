import { useState, useRef, useEffect } from "react";
import {
    AGE_GROUPS,
    DEFAULT_AGE_GROUP,
    calculateEffectiveAdults,
    countEffectiveChildren,
    countInfants,
    calculatePerRoom,
} from "../utils/childrenAgePolicy.js";

const SearchForm = ({ onSearch, loading, branches = [], branchId, onBranchChange, initialSearchParams }) => {
    const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

    const now = new Date(); now.setHours(0,0,0,0);
    const today = fmtYmd(now);
    const tom = new Date(now); tom.setDate(now.getDate()+1);
    const tomorrow = fmtYmd(tom);

    const [sp, setSp] = useState({
        checkIn: today,
        checkOut: tomorrow,
        adults: 1,
        children: 0,
        roomCount: 1,
        childrenAges: [],      // e.g. ["INFANT", "CHILD"]
    });
    const [validationMessage, setValidationMessage] = useState("");

    // guest picker
    const [guestOpen, setGuestOpen] = useState(false);
    const gRef = useRef(null);
    useEffect(() => {
        const h = (e) => { if (gRef.current && !gRef.current.contains(e.target)) setGuestOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const adj = (f, d) => {
        setValidationMessage("");
        setSp(p => {
            const limits = { adults: [1, 20], children: [0, 10], roomCount: [1, 10] };
            const [mn, mx] = limits[f] || [0, 99];
            const newVal = Math.min(mx, Math.max(mn, p[f] + d));

            if (f === "children") {
                // Adjust childrenAges array to match new count
                let newAges = [...p.childrenAges];
                if (newVal > p.children) {
                    // Adding children — append default age group
                    for (let i = p.children; i < newVal; i++) {
                        newAges.push(DEFAULT_AGE_GROUP);
                    }
                } else {
                    // Removing children — trim from end
                    newAges = newAges.slice(0, newVal);
                }
                return { ...p, [f]: newVal, childrenAges: newAges };
            }
            return { ...p, [f]: newVal };
        });
    };

    const handleChildAgeChange = (index, newGroup) => {
        setValidationMessage("");
        setSp(p => {
            const newAges = [...p.childrenAges];
            newAges[index] = newGroup;
            return { ...p, childrenAges: newAges };
        });
    };

    // Derived values
    // Teen (12+) counts as 1 ADULT, Child (6-11) counts as 1 CHILD, Infant (0-5) = free
    const effectiveAdults = calculateEffectiveAdults(sp.adults, sp.childrenAges);
    const effectiveChildren = countEffectiveChildren(sp.childrenAges);
    const infantCount = countInfants(sp.childrenAges);
    const adultsPerRoom = calculatePerRoom(effectiveAdults, sp.roomCount);
    const childrenPerRoom = calculatePerRoom(effectiveChildren, sp.roomCount);

    const guestText = () => {
        let t = `${sp.adults} adult${sp.adults > 1 ? 's' : ''}`;
        if (sp.children > 0) t += `, ${sp.children} child${sp.children > 1 ? 'ren' : ''}`;
        t += ` · ${sp.roomCount} room${sp.roomCount > 1 ? 's' : ''}`;
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

    const isFirstRun = useRef(true);
    const lastInitialKeyRef = useRef("");
    const getNormalizedSearchParams = (params) => {
        if (!params) return {};
        return Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
        );
    };
    const isSameSearchParams = (nextParams, currentParams) => {
        const keys = ["checkIn", "checkOut", "adults", "children", "roomCount"];
        if (!keys.every((key) => String(nextParams?.[key] ?? "") === String(currentParams?.[key] ?? ""))) return false;
        // Also compare childrenAges arrays
        const nextAges = Array.isArray(nextParams?.childrenAges) ? nextParams.childrenAges : [];
        const currAges = Array.isArray(currentParams?.childrenAges) ? currentParams.childrenAges : [];
        return nextAges.length === currAges.length && nextAges.every((v, i) => v === currAges[i]);
    };
    useEffect(() => {
        if (!initialSearchParams) return;
        const normalized = getNormalizedSearchParams(initialSearchParams);
        const initialKey = JSON.stringify(normalized);
        if (initialKey === lastInitialKeyRef.current) return;
        if (isSameSearchParams(normalized, sp)) return;
        lastInitialKeyRef.current = initialKey;
        setSp((prev) => {
            const next = { ...prev, ...normalized };
            // Ensure childrenAges array is properly restored
            if (Array.isArray(normalized.childrenAges)) {
                next.childrenAges = normalized.childrenAges;
            } else if (next.children > 0 && (!next.childrenAges || next.childrenAges.length !== next.children)) {
                next.childrenAges = Array.from({ length: next.children }, () => DEFAULT_AGE_GROUP);
            }
            return next;
        });
    }, [initialSearchParams]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        if (!sp.checkIn || !sp.checkOut) {
            setValidationMessage("Please select both check-in and check-out dates.");
            return;
        }
        if (sp.checkOut <= sp.checkIn) {
            setValidationMessage("Check-out date must be after check-in date.");
            return;
        }
        setValidationMessage("");

        // Include computed values in search params
        onSearch({
            ...sp,
            effectiveAdults,
            adultsPerRoom,
            childrenPerRoom,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sp]);

    return (
        <>
            <style>{`
        .sf{background:#fff;border-radius:18px;padding:24px 28px 20px;box-shadow:0 8px 40px rgba(0,0,0,.10);position:relative;overflow:visible}
        .sf-r{display:flex;align-items:flex-end;gap:10px;flex-wrap:nowrap}
        .sf-g{display:flex;flex-direction:column;min-width:0}
        .sf-g.br{flex:0 0 220px}
        .sf-g.dt{flex:1 1 auto;min-width:260px}
        .sf-g.gu{flex:0 0 200px;position:relative}
        .sf-g.ac{flex:0 0 auto}
        .sf-l{font-size:.7rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px;display:flex;align-items:center;gap:4px}
        .sf-l i{color:#465c47;font-size:.78rem}
        .sf-w{position:relative}
        .sf-w .si{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#465c47;font-size:.95rem;pointer-events:none;z-index:2}
        .sf-sel{width:100%;height:46px;border:2px solid #e8e8e8;border-radius:10px;background:#fafafa;padding:0 12px 0 38px;font-size:.88rem;font-weight:500;color:#333;cursor:pointer;transition:border-color .2s,box-shadow .2s;appearance:auto}
        .sf-sel:hover{border-color:#ccc;background:#fff}
        .sf-sel:focus{border-color:#465c47;box-shadow:0 0 0 3px rgba(92,111,78,.1);background:#fff;outline:none}
        .sf-dr{display:flex;gap:6px;align-items:stretch}
        .sf-db{flex:1;display:flex;align-items:center;gap:8px;padding:6px 12px;border:2px solid #e8e8e8;border-radius:10px;background:#fafafa;cursor:pointer;transition:border-color .2s;height:46px;position:relative}
        .sf-db:hover{border-color:#ccc;background:#fff}
        .sf-db .di{color:#465c47;font-size:1rem;flex-shrink:0}
        .sf-db .dm{font-size:.82rem;font-weight:600;color:#333;line-height:1.2}
        .sf-db .ds{font-size:.66rem;color:#999}
        .sf-nb{display:flex;align-items:center;justify-content:center;background:#f0f4ec;color:#465c47;border-radius:8px;font-size:.68rem;font-weight:700;padding:4px 8px;white-space:nowrap;height:46px}
        .gt{width:100%;height:46px;border:2px solid #e8e8e8;border-radius:10px;background:#fafafa;padding:0 12px 0 38px;font-size:.85rem;font-weight:500;color:#333;cursor:pointer;transition:border-color .2s;display:flex;align-items:center;user-select:none;position:relative}
        .gt:hover{border-color:#ccc;background:#fff}
        .gt.op{border-color:#465c47;box-shadow:0 0 0 3px rgba(92,111,78,.1);background:#fff}
        .gt .ch{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#999;font-size:.7rem;transition:transform .2s}
        .gt.op .ch{transform:translateY(-50%) rotate(180deg)}
        .gdd{position:absolute;top:calc(100% + 6px);left:0;right:0;min-width:300px;background:#fff;border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.12);z-index:1060;padding:16px 20px;animation:gF .2s}
        @keyframes gF{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .gr{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
        .gr+.gr{border-top:1px solid #f0f0f0}
        .grl{font-size:.9rem;font-weight:600;color:#333}
        .grh{font-size:.72rem;color:#999}
        .gc{display:flex;align-items:center;gap:12px}
        .gb{width:32px;height:32px;border:2px solid #ddd;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#465c47;cursor:pointer;transition:all .15s;padding:0}
        .gb:hover:not(:disabled){border-color:#465c47;background:rgba(92,111,78,.06)}
        .gb:disabled{border-color:#eee;color:#ccc;cursor:not-allowed}
        .gv{font-size:1rem;font-weight:700;color:#222;min-width:18px;text-align:center}
        .gdone{width:100%;margin-top:10px;padding:9px;border:none;border-radius:10px;background:#465c47;color:#fff;font-size:.84rem;font-weight:700;cursor:pointer}
        .gdone:hover{background:#384a39}
        .sf-btn{height:46px;padding:0 26px;background:linear-gradient(135deg,#465c47,#384a39);color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;transition:all .2s;box-shadow:0 4px 14px rgba(92,111,78,.3);white-space:nowrap}
        .sf-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(92,111,78,.4)}
        .sf-btn:disabled{opacity:.6;cursor:not-allowed}
        .sf-btn .spinner-border{width:16px;height:16px;border-width:2px}
        .sf-msg{margin-top:10px;font-size:.82rem;font-weight:600;color:#c0392b;display:flex;align-items:center;gap:6px}
        .sf-help{margin-top:8px;font-size:.75rem;color:#6c757d}
        .child-age-row{display:flex;align-items:center;gap:8px;margin-top:6px;padding:4px 0}
        .child-age-label{font-size:.78rem;font-weight:600;color:#555;min-width:55px}
        .child-age-select{flex:1;height:32px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fafafa;font-size:.78rem;font-weight:500;color:#333;padding:0 8px;cursor:pointer;transition:border-color .2s}
        .child-age-select:focus{border-color:#465c47;outline:none;box-shadow:0 0 0 2px rgba(92,111,78,.1)}
        .child-age-equiv{font-size:.68rem;color:#718096;font-weight:600;min-width:42px;text-align:right}
        .occupancy-summary{margin-top:10px;padding:10px 12px;background:linear-gradient(135deg,#f0f4ec,#e8ede4);border-radius:10px;border:1px solid #d4dcc8}
        .occupancy-summary .os-title{font-size:.72rem;font-weight:700;color:#465c47;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;display:flex;align-items:center;gap:4px}
        .occupancy-summary .os-line{font-size:.76rem;color:#4a5568;line-height:1.5}
        .occupancy-summary .os-highlight{font-weight:700;color:#2d3748}
        @media(max-width:992px){.sf-r{flex-wrap:wrap}.sf-g.br{flex:1 1 100%}.sf-g.dt{flex:1 1 100%;min-width:0}.sf-g.gu{flex:1 1 calc(50% - 5px)}.sf-g.ac{flex:1 1 calc(50% - 5px)}}
        @media(max-width:576px){.sf{padding:18px 14px 16px}.sf-g.gu,.sf-g.ac{flex:1 1 100%}.gdd{min-width:auto;left:-10px;right:-10px}}
      `}</style>

            <div className="sf" tabIndex={0}>
                <div>
                    <div className="sf-r">
                        {/* Branch */}
                        <div className="sf-g br">
                            <span className="sf-l"><i className="bi bi-geo-alt-fill"></i>Branch</span>
                            <div className="sf-w">
                                <i className="bi bi-geo-alt-fill si"></i>
                                <select className="sf-sel" value={branchId || ""} onChange={(e) => {
                                    setValidationMessage("");
                                    onBranchChange(e.target.value ? parseInt(e.target.value) : "");
                                }}>
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
                                           onChange={(e) => {
                                               setValidationMessage("");
                                               setSp(p => {
                                               const ci = e.target.value; let co = p.checkOut;
                                               if (co && co <= ci) { const d = new Date(ci); d.setDate(d.getDate()+1); co = fmtYmd(d); }
                                               return { ...p, checkIn: ci, checkOut: co };
                                               });
                                           }}
                                           style={{ position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none" }}
                                    />
                                </div>
                                <div className="sf-nb">{nights()} night{nights() !== 1 ? 's' : ''}</div>
                                <div className="sf-db" onClick={() => { const el = document.getElementById("hco"); el.showPicker ? el.showPicker() : el.focus(); }}>
                                    <i className="bi bi-box-arrow-right di"></i>
                                    <div><div className="dm">{fmtDate(sp.checkOut).main}</div><div className="ds">{fmtDate(sp.checkOut).sub}</div></div>
                                    <input type="date" id="hco" value={sp.checkOut} min={(() => { if (!sp.checkIn) return today; const d = new Date(sp.checkIn); d.setDate(d.getDate()+1); return fmtYmd(d); })()}
                                           onChange={(e) => {
                                               setValidationMessage("");
                                               setSp(p => ({ ...p, checkOut: e.target.value }));
                                           }}
                                           style={{ position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Guests & Rooms */}
                        <div className="sf-g gu" ref={gRef}>
                            <span className="sf-l"><i className="bi bi-people-fill"></i>Guests &amp; Rooms</span>
                            <div className="sf-w">
                                <i className="bi bi-people-fill si"></i>
                                <div
                                    className={`gt ${guestOpen?"op":""}`}
                                    onClick={() => setGuestOpen(!guestOpen)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setGuestOpen(!guestOpen);
                                        }
                                    }}
                                >
                                    {guestText()}<i className="bi bi-chevron-down ch"></i>
                                </div>
                            </div>
                            {guestOpen && (
                                <div className="gdd">
                                    {/* Rooms */}
                                    <div className="gr">
                                        <div><div className="grl">Rooms</div><div className="grh">Number of rooms</div></div>
                                        <div className="gc">
                                            <button type="button" className="gb" onClick={() => adj("roomCount",-1)} disabled={sp.roomCount<=1}>−</button>
                                            <span className="gv">{sp.roomCount}</span>
                                            <button type="button" className="gb" onClick={() => adj("roomCount",1)} disabled={sp.roomCount>=10}>+</button>
                                        </div>
                                    </div>
                                    {/* Adults */}
                                    <div className="gr">
                                        <div><div className="grl">Adults</div><div className="grh">Ages 13 and above</div></div>
                                        <div className="gc">
                                            <button type="button" className="gb" onClick={() => adj("adults",-1)} disabled={sp.adults<=1}>−</button>
                                            <span className="gv">{sp.adults}</span>
                                            <button type="button" className="gb" onClick={() => adj("adults",1)} disabled={sp.adults>=20}>+</button>
                                        </div>
                                    </div>
                                    {/* Children */}
                                    <div className="gr" style={{ borderBottom: sp.children > 0 ? "none" : undefined, paddingBottom: sp.children > 0 ? 4 : undefined }}>
                                        <div><div className="grl">Children</div><div className="grh">Ages 0 – 12</div></div>
                                        <div className="gc">
                                            <button type="button" className="gb" onClick={() => adj("children",-1)} disabled={sp.children<=0}>−</button>
                                            <span className="gv">{sp.children}</span>
                                            <button type="button" className="gb" onClick={() => adj("children",1)} disabled={sp.children>=10}>+</button>
                                        </div>
                                    </div>

                                    {/* Age group selector per child */}
                                    {sp.children > 0 && (
                                        <div style={{ paddingBottom: 6 }}>
                                            {sp.childrenAges.map((ageGroup, idx) => {
                                                const group = AGE_GROUPS.find(g => g.key === ageGroup);
                                                const equivLabel = group?.countsAs === "FREE"
                                                    ? "Free"
                                                    : group?.countsAs === "ADULT"
                                                        ? "= 1 adult"
                                                        : "= 1 child";
                                                return (
                                                    <div key={idx} className="child-age-row">
                                                        <span className="child-age-label">Child {idx + 1}:</span>
                                                        <select
                                                            className="child-age-select"
                                                            value={ageGroup}
                                                            onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                                                        >
                                                            {AGE_GROUPS.map(g => (
                                                                <option key={g.key} value={g.key}>{g.label}</option>
                                                            ))}
                                                        </select>
                                                        <span className="child-age-equiv">{equivLabel}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Occupancy Summary */}
                                    <div className="occupancy-summary">
                                        <div className="os-title">
                                            <i className="bi bi-calculator"></i>
                                            Occupancy Summary
                                        </div>
                                        {/* Line 1: Breakdown */}
                                        <div className="os-line">
                                            <span className="os-highlight">{sp.adults}</span> adult{sp.adults > 1 ? "s" : ""}
                                            {sp.children > 0 && (
                                                <> + <span className="os-highlight">{sp.children}</span> child{sp.children > 1 ? "ren" : ""}</>
                                            )}
                                        </div>
                                        {/* Line 2: Conversion annotation */}
                                        {sp.children > 0 && (
                                            <div className="os-line" style={{ fontSize: '.72rem', color: '#718096' }}>
                                                {infantCount > 0 && <span>🍼 {infantCount} infant{infantCount > 1 ? 's' : ''} (free) &nbsp;</span>}
                                                {effectiveChildren > 0 && <span>👶 {effectiveChildren} child{effectiveChildren > 1 ? 'ren' : ''} → MaxChildren &nbsp;</span>}
                                                {effectiveAdults > sp.adults && <span>🧑 {effectiveAdults - sp.adults} teen{(effectiveAdults - sp.adults) > 1 ? 's' : ''} → MaxAdult</span>}
                                            </div>
                                        )}
                                        {/* Line 3: Per-room requirement */}
                                        <div className="os-line">
                                            <span className="os-highlight">{sp.roomCount}</span> room{sp.roomCount > 1 ? "s" : ""}
                                            {" → need ≥ "}
                                            <span className="os-highlight">{adultsPerRoom}</span> MaxAdult
                                            {childrenPerRoom > 0 && (
                                                <> + <span className="os-highlight">{childrenPerRoom}</span> MaxChildren</>
                                            )}
                                            {" per room"}
                                        </div>
                                    </div>

                                    <button type="button" className="gdone" onClick={() => setGuestOpen(false)}>Done</button>
                                </div>
                            )}
                        </div>

                        {/* Removed manual Search button as it auto-searches */}
                    </div>
                    {validationMessage && (
                        <div className="sf-msg" role="alert" aria-live="polite">
                            <i className="bi bi-exclamation-circle"></i>
                            <span>{validationMessage}</span>
                        </div>
                    )}
                    <div className="sf-help">
                        <span>Tip: Select your dates first, then choose guests and rooms to get accurate room availability.</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SearchForm;