/**
 * AggregatedReportScreen.jsx
 * Route: /report/aggregated?branchId=X&year=Y&month=M
 *
 * Shows combined Room + Service + Expense report for a single branch.
 * Supports Monthly view (specific month) and Yearly view (full year).
 */
import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportApi } from '../api/reportApi';
import 'bootstrap/dist/css/bootstrap.min.css';
import YearlyRevenueDashboard from '../component/YearlyRevenueDashboard';
import MonthlyRevenueDashboard from '../component/MonthlyRevenueDashboard';
import YearlyServiceRevenueDashboard from '../component/YearlyServiceRevenueDashboard';
import YearlyExpenseDashboard from '../component/YearlyExpenseDashboard';
import ExpensePieChart from '../component/ExpensePieChart';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';

// ─── Constants ──────────────────────────────────────────────────────────────────
const ACCENT_COLORS = {
    room:    { color: '#4f81ff', bg: '#e8eeff', label: 'Room Revenue'    },
    service: { color: '#20c997', bg: '#e6faf5', label: 'Service Revenue' },
    expense: { color: '#fd7e14', bg: '#fff3e6', label: 'Operating Expense' },
    profit:  { color: '#198754', bg: '#e8f5e9', label: 'Gross Profit'    },
};
const PIE_COLORS   = ['#4f81ff','#20c997','#fd7e14','#e83e8c','#6f42c1','#198754','#ffc107','#0dcaf0'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_LABELS_VI = ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12'];

const fmt  = v => new Intl.NumberFormat('vi-VN').format(v || 0);
const fmtM = v => {
    if (!v && v !== 0) return '0';
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
    return String(v);
};

// ─── Shared Tooltip ─────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
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

// ─── KPI Card ───────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, grow, icon, onClick, hint, children }) => {
    const [hovered, setHovered] = React.useState(false);
    return (
        <div
            className="card border-0 rounded-4 p-4 h-100"
            onClick={onClick}
            onMouseEnter={() => onClick && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                backgroundColor: accent,
                cursor: onClick ? 'pointer' : 'default',
                boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.13)' : '0 2px 8px rgba(0,0,0,0.07)',
                transform: hovered ? 'translateY(-2px)' : 'none',
                transition: 'box-shadow .18s, transform .18s',
            }}
        >
            <div className="d-flex justify-content-between align-items-start mb-2">
                <p className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.7rem', letterSpacing: '1.2px' }}>{label}</p>
                {icon && <i className={`bi ${icon}`} style={{ fontSize: '1.1rem', opacity: 0.4 }} />}
            </div>
            <h3 className="fw-bold text-dark mb-1">{value}</h3>
            {sub && typeof sub === 'string' ? <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{sub}</p> : sub}
            {children}
            {grow != null && (
                <span className={`badge rounded-pill mt-2 ${grow >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                    style={{ fontSize: '0.74rem', width: 'fit-content' }}>
                    {grow >= 0 ? '↑' : '↓'} {Math.abs(grow).toFixed(1)}% vs prev month
                </span>
            )}
            {hint && onClick && (
                <p className="mb-0 mt-2" style={{ fontSize: '0.72rem', color: '#4f81ff', opacity: hovered ? 1 : 0.6, transition: 'opacity .18s' }}>
                    <i className="bi bi-box-arrow-up-right me-1" />{hint}
                </p>
            )}
        </div>
    );
};

// ─── Main ───────────────────────────────────────────────────────────────────────
const AggregatedReportScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const currentYear  = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    /* ── URL param bootstrap ── */
    const initBranchId = searchParams.get('branchId') ? Number(searchParams.get('branchId')) : null;
    const initYear     = searchParams.get('year')     ? Number(searchParams.get('year'))     : currentYear;
    const initMonth    = searchParams.get('month')    ? Number(searchParams.get('month'))    : currentMonth;

    const [branches,      setBranches]      = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(initBranchId);
    const [selectedYear,   setSelectedYear]   = useState(initYear);
    const [selectedMonth,  setSelectedMonth]  = useState(initMonth);
    const [periodMode,     setPeriodMode]     = useState('monthly'); // 'monthly' | 'yearly'
    const [layoutMode,     setLayoutMode]     = useState('dashboard'); // 'dashboard' | 'excel'

    /* Drill-down state for Room + Service tabs */
    const [roomDrillMonth,    setRoomDrillMonth]    = useState(null);
    const [roomMonthlyData,   setRoomMonthlyData]   = useState(null);
    const [serviceDrillMonth, setServiceDrillMonth] = useState(null);
    const [serviceMonthlyData, setServiceMonthlyData] = useState([]);
    const [expenseDrillMonth, setExpenseDrillMonth] = useState(null);
    const [expenseMonthlyData, setExpenseMonthlyData] = useState([]);

    /* Monthly data */
    const [roomData,    setRoomData]    = useState(null);
    const [serviceData, setServiceData] = useState([]);
    const [expenseData, setExpenseData] = useState([]);

    /* Yearly data */
    const [yearlyRoom,    setYearlyRoom]    = useState(null);   // YearlyRoomRevenueSummaryDTO
    const [yearlyService, setYearlyService] = useState([]);     // list of monthly service totals
    const [yearlyExpense, setYearlyExpense] = useState([]);     // list of monthly expense totals

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'room' | 'service' | 'expense'

    const START_YEAR = 2024;
    const years  = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => START_YEAR + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    /* Load branches */
    useEffect(() => {
        reportApi.getReportBranches()
            .then(data => {
                setBranches(data || []);
                if (!selectedBranch && data?.length) setSelectedBranch(data[0].branchId);
            })
            .catch(console.error);
    }, []);

    /* Load monthly data */
    const fetchMonthly = useCallback(async () => {
        if (!selectedBranch) return;
        setLoading(true);
        try {
            const [room, service, expense] = await Promise.all([
                reportApi.getRoomRevenue(selectedBranch, selectedMonth, selectedYear).catch(() => null),
                reportApi.getMonthlyServiceRevenue(selectedBranch, selectedMonth, selectedYear).catch(() => []),
                reportApi.getMonthlyExpenses(selectedBranch, selectedMonth, selectedYear).catch(() => []),
            ]);
            setRoomData(room);
            setServiceData(service || []);
            setExpenseData(expense || []);
        } finally {
            setLoading(false);
        }
    }, [selectedBranch, selectedMonth, selectedYear]);

    /* Load yearly data */
    const fetchYearly = useCallback(async () => {
        if (!selectedBranch) return;
        setLoading(true);
        try {
            const [room, service, expense] = await Promise.all([
                reportApi.getYearlyRoomDashboard(selectedBranch, selectedYear).catch(() => null),
                reportApi.getYearlyServiceRevenue(selectedBranch, selectedYear).catch(() => []),
                reportApi.getYearlyExpenses(selectedBranch, selectedYear).catch(() => []),
            ]);
            setYearlyRoom(room);
            setYearlyService(service || []);
            setYearlyExpense(expense || []);
        } finally {
            setLoading(false);
        }
    }, [selectedBranch, selectedYear]);

    /* Load room monthly drill */
    const fetchRoomDrill = useCallback(async (month) => {
        if (!selectedBranch) return;
        try {
            const data = await reportApi.getRoomRevenue(selectedBranch, month, selectedYear);
            setRoomMonthlyData(data);
        } catch { setRoomMonthlyData(null); }
    }, [selectedBranch, selectedYear]);

    /* Load service monthly drill */
    const fetchServiceDrill = useCallback(async (month) => {
        if (!selectedBranch) return;
        try {
            const data = await reportApi.getMonthlyServiceRevenue(selectedBranch, month, selectedYear);
            setServiceMonthlyData(data || []);
        } catch { setServiceMonthlyData([]); }
    }, [selectedBranch, selectedYear]);

    /* Load expense monthly drill */
    const fetchExpenseDrill = useCallback(async (month) => {
        if (!selectedBranch) return;
        try {
            const data = await reportApi.getMonthlyExpenses(selectedBranch, month, selectedYear);
            setExpenseMonthlyData(data || []);
        } catch { setExpenseMonthlyData([]); }
    }, [selectedBranch, selectedYear]);

    useEffect(() => {
        if (periodMode === 'monthly') fetchMonthly();
        else fetchYearly();
    }, [periodMode, fetchMonthly, fetchYearly]);

    /* ── Derived ── */
    const branchName = branches.find(b => b.branchId === selectedBranch)?.branchName || '—';

    // Monthly derived
    const totalRoomRev    = roomData?.totalRevenue || 0;
    const totalServiceRev = serviceData.reduce((s, x) => s + (x.amount || 0), 0);
    const totalServiceCost = serviceData.reduce((s, x) => s + ((x.amount || 0) - (x.netRevenue || 0)), 0);
    const totalExpenseAgg = expenseData.reduce((s, x) => s + (x.amount || 0), 0);
    const grossProfit     = totalRoomRev + (totalServiceRev - totalServiceCost) - totalExpenseAgg;

    // Yearly derived — build 12-month area chart data
    const yearlyAreaData = (() => {
        if (periodMode !== 'yearly') return [];
        // yearlyRoom has monthlyDetails[]:{month, totalRevenue, occupancyRate, adr, totalStandardGuests}
        // yearlyService/yearlyExpense are {month, total} or similar — check structure
        const map = {};
        for (let m = 1; m <= 12; m++) {
            map[m] = { name: MONTH_LABELS[m - 1], month: m, room: 0, service: 0, expense: 0 };
        }
        // Room from yearlyRoom.monthlyDetails
        if (yearlyRoom?.monthlyDetails) {
            yearlyRoom.monthlyDetails.forEach(d => {
                if (map[d.month]) map[d.month].room = d.totalRevenue || 0;
            });
        }
        // Service yearly: YearlyRevenueDTO[] {monthValue, revenue}
        yearlyService.forEach(s => {
            const m = s.monthValue;
            if (map[m]) map[m].service = s.revenue || 0;
        });
        // Expense yearly: YearlyRevenueDTO[] {monthValue, revenue}
        yearlyExpense.forEach(e => {
            const m = e.monthValue;
            if (map[m]) map[m].expense = e.revenue || 0;
        });
        return Object.values(map).sort((a, b) => a.month - b.month);
    })();

    const yearlyTotalRoom    = yearlyRoom?.totalRevenue || 0;
    const yearlyTotalService = yearlyAreaData.reduce((s, d) => s + d.service, 0);
    const yearlyTotalExpense = yearlyAreaData.reduce((s, d) => s + d.expense, 0);
    const yearlyGrossProfit  = yearlyTotalRoom + yearlyTotalService - yearlyTotalExpense;

    /* Pie data */
    const revenuePieData = periodMode === 'monthly'
        ? [{ name: 'Room', value: totalRoomRev }, { name: 'Service', value: totalServiceRev }].filter(d => d.value > 0)
        : [{ name: 'Room', value: yearlyTotalRoom }, { name: 'Service', value: yearlyTotalService }].filter(d => d.value > 0);

    /* ── Excel export ── */
    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const rows = [];
        rows.push([`AGGREGATED REPORT — ${branchName}`, '', '', '', '']);
        const displayPeriod = periodMode === 'monthly' ? `${MONTH_LABELS[selectedMonth - 1]} ${selectedYear}` : `Year ${selectedYear}`;
        rows.push([displayPeriod, '', '', '', '']);
        rows.push([]);
        rows.push(['ROOM REVENUE', '', '', '', '']);
        rows.push(['Room Type', 'Revenue', '', '', '']);
        (roomData?.roomRevenues || []).forEach(r => rows.push([r.roomTypeName, r.revenue]));
        rows.push(['TOTAL', totalRoomRev, '', '', '']);
        rows.push([]);
        rows.push(['SERVICE REVENUE', '', '', '', '']);
        rows.push(['Category', 'Gross Revenue', 'Net Revenue', 'MoM Growth (%)', '']);
        serviceData.forEach(s => rows.push([s.category, s.amount, s.netRevenue, s.growth != null ? `${s.growth > 0 ? 'Up' : s.growth < 0 ? 'Down' : ''} ${Math.abs(s.growth).toFixed(1)}%` : '-']));
        rows.push(['TOTAL', totalServiceRev, '', '', '']);
        rows.push([]);
        rows.push(['EXPENSE REPORT', '', '', '', '']);
        rows.push(['Category', 'Amount', 'MoM', 'Note', '']);
        expenseData.forEach(e => rows.push([e.category, e.amount, e.growth != null ? `${e.growth}%` : '-', e.note || '']));
        rows.push(['TOTAL', totalExpenseAgg, '', '', '']);
        rows.push([]);
        rows.push(['GROSS PROFIT', grossProfit, '', '', '']);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buf], { type: 'application/octet-stream' }), `AggReport_${branchName}_${selectedYear}${periodMode === 'monthly' ? `_T${selectedMonth}` : ''}.xlsx`);
    };

    const totalRevDisplay = periodMode === 'monthly' ? totalRoomRev : yearlyTotalRoom;
    const totalSvcDisplay = periodMode === 'monthly' ? totalServiceRev : yearlyTotalService;
    const totalExpDisplay = periodMode === 'monthly' ? totalExpenseAgg : yearlyTotalExpense;
    const profitDisplay   = periodMode === 'monthly' ? grossProfit : yearlyGrossProfit;

    return (
        <div className="container-fluid p-0 pb-5" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>

            {/* ── Header ────────────────────────────────────────── */}
            <div className="bg-white shadow-sm border-bottom">
                {/* Top bar */}
                <div className="px-4 pt-3 pb-0">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                        <div>
                            {/* Breadcrumb */}
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <button className="btn btn-sm btn-outline-secondary px-3 fw-semibold rounded-3 py-1"
                                    onClick={() => navigate('/report/multi-branch')}>
                                    <i className="bi bi-arrow-left me-1" />Multi-Branch Report
                                </button>
                                <span className="text-secondary" style={{ fontSize: '0.78rem' }}>›</span>
                                <span className="fw-semibold text-primary" style={{ fontSize: '0.83rem' }}>
                                    <i className="bi bi-building me-1" />{branchName}
                                </span>
                            </div>
                            <p className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.71rem', letterSpacing: '1px' }}>AGGREGATED REPORT</p>
                            <h2 className="fw-bold text-dark m-0">{branchName}</h2>
                        </div>

                        {/* Right controls */}
                        <div className="d-flex align-items-center gap-2 pt-1 flex-wrap">
                            {/* Monthly/Yearly toggle */}
                            <div className="btn-group shadow-sm">
                                <button className={`btn fw-semibold px-4 ${periodMode === 'monthly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setPeriodMode('monthly')}>
                                    <i className="bi bi-calendar-month me-2" />Monthly
                                </button>
                                <button className={`btn fw-semibold px-4 ${periodMode === 'yearly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setPeriodMode('yearly')}>
                                    <i className="bi bi-calendar-range me-2" />Yearly
                                </button>
                            </div>
                            {/* Export */}
                            <button className="btn btn-success fw-semibold px-3 shadow-sm"
                                onClick={handleExport}
                                disabled={loading}>
                                <i className="bi bi-file-earmark-excel me-2" />Export
                            </button>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="d-flex flex-wrap align-items-center gap-3 pb-3 border-bottom">
                        {/* Branch selector */}
                        <select className="form-select fw-semibold border-secondary shadow-sm"
                            style={{ borderRadius: 8, width: 200 }}
                            value={selectedBranch || ''}
                            onChange={e => setSelectedBranch(Number(e.target.value))}
                            disabled={!branches.length}>
                            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                        </select>

                        {/* Month pills — monthly only */}
                        {periodMode === 'monthly' && (
                            <div className="d-flex flex-wrap gap-1">
                                {months.map(m => (
                                    <button key={m}
                                        className={`btn btn-sm fw-semibold px-2 py-1 ${selectedMonth === m ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                        style={{ borderRadius: 7, minWidth: 36, fontSize: '0.77rem' }}
                                        onClick={() => setSelectedMonth(m)}
                                        disabled={loading}>
                                        {MONTH_LABELS[m - 1]}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Year selector */}
                        <select className="form-select fw-semibold border-secondary shadow-sm"
                            style={{ borderRadius: 8, width: 115 }}
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}>
                            {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                    </div>

                    {/* Tab bar */}
                    <div className="d-flex gap-0">
                        {[
                            { key: 'overview', label: 'Overview',         icon: 'bi-grid-1x2' },
                            { key: 'room',     label: 'Room Revenue',     icon: 'bi-door-open' },
                            { key: 'service',  label: 'Services',         icon: 'bi-bag-check' },
                            { key: 'expense',  label: 'Expenses',         icon: 'bi-receipt' },
                        ].map(tab => (
                            <button key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    border: 'none', background: 'none', padding: '13px 20px',
                                    fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer',
                                    borderBottom: activeTab === tab.key ? '3px solid #4f81ff' : '3px solid transparent',
                                    color: activeTab === tab.key ? '#4f81ff' : '#6c757d',
                                    transition: 'all .18s'
                                }}>
                                <i className={`bi ${tab.icon} me-2`} />{tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" style={{ width: '2.8rem', height: '2.8rem' }} />
                    <p className="mt-3 text-secondary fw-semibold">Loading data...</p>
                </div>
            ) : (
                <div className="px-4 pt-4">

                    {/* ══════════════ OVERVIEW TAB ══════════════ */}
                    {activeTab === 'overview' && (() => {
                        const roomRevenues = roomData?.roomRevenues || [];
                        const maxRoomRev = Math.max(...roomRevenues.map(r => r.revenue || 0), 1);

                        return (
                            <>
                                {/* ── KPI Totals (top) ── */}
                                <div className="row g-3 mb-4">
                                    <div className="col-6 col-md-3">
                                        <KpiCard label="Room Revenue" value={`${fmt(totalRevDisplay)} đ`}
                                            accent={ACCENT_COLORS.room.bg} icon="bi-door-open"
                                            grow={periodMode === 'monthly' ? roomData?.momGrowth : yearlyRoom?.yearlyGrowth}
                                            hint="View Revenue Report"
                                            onClick={() => navigate(`/report/revenue?branchId=${selectedBranch}&year=${selectedYear}${periodMode === 'monthly' ? `&month=${selectedMonth}` : ''}`)}>
                                            <div className="mt-1">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <span className="badge" style={{ backgroundColor: '#4f81ff', width: 45, fontSize: '0.65rem' }}>Direct</span>
                                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>{fmt(periodMode === 'monthly' ? roomData?.directRevenue : yearlyRoom?.totalDirectRevenue)}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <span className="badge bg-warning text-dark" style={{ width: 45, fontSize: '0.65rem' }}>OTA</span>
                                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>{fmt(periodMode === 'monthly' ? roomData?.otaRevenue : yearlyRoom?.totalOtaRevenue)}</span>
                                                </div>
                                                <div className="text-muted mt-2 lh-sm" style={{ fontSize: '0.68rem', fontStyle: 'italic' }}>
                                                    <i className="bi bi-info-circle me-1" />
                                                    Note: OTA amounts are estimates before commission.
                                                </div>
                                            </div>
                                        </KpiCard>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <KpiCard label="Service Revenue" value={`${fmt(totalSvcDisplay)} đ`}
                                            accent={ACCENT_COLORS.service.bg} icon="bi-bag-check"
                                            sub={periodMode === 'monthly' ? `Month ${selectedMonth}/${selectedYear}` : `Year ${selectedYear}`}
                                            hint="View Service Report"
                                            onClick={() => navigate(`/report/services?branchId=${selectedBranch}&year=${selectedYear}${periodMode === 'monthly' ? `&month=${selectedMonth}` : ''}`)} />
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <KpiCard label="Operating Expense" value={`${fmt(totalExpDisplay)} đ`}
                                            accent={ACCENT_COLORS.expense.bg} icon="bi-receipt"
                                            sub={periodMode === 'monthly' ? `Month ${selectedMonth}/${selectedYear}` : `Year ${selectedYear}`}
                                            hint="View Expense Report"
                                            onClick={() => navigate(`/report/expense?branchId=${selectedBranch}&year=${selectedYear}${periodMode === 'monthly' ? `&month=${selectedMonth}` : ''}`)} />
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <KpiCard label="Gross Profit" value={`${fmt(profitDisplay)} đ`}
                                            accent={profitDisplay >= 0 ? ACCENT_COLORS.profit.bg : '#fff0f0'}
                                            icon={profitDisplay >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}
                                            sub="Room + Net Svc. − Expense" />
                                    </div>
                                </div>

                                {/* Layout toggle */}
                                <div className="d-flex justify-content-end mb-4">
                                    <div className="btn-group shadow-sm">
                                        <button className={`btn fw-semibold px-4 ${layoutMode === 'dashboard' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setLayoutMode('dashboard')}>
                                            <i className="bi bi-pie-chart-fill me-2" />Dashboard View
                                        </button>
                                        <button className={`btn fw-semibold px-4 ${layoutMode === 'excel' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setLayoutMode('excel')}>
                                            <i className="bi bi-table me-2" />Excel Layout
                                        </button>
                                    </div>
                                </div>

                                {/* ══ DASHBOARD VIEW ══ */}
                                {layoutMode === 'dashboard' && (
                                    <>
                                        {/* ── Room Revenue Chart ── */}
                                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="text-secondary fw-bold text-uppercase mb-0" style={{ fontSize: '0.74rem', letterSpacing: '1px' }}>
                                                    ROOM REVENUE BY TYPE — {periodMode === 'monthly' ? `${MONTH_LABELS[selectedMonth - 1]} ${selectedYear}` : `Year ${selectedYear}`}
                                                </h6>
                                                <span className="fw-bold" style={{ color: '#4f81ff', fontSize: '0.9rem' }}>
                                                    {fmt(totalRevDisplay)} đ
                                                    {roomData?.momGrowth != null && (
                                                        <span className={`badge rounded-pill ms-2 ${roomData.momGrowth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                                                            style={{ fontSize: '0.72rem' }}>
                                                            {roomData.momGrowth >= 0 ? '↑' : '↓'} {Math.abs(roomData.momGrowth).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            {periodMode === 'monthly' ? (
                                                roomRevenues.length > 0 ? (
                                                    <div className="row g-0">
                                                        {roomRevenues.map((r, i) => {
                                                            const pct = (r.revenue / maxRoomRev) * 100;
                                                            const dPct = r.revenue > 0 ? (r.directRevenue / r.revenue) * 100 : 0;
                                                            const oPct = r.revenue > 0 ? (r.otaRevenue / r.revenue) * 100 : 0;
                                                            return (
                                                                <div key={r.roomTypeName} className="col-12 d-flex flex-column mb-3">
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <div style={{ fontSize: '0.87rem', color: '#555', fontWeight: 600 }} className="text-truncate">
                                                                            {r.roomTypeName}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.87rem', fontWeight: 700 }} className="text-dark">
                                                                            {fmt(r.revenue)} đ
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="flex-grow-1 d-flex" style={{ height: 14, backgroundColor: '#f0f0f0', borderRadius: 7, overflow: 'hidden' }}>
                                                                            <div style={{ width: `${pct * (dPct/100)}%`, height: '100%', backgroundColor: '#4f81ff', transition: 'width 0.6s ease' }} title={`Direct: ${fmt(r.directRevenue)}`} />
                                                                            <div style={{ width: `${pct * (oPct/100)}%`, height: '100%', backgroundColor: '#ffc107', transition: 'width 0.6s ease' }} title={`OTA: ${fmt(r.otaRevenue)}`} />
                                                                        </div>
                                                                        <div style={{ width: 140, fontSize: '0.75rem', fontWeight: 500 }} className="text-end text-muted">
                                                                            Dir: {fmt(r.directRevenue)} | OTA: {fmt(r.otaRevenue)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-muted text-center py-3">No room data available</div>
                                                )
                                            ) : (
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <BarChart data={yearlyAreaData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
                                                        <YAxis axisLine={false} tickLine={false} tickFormatter={fmtM} tick={{ fill: '#888', fontSize: 11 }} width={55} />
                                                        <Tooltip content={<ChartTip />} />
                                                        <Bar dataKey="room" name="Room Revenue" fill="#4f81ff" radius={[6,6,0,0]} maxBarSize={52} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>

                                        {/* ── Service + Expense Tables ── */}
                                        <div className="row g-4 mb-4">
                                            {/* Service Revenue Table */}
                                            <div className="col-lg-6">
                                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <p className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Service Revenue</p>
                                                        <button className="btn btn-sm btn-outline-primary px-2 py-1 fw-semibold"
                                                            style={{ fontSize: '0.75rem', borderRadius: 7 }}
                                                            onClick={() => navigate(`/report/services?branchId=${selectedBranch}&year=${selectedYear}${periodMode === 'monthly' ? `&month=${selectedMonth}` : ''}`)}>
                                                            <i className="bi bi-box-arrow-up-right me-1" />Full Report
                                                        </button>
                                                    </div>
                                                    <hr className="text-muted mt-2 mb-3" />
                                                    {serviceData.length > 0 ? serviceData.map((s, idx) => (
                                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                                            <span className="text-secondary" style={{ fontSize: '0.88rem' }}>{s.category}</span>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>{fmt(s.amount)}</span>
                                                                {s.growth != null && (
                                                                    <span className={`badge rounded-pill ${s.growth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                                                                        style={{ fontSize: '0.7rem', minWidth: 50 }}>
                                                                        {s.growth >= 0 ? '↑' : '↓'} {Math.abs(s.growth).toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-muted text-center py-3" style={{ fontSize: '0.87rem' }}>No data available</div>}
                                                    <div className="d-flex justify-content-between align-items-center p-3 rounded-3 mt-3" style={{ backgroundColor: '#e6faf5' }}>
                                                        <span className="fw-bold" style={{ color: '#20c997' }}>Total Service Revenue</span>
                                                        <span className="fw-bold" style={{ color: '#20c997' }}>{fmt(totalSvcDisplay)} đ</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expense Report Table */}
                                            <div className="col-lg-6">
                                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <p className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Operating Expense</p>
                                                        <button className="btn btn-sm btn-outline-warning px-2 py-1 fw-semibold"
                                                            style={{ fontSize: '0.75rem', borderRadius: 7 }}
                                                            onClick={() => navigate(`/report/expense?branchId=${selectedBranch}&year=${selectedYear}${periodMode === 'monthly' ? `&month=${selectedMonth}` : ''}`)}>
                                                            <i className="bi bi-box-arrow-up-right me-1" />Full Report
                                                        </button>
                                                    </div>
                                                    <hr className="text-muted mt-2 mb-3" />
                                                    {expenseData.length > 0 ? expenseData.map((e, idx) => (
                                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                                            <span className="text-secondary" style={{ fontSize: '0.88rem' }}>{e.category}{e.note ? <small className="text-muted ms-1">— {e.note}</small> : ''}</span>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>{e.amount > 0 ? fmt(e.amount) : 'N/A'}</span>
                                                                {e.growth != null && (
                                                                    <span className={`badge rounded-pill ${e.growth > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}
                                                                        style={{ fontSize: '0.7rem', minWidth: 50 }}>
                                                                        {e.growth > 0 ? '↑' : '↓'} {Math.abs(e.growth).toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-muted text-center py-3" style={{ fontSize: '0.87rem' }}>No data available</div>}
                                                    <div className="d-flex justify-content-between align-items-center p-3 rounded-3 mt-3" style={{ backgroundColor: '#fff0e6' }}>
                                                        <span className="fw-bold text-danger">Total Expense</span>
                                                        <span className="fw-bold text-danger">{fmt(totalExpDisplay)} đ</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Pie Charts Row ── */}
                                        <div className="row g-4 mb-4">
                                            {/* Service Distribution */}
                                            <div className="col-lg-6">
                                                <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                                    SERVICE REVENUE DISTRIBUTION
                                                </p>
                                                <div className="card border-0 shadow-sm rounded-4 p-4">
                                                    <div style={{ width: '100%', height: 300 }}>
                                                        {serviceData.filter(s => s.amount > 0).length > 0 ? (
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={serviceData.filter(s => s.amount > 0).map(s => ({ name: s.category, value: Number(s.amount) || 0 }))}
                                                                        cx="50%" cy="48%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none"
                                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                                        labelLine={true}>
                                                                        {serviceData.filter(s => s.amount > 0).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                                    </Pie>
                                                                    <Tooltip content={<ChartTip />} />
                                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        ) : <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expense Distribution */}
                                            <div className="col-lg-6">
                                                <p className="text-secondary fw-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                                    EXPENSE DISTRIBUTION
                                                </p>
                                                <div className="card border-0 shadow-sm rounded-4 p-4">
                                                    <div style={{ width: '100%', height: 300 }}>
                                                        {expenseData.filter(e => (e.amount || 0) > 0).length > 0 ? (
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={expenseData.filter(e => (e.amount || 0) > 0).map(e => ({ name: e.category, value: Number(e.amount) || 0 }))}
                                                                        cx="50%" cy="48%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none"
                                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                                        labelLine={true}>
                                                                        {expenseData.filter(e => (e.amount || 0) > 0).map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 4) % PIE_COLORS.length]} />)}
                                                                    </Pie>
                                                                    <Tooltip content={<ChartTip />} />
                                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        ) : <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </>
                                )}

                                {/* ══ EXCEL VIEW ══ */}
                                {layoutMode === 'excel' && (
                                    <>
                                        {/* Room Revenue Table */}
                                        <div className="table-responsive rounded-4 mb-4" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                                            {periodMode === 'monthly' ? (
                                                <table className="table table-bordered mb-0 text-center align-middle" style={{ borderColor: '#e1e5eb' }}>
                                                    <thead>
                                                        <tr>
                                                            <th colSpan={roomRevenues.length + 4} className="py-2"
                                                                style={{ backgroundColor: '#f39c12', color: '#fff', letterSpacing: '1px', fontSize: '1rem', borderBottom: 'none' }}>
                                                                ROOM REVENUE — {MONTH_LABELS[selectedMonth - 1]} {selectedYear}
                                                            </th>
                                                        </tr>
                                                        <tr style={{ backgroundColor: '#fffcf5' }}>
                                                            <th colSpan={Math.max(roomRevenues.length, 1)} className="text-danger py-3">
                                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                                    <span>Total: {fmt(totalRoomRev)} đ</span>
                                                                    <div className="d-flex flex-wrap justify-content-center gap-3 mt-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                                        <span className="text-primary"><i className="bi bi-wallet2 me-1"/>Direct: {fmt(periodMode === 'monthly' ? roomData?.directRevenue : yearlyRoom?.totalDirectRevenue)}</span>
                                                                        <span className="text-warning text-dark"><i className="bi bi-globe me-1"/>OTA: {fmt(periodMode === 'monthly' ? roomData?.otaRevenue : yearlyRoom?.totalOtaRevenue)}</span>
                                                                    </div>
                                                                </div>
                                                            </th>
                                                            <th className="py-3 text-secondary" style={{ width: 140 }}>MoM</th>
                                                            <th className="py-3 text-secondary" style={{ width: 130 }}>Occupancy</th>
                                                            <th className="py-3 text-secondary" style={{ width: 155 }}>ADR</th>
                                                            <th className="py-3 text-secondary" style={{ width: 130 }}>Guests</th>
                                                        </tr>
                                                        <tr>
                                                            {roomRevenues.length > 0 ? roomRevenues.map(r => (
                                                                <th key={r.roomTypeName} className="py-2 bg-light text-dark" style={{ minWidth: 120 }}>{r.roomTypeName}</th>
                                                            )) : <th className="py-2 bg-light text-dark">Room Type</th>}
                                                            <td rowSpan={2} className="fw-bold fs-6" style={{ backgroundColor: '#f8f9fa' }}>
                                                                {roomData?.momGrowth != null ? (
                                                                    roomData.momGrowth >= 0
                                                                        ? <span className="text-success">↑ {roomData.momGrowth.toFixed(1)}%</span>
                                                                        : <span className="text-danger">↓ {Math.abs(roomData.momGrowth).toFixed(1)}%</span>
                                                                ) : '—'}
                                                            </td>
                                                            <td rowSpan={2} className="fw-bold fs-6" style={{ backgroundColor: '#f8f9fa' }}>{roomData?.occupancyRate || 0}%</td>
                                                            <td rowSpan={2} className="fw-bold fs-6" style={{ backgroundColor: '#f8f9fa' }}>{fmt(roomData?.adr)}</td>
                                                            <td rowSpan={2} className="fw-bold fs-6" style={{ backgroundColor: '#f8f9fa' }}>{roomData?.totalStandardGuests || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            {roomRevenues.length > 0 ? roomRevenues.map(r => (
                                                                <td key={r.roomTypeName} className="py-3 fw-bold align-middle" style={{ backgroundColor: r.revenue > 0 ? '#fffae6' : '#fff' }}>
                                                                    <div className="d-flex flex-column align-items-center justify-content-center">
                                                                        <span className="mb-1" style={{ fontSize: '0.95rem', color: '#4f81ff' }}>{fmt(r.revenue)}</span>
                                                                        {r.revenue > 0 && (
                                                                            <div className="d-flex flex-wrap justify-content-center gap-2" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                                                <span className="text-primary px-1 rounded" style={{ backgroundColor: '#e8eeff' }}>Dir: {fmt(r.directRevenue)}</span>
                                                                                <span className="text-dark px-1 rounded bg-warning">OTA: {fmt(r.otaRevenue)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )) : <td className="py-3 text-muted">—</td>}
                                                        </tr>
                                                    </thead>
                                                </table>
                                            ) : (
                                                /* Yearly: 12-month summary */
                                                <table className="table table-bordered mb-0 align-middle" style={{ borderColor: '#e1e5eb' }}>
                                                    <thead>
                                                        <tr>
                                                            <th colSpan={5} className="py-2 text-center"
                                                                style={{ backgroundColor: '#f39c12', color: '#fff', letterSpacing: '1px', fontSize: '1rem', borderBottom: 'none' }}>
                                                                REVENUE & EXPENSES BY MONTH — YEAR {selectedYear}
                                                            </th>
                                                        </tr>
                                                        <tr style={{ backgroundColor: '#fffcf5' }}>
                                                            <th className="py-2 ps-3 text-secondary">Month</th>
                                                            <th className="py-2 text-center text-secondary">Room Revenue</th>
                                                            <th className="py-2 text-center text-secondary">Service Revenue</th>
                                                            <th className="py-2 text-center text-secondary">Expenses</th>
                                                            <th className="py-2 text-center text-secondary">Gross Profit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {yearlyAreaData.map((row, i) => {
                                                            const profit = (row.room || 0) + (row.service || 0) - (row.expense || 0);
                                                            return (
                                                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                                                                    <td className="ps-3 fw-semibold text-dark" style={{ fontSize: '0.87rem' }}>{row.name}</td>
                                                                    <td className="text-center fw-semibold" style={{ fontSize: '0.87rem', color: '#4f81ff' }}>{row.room > 0 ? fmt(row.room) : '—'}</td>
                                                                    <td className="text-center fw-semibold" style={{ fontSize: '0.87rem', color: '#20c997' }}>{row.service > 0 ? fmt(row.service) : '—'}</td>
                                                                    <td className="text-center fw-semibold text-danger" style={{ fontSize: '0.87rem' }}>{row.expense > 0 ? fmt(row.expense) : '—'}</td>
                                                                    <td className="text-center fw-bold" style={{ fontSize: '0.87rem', color: profit >= 0 ? '#198754' : '#dc3545' }}>{fmt(profit)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                        <tr style={{ backgroundColor: '#fffae6' }}>
                                                            <td className="ps-3 fw-bold text-dark">TOTAL</td>
                                                            <td className="text-center fw-bold" style={{ color: '#4f81ff' }}>{fmt(yearlyTotalRoom)}</td>
                                                            <td className="text-center fw-bold" style={{ color: '#20c997' }}>{fmt(yearlyTotalService)}</td>
                                                            <td className="text-center fw-bold text-danger">{fmt(yearlyTotalExpense)}</td>
                                                            <td className="text-center fw-bold" style={{ color: yearlyGrossProfit >= 0 ? '#198754' : '#dc3545' }}>{fmt(yearlyGrossProfit)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>

                                        {/* Service + Expense Tables side by side (monthly only) */}
                                        {periodMode === 'monthly' && (
                                            <div className="row g-4 mb-4">
                                            {/* Service Revenue Table */}
                                            <div className="col-lg-6">
                                                <div className="table-responsive rounded-4" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                                                    <table className="table table-bordered mb-0 align-middle" style={{ borderColor: '#e1e5eb' }}>
                                                        <thead>
                                                            <tr>
                                                                <th colSpan={4} className="py-2 text-center"
                                                                    style={{ backgroundColor: '#f39c12', color: '#fff', letterSpacing: '1px', fontSize: '1rem', borderBottom: 'none' }}>
                                                                    SERVICE REVENUE
                                                                </th>
                                                            </tr>
                                                            <tr style={{ backgroundColor: '#f9f9f9' }}>
                                                                <th className="py-2 ps-3" style={{ color: '#444' }}>Category</th>
                                                                <th className="py-2 text-center" style={{ color: '#444' }}>Gross Revenue</th>
                                                                <th className="py-2 text-center" style={{ color: '#444' }}>Net Revenue</th>
                                                                <th className="py-2 text-center" style={{ color: '#444' }}>MoM Growth (%)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {serviceData.map((s, i) => (
                                                                <tr key={i}>
                                                                    <td className="ps-3 fw-medium" style={{ fontSize: '0.87rem' }}>{s.category}</td>
                                                                    <td className="text-center fw-semibold text-dark" style={{ fontSize: '0.87rem' }}>{fmt(s.amount)}</td>
                                                                    <td className="text-center fw-semibold text-dark" style={{ fontSize: '0.87rem' }}>{fmt(s.netRevenue)}</td>
                                                                    <td className="text-center fw-medium" style={{ fontSize: '0.87rem' }}>
                                                                        {s.growth != null ? (s.growth > 0 ? <span className="text-dark">Up {s.growth.toFixed(1)}%</span> : s.growth < 0 ? <span className="text-dark">Down {Math.abs(s.growth).toFixed(1)}%</span> : <span className="text-muted">0%</span>) : <span className="text-muted">—</span>}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr>
                                                                <td className="fw-bold ps-3" style={{ backgroundColor: '#ffea00' }}>TOTAL</td>
                                                                <td className="fw-bold text-center" style={{ backgroundColor: '#ffea00', color: '#000' }}>{fmt(totalServiceRev)}</td>
                                                                <td className="fw-bold text-center" style={{ backgroundColor: '#ffea00', color: '#000' }}>{fmt(serviceData.reduce((s, x) => s + (x.netRevenue || 0), 0))}</td>
                                                                <td className="fw-bold text-center" style={{ backgroundColor: '#ffea00', color: '#000' }}>
                                                                    {(() => {
                                                                        const validGrowths = serviceData.filter(x => x.growth != null);
                                                                        if (validGrowths.length === 0) return '';
                                                                        const avgGrowth = validGrowths.reduce((s, x) => s + x.growth, 0) / validGrowths.length;
                                                                        return avgGrowth > 0 ? `Up ${avgGrowth.toFixed(1)}%` : avgGrowth < 0 ? `Down ${Math.abs(avgGrowth).toFixed(1)}%` : '';
                                                                    })()}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Expense Table */}
                                            <div className="col-lg-6">
                                                <div className="table-responsive rounded-4" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                                                    <table className="table table-bordered mb-0 align-middle" style={{ borderColor: '#e1e5eb' }}>
                                                        <thead>
                                                            <tr>
                                                                <th colSpan={4} className="py-2 text-center"
                                                                    style={{ backgroundColor: '#f39c12', color: '#fff', letterSpacing: '1px', fontSize: '1rem', borderBottom: 'none' }}>
                                                                    EXPENSE REPORT
                                                                </th>
                                                            </tr>
                                                            <tr style={{ backgroundColor: '#f9f9f9' }}>
                                                                <th className="py-2 ps-3 text-secondary">Category</th>
                                                                <th className="py-2 text-center text-secondary">Amount</th>
                                                                <th className="py-2 text-center text-secondary">MoM</th>
                                                                <th className="py-2 ps-2 text-secondary">Note</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {expenseData.map((e, i) => (
                                                                <tr key={i}>
                                                                    <td className="ps-3 fw-medium" style={{ fontSize: '0.87rem' }}>{e.category}</td>
                                                                    <td className="text-center fw-semibold text-danger" style={{ fontSize: '0.87rem' }}>{fmt(e.amount)}</td>
                                                                    <td className="text-center fw-medium" style={{ fontSize: '0.87rem' }}>
                                                                        {e.growth != null ? (e.growth > 0 ? <span className="text-danger">↑ {e.growth.toFixed(1)}%</span> : e.growth < 0 ? <span className="text-success">↓ {Math.abs(e.growth).toFixed(1)}%</span> : <span className="text-muted">0%</span>) : <span className="text-muted">—</span>}
                                                                    </td>
                                                                    <td className="ps-2 text-muted" style={{ fontSize: '0.87rem' }}>{e.note || ''}</td>
                                                                </tr>
                                                            ))}
                                                            <tr>
                                                                <td className="fw-bold ps-3" style={{ backgroundColor: '#ffe9e9' }}>TOTAL</td>
                                                                <td className="fw-bold text-center text-danger" style={{ backgroundColor: '#ffe9e9' }}>{fmt(totalExpenseAgg)}</td>
                                                                <td style={{ backgroundColor: '#ffe9e9' }}></td>
                                                                <td style={{ backgroundColor: '#ffe9e9' }}></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                                    </div>
                                                )}
                                    </>
                                )}
                            </>
                        );
                    })()}


                    {/* ══════════════ ROOM TAB ══════════════ */}
                    {activeTab === 'room' && (
                        <div>
                            {periodMode === 'yearly' ? (
                                /* ── Yearly: full YearlyRevenueDashboard with drill-down ── */
                                roomDrillMonth ? (
                                    <>
                                        <button className="btn btn-sm btn-outline-secondary mb-3 fw-semibold"
                                            onClick={() => { setRoomDrillMonth(null); setRoomMonthlyData(null); }}>
                                            <i className="bi bi-arrow-left me-1" />Back to Yearly Overview
                                        </button>
                                        {roomMonthlyData && <MonthlyRevenueDashboard monthlyData={roomMonthlyData} />}
                                    </>
                                ) : (
                                    yearlyRoom && <YearlyRevenueDashboard
                                        yearlyData={yearlyRoom}
                                        selectedYear={selectedYear}
                                        handleDrillDown={(month) => { setRoomDrillMonth(month); fetchRoomDrill(month); }}
                                    />
                                )
                            ) : (
                                /* ── Monthly: MonthlyRevenueDashboard with current month data ── */
                                roomData ? (
                                    <MonthlyRevenueDashboard monthlyData={roomData} />
                                ) : (
                                    <div className="text-muted text-center py-5">No room data for this period.</div>
                                )
                            )}
                        </div>
                    )}

                    {/* ══════════════ SERVICE TAB ══════════════ */}
                    {activeTab === 'service' && (
                        <div>
                            {/* Back button when drilled in */}
                            {serviceDrillMonth && (
                                <button className="btn btn-sm btn-outline-secondary mb-3 fw-semibold"
                                    onClick={() => { setServiceDrillMonth(null); setServiceMonthlyData([]); }}>
                                    <i className="bi bi-arrow-left me-1" />Back to Yearly Overview
                                </button>
                            )}

                            {periodMode === 'yearly' ? (
                                /* ── Yearly ── */
                                <YearlyServiceRevenueDashboard
                                    yearlyData={yearlyService}
                                    selectedYear={selectedYear}
                                    onMonthClick={(m) => { setServiceDrillMonth(m); fetchServiceDrill(m); }}
                                />
                            ) : (
                                /* Monthly: same layout as ServiceRevenueReportScreen */
                                <div className="row g-4">
                                    <div className="col-lg-5">
                                        <div className="card shadow-sm border-0 rounded-4 h-100">
                                            <div className="card-header bg-white py-3 border-0">
                                                <h5 className="fw-bold m-0 text-dark">Service Type Structure (%)</h5>
                                                <small className="text-muted">Service Revenue Proportion</small>
                                            </div>
                                            <div className="card-body d-flex align-items-center justify-content-center">
                                                <ExpensePieChart data={serviceData} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-7">
                                        <div className="card shadow-sm border-0 rounded-4 h-100">
                                            <div className="card-header bg-white py-3 border-0">
                                                <h5 className="fw-bold m-0 text-dark">Service Revenue Details</h5>
                                                <small className="fw-bold" style={{ color: '#0d9488' }}>Total: {fmt(totalServiceRev)} đ</small>
                                            </div>
                                            <div className="card-body p-0">
                                                {serviceData.length === 0 ? (
                                                    <div className="text-center p-5 text-muted">No service data available for this month</div>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover mb-0 align-middle text-center">
                                                            <thead className="bg-light">
                                                                <tr>
                                                                    <th className="text-start ps-4">Service Name / Group</th>
                                                                    <th>Usage Count</th>
                                                                    <th className="text-end pe-4">Revenue</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {serviceData.map((item, i) => (
                                                                    <tr key={i}>
                                                                        <td className="fw-bold text-start ps-4 text-dark">{item.category}</td>
                                                                        <td><span className="badge bg-secondary rounded-pill px-3 py-2">{item.usageCount} times</span></td>
                                                                        <td className="text-end pe-4 fw-bold" style={{ color: '#0d9488' }}>{fmt(item.amount)} đ</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {serviceDrillMonth && (
                                /* ── Drilled into a month: show pie + table ── */
                                <div className="row g-4">
                                    <div className="col-lg-5">
                                        <div className="card shadow-sm border-0 rounded-3 h-100">
                                            <div className="card-header bg-white py-3 border-0">
                                                <h5 className="fw-bold m-0 text-dark">Service Type Structure (%)</h5>
                                                <small className="text-muted">Month {serviceDrillMonth}/{selectedYear}</small>
                                            </div>
                                            <div className="card-body d-flex align-items-center justify-content-center">
                                                <ExpensePieChart data={serviceMonthlyData} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-7">
                                        <div className="card shadow-sm border-0 rounded-3 h-100">
                                            <div className="card-header bg-white py-3 border-0">
                                                <h5 className="fw-bold m-0 text-dark">Service Revenue Details</h5>
                                                <small className="text-success fw-bold">Total: {fmt(serviceMonthlyData.reduce((s, x) => s + (x.amount || 0), 0))} đ</small>
                                            </div>
                                            <div className="card-body p-0">
                                                <table className="table table-hover mb-0 align-middle text-center">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th className="text-start ps-4">Service Name / Group</th>
                                                            <th>Usage Count</th>
                                                            <th className="text-end pe-4">Revenue</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {serviceMonthlyData.map((item, i) => (
                                                            <tr key={i}>
                                                                <td className="fw-bold text-start ps-4 text-dark">{item.category}</td>
                                                                <td><span className="badge bg-secondary rounded-pill px-3 py-2">{item.usageCount} times</span></td>
                                                                <td className="text-end pe-4 fw-bold" style={{ color: '#0d9488' }}>{fmt(item.amount)} đ</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    )}

                    {activeTab === 'expense' && (
                        <div>
                            {periodMode === 'yearly' ? (
                                /* ── Yearly: Full YearlyExpenseDashboard ── */
                                <YearlyExpenseDashboard
                                    yearlyData={yearlyExpense}
                                    selectedYear={selectedYear}
                                    onMonthClick={(m) => navigate(`/report/expense?branchId=${selectedBranch}&year=${selectedYear}&month=${m}`)}
                                />
                            ) : (
                                /* ── Monthly: same layout as ExpenseReportScreen ── */
                                <div className="row g-4">
                                    <div className="col-lg-5">
                                        <div className="card shadow-sm border-0 rounded-4 h-100">
                                            <div className="card-header bg-white py-3 border-0">
                                                <h5 className="fw-bold m-0 text-dark">Expense Structure (%)</h5>
                                            </div>
                                            <div className="card-body d-flex align-items-center justify-content-center">
                                                <ExpensePieChart data={expenseData} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-7">
                                        <div className="card shadow-sm border-0 rounded-4 h-100">
                                            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="fw-bold m-0 text-dark">Category Details</h5>
                                                    <small className="text-danger fw-bold">Total Expenses: {fmt(totalExpenseAgg)} đ</small>
                                                </div>
                                                <button className="btn btn-sm btn-outline-warning px-3 fw-semibold"
                                                    style={{ fontSize: '0.75rem', borderRadius: 7 }}
                                                    onClick={() => navigate(`/report/expense?branchId=${selectedBranch}&year=${selectedYear}&month=${selectedMonth}`)}>
                                                    <i className="bi bi-box-arrow-up-right me-1" />Full Report
                                                </button>
                                            </div>
                                            <div className="card-body p-0">
                                                <table className="table table-hover mb-0 align-middle">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th className="ps-4">Category</th>
                                                            <th className="text-end">Amount</th>
                                                            <th className="text-center">MoM Growth</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {expenseData.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="fw-bold ps-4">{item.category}</td>
                                                                <td className={`text-end fw-bold ${item.amount ? 'text-danger' : 'text-muted'}`}>
                                                                    {item.amount ? fmt(item.amount) + ' đ' : 'N/A'}
                                                                </td>
                                                                <td className="text-center">
                                                                    {item.growth != null ? (
                                                                        <span className={`badge rounded-pill ${item.growth > 0 ? 'bg-danger-subtle text-danger' : item.growth < 0 ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
                                                                            {item.growth > 0 ? '↑ Up' : item.growth < 0 ? '↓ Down' : '-'} {Math.abs(item.growth).toFixed(1)}%
                                                                        </span>
                                                                    ) : <span className="text-muted small">-</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                </div>
            )}
        </div>
    );
};

export default AggregatedReportScreen;