import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { reportApi } from '../api/reportApi';
import { COLORS } from '@/constants';
import 'bootstrap/dist/css/bootstrap.min.css';

const PIE_COLORS = ['#4f81ff', '#20c997', '#fd7e14', '#e83e8c', '#6f42c1', '#198754'];
const BAR_COLORS = ['#4f81ff', '#20c997', '#fd7e14', '#e83e8c', '#6f42c1', '#198754'];

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);

const MultiBranchReportScreen = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Fetch authorized branches first
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await reportApi.getReportBranches();
                setBranches(data);
            } catch (error) {
                console.error("Fetch branches error:", error);
            }
        };
        fetchBranches();
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        if (branches.length > 0) {
            const fetchDashboard = async () => {
                setLoading(true);
                try {
                    const branchIds = branches.map(b => b.branchId);
                    const data = await reportApi.getMultiBranchDashboard(branchIds, selectedMonth, selectedYear);
                    setReportData(data);
                } catch (error) {
                    console.error("Fetch multi-branch error", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchDashboard();
        }
    }, [branches, selectedMonth, selectedYear]);

    // Data for Donut Chart (Tỉ trọng DT)
    const pieData = useMemo(() => {
        if (!reportData || !reportData.branchSummaries) return [];
        return reportData.branchSummaries.filter(b => b.totalRevenue > 0).map(b => ({
            name: b.branchName,
            value: b.totalRevenue
        }));
    }, [reportData]);

    // Data for Bar Chart
    const barDataList = useMemo(() => {
        if (!reportData || !reportData.monthlyTrends) return [];
        const trends = reportData.monthlyTrends;
        
        const grouped = {};
        trends.forEach(t => {
            const key = `${t.month}/${t.year}`;
            if (!grouped[key]) grouped[key] = { name: `Tháng ${t.month}`, sortKey: t.year * 100 + t.month };
            grouped[key][t.branchName] = t.revenue;
        });
        
        let sortedArray = Object.values(grouped).sort((a, b) => a.sortKey - b.sortKey);
        return sortedArray;
    }, [reportData]);

    // Data for Line Chart (Xu hướng 12 tháng)
    const lineDataList = useMemo(() => {
        if (!reportData || !reportData.monthlyTrends) return [];
        const grouped = {};
        reportData.monthlyTrends.forEach(t => {
            const key = `${t.month}/${t.year}`;
            if (!grouped[key]) grouped[key] = { name: `T${t.month}`, sortKey: t.year * 100 + t.month };
            grouped[key][t.branchName] = t.revenue;
        });
        return Object.values(grouped).sort((a, b) => a.sortKey - b.sortKey);
    }, [reportData]);

    // Data for Ranking
    const rankedBranches = useMemo(() => {
        if (!reportData || !reportData.branchSummaries) return [];
        return [...reportData.branchSummaries].sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [reportData]);

    const systemRev = reportData?.systemTotalRevenue || 0;
    const systemMom = reportData?.systemMomGrowth || 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow-sm opacity-100">
                    <p className="fw-bold mb-2">{label || payload[0]?.name}</p>
                    {payload.map((entry, idx) => (
                        <div key={idx} className="d-flex align-items-center mb-1">
                            <span 
                                style={{ width: 12, height: 12, backgroundColor: entry.fill || entry.color, borderRadius: '50%', marginRight: 8 }}
                            ></span>
                            <span className="me-3">{entry.name}:</span>
                            <span className="fw-bold">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container-fluid p-0 pb-5" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Header Area */}
            <div className="p-4 bg-white shadow-sm border-bottom mb-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="text-secondary fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Hệ Thống Khách Sạn</h4>
                        <h2 className="fw-bold m-0 text-dark">Báo cáo doanh thu đa cơ sở</h2>
                    </div>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-4">
                    <div className="d-flex flex-wrap gap-2">
                        {months.map(m => (
                            <button
                                key={m}
                                className={`btn btn-sm fw-semibold px-3 py-2 ${selectedMonth === m ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                style={{ borderRadius: '8px', minWidth: '48px' }}
                                onClick={() => setSelectedMonth(m)}
                                disabled={loading}
                            >
                                T{m}
                            </button>
                        ))}
                    </div>
                    <div>
                        <select 
                            className="form-select fw-semibold border-secondary shadow-sm" 
                            style={{ borderRadius: '8px' }}
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            disabled={loading}
                        >
                            {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="px-4">
                {/* Branch Tabs Mockup */}
                <div className="d-flex gap-3 mb-4 overflow-auto pb-2" style={{ whiteSpace: 'nowrap' }}>
                    <div className="px-4 py-2 bg-white border border-primary shadow-sm rounded-pill fw-bold text-primary" style={{ cursor: 'pointer' }}>
                        Tổng quan hệ thống
                    </div>
                    {branches.map(b => (
                        <div key={b.branchId} className="px-4 py-2 bg-white border shadow-sm rounded-pill fw-medium text-secondary" style={{ cursor: 'pointer' }}>
                            <span style={{color: '#6c757d', marginRight: '6px'}}>●</span> {b.branchName}
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                        <p className="mt-3 text-secondary fw-semibold">Đang tổng hợp dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ backgroundColor: '#fffdf6' }}>
                                    <h6 className="text-secondary fw-bold text-uppercase mb-2">TỔNG DT HỆ THỐNG</h6>
                                    <h3 className="fw-bold text-dark mb-2">{formatCurrency(systemRev)} đ</h3>
                                    {systemMom !== 0 && (
                                        <div className="d-inline-flex px-2 py-1 rounded bg-success-subtle text-success fw-bold" style={{ fontSize: '0.8rem' }}>
                                            {systemMom > 0 ? '↑' : '↓'} {Math.abs(systemMom)}% <span className="text-muted fw-normal ms-1">so tháng trước</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ backgroundColor: '#f8f9fa' }}>
                                    <h6 className="text-secondary fw-bold text-uppercase mb-2">TB LẤP KÍN</h6>
                                    <h3 className="fw-bold text-dark mb-2">{reportData?.systemAvgOccupancy || 0}%</h3>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Trung bình {branches.length} cơ sở</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ backgroundColor: '#f8f9fa' }}>
                                    <h6 className="text-secondary fw-bold text-uppercase mb-2">TB ADR</h6>
                                    <h3 className="fw-bold text-dark mb-2">{formatCurrency(reportData?.systemAvgAdr || 0)} đ</h3>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Giá phòng/đêm</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ backgroundColor: '#f8f9fa' }}>
                                    <h6 className="text-secondary fw-bold text-uppercase mb-2">TỔNG KHÁCH</h6>
                                    <h3 className="fw-bold text-dark mb-2">{reportData?.systemTotalGuests || 0}</h3>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Khách tiêu chuẩn</p>
                                </div>
                            </div>
                        </div>

                        {/* Top Charts Row */}
                        <div className="row g-4 mb-4">
                            <div className="col-lg-8">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                                    <h6 className="text-secondary fw-bold text-uppercase mb-4">
                                        DOANH THU {branches.length} CƠ SỞ TRONG NĂM {selectedYear}
                                    </h6>
                                    <div style={{ width: '100%', height: 320 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={barDataList} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6c757d', fontWeight: 500}} />
                                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} tick={{fill: '#6c757d'}} width={60} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend iconType="square" verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: '20px' }} />
                                                {branches.map((b, idx) => (
                                                    <Bar key={b.branchId} dataKey={b.branchName} fill={BAR_COLORS[idx % BAR_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                                    <h6 className="text-secondary fw-bold text-uppercase mb-4">
                                        TỈ TRỌNG DT THÁNG {selectedMonth}
                                    </h6>
                                    <div style={{ width: '100%', height: 320 }}>
                                        {pieData.length > 0 ? (
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%" cy="50%"
                                                        innerRadius={80} outerRadius={120}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend 
                                                        iconType="square" verticalAlign="top" 
                                                        formatter={(value, entry, index) => {
                                                            const percent = systemRev > 0 ? (entry.payload.value / systemRev * 100).toFixed(0) : 0;
                                                            return <span className="text-secondary fw-medium me-3">{value} {percent}%</span>
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-100 d-flex align-items-center justify-content-center text-muted">Chưa có dữ liệu</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Analytics Row */}
                        <div className="row g-4 pb-4">
                            {/* Lấp kín & ADR Progress */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                                    <h6 className="text-secondary fw-bold text-uppercase mb-4">LẤP KÍN % & ADR</h6>
                                    
                                    <p className="text-dark fw-bold mb-3" style={{ fontSize: '0.85rem' }}>Tỉ lệ lấp kín</p>
                                    {reportData?.branchSummaries?.map((b, idx) => (
                                        <div key={`occ-${b.branchId}`} className="d-flex align-items-center mb-3">
                                            <div style={{ width: 80 }} className="text-secondary fw-medium">{b.branchName}</div>
                                            <div className="flex-grow-1 mx-3" style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                                                <div style={{ width: `${b.occupancyRate}%`, height: '100%', backgroundColor: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: '4px' }}></div>
                                            </div>
                                            <div style={{ width: 50 }} className="text-end fw-bold text-dark">{b.occupancyRate}%</div>
                                        </div>
                                    ))}

                                    <div className="mt-4 mb-3" style={{ borderTop: '1px dashed #dee2e6' }}></div>

                                    <p className="text-dark fw-bold mb-3" style={{ fontSize: '0.85rem' }}>ADR (đ/đêm)</p>
                                    {reportData?.branchSummaries?.map((b, idx) => {
                                        const maxAdr = Math.max(...reportData.branchSummaries.map(x => x.adr || 0));
                                        const adrPercent = maxAdr > 0 ? ((b.adr || 0) / maxAdr) * 100 : 0;
                                        return (
                                            <div key={`adr-${b.branchId}`} className="d-flex align-items-center mb-3">
                                                <div style={{ width: 80 }} className="text-secondary fw-medium">{b.branchName}</div>
                                                <div className="flex-grow-1 mx-3" style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                                                    <div style={{ width: `${adrPercent}%`, height: '100%', backgroundColor: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: '4px' }}></div>
                                                </div>
                                                <div style={{ width: 50 }} className="text-end fw-bold text-dark">{(b.adr / 1000).toFixed(0)}K</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            {/* Trend Line Chart */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                                    <h6 className="text-secondary fw-bold text-uppercase mb-4">XU HƯỚNG DT TRONG NĂM {selectedYear}</h6>
                                    <div style={{ width: '100%', height: 320 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={lineDataList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6c757d', fontWeight: 500, fontSize: 12}} />
                                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} tick={{fill: '#6c757d', fontSize: 12}} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend iconType="square" verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                                            {branches.map((b, idx) => (
                                                <Line 
                                                    key={b.branchId} type="monotone" 
                                                    dataKey={b.branchName} 
                                                    stroke={BAR_COLORS[idx % BAR_COLORS.length]} 
                                                    strokeWidth={3} 
                                                    dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} 
                                                    activeDot={{ r: 6 }} 
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Ranking List */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                                    <h6 className="text-secondary fw-bold text-uppercase mb-4">XẾP HẠNG THÁNG {selectedMonth}</h6>
                                    
                                    <div className="mb-4">
                                        {rankedBranches.map((b, idx) => (
                                            <div key={`rank-${b.branchId}`} className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                                                <div className="d-flex align-items-center">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3" 
                                                        style={{ width: 30, height: 30, backgroundColor: idx === 0 ? '#f59e0b' : '#adb5bd' }}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="fw-medium text-dark">{b.branchName}</span>
                                                </div>
                                                <div className="text-end">
                                                    <span className="fw-bold d-block text-dark">{formatCurrency(b.totalRevenue)}</span>
                                                    {b.momGrowth != null && (
                                                        <span className={`fw-bold ${b.momGrowth >= 0 ? 'text-success' : 'text-danger'}`} style={{fontSize: '0.8rem'}}>
                                                            {b.momGrowth >= 0 ? '↑' : '↓'}{Math.abs(b.momGrowth)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto bg-light rounded-3 p-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-secondary fw-medium">Lấp kín cao nhất</span>
                                            <span className="fw-bold text-primary">
                                                {rankedBranches.length > 0 ? [...rankedBranches].sort((a,b)=>b.occupancyRate - a.occupancyRate)[0]?.branchName : ''} 
                                                &nbsp; {rankedBranches.length > 0 ? [...rankedBranches].sort((a,b)=>b.occupancyRate - a.occupancyRate)[0]?.occupancyRate + '%' : ''}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-secondary fw-medium">ADR cao nhất</span>
                                            <span className="fw-bold text-primary">
                                                {rankedBranches.length > 0 ? [...rankedBranches].sort((a,b)=>b.adr - a.adr)[0]?.branchName : ''} 
                                                &nbsp; {rankedBranches.length > 0 ? formatCurrency([...rankedBranches].sort((a,b)=>b.adr - a.adr)[0]?.adr) : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MultiBranchReportScreen;
