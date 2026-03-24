import React from 'react';
import { ComposedChart, BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#a5c8ff', '#7eb0ff', '#5396ff', '#2d7cff', '#004fc4', '#003380', '#001a40', '#cfdffe'];

const YearlyRevenueDashboard = ({ yearlyData, selectedYear, handleDrillDown }) => {
    const formatCurrency = (value) => new Intl.NumberFormat('en-US').format(value || 0);

    const getQuarterlyData = (details) => {
        if (!details || details.length === 0) return [];
        const quarters = [
            { name: 'Q1', revenue: 0 },
            { name: 'Q2', revenue: 0 },
            { name: 'Q3', revenue: 0 },
            { name: 'Q4', revenue: 0 },
        ];
        details.forEach(m => {
            const qIdx = Math.floor((m.month - 1) / 3);
            quarters[qIdx].revenue += m.totalRevenue;
        });
        return quarters;
    };

    const CustomTooltipYearly = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow-sm">
                    <p className="fw-bold mb-2">Month {label}</p>
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
            <div className="d-flex justify-content-between align-items-end mb-3 border-bottom pb-2" style={{ borderColor: '#f39c12 !important', borderBottomWidth: '2px !important' }}>
                <div>
                    <span className="badge rounded-pill px-3 py-2 mb-2 fw-bold" style={{ backgroundColor: '#fffcf5', color: '#f39c12', border: '1px solid #f39c12' }}>
                        ROOM REVENUE REPORT
                    </span>
                    <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-3">
                        Year {selectedYear} &mdash; 12-Month Summary
                    </h5>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.85rem' }}>Comprehensive business report - click on the chart to view monthly details</p>
                </div>
                <div className="text-end">
                    <p className="text-secondary mb-1" style={{ fontSize: '0.8rem' }}>Total Yearly Revenue</p>
                    <h4 className="fw-bold m-0" style={{ color: '#f39c12' }}>
                        {formatCurrency(yearlyData.totalRevenue)} VND
                    </h4>
                </div>
            </div>

            {/* KPI Metrics Row 1 */}
            <div className="row g-3 mb-3">
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100 border-start border-4" style={{ borderStartColor: '#f39c12 !important' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>TOTAL REVENUE</p>
                        <h5 className="fw-bold text-dark mb-1">{formatCurrency(yearlyData.totalRevenue)} VND</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>12-month cumulative</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100 border-start border-4 border-primary">
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>AVG. YEARLY ADR</p>
                        <h5 className="fw-bold text-dark mb-1">{formatCurrency(yearlyData.averageAdr)} VND</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>Room rate / night</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100 border-start border-4 border-success">
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>TOTAL GUESTS</p>
                        <h5 className="fw-bold text-dark mb-1">{new Intl.NumberFormat('en-US').format(yearlyData.totalGuests)}</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>Standard guests</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100 border-start border-4" style={{ borderStartColor: '#6f42c1 !important' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>AVG. OCCUPANCY RATE</p>
                        <h5 className="fw-bold text-dark mb-1">{yearlyData.averageOccupancyRate}%</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>12-month average</p>
                    </div>
                </div>
            </div>

            {/* KPI Metrics Row 2 */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ backgroundColor: '#f2f9f6' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>BEST MONTH</p>
                        <h5 className="fw-bold text-success mb-1">Month {yearlyData.bestMonth}</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{formatCurrency(yearlyData.bestMonthRevenue)} VND</p>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ backgroundColor: '#fdf2f2' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>WORST MONTH</p>
                        <h5 className="fw-bold text-danger mb-1">Month {yearlyData.worstMonth}</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{formatCurrency(yearlyData.worstMonthRevenue)} VND</p>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100" style={{ backgroundColor: '#f0f6ff' }}>
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>YEARLY GROWTH</p>
                        <h5 className="fw-bold text-primary mb-1">
                            {yearlyData.yearlyGrowth > 0 ? '+' : ''}{yearlyData.yearlyGrowth}%
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>Month 12 vs Month 1</p>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row g-4 mb-4">
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>MONTHLY REVENUE (VND)</p>
                        <div style={{ width: '100%', height: '260px' }}>
                            <ResponsiveContainer>
                                <ComposedChart data={yearlyData.monthlyDetails} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} axisLine={false} tickLine={false} style={{fontSize: '0.85rem'}} />
                                    <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} style={{fontSize: '0.85rem'}} width={45} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} style={{fontSize: '0.85rem'}} width={35} />
                                    <Tooltip content={<CustomTooltipYearly />} />
                                    <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{ paddingBottom: '10px' }} />
                                    <Bar yAxisId="left" name="Revenue" dataKey="totalRevenue" fill="#5396ff" radius={[4, 4, 0, 0]} barSize={20} onClick={(data) => handleDrillDown(data.month)} style={{ cursor: 'pointer' }}>
                                        {yearlyData.monthlyDetails.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.month === yearlyData.bestMonth ? '#f39c12' : '#5396ff'} />
                                        ))}
                                    </Bar>
                                    <Line yAxisId="right" name="MoM Growth" type="monotone" dataKey="momGrowth" stroke="#0d6efd" strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>REVENUE BY ROOM TYPE</p>
                        <div style={{ width: '100%', height: '260px' }} className="d-flex flex-column align-items-center justify-content-center">
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie 
                                        data={yearlyData.roomTypeRevenues} 
                                        cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="revenue"
                                        nameKey="roomTypeName"
                                    >
                                        {yearlyData.roomTypeRevenues.map((entry, index) => (
                                            <Cell key={`pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${formatCurrency(value)} VND`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="d-flex flex-wrap justify-content-center gap-3 mt-2">
                                {yearlyData.roomTypeRevenues.map((r, i) => (
                                    <div key={i} className="d-flex align-items-center" style={{ fontSize: '0.85rem', color: '#555' }}>
                                        <div style={{ width: '12px', height: '12px', backgroundColor: PIE_COLORS[i % PIE_COLORS.length], borderRadius: '2px', marginRight: '6px' }}></div>
                                        {r.roomTypeName} ({yearlyData.totalRevenue > 0 ? ((r.revenue / yearlyData.totalRevenue) * 100).toFixed(0) : 0}%)
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row g-4 mb-4">
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>QUARTERLY REVENUE</p>
                        <div style={{ width: '100%', height: '240px' }}>
                            <ResponsiveContainer>
                                <BarChart data={getQuarterlyData(yearlyData.monthlyDetails)} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '0.85rem'}} />
                                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} style={{fontSize: '0.85rem'}} width={45} />
                                    <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => `${formatCurrency(value)} VND`} />
                                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                                        {getQuarterlyData(yearlyData.monthlyDetails).map((entry, index) => (
                                            <Cell key={`cell-q-${index}`} fill={['#a5c8ff', '#7eb0ff', '#5396ff', '#2d7cff'][index % 4]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 rounded-4 p-3 h-100">
                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>MONTHLY OCCUPANCY RATE & ADR</p>
                        <div style={{ width: '100%', height: '240px' }}>
                            <ResponsiveContainer>
                                <LineChart data={yearlyData.monthlyDetails} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} axisLine={false} tickLine={false} style={{fontSize: '0.85rem'}} />
                                    <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} style={{fontSize: '0.85rem'}} width={35} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} axisLine={false} tickLine={false} domain={['auto', 'auto']} style={{fontSize: '0.85rem'}} width={45} />
                                    <Tooltip content={<CustomTooltipYearly />} />
                                    <Line yAxisId="left" type="monotone" name="Occupancy" dataKey="occupancyRate" stroke="#004fc4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line yAxisId="right" type="monotone" name="ADR" dataKey="adr" stroke="#f39c12" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table View */}
            <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-bottom-0 p-3 pb-0">
                    <p className="text-secondary text-uppercase fw-bold mb-0" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>12-MONTH DETAILED DATA TABLE</p>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 text-center align-middle" style={{ borderColor: '#f0f0f0' }}>
                            <thead style={{ backgroundColor: '#fafafa' }}>
                                <tr>
                                    <th className="py-3 text-secondary fw-bold text-start ps-4" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>MONTH</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>REVENUE (VND)</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>GROWTH</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>OCCUPANCY %</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>ADR (VND)</th>
                                    <th className="py-3 text-secondary fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>GUESTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yearlyData.monthlyDetails.map((m) => (
                                    <tr key={m.month} className="border-bottom" style={{ cursor: 'pointer', backgroundColor: m.month === yearlyData.bestMonth ? '#f9fffa' : (m.month === yearlyData.worstMonth ? '#fffafa' : '#fff') }} onClick={() => handleDrillDown(m.month)}>
                                        <td className="text-start ps-4 fw-bold py-3 text-dark">
                                            M{m.month} {m.month === yearlyData.bestMonth && <i className="bi bi-star-fill text-warning ms-1" style={{fontSize:'0.8rem'}}></i>}
                                        </td>
                                        <td className="fw-medium text-dark">{formatCurrency(m.totalRevenue)}</td>
                                        <td>
                                            {m.momGrowth != null ? (
                                                <span className={`badge ${m.momGrowth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill fw-medium`} style={{ fontSize: '0.75rem', minWidth: '60px' }}>
                                                    {m.momGrowth > 0 ? '↑' : (m.momGrowth < 0 ? '↓' : '')} {Math.abs(m.momGrowth).toFixed(1)}%
                                                </span>
                                            ) : <span className="text-muted">—</span>}
                                        </td>
                                        <td className="fw-medium text-dark">{m.occupancyRate}%</td>
                                        <td className="fw-medium text-dark">{formatCurrency(m.adr)}</td>
                                        <td className="fw-medium text-dark">{m.totalStandardGuests}</td>
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
