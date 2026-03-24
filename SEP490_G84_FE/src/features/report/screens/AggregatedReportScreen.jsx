import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { reportApi } from '../api/reportApi';
import { COLORS } from '@/constants';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#20c997', '#ffc107', '#0dcaf0'];

const AggregatedReportScreen = () => {
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    
    const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'

    const [branches, setBranches] = useState([]);
    const [roomData, setRoomData] = useState(null);
    const [serviceData, setServiceData] = useState([]);
    const [expenseData, setExpenseData] = useState([]);
    const [loading, setLoading] = useState(false);

    const START_YEAR = 2024;
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => START_YEAR + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await reportApi.getReportBranches();
                setBranches(data);
                if (data && data.length > 0) {
                    setSelectedBranch(data[0].branchId);
                }
            } catch (error) {
                console.error("Lỗi khi load danh sách chi nhánh:", error);
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch && selectedMonth && selectedYear) {
            const fetchAllData = async () => {
                setLoading(true);
                try {
                    const [room, service, expense] = await Promise.all([
                        reportApi.getRoomRevenue(selectedBranch, selectedMonth, selectedYear).catch(() => null),
                        reportApi.getMonthlyServiceRevenue(selectedBranch, selectedMonth, selectedYear).catch(() => []),
                        reportApi.getMonthlyExpenses(selectedBranch, selectedMonth, selectedYear).catch(() => [])
                    ]);
                    setRoomData(room);
                    setServiceData(service);
                    setExpenseData(expense);
                } catch (error) {
                    console.error("Fetch aggregated data error", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchAllData();
        }
    }, [selectedBranch, selectedMonth, selectedYear]);

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        
        const roomExcelData = [];
        roomExcelData.push(["DOANH THU PHÒNG", "", "", "", "", ""]);
        
        const roomRevenues = roomData?.roomRevenues || [];
        
        const row1 = [`Tổng doanh thu: ${roomData ? formatCurrency(roomData.totalRevenue) : 0}`];
        for (let i = 1; i < roomRevenues.length; i++) row1.push(""); 
        row1.push("So sánh tháng trước (tăng/giảm bao nhiêu %)");
        row1.push("Tỉ lệ lấp kín phòng (%)");
        row1.push("Trung bình giá phòng/đêm");
        row1.push("Tổng số lượng khách trong tháng");
        roomExcelData.push(row1);

        const row2 = [];
        roomRevenues.forEach(r => row2.push(r.roomTypeName));
        if (roomRevenues.length === 0) row2.push("Phòng");
        
        if (roomData) {
            row2.push(roomData.momGrowth > 0 ? `Tăng ${roomData.momGrowth}%` : (roomData.momGrowth < 0 ? `Giảm ${Math.abs(roomData.momGrowth)}%` : "-"));
            row2.push(`${roomData.occupancyRate}%`);
            row2.push(roomData.adr);
            row2.push(roomData.totalStandardGuests);
        } else {
            row2.push("-", "-", "-", "-");
        }
        roomExcelData.push(row2);

        const row3 = [];
        roomRevenues.forEach(r => row3.push(r.revenue));
        if (roomRevenues.length === 0) row3.push(0);
        row3.push("", "", "", ""); 
        roomExcelData.push(row3);
        
        roomExcelData.push([]); roomExcelData.push([]);

        const offset = roomRevenues.length > 0 ? roomRevenues.length - 1 : 1; 
        const padding = Array(Math.max(offset, 1)).fill("");

        roomExcelData.push([...padding, "DOANH THU DỊCH VỤ", "", "", ""]);
        roomExcelData.push([...padding, "Danh mục", "Tổng doanh thu", "Số lượt sử dụng", "So sánh DT tháng trước (tăng/giảm)"]);
        let totalServiceRev = 0;
        serviceData.forEach(s => {
            roomExcelData.push([...padding, s.category, s.amount, s.usageCount, "-"]);
            totalServiceRev += s.amount;
        });
        roomExcelData.push([...padding, "TOTAL", totalServiceRev, "", ""]);
        
        roomExcelData.push([]); roomExcelData.push([]);

        roomExcelData.push([...padding, "BÁO CÁO CHI PHÍ", "", "", ""]);
        roomExcelData.push([...padding, "Danh mục", "Tổng chi", "So sánh tháng trước (%)", "Note"]);
        let totalExpense = 0;
        expenseData.forEach(e => {
            roomExcelData.push([
                ...padding, e.category, e.amount, 
                e.growth !== null && e.growth !== undefined ? (e.growth > 0 ? `Tăng ${e.growth}%` : `Giảm ${Math.abs(e.growth)}%`) : "-", 
                e.note || ""
            ]);
            totalExpense += (e.amount || 0);
        });
        roomExcelData.push([...padding, "TOTAL", totalExpense, "", ""]);
        
        const ws = XLSX.utils.aoa_to_sheet(roomExcelData);
        ws['!cols'] = [ { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 } ];
        XLSX.utils.book_append_sheet(wb, ws, `BaoCao_T${selectedMonth}_${selectedYear}`);
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, `TongHop_BaoCao_T${selectedMonth}_${selectedYear}.xlsx`);
    };

    const roomRevenues = roomData?.roomRevenues || [];
    const N = Math.max(roomRevenues.length, 1);
    
    // Derived values for dashboard
    const totalRoomRev = roomData?.totalRevenue || 0;
    const totalServiceRev = serviceData.reduce((sum, s) => sum + s.amount, 0);
    const totalExpenseAgg = expenseData.reduce((sum, e) => sum + (e.amount || 0), 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border rounded shadow-sm">
                    <p className="mb-0 fw-bold">{payload[0].name || payload[0].payload.name}</p>
                    <p className="mb-0" style={{ color: payload[0].payload.fill || payload[0].color }}>
                        {formatCurrency(payload[0].value)} VND
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container-fluid p-0" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh', paddingBottom: '40px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-white shadow-sm rounded-bottom-4">
                <h2 className="fw-bold m-0" style={{ color: COLORS.PRIMARY, letterSpacing: '0.5px' }}>
                    AGGREGATED REPORT - MONTH {selectedMonth}/{selectedYear}
                </h2>
                
                <div className="d-flex gap-3">
                    <div className="btn-group shadow-sm" style={{ borderRadius: '8px' }}>
                        <button 
                            className={`btn fw-bold px-3 ${viewMode === 'chart' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('chart')}
                        >
                            <i className="bi bi-pie-chart-fill me-2"></i> Dashboard View
                        </button>
                        <button 
                            className={`btn fw-bold px-3 ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <i className="bi bi-table me-2"></i> Excel Layout
                        </button>
                    </div>

                    <button 
                        className="btn btn-success fw-bold px-4 shadow-sm"
                        onClick={handleExportExcel}
                        disabled={loading || (!roomData && serviceData.length === 0 && expenseData.length === 0)}
                        style={{ borderRadius: '8px' }}
                    >
                        <i className="bi bi-file-earmark-excel me-2"></i> Export to Excel
                    </button>
                </div>
            </div>

            <div className="mx-4 mb-4">
                <div className="card shadow-sm border-0 p-4" style={{ borderRadius: '12px' }}>
                    <div className="row g-3 align-items-end mb-3">
                        <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Branch</label>
                            <select 
                                className="form-select" 
                                value={selectedBranch || ''} 
                                onChange={(e) => setSelectedBranch(Number(e.target.value))}
                                disabled={branches.length === 0}
                                style={{ borderRadius: '8px' }}
                            >
                                {branches.length === 0 ? <option>Loading...</option> : branches.map(b => (
                                    <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Year</label>
                            <select 
                                className="form-select" 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                style={{ borderRadius: '8px' }}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <label className="form-label fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Month</label>
                    <div className="d-flex flex-wrap gap-2">
                        {months.map(m => (
                            <button
                                key={m}
                                className={`btn btn-sm fw-semibold px-3 py-2 ${selectedMonth === m ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                style={{ borderRadius: '20px', minWidth: '52px', transition: 'all 0.15s ease' }}
                                onClick={() => setSelectedMonth(m)}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-5 mt-5">
                    <div className="spinner-border" style={{color: COLORS.PRIMARY, width: '3rem', height: '3rem'}}></div>
                    <div className="mt-3 text-secondary fw-semibold">Loading Report Data...</div>
                </div>
            ) : (
                <div className="animate__animated animate__fadeInUp px-4 pb-5">
                    
                    {/* ===== DASHBOARD CHART VIEW ===== */}
                    {viewMode === 'chart' && (
                        <>
                            {/* Dashboard Top Header */}
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>MONTHLY REPORT</p>
                                    <h3 className="fw-bold text-dark m-0">Month {selectedMonth} / {selectedYear}</h3>
                                </div>
                                <div className="text-end">
                                    <p className="text-secondary mb-1" style={{ fontSize: '0.85rem' }}>Total Room Revenue</p>
                                    <h2 className="fw-bold text-dark m-0">
                                        {formatCurrency(totalRoomRev)} đ
                                    </h2>
                                    {roomData && roomData.momGrowth != null && (
                                        <div className={`badge ${roomData.momGrowth >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-3 py-2 mt-2 fw-medium rounded-pill`} style={{ fontSize: '0.85rem' }}>
                                            {roomData.momGrowth >= 0 ? '↑' : '↓'} {Math.abs(roomData.momGrowth)}% vs previous month
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* KPI Metrics Row */}
                            <div className="row g-3 mb-4">
                                <div className="col-md-4">
                                    <div className="card shadow-sm border-0 rounded-4 p-4 h-100" style={{ backgroundColor: '#f9fafc' }}>
                                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>OCCUPANCY RATE</p>
                                        <h3 className="fw-bold text-dark mb-1">{roomData?.occupancyRate || 0}%</h3>
                                        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Month {selectedMonth}/{selectedYear}</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card shadow-sm border-0 rounded-4 p-4 h-100" style={{ backgroundColor: '#f9fafc' }}>
                                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>AVG. ROOM RATE / NIGHT</p>
                                        <h3 className="fw-bold text-dark mb-1">{formatCurrency(roomData?.adr || 0)} đ</h3>
                                        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>ADR</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card shadow-sm border-0 rounded-4 p-4 h-100" style={{ backgroundColor: '#f9fafc' }}>
                                        <p className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>TOTAL GUESTS</p>
                                        <h3 className="fw-bold text-dark mb-1">{roomData?.totalStandardGuests || 0}</h3>
                                        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Standard guest equivalent</p>
                                    </div>
                                </div>
                            </div>

                            {/* Room Revenue by Type (Progress Bars) */}
                            <div className="mb-4">
                                <p className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>REVENUE BY ROOM TYPE</p>
                                <div className="card shadow-sm border-0 rounded-4 p-4">
                                    {roomRevenues.length > 0 ? roomRevenues.map((r, i) => {
                                        const maxRev = Math.max(...roomRevenues.map(x => x.revenue));
                                        const percentage = maxRev === 0 ? 0 : (r.revenue / maxRev) * 100;
                                        const barColors = ['#a5c8ff', '#7eb0ff', '#5396ff', '#2d7cff', '#004fc4', '#003380'];
                                        const bgColor = barColors[i % barColors.length];
                                        return (
                                            <div key={r.roomTypeName} className="d-flex align-items-center mb-3">
                                                <div style={{ width: '140px', fontSize: '0.9rem', color: '#555' }} className="fw-medium text-truncate pe-2" title={r.roomTypeName}>
                                                    {r.roomTypeName}
                                                </div>
                                                <div className="flex-grow-1 mx-3" style={{ height: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: bgColor, borderRadius: '6px', transition: 'width 0.5s ease' }} />
                                                </div>
                                                <div style={{ width: '110px', fontSize: '0.9rem' }} className="text-end fw-semibold text-dark">
                                                    {formatCurrency(r.revenue)}
                                                </div>
                                            </div>
                                        )
                                    }) : <div className="text-muted text-center py-3">No room data available</div>}
                                </div>
                            </div>

                            {/* Service and Expense Lists */}
                            <div className="row g-4 mb-4">
                                {/* Service List */}
                                <div className="col-lg-6">
                                    <div className="card shadow-sm border-0 rounded-4 p-4 h-100">
                                        <p className="text-dark fw-bold mb-2" style={{ fontSize: '1rem' }}>Service Revenue</p>
                                        <hr className="text-muted mt-0 mb-3" />
                                        {serviceData.map((s, idx) => (
                                            <div key={idx} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{s.category}</span>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>{formatCurrency(s.amount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded-3 mt-3" style={{ backgroundColor: '#eef6ff' }}>
                                            <span className="fw-bold text-primary">Total Service Revenue</span>
                                            <span className="fw-bold text-primary">{formatCurrency(totalServiceRev)} đ</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Expense List */}
                                <div className="col-lg-6">
                                    <div className="card shadow-sm border-0 rounded-4 p-4 h-100">
                                        <p className="text-dark fw-bold mb-2" style={{ fontSize: '1rem' }}>Expense Report</p>
                                        <hr className="text-muted mt-0 mb-3" />
                                        {expenseData.map((e, idx) => (
                                            <div key={idx} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{e.category}</span>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>{e.amount > 0 ? formatCurrency(e.amount) : 'N/A'}</span>
                                                    {e.growth != null ? (
                                                        <span className={`badge ${e.growth > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} rounded-pill fw-medium`} style={{ fontSize: '0.72rem', minWidth: '55px' }}>
                                                            {e.growth > 0 ? '↑' : '↓'} {Math.abs(e.growth)}%
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-light text-muted rounded-pill fw-medium" style={{ fontSize: '0.72rem', minWidth: '55px' }}>N/A</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded-3 mt-3" style={{ backgroundColor: '#fff5f5' }}>
                                            <span className="fw-bold text-danger">Total Expenses</span>
                                            <span className="fw-bold text-danger">{formatCurrency(totalExpenseAgg)} đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Distribution Pie Charts */}
                            <div className="row g-4 mb-4">
                                <div className="col-lg-6">
                                    <p className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>SERVICE REVENUE DISTRIBUTION</p>
                                    <div className="card shadow-sm border-0 rounded-4 p-4">
                                        <div style={{ width: '100%', height: '350px' }}>
                                            {serviceData.filter(s => s.amount > 0).length > 0 ? (
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie 
                                                            data={serviceData.filter(s => s.amount > 0).map(s => ({ name: s.category, value: s.amount, percentage: totalServiceRev > 0 ? (s.amount / totalServiceRev * 100).toFixed(1) : 0 }))} 
                                                            cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value"
                                                            labelLine={true}
                                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        >
                                                            {serviceData.filter(s => s.amount > 0).map((entry, index) => (
                                                                <Cell key={`svc-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <p className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>EXPENSE DISTRIBUTION</p>
                                    <div className="card shadow-sm border-0 rounded-4 p-4">
                                        <div style={{ width: '100%', height: '350px' }}>
                                            {expenseData.filter(e => (e.amount || 0) > 0).length > 0 ? (
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie 
                                                            data={expenseData.filter(e => (e.amount || 0) > 0).map(e => ({ name: e.category, value: e.amount || 0, percentage: totalExpenseAgg > 0 ? ((e.amount || 0) / totalExpenseAgg * 100).toFixed(1) : 0 }))} 
                                                            cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value"
                                                            labelLine={true}
                                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        >
                                                            {expenseData.filter(e => (e.amount || 0) > 0).map((entry, index) => (
                                                                <Cell key={`exp-${index}`} fill={PIE_COLORS[(index + 4) % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-100 d-flex align-items-center justify-content-center text-muted">No data available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ===== TABLE VIEW (EXCEL LAYOUT) ===== */}
                    {viewMode === 'table' && (
                        <>
                            {/* ===== BẢNG 1: DOANH THU PHÒNG ===== */}
                            <div className="table-responsive rounded-3 mt-2" style={{ backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <table className="table table-bordered mb-0 text-center align-middle" style={{ borderColor: '#e1e5eb' }}>
                                    <thead>
                                        <tr>
                                            <th colSpan={N + 4} className="py-2" style={{ backgroundColor: '#f39c12', color: '#fff', letterSpacing: '1px', fontSize: '1.05rem', borderBottom: 'none' }}>
                                                ROOM REVENUE
                                            </th>
                                        </tr>
                                        <tr style={{ backgroundColor: '#fffcf5' }}>
                                            <th colSpan={N} className="text-danger py-3" style={{ fontSize: '1rem' }}>
                                                Total Revenue: {roomData ? formatCurrency(roomData.totalRevenue) : 0}
                                            </th>
                                            <th className="py-3 text-secondary" style={{ width: '150px' }}>MoM Comparison<br/><span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>(growth %)</span></th>
                                            <th className="py-3 text-secondary" style={{ width: '150px' }}>Occupancy<br/><span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Rate (%)</span></th>
                                            <th className="py-3 text-secondary" style={{ width: '180px' }}>Average Rate<br/><span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>per night</span></th>
                                            <th className="py-3 text-secondary" style={{ width: '150px' }}>Total Guests<br/><span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>this month</span></th>
                                        </tr>
                                        <tr>
                                            {roomRevenues.length > 0 ? (
                                                roomRevenues.map(r => (
                                                    <th key={r.roomTypeName} className="py-3 bg-light text-dark" style={{ minWidth: '120px' }}>{r.roomTypeName}</th>
                                                ))
                                            ) : (
                                                <th className="py-3 bg-light text-dark">Room Type</th>
                                            )}
                                            <td rowSpan={2} className="fw-bold fs-5 text-dark" style={{ backgroundColor: '#f8f9fa' }}>
                                                {roomData && roomData.momGrowth != null ? (
                                                    roomData.momGrowth > 0 ? <span className="text-success">↑ {roomData.momGrowth.toFixed(2)}%</span> :
                                                    roomData.momGrowth < 0 ? <span className="text-danger">↓ {Math.abs(roomData.momGrowth).toFixed(2)}%</span> :
                                                    <span className="text-muted">0%</span>
                                                ) : "-"}
                                            </td>
                                            <td rowSpan={2} className="fw-bold fs-5 text-dark" style={{ backgroundColor: '#f8f9fa' }}>{roomData?.occupancyRate || 0}%</td>
                                            <td rowSpan={2} className="fw-bold fs-5 text-dark" style={{ backgroundColor: '#f8f9fa' }}>{formatCurrency(roomData?.adr)}</td>
                                            <td rowSpan={2} className="fw-bold fs-5 text-dark" style={{ backgroundColor: '#f8f9fa' }}>{roomData?.totalStandardGuests || 0}</td>
                                        </tr>
                                        <tr>
                                            {roomRevenues.length > 0 ? (
                                                roomRevenues.map(r => (
                                                    <td key={r.roomTypeName} className={`py-4 fw-bold fs-6 ${r.revenue > 0 ? 'text-dark' : 'text-muted'}`} style={{ backgroundColor: r.revenue > 0 ? '#fffae6' : '#fff' }}>
                                                        {formatCurrency(r.revenue)}
                                                    </td>
                                                ))
                                            ) : (
                                                <td className="py-4 fw-bold fs-6 text-muted">-</td>
                                            )}
                                        </tr>
                                    </thead>
                                </table>
                            </div>

                            <div className="row mt-5">
                                <div className={`col-lg-7 offset-lg-${Math.min(5, N > 3 ? 5 : 4)}`}>
                                    
                                    {/* ===== BẢNG 2: DOANH THU DỊCH VỤ ===== */}
                                    <div className="table-responsive rounded-3 mb-5" style={{ backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <table className="table table-bordered mb-0 text-center align-middle" style={{ borderColor: '#e1e5eb' }}>
                                            <thead>
                                                <tr>
                                                    <th colSpan={4} className="py-2" style={{ backgroundColor: '#f39c12', color: '#fff', letterSpacing: '1px', fontSize: '1.05rem', borderBottom: 'none' }}>
                                                        SERVICE REVENUE
                                                    </th>
                                                </tr>
                                                <tr style={{ backgroundColor: '#f9f9f9' }}>
                                                    <th className="py-3 text-secondary text-start ps-4">Category</th>
                                                    <th className="py-3 text-secondary">Total Revenue</th>
                                                    <th className="py-3 text-secondary">Usage Count</th>
                                                    <th className="py-3 text-secondary">MoM Growth</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {serviceData.map((s, idx) => (
                                                    <tr key={idx}>
                                                        <td className="text-start ps-4 fw-medium">{s.category}</td>
                                                        <td className="fw-medium text-dark">{formatCurrency(s.amount)}</td>
                                                        <td className="text-muted">{s.usageCount}</td>
                                                        <td className="fw-medium">
                                                            {s.growth != null ? (
                                                                s.growth > 0 ? <span className="text-success">↑ {s.growth.toFixed(2)}%</span> :
                                                                s.growth < 0 ? <span className="text-danger">↓ {Math.abs(s.growth).toFixed(2)}%</span> :
                                                                <span className="text-muted">0%</span>
                                                            ) : <span className="text-muted">-</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td className="fw-bold text-start ps-4" style={{ backgroundColor: '#fffae6' }}>TOTAL</td>
                                                    <td className="fw-bold text-danger fs-6" style={{ backgroundColor: '#fffae6' }}>{formatCurrency(totalServiceRev)}</td>
                                                    <td style={{ backgroundColor: '#fffae6' }}></td>
                                                    <td style={{ backgroundColor: '#fffae6' }}></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ===== BẢNG 3: BÁO CÁO CHI PHÍ ===== */}
                                    <div className="table-responsive rounded-3" style={{ backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <table className="table table-bordered mb-0 text-center align-middle" style={{ borderColor: '#e1e5eb' }}>
                                            <thead>
                                                <tr>
                                                    <th colSpan={4} className="py-2" style={{ backgroundColor: '#f39c12', color: '#fff', letterSpacing: '1px', fontSize: '1.05rem', borderBottom: 'none' }}>
                                                        EXPENSE REPORT
                                                    </th>
                                                </tr>
                                                <tr style={{ backgroundColor: '#f9f9f9' }}>
                                                    <th className="py-3 text-secondary text-start ps-4">Category</th>
                                                    <th className="py-3 text-secondary">Total Amount</th>
                                                    <th className="py-3 text-secondary">MoM Growth (%)</th>
                                                    <th className="py-3 text-secondary text-start">Note</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenseData.map((e, idx) => (
                                                    <tr key={idx}>
                                                        <td className="text-start ps-4 fw-medium">{e.category}</td>
                                                        <td className="fw-medium text-danger">{formatCurrency(e.amount)}</td>
                                                        <td className="fw-medium">
                                                            {e.growth !== null && e.growth !== undefined ? 
                                                                (e.growth > 0 ? <span className="text-danger">Tăng {e.growth}%</span> : <span className="text-success">Giảm {Math.abs(e.growth)}%</span>) 
                                                                : "-"}
                                                        </td>
                                                        <td className="text-start text-muted">{e.note}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td className="fw-bold text-start ps-4" style={{ backgroundColor: '#ffe9e9' }}>TOTAL</td>
                                                    <td className="fw-bold text-danger fs-6" style={{ backgroundColor: '#ffe9e9' }}>{formatCurrency(totalExpenseAgg)}</td>
                                                    <td style={{ backgroundColor: '#ffe9e9' }}></td>
                                                    <td style={{ backgroundColor: '#ffe9e9' }}></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AggregatedReportScreen;
