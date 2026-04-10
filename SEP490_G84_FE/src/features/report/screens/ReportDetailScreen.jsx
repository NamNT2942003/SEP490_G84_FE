/**
 * ReportDetailScreen.jsx
 * Route: /report/detail/:category   (?year=2026)
 * category = 'room' | 'service' | 'expense'
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { reportApi } from '../api/reportApi';
import 'bootstrap/dist/css/bootstrap.min.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const BRANCH_COLORS = ['#4f81ff', '#20c997', '#fd7e14', '#e83e8c', '#6f42c1', '#198754'];

const CATEGORIES = {
    room: {
        label: 'Room Revenue', icon: 'bi-door-open',
        color: '#4f81ff', mainKey: 'totalRevenue', trendKey: 'revenue', accent: '#e8eeff',
    },
    service: {
        label: 'Service Revenue', icon: 'bi-bag-check',
        color: '#20c997', mainKey: 'serviceRevenue', trendKey: 'serviceRevenue', accent: '#e6faf5',
    },
    expense: {
        label: 'Operating Expense', icon: 'bi-receipt',
        color: '#fd7e14', mainKey: 'totalExpense', trendKey: 'expense', accent: '#fff3e6',
    },
};

const MONTH_LABELS = ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12'];
const fmt  = v => new Intl.NumberFormat('vi-VN').format(v || 0);
const fmtM = v => {
    if (!v && v !== 0) return '0';
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
    return String(v);
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 6px 20px rgba(0,0,0,.1)' }}>
            <p className="fw-bold text-dark mb-1" style={{ fontSize: '0.83rem' }}>{label || payload[0]?.name}</p>
            {payload.map((e, i) => (
                <div key={i} className="d-flex align-items-center gap-2">
                    <span style={{ width: 9, height: 9, background: e.fill || e.color || e.stroke, borderRadius: '50%', flexShrink: 0 }} />
                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{e.name}:</span>
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>{fmt(e.value)} đ</span>
                </div>
            ))}
        </div>
    );
};

// ─── Room Lower Panel (Occ% & ADR) ───────────────────────────────────────────
const RoomLowerPanel = ({ rankingList, viewMode }) => (
    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
        <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>OCCUPANCY % &amp; ADR</h6>

        <p className="fw-semibold text-dark mb-2" style={{ fontSize: '0.82rem' }}>
            Occupancy Rate {viewMode === 'yearly' && <span className="text-muted fw-normal" style={{ fontSize: '0.78rem' }}>(yearly avg)</span>}
        </p>
        {rankingList.map((b, i) => (
            <div key={`occ-${b.branchId}`} className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                    <span className="text-secondary" style={{ fontSize: '0.79rem' }}>{b.branchName}</span>
                    <span className="fw-bold text-dark" style={{ fontSize: '0.79rem' }}>{(b.occupancyRate || 0).toFixed(2)}%</span>
                </div>
                <div className="progress" style={{ height: 7, borderRadius: 4 }}>
                    <div className="progress-bar"
                        style={{ width: `${Math.min(b.occupancyRate || 0, 100)}%`, backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length], borderRadius: 4 }} />
                </div>
            </div>
        ))}

        <p className="fw-semibold text-dark mb-2 mt-3" style={{ fontSize: '0.82rem' }}>
            ADR (₫/night) {viewMode === 'yearly' && <span className="text-muted fw-normal" style={{ fontSize: '0.78rem' }}>(yearly avg)</span>}
        </p>
        {rankingList.map((b, i) => {
            const adrVal = b.adr?.value || b.adr || 0;
            const maxAdr = Math.max(...rankingList.map(x => x.adr?.value || x.adr || 0), 1);
            return (
                <div key={`adr-${b.branchId}`} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary" style={{ fontSize: '0.79rem' }}>{b.branchName}</span>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.79rem' }}>{fmtM(adrVal)}</span>
                    </div>
                    <div className="progress" style={{ height: 7, borderRadius: 4 }}>
                        <div className="progress-bar"
                            style={{ width: `${Math.min(adrVal / maxAdr * 100, 100)}%`, backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length], borderRadius: 4 }} />
                    </div>
                </div>
            );
        })}
    </div>
);

// ─── Service Lower Panel ──────────────────────────────────────────────────────
const ServiceLowerPanel = ({ rankingList, branches, viewMode, selectedMonth, selectedYear, yearlyTrends }) => {
    const [branchDetails, setBranchDetails] = useState({});
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        if (viewMode !== 'monthly' || !branches.length) return;
        setDetailLoading(true);
        Promise.all(
            branches.map(b =>
                reportApi.getMonthlyServiceRevenue(b.branchId, selectedMonth, selectedYear)
                    .then(items => ({ branchId: b.branchId, branchName: b.branchName, items: items || [] }))
                    .catch(() => ({ branchId: b.branchId, branchName: b.branchName, items: [] }))
            )
        ).then(results => {
            const map = {};
            results.forEach(r => { map[r.branchId] = r; });
            setBranchDetails(map);
        }).finally(() => setDetailLoading(false));
    }, [branches, viewMode, selectedMonth, selectedYear]);

    if (viewMode === 'monthly') {
        /* Monthly: per-branch service item breakdown */
        return (
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                    CHI TIẾT DỊCH VỤ THEO CƠ SỞ — T{selectedMonth}/{selectedYear}
                </h6>
                {detailLoading ? (
                    <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-success" /></div>
                ) : (
                    <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                        {rankingList.map((b, idx) => {
                            const detail = branchDetails[b.branchId];
                            const items = detail?.items || [];
                            const total = items.reduce((s, it) => s + (it.amount || 0), 0);
                            return (
                                <div key={b.branchId} className="mb-4">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                            style={{ width: 22, height: 22, fontSize: '0.72rem', backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length] }}>
                                            {idx + 1}
                                        </span>
                                        <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>{b.branchName}</span>
                                        <span className="ms-auto fw-bold" style={{ fontSize: '0.82rem', color: '#20c997' }}>{fmt(b.serviceRevenue)} đ</span>
                                    </div>
                                    {items.length > 0 ? (
                                        <div className="ps-4">
                                            {items.map((it, ii) => {
                                                const pct = total > 0 ? (it.amount / total * 100).toFixed(0) : 0;
                                                return (
                                                    <div key={ii} className="mb-2">
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="text-secondary" style={{ fontSize: '0.77rem' }}>{it.category || `Service ${ii + 1}`}{it.usageCount ? ` (×${it.usageCount})` : ''}</span>
                                                            <span className="fw-semibold" style={{ fontSize: '0.77rem', color: '#20c997' }}>{fmt(it.amount)} đ</span>
                                                        </div>
                                                        <div className="progress" style={{ height: 5, borderRadius: 4 }}>
                                                            <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length], borderRadius: 4 }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="ps-4 text-muted mb-0" style={{ fontSize: '0.77rem' }}>No service data available</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    /* Yearly: month-by-month service revenue per branch — mini horizontal progress */
    const maxService = Math.max(...rankingList.map(b => b.serviceRevenue || 0), 1);
    return (
        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                DOANH THU DỊCH VỤ TỪNG CƠ SỞ — NĂM {selectedYear}
            </h6>
            {rankingList.map((b, i) => (
                <div key={b.branchId} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary" style={{ fontSize: '0.79rem' }}>{b.branchName}</span>
                        <span className="fw-bold" style={{ fontSize: '0.79rem', color: '#20c997' }}>{fmtM(b.serviceRevenue || 0)}</span>
                    </div>
                    <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                        <div className="progress-bar"
                            style={{ width: `${Math.min((b.serviceRevenue || 0) / maxService * 100, 100)}%`, backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length], borderRadius: 4 }} />
                    </div>
                </div>
            ))}

            {/* Monthly pivot from yearlyTrends — top 3 service months overall */}
            {yearlyTrends.length > 0 && (
                <>
                    <hr className="my-3" />
                    <p className="fw-semibold text-dark mb-2" style={{ fontSize: '0.82rem' }}>Total service revenue by month (system-wide)</p>
                    {(() => {
                        const byMonth = {};
                        yearlyTrends.forEach(t => {
                            if (!byMonth[t.month]) byMonth[t.month] = 0;
                            byMonth[t.month] += t.serviceRevenue || 0;
                        });
                        const maxM = Math.max(...Object.values(byMonth), 1);
                        return MONTH_LABELS.map((lbl, idx) => {
                            const val = byMonth[idx + 1] || 0;
                            return (
                                <div key={lbl} className="mb-2">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-secondary" style={{ fontSize: '0.77rem' }}>{lbl}</span>
                                        <span className="fw-semibold" style={{ fontSize: '0.77rem', color: '#20c997' }}>{fmtM(val)}</span>
                                    </div>
                                    <div className="progress" style={{ height: 4, borderRadius: 4 }}>
                                        <div className="progress-bar bg-success" style={{ width: `${val / maxM * 100}%`, borderRadius: 4 }} />
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </>
            )}
        </div>
    );
};

// ─── Expense Lower Panel ──────────────────────────────────────────────────────
const ExpenseLowerPanel = ({ rankingList, branches, viewMode, selectedMonth, selectedYear, yearlyTrends }) => {
    const [branchDetails, setBranchDetails] = useState({});
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        if (viewMode !== 'monthly' || !branches.length) return;
        setDetailLoading(true);
        Promise.all(
            branches.map(b =>
                reportApi.getMonthlyExpenses(b.branchId, selectedMonth, selectedYear)
                    .then(items => ({ branchId: b.branchId, items: items || [] }))
                    .catch(() => ({ branchId: b.branchId, items: [] }))
            )
        ).then(results => {
            const map = {};
            results.forEach(r => { map[r.branchId] = r; });
            setBranchDetails(map);
        }).finally(() => setDetailLoading(false));
    }, [branches, viewMode, selectedMonth, selectedYear]);

    if (viewMode === 'monthly') {
        /* Monthly: per-branch expense item breakdown */
        return (
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                    CHI TIẾT CHI PHÍ THEO CƠ SỞ — T{selectedMonth}/{selectedYear}
                </h6>
                {detailLoading ? (
                    <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-warning" /></div>
                ) : (
                    <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                        {rankingList.map((b, idx) => {
                            const detail = branchDetails[b.branchId];
                            const items = detail?.items || [];
                            const total = items.reduce((s, it) => s + (it.amount || 0), 0);
                            return (
                                <div key={b.branchId} className="mb-4">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                            style={{ width: 22, height: 22, fontSize: '0.72rem', backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length] }}>
                                            {idx + 1}
                                        </span>
                                        <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>{b.branchName}</span>
                                        <span className="ms-auto fw-bold" style={{ fontSize: '0.82rem', color: '#fd7e14' }}>{fmt(b.totalExpense)} đ</span>
                                    </div>
                                    {items.length > 0 ? (
                                        <div className="ps-4">
                                            {items.map((it, ii) => {
                                                const pct = total > 0 ? (it.amount / total * 100).toFixed(0) : 0;
                                                return (
                                                    <div key={ii} className="mb-2">
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="text-secondary" style={{ fontSize: '0.77rem' }}>{it.category || `Expense ${ii + 1}`}{it.note ? ` — ${it.note}` : ''}</span>
                                                            <span className="fw-semibold" style={{ fontSize: '0.77rem', color: '#fd7e14' }}>{fmt(it.amount)} đ</span>
                                                        </div>
                                                        <div className="progress" style={{ height: 5, borderRadius: 4 }}>
                                                            <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length], borderRadius: 4 }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="ps-4 text-muted mb-0" style={{ fontSize: '0.77rem' }}>No expense data available</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    /* Yearly: per-branch expense bar + monthly pivot */
    const maxExp = Math.max(...rankingList.map(b => b.totalExpense || 0), 1);
    return (
        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                CHI PHÍ TỪNG CƠ SỞ — NĂM {selectedYear}
            </h6>
            {rankingList.map((b, i) => (
                <div key={b.branchId} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary" style={{ fontSize: '0.79rem' }}>{b.branchName}</span>
                        <span className="fw-bold" style={{ fontSize: '0.79rem', color: '#fd7e14' }}>{fmtM(b.totalExpense || 0)}</span>
                    </div>
                    <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                        <div className="progress-bar"
                            style={{ width: `${Math.min((b.totalExpense || 0) / maxExp * 100, 100)}%`, backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length], borderRadius: 4 }} />
                    </div>
                </div>
            ))}

            {yearlyTrends.length > 0 && (
                <>
                    <hr className="my-3" />
                    <p className="fw-semibold text-dark mb-2" style={{ fontSize: '0.82rem' }}>Total expenses by month (system-wide)</p>
                    {(() => {
                        const byMonth = {};
                        yearlyTrends.forEach(t => {
                            if (!byMonth[t.month]) byMonth[t.month] = 0;
                            byMonth[t.month] += t.expense || 0;
                        });
                        const maxM = Math.max(...Object.values(byMonth), 1);
                        return MONTH_LABELS.map((lbl, idx) => {
                            const val = byMonth[idx + 1] || 0;
                            return (
                                <div key={lbl} className="mb-2">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-secondary" style={{ fontSize: '0.77rem' }}>{lbl}</span>
                                        <span className="fw-semibold" style={{ fontSize: '0.77rem', color: '#fd7e14' }}>{fmtM(val)}</span>
                                    </div>
                                    <div className="progress" style={{ height: 4, borderRadius: 4 }}>
                                        <div className="progress-bar" style={{ width: `${val / maxM * 100}%`, backgroundColor: '#fd7e14', borderRadius: 4 }} />
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </>
            )}
        </div>
    );
};

// ─── KPI Section ─────────────────────────────────────────────────────────────
const KpiSection = ({ category, cat, activeSummaries, viewMode, selectedYear, selectedMonth, branches }) => {
    const totalVal  = activeSummaries.reduce((s, b) => s + (b[cat.mainKey] || 0), 0);
    const avgVal    = activeSummaries.length ? totalVal / activeSummaries.length : 0;
    const topBranch = [...activeSummaries].sort((a, b) => (b[cat.mainKey] || 0) - (a[cat.mainKey] || 0))[0];

    if (category === 'room') {
        const sysAvgOcc = activeSummaries.length ? activeSummaries.reduce((s, b) => s + (b.occupancyRate || 0), 0) / activeSummaries.length : 0;
        const sysAvgAdr = activeSummaries.length ? activeSummaries.reduce((s, b) => s + (b.adr || 0), 0) / activeSummaries.length : 0;
        const sysGuests = activeSummaries.reduce((s, b) => s + (b.totalStandardGuests || 0), 0);
        return (
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: cat.accent }}>
                        <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>TOTAL {cat.label.toUpperCase()} (SYSTEM)</p>
                        <h3 className="fw-bold text-dark mb-0">{fmt(totalVal)} đ</h3>
                    </div>
                </div>
                <div className="col-12 col-md">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>AVG OCCUPANCY</p>
                        <h3 className="fw-bold text-dark mb-0">{sysAvgOcc.toFixed(1)}%</h3>
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem' }}>{viewMode === 'monthly' ? `Avg across ${branches.length} branches` : 'Full-year avg'}</p>
                    </div>
                </div>
                <div className="col-12 col-md">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>AVG ADR</p>
                        <h3 className="fw-bold text-dark mb-0">{fmt(sysAvgAdr)} đ</h3>
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem' }}>{viewMode === 'monthly' ? 'Rate per night' : 'Avg rate per night'}</p>
                    </div>
                </div>
                <div className="col-12 col-md">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>TOTAL GUESTS</p>
                        <h3 className="fw-bold text-dark mb-0">{fmt(sysGuests)}</h3>
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem' }}>{viewMode === 'monthly' ? 'Standard guests' : `Full-year ${selectedYear}`}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (category === 'service') {
        return (
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: cat.accent }}>
                        <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>TOTAL SERVICE REVENUE</p>
                        <h3 className="fw-bold" style={{ color: cat.color }}>{fmt(totalVal)} đ</h3>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{viewMode === 'monthly' ? `M${selectedMonth}/${selectedYear}` : `Year ${selectedYear}`}</p>
                    </div>
                </div>
                <div className="col-12 col-md">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>AVG / BRANCH</p>
                        <h3 className="fw-bold text-dark mb-0">{fmt(Math.round(avgVal))} đ</h3>
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem' }}>{branches.length} branches</p>
                    </div>
                </div>
                <div className="col-12 col-md">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>TOP BRANCH</p>
                        <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>{topBranch?.branchName || '—'}</h3>
                        <p className="fw-semibold mb-0 mt-1" style={{ fontSize: '0.82rem', color: cat.color }}>{fmt(topBranch?.[cat.mainKey] || 0)} đ</p>
                    </div>
                </div>
            </div>
        );
    }

    // expense
    return (
        <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ backgroundColor: cat.accent }}>
                    <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>TOTAL OPERATING EXPENSE</p>
                    <h3 className="fw-bold" style={{ color: cat.color }}>{fmt(totalVal)} đ</h3>
                    <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{viewMode === 'monthly' ? `M${selectedMonth}/${selectedYear}` : `Year ${selectedYear}`}</p>
                </div>
            </div>
            <div className="col-12 col-md">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                    <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>AVG / BRANCH</p>
                    <h3 className="fw-bold text-dark mb-0">{fmt(Math.round(avgVal))} đ</h3>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.8rem' }}>{branches.length} branches</p>
                </div>
            </div>
            <div className="col-12 col-md">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                    <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>HIGHEST COST BRANCH</p>
                    <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>{topBranch?.branchName || '—'}</h3>
                    <p className="fw-semibold mb-0 mt-1" style={{ fontSize: '0.82rem', color: cat.color }}>{fmt(topBranch?.[cat.mainKey] || 0)} đ</p>
                </div>
            </div>
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const ReportDetailScreen = () => {
    const { category }   = useParams();
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();

    const currentYear  = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [viewMode,      setViewMode]      = useState('monthly');
    const [chartMode,     setChartMode]     = useState('trend');
    const [selectedYear,  setSelectedYear]  = useState(Number(searchParams.get('year') || currentYear));
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const [yearlyData,   setYearlyData]   = useState(null);
    const [monthlyData,  setMonthlyData]  = useState(null);
    const [branches,     setBranches]     = useState([]);
    const [loading,      setLoading]      = useState(false);

    const cat    = CATEGORIES[category] || CATEGORIES.room;
    const years  = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    useEffect(() => {
        reportApi.getReportBranches().then(d => setBranches(d || [])).catch(console.error);
    }, []);

    // Always fetch yearly (trend chart + yearly view KPIs)
    useEffect(() => {
        if (!branches.length) return;
        setLoading(true);
        reportApi.getYearlyMultiBranchDashboard(branches.map(b => b.branchId), selectedYear)
            .then(setYearlyData).catch(console.error).finally(() => setLoading(false));
    }, [branches, selectedYear]);

    // Monthly data only when in monthly mode
    useEffect(() => {
        if (!branches.length || viewMode !== 'monthly') return;
        reportApi.getMultiBranchDashboard(branches.map(b => b.branchId), selectedMonth, selectedYear)
            .then(setMonthlyData).catch(console.error);
    }, [branches, selectedMonth, selectedYear, viewMode]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const yearlyTrends     = yearlyData?.monthlyTrends    || [];
    const yearlySummaries  = yearlyData?.branchSummaries  || [];
    const monthlySummaries = monthlyData?.branchSummaries || [];
    const activeSummaries  = viewMode === 'monthly' ? monthlySummaries : yearlySummaries;

    // 12-month area chart (always yearly trend)
    const trendData = (() => {
        const map = {};
        MONTH_LABELS.forEach((name, i) => { map[i + 1] = { name, sortKey: i + 1 }; });
        yearlyTrends.forEach(t => { if (map[t.month]) map[t.month][t.branchName] = t[cat.trendKey] || 0; });
        return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
    })();

    const compareData = yearlySummaries.map(b => ({ name: b.branchName, [cat.label]: b[cat.mainKey] || 0 }));

    // Donut + ranking always from activeSummaries
    const totalVal    = activeSummaries.reduce((s, b) => s + (b[cat.mainKey] || 0), 0);
    const pieData     = activeSummaries.filter(b => (b[cat.mainKey] || 0) > 0).map(b => ({ name: b.branchName, value: b[cat.mainKey] || 0 }));
    const pieTotal    = pieData.reduce((s, d) => s + d.value, 0);
    const rankingList = [...activeSummaries].sort((a, b) => (b[cat.mainKey] || 0) - (a[cat.mainKey] || 0));

    const periodLabel = viewMode === 'monthly' ? `M${selectedMonth}/${selectedYear}` : `Year ${selectedYear}`;

    return (
        <div className="container-fluid p-0 pb-5" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="bg-white shadow-sm border-bottom px-4 pt-3 pb-0">

                {/* Row 1: breadcrumb + title + monthly/yearly toggle */}
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <button className="btn btn-sm btn-outline-secondary px-3 fw-semibold rounded-3 py-1"
                                onClick={() => navigate('/report/multi-branch')}>
                                <i className="bi bi-arrow-left me-1" />Multi-Branch Report
                            </button>
                            <span className="text-secondary" style={{ fontSize: '0.78rem' }}>›</span>
                            <span className="fw-semibold" style={{ color: cat.color, fontSize: '0.83rem' }}>
                                <i className={`bi ${cat.icon} me-1`} />{cat.label}
                            </span>
                        </div>
                        <p className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.71rem', letterSpacing: '1px' }}>HỆ THỐNG KHÁCH SẠN</p>
                        <h2 className="fw-bold text-dark m-0">Báo cáo {cat.label} đa cơ sở</h2>
                    </div>

                    {/* Monthly / Yearly toggle */}
                    <div className="d-flex align-items-center gap-2 pt-1">
                        <div className="btn-group shadow-sm">
                            <button className={`btn fw-semibold px-4 ${viewMode === 'monthly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setViewMode('monthly')}>
                                <i className="bi bi-calendar-month me-2" />Monthly
                            </button>
                            <button className={`btn fw-semibold px-4 ${viewMode === 'yearly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setViewMode('yearly')}>
                                <i className="bi bi-calendar-range me-2" />Yearly
                            </button>
                        </div>
                    </div>
                </div>

                {/* Row 2: month pills (monthly only) + year selector */}
                <div className="d-flex flex-wrap align-items-center gap-3 pb-3 border-bottom">
                    {viewMode === 'monthly' && (
                        <div className="d-flex flex-wrap gap-1">
                            {months.map(m => (
                                <button key={m}
                                    className={`btn btn-sm fw-semibold px-2 py-1 ${selectedMonth === m ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                    style={{ borderRadius: 7, minWidth: 36, fontSize: '0.77rem' }}
                                    onClick={() => setSelectedMonth(m)}>
                                    M{m}
                                </button>
                            ))}
                        </div>
                    )}
                    <select className="form-select fw-semibold border-secondary shadow-sm"
                        style={{ borderRadius: 8, width: 115 }}
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Content ─────────────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" style={{ width: '2.8rem', height: '2.8rem' }} />
                    <p className="mt-3 text-secondary fw-semibold">Loading data...</p>
                </div>
            ) : (
                <div className="px-4 pt-4">

                    {/* ── KPI Cards (category-aware) ─────────────────────── */}
                    <KpiSection
                        category={category}
                        cat={cat}
                        activeSummaries={activeSummaries}
                        viewMode={viewMode}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        branches={branches}
                    />

                    {/* ── Chart toggle ──────────────────────────────────────── */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="btn-group shadow-sm">
                            <button className={`btn btn-sm fw-semibold px-4 ${chartMode === 'trend' ? 'btn-dark' : 'btn-outline-secondary'}`}
                                onClick={() => setChartMode('trend')}>
                                <i className="bi bi-graph-up me-2" />Trend {selectedYear}
                            </button>
                            <button className={`btn btn-sm fw-semibold px-4 ${chartMode === 'compare' ? 'btn-dark' : 'btn-outline-secondary'}`}
                                onClick={() => setChartMode('compare')}>
                                <i className="bi bi-bar-chart-line me-2" />Branch Comparison
                            </button>
                        </div>
                    </div>

                    {/* ── Main chart + donut ────────────────────────────────── */}
                    <div className="row g-4 mb-4">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <h6 className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                                    {chartMode === 'trend'
                                        ? `${cat.label.toUpperCase()} — XU HƯỚNG NĂM ${selectedYear}`
                                        : `SO SÁNH ${cat.label.toUpperCase()} GIỮA CÁC CƠ SỞ`}
                                </h6>
                                <div style={{ height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartMode === 'trend' ? (
                                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                <defs>
                                                    {branches.map((b, idx) => (
                                                        <linearGradient key={b.branchId} id={`g${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%"  stopColor={BRANCH_COLORS[idx % BRANCH_COLORS.length]} stopOpacity={0.28} />
                                                            <stop offset="95%" stopColor={BRANCH_COLORS[idx % BRANCH_COLORS.length]} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                                                <YAxis axisLine={false} tickLine={false} tickFormatter={fmtM} tick={{ fill: '#888', fontSize: 11 }} width={55} />
                                                <Tooltip content={<Tip />} />
                                                <Legend iconType="square" verticalAlign="top" wrapperStyle={{ paddingBottom: 12, fontSize: '0.8rem' }} />
                                                {branches.map((b, idx) => (
                                                    <Area key={b.branchId} type="monotone" dataKey={b.branchName}
                                                        stroke={BRANCH_COLORS[idx % BRANCH_COLORS.length]} strokeWidth={2.5}
                                                        fill={`url(#g${idx})`}
                                                        dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: BRANCH_COLORS[idx % BRANCH_COLORS.length] }}
                                                        activeDot={{ r: 5 }} />
                                                ))}
                                            </AreaChart>
                                        ) : (
                                            <BarChart data={compareData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                                                <YAxis axisLine={false} tickLine={false} tickFormatter={fmtM} tick={{ fill: '#888', fontSize: 11 }} width={55} />
                                                <Tooltip content={<Tip />} />
                                                <Bar dataKey={cat.label} radius={[6, 6, 0, 0]} maxBarSize={72}>
                                                    {compareData.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Donut */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                <h6 className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                                    TỈ TRỌNG — {periodLabel}
                                </h6>
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="48%" innerRadius={68} outerRadius={102}
                                                paddingAngle={3} dataKey="value" stroke="none">
                                                {pieData.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip content={<Tip />} />
                                            <Legend iconType="square" verticalAlign="bottom" wrapperStyle={{ fontSize: '0.78rem', paddingTop: 8 }}
                                                formatter={(v, e) => {
                                                    const pct = pieTotal > 0 ? (e.payload.value / pieTotal * 100).toFixed(0) : 0;
                                                    return <span className="text-secondary">{v} {pct}%</span>;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-100 d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 200 }}>
                                        No data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Lower Row: Category-specific panel + Ranking ──── */}
                    <div className="row g-4 mb-4">

                        {/* Left: category-specific breakdown panel */}
                        <div className="col-lg-5">
                            {category === 'room' && (
                                <RoomLowerPanel rankingList={rankingList} viewMode={viewMode} />
                            )}
                            {category === 'service' && (
                                <ServiceLowerPanel
                                    rankingList={rankingList}
                                    branches={branches}
                                    viewMode={viewMode}
                                    selectedMonth={selectedMonth}
                                    selectedYear={selectedYear}
                                    yearlyTrends={yearlyTrends}
                                />
                            )}
                            {category === 'expense' && (
                                <ExpenseLowerPanel
                                    rankingList={rankingList}
                                    branches={branches}
                                    viewMode={viewMode}
                                    selectedMonth={selectedMonth}
                                    selectedYear={selectedYear}
                                    yearlyTrends={yearlyTrends}
                                />
                            )}
                        </div>

                        {/* Right: Ranking */}
                        <div className="col-lg-7">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                                        RANKING — {periodLabel}
                                    </h6>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>Total: {fmt(totalVal)} đ</span>
                                        <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                                            <i className="bi bi-cursor me-1" />Click for details
                                        </span>
                                    </div>
                                </div>
                                {rankingList.map((b, i) => {
                                    const val = b[cat.mainKey] || 0;
                                    const pct = totalVal > 0 ? (val / totalVal * 100).toFixed(0) : 0;
                                    const mom = b.momGrowth;
                                    const aggregatedUrl = `/report/aggregated?branchId=${b.branchId}&year=${selectedYear}&month=${selectedMonth}`;
                                    return (
                                        <div key={b.branchId}
                                            className="d-flex align-items-center gap-3 py-3 border-bottom"
                                            style={{ cursor: 'pointer', borderRadius: 8, margin: '0 -8px', padding: '12px 8px', transition: 'background .15s' }}
                                            onClick={() => navigate(aggregatedUrl)}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                                        >
                                            <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
                                                style={{ width: 36, height: 36, backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <div className="fw-semibold text-dark text-truncate mb-1" style={{ fontSize: '0.87rem' }}>{b.branchName}</div>
                                                <div className="progress" style={{ height: 5, borderRadius: 4 }}>
                                                    <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length], borderRadius: 4 }} />
                                                </div>
                                            </div>
                                            <div className="text-end flex-shrink-0">
                                                <div className="fw-bold" style={{ fontSize: '0.92rem', color: cat.color }}>{fmt(val)}</div>
                                                {category === 'room' && mom != null && (
                                                    <span className={`badge rounded-pill ${mom >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                                                        style={{ fontSize: '0.71rem' }}>
                                                        {mom >= 0 ? '↑' : '↓'} {Math.abs(mom).toFixed(0)}%
                                                    </span>
                                                )}
                                                {(category === 'service' || category === 'expense') && (
                                                    <span className="text-muted" style={{ fontSize: '0.76rem' }}>{pct}% of system</span>
                                                )}
                                                <div className="text-primary mt-1" style={{ fontSize: '0.71rem', fontWeight: 600 }}>Chi tiết →</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {rankingList.length === 0 && (
                                    <div className="text-center text-muted py-4">No data available</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetailScreen;
