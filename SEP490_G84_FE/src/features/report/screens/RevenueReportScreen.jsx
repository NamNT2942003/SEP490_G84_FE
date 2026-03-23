import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';
import RevenueChart from '../component/RevenueChart';
import RevenueTable from '../component/RevenueTable';
import YearlyRevenueChart from '../component/YearlyRevenueChart';
import RoomRevenuePieChart from '../component/RoomRevenuePieChart';
import { COLORS } from '@/constants';
import 'bootstrap/dist/css/bootstrap.min.css';

const RevenueReportScreen = () => {
    // Global Filters
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // Luồng Drill-down State
    const [viewLevel, setViewLevel] = useState('yearly'); // 'yearly' | 'monthly'
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table' (chỉ dùng cho monthly)
    
    // Data States
    const [yearlyData, setYearlyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState(null);
    const [loading, setLoading] = useState(false);

 // 1. Khai báo state lưu danh sách chi nhánh lấy từ API
    const [branches, setBranches] = useState([]);

    // 2. Logic sinh mảng Năm tự động (từ 2024 đến năm hiện tại)
    const START_YEAR = 2024;
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: currentYear - START_YEAR + 1 }, 
        (_, index) => START_YEAR + index
    );

    // 3. Gọi API lấy danh sách chi nhánh ngay khi mở trang
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await reportApi.getReportBranches();
                setBranches(data);
                
                // Tự động gán chi nhánh đầu tiên vào filter nếu data trả về có chứa chi nhánh
                if (data && data.length > 0) {
                    setSelectedBranch(data[0].branchId);
                }
            } catch (error) {
                console.error("Lỗi khi load danh sách chi nhánh:", error);
            }
        };
        fetchBranches();
    }, []);

    // Effect 1: Gọi data TỔNG QUAN NĂM khi đổi chi nhánh hoặc năm, hoặc quay lại view yearly
    useEffect(() => {
        if (viewLevel === 'yearly') {
            const fetchYearlyData = async () => {
                setLoading(true);
                try {
                    const data = await reportApi.getYearlyRevenue(selectedBranch, selectedYear);
                    setYearlyData(data);
                } catch (error) {
                    setYearlyData([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchYearlyData();
        }
    }, [selectedBranch, selectedYear, viewLevel]);

    // Effect 2: Gọi data CHI TIẾT THÁNG khi click vào 1 tháng cụ thể
    useEffect(() => {
        if (viewLevel === 'monthly' && selectedMonth) {
            const fetchMonthlyData = async () => {
                setLoading(true);
                try {
                    const data = await reportApi.getRoomRevenue(selectedBranch, selectedMonth, selectedYear);
                    setMonthlyData(data);
                } catch (error) {
                    setMonthlyData(null);
                } finally {
                    setLoading(false);
                }
            };
            fetchMonthlyData();
        }
    }, [selectedBranch, selectedYear, selectedMonth, viewLevel]);

    // Hàm xử lý khi user click vào 1 cột tháng trên biểu đồ năm
    const handleDrillDown = (month) => {
        setSelectedMonth(month);
        setViewLevel('monthly');
        setViewMode('chart'); // Reset mặc định xem chart khi vào chi tiết
    };

    // Hàm quay lại màn hình tổng quan năm
    const handleGoBack = () => {
        setViewLevel('yearly');
        setSelectedMonth(null);
    };

    const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(value || 0);

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0" style={{ color: COLORS.PRIMARY }}>
                    REVENUE REPORT {viewLevel === 'monthly' && `- MONTH ${selectedMonth}`}
                </h2>
                {/* Nút quay lại (chỉ hiện khi ở màn hình chi tiết tháng) */}
                {viewLevel === 'monthly' && (
                    <button className="btn btn-outline-secondary fw-bold" onClick={handleGoBack}>
                        <i className="bi bi-arrow-left me-2"></i> Back to Yearly Report
                    </button>
                )}
            </div>

             {/* Filter - Chỉ hiện ở màn hình Tổng quan năm */}
            {/* Vùng Bộ lọc Toàn cục (Chỉ hiện ở view yearly) */}
            {viewLevel === 'yearly' && (
                <div className="card shadow-sm border-0 mb-4 p-3 rounded-3 animate__animated animate__fadeIn">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-4">
                            <label className="form-label fw-bold text-dark">Select Branch</label>
                            <select 
                                className="form-select" 
                                value={selectedBranch} 
                                onChange={(e) => setSelectedBranch(Number(e.target.value))}
                                disabled={branches.length === 0} // Khoá lại nếu đang load hoặc ko có quyền
                            >
                                {branches.length === 0 ? (
                                    <option>Loading data...</option>
                                ) : (
                                    branches.map(b => (
                                        <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold text-dark">Report Year</label>
                            <select 
                                className="form-select" 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className="text-center p-5"><div className="spinner-border" style={{color: COLORS.PRIMARY}} role="status"></div></div>}

            {/* ================= LEVEL 1: TỔNG QUAN NĂM ================= */}
            {!loading && viewLevel === 'yearly' && (
                <div className="card shadow-sm border-0 rounded-3 animate__animated animate__fadeIn">
                    <div className="card-header bg-white border-bottom-0 pt-3">
                        <h5 className="card-title fw-bold text-dark">12-Month Revenue Overview - Year {selectedYear}</h5>
                        <p className="text-muted small mb-0">💡 Click on any month column to view details</p>
                    </div>
                    <div className="card-body">
                        <YearlyRevenueChart data={yearlyData} onMonthClick={handleDrillDown} />
                    </div>
                </div>
            )}

            {/* ================= LEVEL 2: CHI TIẾT THÁNG ================= */}
            {!loading && viewLevel === 'monthly' && monthlyData && (
                <div className="animate__animated animate__fadeInRight">
                    {/* KPI Cards */}
                    <div className="row mb-4 g-3">
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0 h-100 rounded-3">
                                <div className="card-body">
                                    <h6 className="text-muted">Total Revenue</h6>
                                    <h4 className="text-danger fw-bold">{formatCurrency(monthlyData.totalRevenue)}</h4>
                                    <small className={monthlyData.momGrowth >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                                        Last month: {monthlyData.momGrowth > 0 ? '+' : ''}{monthlyData.momGrowth}%
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0 h-100 rounded-3">
                                <div className="card-body">
                                    <h6 className="text-muted">Occupancy Rate</h6>
                                    <h4 className="fw-bold" style={{color: COLORS.PRIMARY}}>{monthlyData.occupancyRate}%</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0 h-100 rounded-3">
                                <div className="card-body">
                                    <h6 className="text-muted">Average Daily Rate (ADR)</h6>
                                    <h4 className="fw-bold" style={{color: COLORS.PRIMARY}}>{formatCurrency(monthlyData.adr)}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0 h-100 rounded-3">
                                <div className="card-body">
                                    <h6 className="text-muted">Total Guests</h6>
                                    <h4 className="fw-bold" style={{color: COLORS.PRIMARY}}>{monthlyData.totalStandardGuests} <span className="fs-6 text-muted fw-normal">guests</span></h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart / Table section + Pie Chart side by side */}
                    <div className="row g-4 mt-0">
                        {/* Bar chart / table toggle */}
                        <div className="col-lg-7">
                            <div className="card shadow-sm border-0 rounded-3 h-100">
                                <div className="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0 fw-bold text-dark">
                                        {viewMode === 'chart' ? 'Revenue by Room Type' : 'Detailed Table'}
                                    </h5>
                                    <div className="btn-group">
                                        <button 
                                            className="btn btn-sm"
                                            style={{
                                                backgroundColor: viewMode === 'chart' ? COLORS.PRIMARY : 'transparent',
                                                color: viewMode === 'chart' ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
                                                borderColor: COLORS.PRIMARY
                                            }}
                                            onClick={() => setViewMode('chart')}
                                        >
                                            View Chart
                                        </button>
                                        <button 
                                            className="btn btn-sm"
                                            style={{
                                                backgroundColor: viewMode === 'table' ? COLORS.PRIMARY : 'transparent',
                                                color: viewMode === 'table' ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
                                                borderColor: COLORS.PRIMARY
                                            }}
                                            onClick={() => setViewMode('table')}
                                        >
                                            View Excel Table
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body mt-2">
                                    {viewMode === 'chart' ? (
                                        <RevenueChart data={monthlyData.roomRevenues} />
                                    ) : (
                                        <RevenueTable roomData={monthlyData.roomRevenues} summary={monthlyData} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pie Chart — Revenue Share by Room Type */}
                        <div className="col-lg-5">
                            <div className="card shadow-sm border-0 rounded-3 h-100">
                                <div className="card-header bg-white border-bottom-0 pt-3">
                                    <h5 className="card-title mb-0 fw-bold text-dark">Revenue Share (%)</h5>
                                    <p className="text-muted small mb-0">Contribution by room type</p>
                                </div>
                                <div className="card-body d-flex align-items-center justify-content-center">
                                    <RoomRevenuePieChart data={monthlyData.roomRevenues} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueReportScreen;