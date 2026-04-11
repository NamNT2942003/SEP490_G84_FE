import React from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const ACCENT = '#e74c3c'; // red accent for expenses
const PIE_COLORS = ['#e74c3c', '#f39c12', '#8b5cf6', '#e07b39', '#14b8a6', '#ec4899', '#198754', '#3498db'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RADIAN = Math.PI / 180;

const formatCurrency = (v) => new Intl.NumberFormat('en-US').format(v || 0);

// Attach MoM growth to each month entry
const enrichData = (data) => {
    if (!data || data.length === 0) return [];
    return data.map((item, i) => {
        const monthName = MONTH_NAMES[item.monthValue - 1] || item.monthLabel;
        const prev = data[i - 1];
        const momGrowth = prev && prev.revenue > 0
            ? (((item.revenue - prev.revenue) / prev.revenue) * 100)
            : null;
        return { ...item, monthLabel: monthName, momGrowth };
    });
};

const renderOuterLabel = ({ cx, cy, midAngle, outerRadius, percent, payload, index }) => {
    if (percent < 0.04) return null;
    const OFFSET = 14;
    const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const mx = cx + (outerRadius + OFFSET) * Math.cos(-midAngle * RADIAN);
    const my = cy + (outerRadius + OFFSET) * Math.sin(-midAngle * RADIAN);
    const isRight = Math.cos(-midAngle * RADIAN) >= 0;
    const ex = mx + (isRight ? 1 : -1) * 12;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    return (
        <g key={`exp-label-${index}`}>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${my}`} stroke={color} fill="none" strokeWidth={1.5} />
            <circle cx={ex} cy={my} r={2.5} fill={color} />
            <text
                x={ex + (isRight ? 4 : -4)}
                y={my}
                textAnchor={isRight ? 'start' : 'end'}
                fill="#333" fontSize={10} fontWeight={600} dominantBaseline="central"
            >
                {payload.category || payload.name} ({(percent * 100).toFixed(0)}%)
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white p-3 border rounded shadow-sm">
            <p className="fw-bold mb-2">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="mb-1" style={{ color: entry.color || entry.fill }}>
                    {entry.name}: {entry.name?.includes('Growth')
                        ? `${Number(entry.value).toFixed(1)}%`
                        : `${formatCurrency(entry.value)} VND`}
                </p>
            ))}
        </div>
    );
};

const YearlyExpenseDashboard = ({ yearlyData, selectedYear, onMonthClick }) => {
    const data = enrichData(yearlyData);
    if (!data.length) return <div className="text-center p-5 text-muted">No data available</div>;

    const now = new Date();
    const realCurrentYear = now.getFullYear();
    const realCurrentMonth = now.getMonth() + 1; // 1-12

    const totalExpense = data.reduce((s, d) => s + (d.revenue || 0), 0);
    const avgMonthly = totalExpense / 12;
    const best = data.reduce((a, b) => (a.revenue || 0) < (b.revenue || 0) ? a : b); // lowest expense = best
    const worst = data.reduce((a, b) => (a.revenue || 0) > (b.revenue || 0) ? a : b); // highest expense = worst

    // Count months that need reports
    const pendingMonths = data.filter(m => {
        const hasData = (m.revenue || 0) > 0;
        const isPastOrCurrent = selectedYear < realCurrentYear || (selectedYear === realCurrentYear && m.monthValue <= realCurrentMonth);
        return !hasData && isPastOrCurrent;
    }).length;

    // Build fake category pie from yearly (we use month data as proxy if no category breakdown)
    // Since API only gives monthly totals, we show monthly distribution as pie
    const pieData = data.map(d => ({ name: d.monthLabel, category: d.monthLabel, value: d.revenue || 0 })).filter(d => d.value > 0);

    return (
        <div className="animate__animated animate__fadeIn px-3 pb-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-end mb-3 border-bottom pb-2">
                <div>
                    <span className="badge rounded-pill px-3 py-2 mb-2 fw-bold"
                        style={{ backgroundColor: '#fff5f5', color: ACCENT, border: `1px solid ${ACCENT}` }}>
                        EXPENSE REPORT
                    </span>
                    <h5 className="fw-bold text-dark m-0">Year {selectedYear} &mdash; 12-Month Summary</h5>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.85rem' }}>Click on bars to view monthly details</p>
                </div>
                <div className="text-end">
                    <p className="text-secondary mb-1" style={{ fontSize: '0.8rem' }}>Total Yearly Expenses</p>
                    <h4 className="fw-bold m-0" style={{ color: ACCENT }}>{formatCurrency(totalExpense)} VND</h4>
                </div>
            </div>

            {/* Pending alert banner */}
            {pendingMonths > 0 && (
                <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center mb-4 rounded-4">
                    <i className="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning"></i>
                    <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1 text-dark">
                            {pendingMonths} month{pendingMonths > 1 ? 's' : ''} pending expense declaration
                        </h6>
                        <span className="small text-secondary">
                            Look for the <span className="badge bg-warning text-dark" style={{ fontSize: '0.68rem' }}>⚠ Pending</span> badges in the table below and click to submit reports.
                        </span>
                    </div>
                </div>
            )}

            {/* 4 KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: `4px solid ${ACCENT}` }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>TOTAL EXPENSES</p>
                        <h5 className="fw-bold text-dark mb-1">{formatCurrency(totalExpense)}</h5>
                        <small className="text-muted">VND · 12-month cumulative</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: '4px solid #f39c12' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>AVG. MONTHLY</p>
                        <h5 className="fw-bold text-dark mb-1">{formatCurrency(Math.round(avgMonthly))}</h5>
                        <small className="text-muted">VND · per month</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: '4px solid #198754' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>LOWEST MONTH</p>
                        <h5 className="fw-bold text-dark mb-1">{best.monthLabel}</h5>
                        <small className="text-muted">{formatCurrency(best.revenue)} VND</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: '4px solid #8b5cf6' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>HIGHEST MONTH</p>
                        <h5 className="fw-bold text-dark mb-1">{worst.monthLabel}</h5>
                        <small className="text-muted">{formatCurrency(worst.revenue)} VND</small>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="row g-4 mb-4">
                {/* Monthly Bar + MoM Line */}
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>MONTHLY EXPENSES (VND)</p>
                        <div style={{ width: '100%', height: '280px' }}>
                            <ResponsiveContainer>
                                <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                                    <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} style={{ fontSize: '0.8rem' }} />
                                    <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} axisLine={false} tickLine={false} style={{ fontSize: '0.8rem' }} width={45} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v?.toFixed(0)}%`} axisLine={false} tickLine={false} style={{ fontSize: '0.8rem' }} width={35} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{ paddingBottom: '8px' }} />
                                    <Bar yAxisId="left" name="Expenses" dataKey="revenue" radius={[4, 4, 0, 0]} barSize={22}
                                        onClick={(d) => onMonthClick(d.monthValue)} style={{ cursor: 'pointer' }}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`}
                                                fill={entry.revenue === worst.revenue ? ACCENT : '#7eb0ff'} />
                                        ))}
                                    </Bar>
                                    <Line yAxisId="right" name="MoM Growth" type="monotone" dataKey="momGrowth"
                                        stroke="#f39c12" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                {/* Monthly Distribution Pie */}
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>MONTHLY DISTRIBUTION</p>
                        <div style={{ width: '100%', height: '230px' }}>
                            <ResponsiveContainer>
                                <PieChart margin={{ top: 20, right: 65, bottom: 20, left: 65 }}>
                                    <Pie data={pieData} cx="50%" cy="50%"
                                        innerRadius={46} outerRadius={72}
                                        paddingAngle={3} dataKey="value"
                                        labelLine={false} label={renderOuterLabel}>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${formatCurrency(v)} VND`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="d-flex flex-wrap justify-content-center gap-2 mt-1" style={{ rowGap: '5px' }}>
                            {pieData.map((d, i) => (
                                <div key={i} className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', color: '#444' }}>
                                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                    <span>{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 12-Month Table */}
            <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-bottom-0 p-3 pb-0">
                    <p className="text-secondary text-uppercase fw-bold mb-0" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>12-MONTH SUMMARY TABLE</p>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 text-center align-middle" style={{ borderColor: '#f0f0f0' }}>
                            <thead style={{ backgroundColor: '#fafafa' }}>
                                <tr>
                                    <th className="py-3 text-secondary fw-bold text-start ps-4" style={{ fontSize: '0.82rem' }}>MONTH</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>EXPENSES (VND)</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>STATUS</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>MoM CHANGE</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((m, i) => {
                                    const hasData = (m.revenue || 0) > 0;
                                    const isCurrentMonth = selectedYear === realCurrentYear && m.monthValue === realCurrentMonth;
                                    const isPast = selectedYear < realCurrentYear || (selectedYear === realCurrentYear && m.monthValue < realCurrentMonth);
                                    const isFuture = selectedYear > realCurrentYear || (selectedYear === realCurrentYear && m.monthValue > realCurrentMonth);

                                    let statusBadge;
                                    if (hasData) {
                                        statusBadge = <span className="badge bg-success-subtle text-success fw-semibold px-2 py-1" style={{ fontSize: '0.72rem' }}><i className="bi bi-check-circle-fill me-1" />Declared</span>;
                                    } else if (isCurrentMonth) {
                                        statusBadge = <span className="badge bg-warning text-dark fw-semibold px-2 py-1" style={{ fontSize: '0.72rem' }}><i className="bi bi-exclamation-triangle-fill me-1" />Pending</span>;
                                    } else if (isPast) {
                                        statusBadge = <span className="badge bg-danger-subtle text-danger fw-semibold px-2 py-1" style={{ fontSize: '0.72rem' }}><i className="bi bi-x-circle-fill me-1" />No Report</span>;
                                    } else {
                                        statusBadge = <span className="badge bg-light text-muted fw-semibold px-2 py-1" style={{ fontSize: '0.72rem' }}><i className="bi bi-clock me-1" />Upcoming</span>;
                                    }

                                    let actionBtn;
                                    if (isCurrentMonth && !hasData) {
                                        actionBtn = (
                                            <button className="btn btn-sm btn-primary fw-bold px-3 py-1 shadow-sm" style={{ fontSize: '0.78rem', borderRadius: 8 }}
                                                onClick={(e) => { e.stopPropagation(); onMonthClick(m.monthValue); }}>
                                                <i className="bi bi-plus-circle me-1" />Create Report
                                            </button>
                                        );
                                    } else if (hasData) {
                                        actionBtn = (
                                            <button className="btn btn-sm btn-outline-secondary fw-semibold px-3 py-1" style={{ fontSize: '0.75rem', borderRadius: 8 }}
                                                onClick={(e) => { e.stopPropagation(); onMonthClick(m.monthValue); }}>
                                                <i className="bi bi-eye me-1" />View
                                            </button>
                                        );
                                    } else if (isPast) {
                                        actionBtn = (
                                            <button className="btn btn-sm btn-outline-danger fw-semibold px-3 py-1" style={{ fontSize: '0.75rem', borderRadius: 8 }}
                                                onClick={(e) => { e.stopPropagation(); onMonthClick(m.monthValue); }}>
                                                <i className="bi bi-pencil-square me-1" />Declare
                                            </button>
                                        );
                                    } else {
                                        actionBtn = <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>;
                                    }

                                    return (
                                        <tr key={i}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: isCurrentMonth && !hasData ? '#fffbe6' : m.revenue === worst.revenue ? '#fff5f5' : m.revenue === best.revenue ? '#f5fff8' : '#fff',
                                                borderLeft: isCurrentMonth ? '3px solid #f39c12' : 'none'
                                            }}
                                            onClick={() => onMonthClick(m.monthValue)}>
                                            <td className="text-start ps-4 fw-bold py-3 text-dark">
                                                {m.monthLabel}
                                                {isCurrentMonth && <span className="badge bg-primary ms-2" style={{ fontSize: '0.6rem', verticalAlign: 'middle' }}>Current</span>}
                                                {m.revenue === worst.revenue && <i className="bi bi-arrow-up-circle text-danger ms-1" style={{ fontSize: '0.75rem' }}></i>}
                                                {m.revenue === best.revenue && m.revenue !== worst.revenue && <i className="bi bi-arrow-down-circle text-success ms-1" style={{ fontSize: '0.75rem' }}></i>}
                                            </td>
                                            <td className="fw-medium" style={{ color: m.revenue > 0 ? ACCENT : '#aaa' }}>{formatCurrency(m.revenue)}</td>
                                            <td>{statusBadge}</td>
                                            <td>
                                                {m.momGrowth != null ? (
                                                    <span className={`badge rounded-pill fw-medium ${m.momGrowth > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}
                                                        style={{ fontSize: '0.72rem', minWidth: '56px' }}>
                                                        {m.momGrowth > 0 ? '↑' : '↓'} {Math.abs(m.momGrowth).toFixed(1)}%
                                                    </span>
                                                ) : <span className="text-muted">—</span>}
                                            </td>
                                            <td>{actionBtn}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YearlyExpenseDashboard;

