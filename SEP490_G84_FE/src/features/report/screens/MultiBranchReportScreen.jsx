import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { reportApi } from '../api/reportApi';
import 'bootstrap/dist/css/bootstrap.min.css';

// ─── Constants ──────────────────────────────────────────────────────────────
const BRANCH_COLORS = ['#4f81ff', '#20c997', '#fd7e14', '#e83e8c', '#6f42c1', '#198754'];

const CATEGORIES = {
    room:    { label: 'Room Revenue',      icon: 'bi-door-open',  color: '#4f81ff', key: 'totalRevenue',   trendKey: 'revenue'        },
    service: { label: 'Service Revenue',   icon: 'bi-bag-check',  color: '#20c997', key: 'serviceRevenue', trendKey: 'serviceRevenue'  },
    expense: { label: 'Operating Expense', icon: 'bi-receipt',    color: '#fd7e14', key: 'totalExpense',   trendKey: 'expense'         },
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt  = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);
const fmtM = (val) => {
    if (!val && val !== 0) return '0';
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + 'B';
    if (val >= 1_000_000)     return (val / 1_000_000).toFixed(1)     + 'M';
    if (val >= 1_000)         return (val / 1_000).toFixed(0)          + 'K';
    return val.toString();
};

// ─── Shared tooltip ──────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
            <p className="fw-bold mb-1 text-dark" style={{ fontSize: '0.83rem' }}>{label || payload[0]?.name}</p>
            {payload.map((e, i) => (
                <div key={i} className="d-flex align-items-center">
                    <span style={{ width: 9, height: 9, background: e.fill || e.color || e.stroke, borderRadius: '50%', marginRight: 7, flexShrink: 0 }} />
                    <span className="text-secondary me-1" style={{ fontSize: '0.8rem' }}>{e.name}:</span>
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>{fmt(e.value)} đ</span>
                </div>
            ))}
        </div>
    );
};

// ─── KPI Card (clickable) ────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, onClick, clickable, children }) => (
    <div
        onClick={onClick}
        className={`card border-0 shadow-sm rounded-4 p-4 h-100 ${clickable ? 'cursor-pointer' : ''}`}
        style={{ backgroundColor: accent || '#f9fafc', cursor: clickable ? 'pointer' : 'default', transition: 'transform .15s, box-shadow .15s' }}
        onMouseEnter={e => { if (clickable) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.12)'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>{label}</p>
        <h3 className="fw-bold text-dark mb-1">{value}</h3>
        {sub && typeof sub === 'string' ? <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{sub}</p> : sub}
        {children}
        {clickable && <p className="mb-0 mt-2 fw-semibold" style={{ fontSize: '0.76rem', color: '#4f81ff' }}>View Details →</p>}
    </div>
);

// ─── Overview Panel ──────────────────────────────────────────────────────────
const OverviewPanel = ({ summaries, branches, activeCategory, periodLabel, onDrillDown, selectedYear, selectedMonth }) => {
    const navigate = useNavigate();
    const sysRoom    = summaries.reduce((s, b) => s + (b.totalRevenue    || 0), 0);
    const sysDirect  = summaries.reduce((s, b) => s + (b.directRevenue   || 0), 0);
    const sysOta     = summaries.reduce((s, b) => s + (b.otaRevenue      || 0), 0);
    const sysService = summaries.reduce((s, b) => s + (b.serviceRevenue  || 0), 0);
    const sysExpense = summaries.reduce((s, b) => s + (b.totalExpense    || 0), 0);

    const barData = summaries.map(b => ({
        name: b.branchName,
        'Room':    b.totalRevenue   || 0,
        'Service': b.serviceRevenue || 0,
        'Expense': b.totalExpense   || 0,
    }));

    const catKey   = CATEGORIES[activeCategory].key;
    const pieData  = summaries.filter(b => (b[catKey] || 0) > 0).map(b => ({ name: b.branchName, value: b[catKey] }));
    const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

    const sorted = [...summaries].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    const hasMom = sorted.some(b => b.momGrowth != null);
    const hasOcc = sorted.some(b => b.occupancyRate != null);

    return (
        <>
            {/* KPI cards */}
            <div className="row g-3 mb-4">
                {[
                    { catKey: 'room',    total: sysRoom,    accent: '#fffdf6' },
                    { catKey: 'service', total: sysService, accent: '#f0fdf8' },
                    { catKey: 'expense', total: sysExpense, accent: '#fff8f3' },
                ].map(({ catKey: ck, total, accent }) => (
                    <div key={ck} className="col-12 col-md-4">
                        <KpiCard
                            label={CATEGORIES[ck].label}
                            value={`${fmt(total)} đ`}
                            sub={periodLabel}
                            accent={accent}
                            clickable
                            onClick={() => onDrillDown(ck)}
                        >
                            {ck === 'room' && (
                                <div className="mt-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="badge" style={{ backgroundColor: '#4f81ff', width: 45, fontSize: '0.65rem' }}>Direct</span>
                                        <span className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>{fmt(sysDirect)}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="badge bg-warning text-dark" style={{ width: 45, fontSize: '0.65rem' }}>OTA</span>
                                        <span className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>{fmt(sysOta)}</span>
                                    </div>
                                    <div className="text-muted mt-2 lh-sm" style={{ fontSize: '0.68rem', fontStyle: 'italic' }}>
                                        <i className="bi bi-info-circle me-1" />
                                        Note: OTA amounts are estimates before commission.
                                    </div>
                                </div>
                            )}
                        </KpiCard>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="row g-4 mb-4">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.77rem', letterSpacing: '1px' }}>
                            COMPARING {branches.length} BRANCHES — {periodLabel.toUpperCase()}
                        </h6>
                        <ResponsiveContainer width="100%" height={310}>
                            <BarChart data={barData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={fmtM} tick={{ fill: '#6c757d', fontSize: 12 }} width={60} />
                                <Tooltip content={<Tip />} />
                                <Legend iconType="square" verticalAlign="top" wrapperStyle={{ paddingBottom: 14, fontSize: '0.82rem' }} />
                                <Bar dataKey="Room"    fill="#4f81ff" radius={[4,4,0,0]} maxBarSize={36} />
                                <Bar dataKey="Service" fill="#20c997" radius={[4,4,0,0]} maxBarSize={36} />
                                <Bar dataKey="Expense" fill="#fd7e14" radius={[4,4,0,0]} maxBarSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.77rem', letterSpacing: '1px' }}>
                            SHARE — {CATEGORIES[activeCategory].label.toUpperCase()}
                        </h6>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={255}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={105} paddingAngle={3} dataKey="value" stroke="none">
                                        {pieData.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                    <Legend iconType="square" formatter={(v, e) => {
                                        const pct = pieTotal > 0 ? (e.payload.value / pieTotal * 100).toFixed(1) : 0;
                                        return <span style={{ fontSize: '0.8rem' }} className="text-secondary">{v} {pct}%</span>;
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm rounded-4 p-4">
                <h6 className="text-secondary fw-bold text-uppercase mb-3" style={{ fontSize: '0.77rem', letterSpacing: '1px' }}>
                    DETAILS BY BRANCH — {periodLabel.toUpperCase()}
                </h6>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.87rem' }}>
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 ps-3">#</th>
                                <th className="py-3">Branch</th>
                                <th className="py-3 text-end">Room Rev.</th>
                                <th className="py-3 text-end">Service Rev.</th>
                                <th className="py-3 text-end">Expenses</th>
                                <th className="py-3 text-end">Gross Profit</th>
                                {hasMom && <th className="py-3 text-center">MoM</th>}
                                {hasOcc && <th className="py-3 text-center">Occupancy</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((b, idx) => {
                                const gross = (b.totalRevenue || 0) + (b.serviceRevenue || 0) - (b.totalExpense || 0);
                                return (
                                    <tr key={b.branchId} style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/report/aggregated?branchId=${b.branchId}&year=${selectedYear}&month=${selectedMonth}`)}
                                        onMouseEnter={e => { e.currentTarget.querySelectorAll('td').forEach(td => td.style.backgroundColor = '#f0f4ff'); }}
                                        onMouseLeave={e => { e.currentTarget.querySelectorAll('td').forEach(td => td.style.backgroundColor = ''); }}
                                    >
                                        <td className="ps-3">
                                            <span className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold"
                                                style={{ width: 26, height: 26, fontSize: '0.74rem', backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length] }}>{idx+1}</span>
                                        </td>
                                        <td className="fw-semibold text-dark">
                                            {b.branchName}
                                            <span className="text-primary ms-2" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Details →</span>
                                        </td>
                                        <td className="text-end align-middle">
                                            <div className="d-flex flex-column align-items-end">
                                                <span className="fw-semibold" style={{ color: '#4f81ff', fontSize: '0.92rem' }}>{fmt(b.totalRevenue)}</span>
                                                {(b.totalRevenue || 0) > 0 && (
                                                    <div className="d-flex flex-wrap justify-content-end gap-2 mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                        <span className="text-primary px-1 rounded" style={{ backgroundColor: '#e8eeff' }}>Dir: {fmt(b.directRevenue)}</span>
                                                        <span className="text-dark px-1 rounded bg-warning">OTA: {fmt(b.otaRevenue)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-end fw-semibold align-middle" style={{ color: '#20c997' }}>{fmt(b.serviceRevenue)}</td>
                                        <td className="text-end fw-semibold align-middle" style={{ color: '#fd7e14' }}>{fmt(b.totalExpense)}</td>
                                        <td className={`text-end fw-bold align-middle ${gross >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(gross)}</td>
                                        {hasMom && <td className="text-center align-middle">
                                            {b.momGrowth != null && <span className={`badge rounded-pill ${b.momGrowth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize: '0.76rem' }}>{b.momGrowth >= 0 ? '↑' : '↓'} {Math.abs(b.momGrowth).toFixed(1)}%</span>}
                                        </td>}
                                        {hasOcc && <td className="text-center fw-semibold align-middle">{b.occupancyRate || 0}%</td>}
                                    </tr>
                                );
                            })}
                            {summaries.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No data available</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

// ─── Detail / Drill-Down Panel ───────────────────────────────────────────────
const DetailPanel = ({ category, branches, summaries, monthlyTrends, selectedYear, onBack }) => {
    const [detailMode, setDetailMode] = useState('trend'); // 'trend' | 'compare'
    const cat = CATEGORIES[category];

    // Build 12-month area chart data from monthlyTrends
    const areaData = (() => {
        const grouped = {};
        monthlyTrends.forEach(t => {
            const key = MONTH_NAMES[t.month - 1] || `M${t.month}`;
            if (!grouped[key]) grouped[key] = { name: key, sortKey: t.month };
            grouped[key][t.branchName] = t[cat.trendKey] || 0;
        });
        return Object.values(grouped).sort((a, b) => a.sortKey - b.sortKey);
    })();

    // Bar chart for yearly comparison
    const compareData = summaries.map(b => ({
        name: b.branchName,
        [cat.label]: b[cat.key] || 0,
    }));

    const sorted = [...summaries].sort((a, b) => (b[cat.key] || 0) - (a[cat.key] || 0));
    const total  = summaries.reduce((s, b) => s + (b[cat.key] || 0), 0);

    return (
        <>
            {/* Header bar */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary btn-sm px-3 fw-semibold rounded-3" onClick={onBack}>
                    <i className="bi bi-arrow-left me-1" />Back
                </button>
                <div>
                    <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>Details {selectedYear}</span>
                    <h5 className="fw-bold text-dark m-0">
                        <span className="me-2" style={{ color: cat.color }}><i className={`bi ${cat.icon}`} /></span>
                        {cat.label} — All Branches
                    </h5>
                </div>
            </div>

            {/* Sub-toggle */}
            <div className="btn-group mb-4 shadow-sm">
                <button className={`btn btn-sm fw-semibold px-4 ${detailMode === 'trend' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setDetailMode('trend')}>
                    <i className="bi bi-graph-up me-2" />12-Month Trend
                </button>
                <button className={`btn btn-sm fw-semibold px-4 ${detailMode === 'compare' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setDetailMode('compare')}>
                    <i className="bi bi-bar-chart-line me-2" />Branch Comparison
                </button>
            </div>

            {detailMode === 'trend' ? (
                /* ── 12-month Area chart ── */
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                    <h6 className="text-secondary fw-bold text-uppercase mb-4" style={{ fontSize: '0.77rem', letterSpacing: '1px' }}>
                        {cat.label.toUpperCase()} TREND — ALL BRANCHES — YEAR {selectedYear}
                    </h6>
                    <ResponsiveContainer width="100%" height={340}>
                        <AreaChart data={areaData} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
                            <defs>
                                {branches.map((b, idx) => (
                                    <linearGradient key={b.branchId} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={BRANCH_COLORS[idx % BRANCH_COLORS.length]} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={BRANCH_COLORS[idx % BRANCH_COLORS.length]} stopOpacity={0}    />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={fmtM} tick={{ fill: '#6c757d', fontSize: 12 }} width={60} />
                            <Tooltip content={<Tip />} />
                            <Legend iconType="square" verticalAlign="top" wrapperStyle={{ paddingBottom: 16, fontSize: '0.82rem' }} />
                            {branches.map((b, idx) => (
                                <Area key={b.branchId} type="monotone" dataKey={b.branchName}
                                    stroke={BRANCH_COLORS[idx % BRANCH_COLORS.length]} strokeWidth={2.5}
                                    fill={`url(#grad-${idx})`}
                                    dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: BRANCH_COLORS[idx % BRANCH_COLORS.length] }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                /* ── Compare per-branch bar ── */
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                    <h6 className="text-secondary fw-bold text-uppercase mb-4" style={{ fontSize: '0.77rem', letterSpacing: '1px' }}>
                        COMPARING {cat.label.toUpperCase()} ACROSS BRANCHES
                    </h6>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={compareData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={fmtM} tick={{ fill: '#6c757d', fontSize: 12 }} width={60} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey={cat.label} radius={[6,6,0,0]} maxBarSize={60}>
                                {compareData.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Ranking table */}
            <div className="card border-0 shadow-sm rounded-4 p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.77rem', letterSpacing: '1px' }}>LEADERBOARD — {cat.label.toUpperCase()}</h6>
                    <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>Total: {fmt(total)} đ</span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.87rem' }}>
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 ps-3">Rank</th>
                                <th className="py-3">Branch</th>
                                <th className="py-3 text-end">{cat.label}</th>
                                <th className="py-3">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((b, idx) => {
                                const val = b[cat.key] || 0;
                                const pct = total > 0 ? (val / total * 100).toFixed(1) : 0;
                                return (
                                    <tr key={b.branchId}>
                                        <td className="ps-3">
                                            <span className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold"
                                                style={{ width: 26, height: 26, fontSize: '0.74rem', backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length] }}>{idx+1}</span>
                                        </td>
                                        <td className="fw-semibold text-dark">{b.branchName}</td>
                                        <td className="text-end fw-semibold" style={{ color: cat.color }}>{fmt(val)}</td>
                                        <td style={{ minWidth: 160 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="progress flex-grow-1" style={{ height: 8, borderRadius: 4 }}>
                                                    <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: cat.color, borderRadius: 4 }} />
                                                </div>
                                                <span className="text-secondary fw-semibold" style={{ fontSize: '0.8rem', minWidth: 38 }}>{pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {summaries.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-4">No data available</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const MultiBranchReportScreen = () => {
    const currentYear  = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [viewMode,       setViewMode]       = useState('monthly');
    const [activeCategory, setActiveCategory] = useState('room');
    const [selectedYear,   setSelectedYear]   = useState(currentYear);
    const [selectedMonth,  setSelectedMonth]  = useState(currentMonth);

    const [reportData,  setReportData]  = useState(null);
    const [yearlyData,  setYearlyData]  = useState(null);
    const [loading,     setLoading]     = useState(false);
    const [branches,    setBranches]    = useState([]);

    const navigate = useNavigate();

    const years  = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    useEffect(() => {
        reportApi.getReportBranches()
            .then(data => setBranches(data || []))
            .catch(err => console.error('Fetch branches error:', err));
    }, []);

    // Monthly data (for overview monthly view)
    useEffect(() => {
        if (!branches.length || viewMode !== 'monthly') return;
        const ids = branches.map(b => b.branchId);
        setLoading(true);
        reportApi.getMultiBranchDashboard(ids, selectedMonth, selectedYear)
            .then(setReportData)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [branches, selectedMonth, selectedYear, viewMode]);

    // Yearly data (for overview yearly view)
    useEffect(() => {
        if (!branches.length || viewMode !== 'yearly') return;
        const ids = branches.map(b => b.branchId);
        setLoading(true);
        reportApi.getYearlyMultiBranchDashboard(ids, selectedYear)
            .then(setYearlyData)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [branches, selectedYear, viewMode]);

    const monthlySummaries = reportData?.branchSummaries  || [];
    const yearlySummaries  = yearlyData?.branchSummaries  || [];

    const activeSummaries = viewMode === 'monthly' ? monthlySummaries : yearlySummaries;
    const periodLabel     = viewMode === 'monthly'
        ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
        : `Year ${selectedYear}`;

    const handleDrillDown = (cat) => {
        navigate(`/report/detail/${cat}?year=${selectedYear}`);
    };

    return (
        <div className="container-fluid p-0 pb-5" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>

            {/* ── Header ── */}
            <div className="p-4 bg-white shadow-sm border-bottom">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <p className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>HOTEL SYSTEM</p>
                        <h2 className="fw-bold m-0 text-dark">Multi-Branch Summary Report</h2>
                    </div>
                    <div className="btn-group shadow-sm">
                        <button className={`btn fw-semibold px-4 ${viewMode === 'monthly' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('monthly')}>
                            <i className="bi bi-calendar-month me-2" />Monthly
                        </button>
                        <button className={`btn fw-semibold px-4 ${viewMode === 'yearly' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('yearly')}>
                            <i className="bi bi-calendar-range me-2" />Yearly
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="d-flex flex-wrap align-items-center gap-3">
                    {viewMode === 'monthly' && (
                        <div className="d-flex flex-wrap gap-1">
                            {months.map(m => (
                                <button key={m}
                                    className={`btn btn-sm fw-semibold px-3 py-1 ${selectedMonth === m ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                    style={{ borderRadius: 8, minWidth: 44, fontSize: '0.81rem' }}
                                    onClick={() => setSelectedMonth(m)} disabled={loading}>
                                    {MONTH_NAMES[m - 1]}
                                </button>
                            ))}
                        </div>
                    )}
                    <select className="form-select fw-semibold border-secondary shadow-sm" style={{ borderRadius: 8, width: 120 }}
                        value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} disabled={loading}>
                        {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
            </div>

                {/* Category tabs — only on overview */}
                <div className="bg-white border-bottom px-4 d-flex gap-0">
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <button key={key} onClick={() => setActiveCategory(key)} style={{
                            border: 'none', background: 'none', padding: '13px 20px',
                            fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer',
                            borderBottom: activeCategory === key ? `3px solid ${cat.color}` : '3px solid transparent',
                            color: activeCategory === key ? cat.color : '#6c757d',
                            transition: 'all .18s'
                        }}>
                            <i className={`bi ${cat.icon} me-2`} />{cat.label}
                        </button>
                    ))}
                </div>

            {/* ── Content ── */}
            <div className="p-4">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
                        <p className="mt-3 text-secondary fw-semibold">Aggregating data...</p>
                    </div>
                ) : (
                    <OverviewPanel
                        summaries={activeSummaries}
                        branches={branches}
                        activeCategory={activeCategory}
                        periodLabel={periodLabel}
                        onDrillDown={handleDrillDown}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                    />
                )}
            </div>
        </div>
    );
};

export default MultiBranchReportScreen;
