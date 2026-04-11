import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Line } from 'recharts';

const PIE_COLORS = ['#5396ff', '#f39c12', '#198754', '#8b5cf6', '#e07b39', '#ec4899', '#14b8a6', '#e74c3c'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RADIAN = Math.PI / 180;

const renderYearlyPieLabel = (totalRevenue) => ({ cx, cy, midAngle, outerRadius, percent, payload, index }) => {
    if (percent < 0.04) return null;
    const OFFSET = 14;
    const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const mx = cx + (outerRadius + OFFSET) * Math.cos(-midAngle * RADIAN);
    const my = cy + (outerRadius + OFFSET) * Math.sin(-midAngle * RADIAN);
    const isRight = Math.cos(-midAngle * RADIAN) >= 0;
    const ex = mx + (isRight ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = isRight ? 'start' : 'end';
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const name = payload.roomTypeName || payload.name;
    return (
        <g key={`yearly-label-${index}`}>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} fill="none" strokeWidth={1.5} />
            <circle cx={ex} cy={ey} r={2.5} fill={color} />
            <text
                x={ex + (isRight ? 4 : -4)}
                y={ey}
                textAnchor={textAnchor}
                fill="#333"
                fontSize={10}
                fontWeight={600}
                dominantBaseline="central"
            >
                {name} ({(percent * 100).toFixed(0)}%)
            </text>
        </g>
    );
};

const YearlyRevenueDashboard = ({ yearlyData, selectedYear, handleDrillDown }) => {
    const formatCurrency = (value) => new Intl.NumberFormat('en-US').format(value || 0);

    const CustomTooltipYearly = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow-sm">
                    <p className="fw-bold mb-2">{MONTH_NAMES[label - 1] || `Month ${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="mb-1" style={{ color: entry.color || entry.fill }}>
                            {entry.name}: {entry.name.includes('Growth') || entry.name.includes('Occupancy')
                                ? `${entry.value.toFixed(1)}%`
                                : `${formatCurrency(entry.value)} VND`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="animate__animated animate__fadeIn px-3 pb-4">
            <div className="d-flex justify-content-between align-items-end mb-3 border-bottom pb-2">
                <div>
                    <span className="badge rounded-pill px-3 py-2 mb-2 fw-bold" style={{ backgroundColor: '#fffcf5', color: '#f39c12', border: '1px solid #f39c12' }}>
                        ROOM REVENUE REPORT
                    </span>
                    <h5 className="fw-bold text-dark m-0">Year {selectedYear} &mdash; 12-Month Summary</h5>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.85rem' }}>Click on the chart bars to drill into monthly details</p>
                </div>
                <div className="text-end">
                    <p className="text-secondary mb-1" style={{ fontSize: '0.8rem' }}>Total Yearly Revenue</p>
                    <h4 className="fw-bold m-0" style={{ color: '#f39c12' }}>{formatCurrency(yearlyData.totalRevenue)} VND</h4>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: '4px solid #f39c12' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>TOTAL REVENUE</p>
                        <h5 className="fw-bold text-dark mb-1">{formatCurrency(yearlyData.totalRevenue)}</h5>
                        <div style={{ fontSize: '0.7rem', lineHeight: '1.6' }}>
                            <span style={{ color: '#198754', fontWeight: 600 }}>Direct: {formatCurrency(yearlyData.totalDirectRevenue || 0)}</span>
                            {(yearlyData.totalOtaRevenue > 0) && (
                                <span className="ms-2" style={{ color: '#e07b39', fontWeight: 600 }}>
                                    OTA: {formatCurrency(yearlyData.totalOtaRevenue)} <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.6rem' }} title="Pre-commission estimate"></i>
                                </span>
                            )}
                        </div>
                        <small className="text-muted">VND · 12-month cumulative</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>AVG. ADR</p>
                        <h5 className="fw-bold text-dark mb-1">{formatCurrency(yearlyData.averageAdr)}</h5>
                        <small className="text-muted">VND · Room rate / night</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: '4px solid #198754' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>TOTAL GUESTS</p>
                        <h5 className="fw-bold text-dark mb-1">{new Intl.NumberFormat('en-US').format(yearlyData.totalGuests)}</h5>
                        <small className="text-muted">Standard guests · yearly</small>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ borderLeft: '4px solid #6f42c1' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>AVG. OCCUPANCY</p>
                        <h5 className="fw-bold text-dark mb-1">{yearlyData.averageOccupancyRate}%</h5>
                        <small className="text-muted">12-month average</small>
                    </div>
                </div>
            </div>

            {/* Charts: Monthly Revenue (left) + Room Type Pie (right) */}
            <div className="row g-4 mb-4">
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>MONTHLY REVENUE (VND)</p>
                        <div style={{ width: '100%', height: '280px' }}>
                            <ResponsiveContainer>
                                <ComposedChart data={yearlyData.monthlyDetails} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                                    <XAxis dataKey="month" tickFormatter={(v) => MONTH_NAMES[v - 1] || `M${v}`} axisLine={false} tickLine={false} style={{ fontSize: '0.82rem' }} />
                                    <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} axisLine={false} tickLine={false} style={{ fontSize: '0.82rem' }} width={45} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} style={{ fontSize: '0.82rem' }} width={35} />
                                    <Tooltip content={<CustomTooltipYearly />} />
                                    <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{ paddingBottom: '8px' }} />
                                    <Bar yAxisId="left" name="Direct" dataKey="directRevenue" stackId="revenue" radius={[0, 0, 0, 0]} barSize={22} fill="#5396ff" onClick={(data) => handleDrillDown(data.month)} style={{ cursor: 'pointer' }} />
                                    <Bar yAxisId="left" name="OTA (est.)" dataKey="otaRevenue" stackId="revenue" radius={[4, 4, 0, 0]} barSize={22} fill="#e07b39" onClick={(data) => handleDrillDown(data.month)} style={{ cursor: 'pointer' }} />
                                    <Line yAxisId="right" name="Occupancy Rate" type="monotone" dataKey="occupancyRate" stroke="#6f42c1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>REVENUE BY ROOM TYPE</p>
                        <div style={{ width: '100%', height: '230px' }}>
                            <ResponsiveContainer>
                                <PieChart margin={{ top: 20, right: 65, bottom: 20, left: 65 }}>
                                    <Pie
                                        data={yearlyData.roomTypeRevenues}
                                        cx="50%" cy="50%" innerRadius={46} outerRadius={72}
                                        paddingAngle={3} dataKey="revenue" nameKey="roomTypeName"
                                        labelLine={false}
                                        label={renderYearlyPieLabel(yearlyData.totalRevenue)}
                                    >
                                        {yearlyData.roomTypeRevenues.map((entry, index) => (
                                            <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${formatCurrency(value)} VND`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="d-flex flex-wrap justify-content-center gap-2 mt-2" style={{ rowGap: '6px' }}>
                            {yearlyData.roomTypeRevenues.map((r, i) => (
                                <div key={i} className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: '#444' }}>
                                    <div style={{ width: '10px', height: '10px', backgroundColor: PIE_COLORS[i % PIE_COLORS.length], borderRadius: '50%', flexShrink: 0 }}></div>
                                    <span>{r.roomTypeName}</span>
                                    <span style={{ color: '#888' }}>({yearlyData.totalRevenue > 0 ? ((r.revenue / yearlyData.totalRevenue) * 100).toFixed(0) : 0}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simplified 12-Month Data Table */}
            <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-bottom-0 p-3 pb-0">
                    <p className="text-secondary text-uppercase fw-bold mb-0" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>12-MONTH SUMMARY TABLE</p>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 text-center align-middle" style={{ borderColor: '#f0f0f0' }}>
                            <thead style={{ backgroundColor: '#fafafa' }}>
                                <tr>
                                    <th className="py-3 text-secondary fw-bold text-start ps-4" style={{ fontSize: '0.82rem', letterSpacing: '0.8px' }}>MONTH</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>REVENUE (VND)</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>DIRECT / OTA</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>MoM GROWTH</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>OCCUPANCY</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>ADR (VND)</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.82rem' }}>GUESTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yearlyData.monthlyDetails.map((m) => (
                                    <tr
                                        key={m.month}
                                        className="border-bottom"
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: m.month === yearlyData.bestMonth ? '#f9fff9' : (m.month === yearlyData.worstMonth ? '#fff9f9' : '#fff')
                                        }}
                                        onClick={() => handleDrillDown(m.month)}
                                    >
                                        <td className="text-start ps-4 fw-bold py-2 text-dark">
                                            {MONTH_NAMES[m.month - 1]}
                                            {m.month === yearlyData.bestMonth && <i className="bi bi-star-fill text-warning ms-1" style={{ fontSize: '0.75rem' }}></i>}
                                            {m.month === yearlyData.worstMonth && <i className="bi bi-arrow-down-circle text-danger ms-1" style={{ fontSize: '0.75rem' }}></i>}
                                        </td>
                                        <td className="fw-medium text-dark">{formatCurrency(m.totalRevenue)}</td>
                                        <td style={{ fontSize: '0.75rem' }}>
                                            <span style={{ color: '#198754', fontWeight: 600 }}>{formatCurrency(m.directRevenue || 0)}</span>
                                            {(m.otaRevenue > 0) && (
                                                <span className="ms-1" style={{ color: '#e07b39', fontWeight: 600 }}>
                                                    / {formatCurrency(m.otaRevenue)}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {m.momGrowth != null ? (
                                                <span className={`badge rounded-pill fw-medium ${m.momGrowth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize: '0.72rem', minWidth: '56px' }}>
                                                    {m.momGrowth > 0 ? '↑' : m.momGrowth < 0 ? '↓' : ''} {Math.abs(m.momGrowth).toFixed(1)}%
                                                </span>
                                            ) : <span className="text-muted">—</span>}
                                        </td>
                                        <td className="fw-medium">{m.occupancyRate}%</td>
                                        <td className="fw-medium">{formatCurrency(m.adr)}</td>
                                        <td className="fw-medium">{m.totalStandardGuests}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default YearlyRevenueDashboard;
