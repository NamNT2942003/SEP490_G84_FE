import React, { useState } from 'react';
import { COLORS } from '@/constants';

const ACCENT = '#0d9488';

const PIE_COLORS = [
    '#0d9488', '#5396ff', '#f39c12', '#8b5cf6',
    '#e07b39', '#ec4899', '#198754', '#e74c3c',
    '#0ea5e9', '#a16207',
];

const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);
const fmtCur = (v) => fmt(v) + ' ₫';

/**
 * ServiceRevenueDetailTable
 * Props:
 *   monthlyData   : ServiceRevenueDetailDTO[]  — dữ liệu tháng đang xem
 *   selectedMonth : number                     — tháng đang xem (1-12)
 *   selectedYear  : number
 *   branchName    : string
 *   yearlyData    : YearlyRevenueDTO[]         — 12 tháng, để vẽ mini summary bar
 *   onMonthChange : (month: number) => void    — chuyển tháng
 *   onBack        : () => void                 — quay lại
 */
const ServiceRevenueDetailTable = ({
    monthlyData = [],
    selectedMonth,
    selectedYear,
    branchName = '',
    yearlyData = [],
    onMonthChange,
    onBack,
}) => {
    const [sortField, setSortField] = useState('amount');
    const [sortDir, setSortDir]     = useState('desc');
    const [searchQ, setSearchQ]     = useState('');

    /* ── Sort & Filter ─────────────────────────────────────────── */
    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filtered = monthlyData
        .filter(d => d.category?.toLowerCase().includes(searchQ.toLowerCase()))
        .sort((a, b) => {
            const mul = sortDir === 'asc' ? 1 : -1;
            if (sortField === 'amount')      return mul * ((a.amount || 0) - (b.amount || 0));
            if (sortField === 'usageCount')  return mul * ((a.usageCount || 0) - (b.usageCount || 0));
            if (sortField === 'growth')      return mul * ((a.growth ?? -9999) - (b.growth ?? -9999));
            return mul * (a.category || '').localeCompare(b.category || '');
        });

    /* ── Totals ─────────────────────────────────────────────────── */
    const totalRevenue    = monthlyData.reduce((s, d) => s + (d.amount || 0), 0);
    const totalUsage      = monthlyData.reduce((s, d) => s + (d.usageCount || 0), 0);
    const totalCategories = monthlyData.length;

    /* ── Month nav from yearlyData ──────────────────────────────── */
    const monthSummary = yearlyData.map((yd, i) => ({
        month: yd.monthValue ?? (i + 1),
        revenue: yd.revenue ?? 0,
        label: MONTH_NAMES[(yd.monthValue ?? (i + 1)) - 1] || `T${i + 1}`,
    }));
    const maxMonthRev = Math.max(...monthSummary.map(m => m.revenue), 1);

    /* ── Sort indicator ─────────────────────────────────────────── */
    const SortIcon = ({ field }) => {
        if (sortField !== field) return <i className="bi bi-arrow-down-up ms-1 opacity-25" style={{ fontSize: '0.7rem' }} />;
        return sortDir === 'asc'
            ? <i className="bi bi-arrow-up ms-1" style={{ fontSize: '0.7rem', color: ACCENT }} />
            : <i className="bi bi-arrow-down ms-1" style={{ fontSize: '0.7rem', color: ACCENT }} />;
    };

    return (
        <div className="animate__animated animate__fadeIn">
            {/* ── PAGE HEADER ───────────────────────────────────────── */}
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button
                            className="btn btn-sm btn-outline-secondary fw-semibold"
                            onClick={onBack}
                            style={{ borderRadius: '8px' }}
                        >
                            <i className="bi bi-arrow-left me-1" />Quay lại
                        </button>
                        <span
                            className="badge rounded-pill px-3 py-2 fw-bold"
                            style={{ backgroundColor: '#f0fdfa', color: ACCENT, border: `1px solid ${ACCENT}`, fontSize: '0.7rem' }}
                        >
                            BẢNG CHI TIẾT DỊCH VỤ
                        </span>
                    </div>
                    <h4 className="fw-bold text-dark m-0">
                        {MONTH_NAMES[(selectedMonth || 1) - 1]} / {selectedYear}
                        {branchName && <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.9rem' }}>— {branchName}</span>}
                    </h4>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.83rem' }}>
                        Tổng thu dịch vụ tháng này: <strong style={{ color: ACCENT }}>{fmtCur(totalRevenue)}</strong>
                    </p>
                </div>
            </div>

            {/* ── KPI CARDS ─────────────────────────────────────────── */}
            <div className="row g-3 mb-4">
                {[
                    {
                        label: 'TỔNG THU DỊCH VỤ', value: fmtCur(totalRevenue),
                        sub: `${selectedYear} • ${MONTH_NAMES[(selectedMonth || 1) - 1]}`,
                        border: ACCENT, icon: 'bi-currency-dollar',
                    },
                    {
                        label: 'TỔNG LƯỢT SỬ DỤNG', value: fmt(totalUsage) + ' lượt',
                        sub: 'Tổng tất cả dịch vụ trong tháng',
                        border: '#5396ff', icon: 'bi-graph-up',
                    },
                    {
                        label: 'NHÓM DỊCH VỤ', value: totalCategories + ' nhóm',
                        sub: 'Phân loại dịch vụ đã sử dụng',
                        border: '#f39c12', icon: 'bi-tag',
                    },
                    {
                        label: 'DOANH THU TB / NHÓM',
                        value: fmtCur(totalCategories > 0 ? Math.round(totalRevenue / totalCategories) : 0),
                        sub: 'Trung bình mỗi nhóm dịch vụ',
                        border: '#8b5cf6', icon: 'bi-calculator',
                    },
                ].map((kpi, i) => (
                    <div className="col-6 col-lg-3" key={i}>
                        <div
                            className="card shadow-sm border-0 rounded-4 p-3 h-100"
                            style={{ borderLeft: `4px solid ${kpi.border}` }}
                        >
                            <div className="d-flex align-items-start justify-content-between mb-1">
                                <p className="text-secondary text-uppercase fw-bold mb-0"
                                   style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
                                    {kpi.label}
                                </p>
                                <i className={`bi ${kpi.icon}`} style={{ color: kpi.border, fontSize: '1rem', opacity: 0.7 }} />
                            </div>
                            <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1rem' }}>{kpi.value}</h5>
                            <small className="text-muted" style={{ fontSize: '0.72rem' }}>{kpi.sub}</small>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* ── MONTHLY MINI BAR ───────────────────────────────── */}
                {monthSummary.length > 0 && (
                    <div className="col-12">
                        <div className="card shadow-sm border-0 rounded-4 p-3 mb-0">
                            <p className="text-secondary text-uppercase fw-bold mb-3"
                               style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                                DOANH THU DỊCH VỤ THEO THÁNG — NĂM {selectedYear}
                                &nbsp;<small className="text-muted fw-normal">(click để chuyển tháng)</small>
                            </p>
                            <div className="d-flex align-items-end gap-1" style={{ height: '80px' }}>
                                {monthSummary.map((ms) => {
                                    const isActive = ms.month === selectedMonth;
                                    const pct = ms.revenue > 0 ? Math.round((ms.revenue / maxMonthRev) * 100) : 2;
                                    return (
                                        <div
                                            key={ms.month}
                                            className="d-flex flex-column align-items-center flex-grow-1"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => onMonthChange && onMonthChange(ms.month)}
                                            title={`${ms.label}: ${fmtCur(ms.revenue)}`}
                                        >
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: `${pct}%`,
                                                    minHeight: '4px',
                                                    borderRadius: '4px 4px 0 0',
                                                    backgroundColor: isActive ? ACCENT : '#c7eae8',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isActive ? `0 0 0 2px ${ACCENT}` : 'none',
                                                }}
                                            />
                                            <span style={{
                                                fontSize: '0.6rem',
                                                color: isActive ? ACCENT : '#aaa',
                                                fontWeight: isActive ? 700 : 400,
                                                marginTop: '3px',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                T{ms.month}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MAIN TABLE ─────────────────────────────────────── */}
                <div className="col-12">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-header bg-white border-0 p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <p className="text-secondary text-uppercase fw-bold mb-0"
                               style={{ fontSize: '0.78rem', letterSpacing: '1px' }}>
                                CHI TIẾT DOANH THU THEO NHÓM DỊCH VỤ
                            </p>
                            {/* Search */}
                            <div className="input-group" style={{ maxWidth: '260px' }}>
                                <span className="input-group-text border-end-0 bg-white border-secondary-subtle">
                                    <i className="bi bi-search text-muted" style={{ fontSize: '0.8rem' }} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 border-secondary-subtle"
                                    placeholder="Tìm nhóm dịch vụ..."
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>
                        </div>

                        <div className="card-body p-0">
                            {filtered.length === 0 ? (
                                <div className="text-center p-5 text-muted">
                                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px', opacity: 0.3 }} />
                                    Không có dữ liệu dịch vụ cho tháng này
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0 align-middle" style={{ borderColor: '#f3f4f6' }}>
                                        <thead style={{ backgroundColor: '#f9fafb' }}>
                                            <tr>
                                                <th className="py-3 ps-4 text-secondary fw-bold" style={{ fontSize: '0.78rem', width: '40px' }}>#</th>
                                                <th
                                                    className="py-3 text-secondary fw-bold"
                                                    style={{ fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}
                                                    onClick={() => toggleSort('category')}
                                                >
                                                    DANH MỤC <SortIcon field="category" />
                                                </th>
                                                <th
                                                    className="py-3 text-end text-secondary fw-bold"
                                                    style={{ fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}
                                                    onClick={() => toggleSort('amount')}
                                                >
                                                    TỔNG DOANH THU <SortIcon field="amount" />
                                                </th>
                                                <th
                                                    className="py-3 pe-4 text-end text-secondary fw-bold"
                                                    style={{ fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}
                                                    onClick={() => toggleSort('netRevenue')}
                                                >
                                                    TỔNG THU VỀ <SortIcon field="netRevenue" />
                                                </th>
                                                <th
                                                    className="py-3 text-center pe-4 text-secondary fw-bold"
                                                    style={{ fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}
                                                    onClick={() => toggleSort('growth')}
                                                >
                                                    SO SÁNH THÁNG TRƯỚC <SortIcon field="growth" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((item, idx) => {
                                                const pct = totalRevenue > 0 ? ((item.amount || 0) / totalRevenue * 100) : 0;
                                                const color = PIE_COLORS[idx % PIE_COLORS.length];
                                                const isGrowthUp = item.growth > 0;
                                                const isGrowthNull = item.growth == null;

                                                return (
                                                    <tr key={idx} style={{ transition: 'background 0.15s' }}>
                                                        <td className="ps-4 text-muted" style={{ fontSize: '0.8rem' }}>{idx + 1}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div style={{
                                                                    width: '10px', height: '10px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: color,
                                                                    flexShrink: 0,
                                                                }} />
                                                                <span className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>
                                                                    {item.category || '(Khác)'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="text-end">
                                                            <span className="fw-bold" style={{ color: '#374151', fontSize: '0.9rem' }}>
                                                                {fmtCur(item.amount)}
                                                            </span>
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            <span className="fw-bold" style={{ color: ACCENT, fontSize: '0.9rem' }}>
                                                                {fmtCur(item.netRevenue)}
                                                            </span>
                                                        </td>
                                                        <td className="text-center pe-4">
                                                            {isGrowthNull ? (
                                                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                                                            ) : (
                                                                <span
                                                                    className={`badge rounded-pill fw-medium px-2 py-1 ${isGrowthUp ? 'bg-success-subtle text-success' : item.growth === 0 ? 'bg-secondary-subtle text-secondary' : 'bg-danger-subtle text-danger'}`}
                                                                    style={{ fontSize: '0.75rem', minWidth: '60px' }}
                                                                >
                                                                    {isGrowthUp ? 'Tăng' : item.growth === 0 ? 'Bằng' : 'Giảm'} {Math.abs(item.growth).toFixed(1)}%
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>

                                        {/* ── TOTALS ROW ─────────────────────────────── */}
                                        <tfoot>
                                            <tr style={{
                                                backgroundColor: '#f0fdfa',
                                                borderTop: `2px solid ${ACCENT}`,
                                            }}>
                                                <td className="ps-4" colSpan={2}>
                                                    <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                                                        <i className="bi bi-calculator me-2" style={{ color: ACCENT }} />
                                                        TỔNG CỘNG
                                                    </span>
                                                    <small className="ms-2 text-muted">({filtered.length} nhóm dịch vụ)</small>
                                                </td>
                                                <td className="text-end">
                                                    <span className="fw-bold" style={{ color: '#374151', fontSize: '1rem' }}>
                                                        {fmtCur(filtered.reduce((s, d) => s + (d.amount || 0), 0))}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <span className="fw-bold" style={{ color: ACCENT, fontSize: '1rem' }}>
                                                        {fmtCur(filtered.reduce((s, d) => s + (d.netRevenue || 0), 0))}
                                                    </span>
                                                </td>
                                                <td className="text-center pe-4 text-muted" style={{ fontSize: '0.8rem' }}>—</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceRevenueDetailTable;
