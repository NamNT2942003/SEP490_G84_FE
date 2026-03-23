import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi'; // Nhớ trỏ đúng đường dẫn file api của em
import { COLORS } from '@/constants';
import YearlyRevenueChart from '../component/YearlyRevenueChart'; 
import ExpensePieChart from '../component/ExpensePieChart'; 
import 'bootstrap/dist/css/bootstrap.min.css';

const ServiceRevenueReportScreen = () => {
    // 1. Global Filters (Bộ lọc)
    const [selectedBranch, setSelectedBranch] = useState(null); 
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // 2. Navigation State (Điều hướng Drill-down)
    const [viewLevel, setViewLevel] = useState('yearly'); 
    const [selectedMonth, setSelectedMonth] = useState(null);

    // 3. Data States (Lưu trữ dữ liệu thật từ API)
    const [yearlyData, setYearlyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
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
    // Effect 1: Gọi API lấy biểu đồ 12 tháng khi màn hình là 'yearly'
    useEffect(() => {
        if (viewLevel === 'yearly') {
            const fetchYearlyData = async () => {
                setLoading(true);
                try {
                    const data = await reportApi.getYearlyServiceRevenue(selectedBranch, selectedYear);
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

    // Effect 2: Gọi API lấy chi tiết dịch vụ khi click vào 1 tháng cụ thể
    useEffect(() => {
        if (viewLevel === 'monthly' && selectedMonth) {
            const fetchMonthlyData = async () => {
                setLoading(true);
                try {
                    const data = await reportApi.getMonthlyServiceRevenue(selectedBranch, selectedMonth, selectedYear);
                    setMonthlyData(data);
                } catch (error) {
                    setMonthlyData([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchMonthlyData();
        }
    }, [selectedBranch, selectedYear, selectedMonth, viewLevel]);

    // Xử lý tính tổng tiền của tháng hiện tại để hiển thị ra UI
    const totalMonthlyRevenue = monthlyData.reduce((sum, item) => sum + item.amount, 0);

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(val || 0);

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0" style={{ color: COLORS.PRIMARY }}>
                    SERVICE REVENUE {viewLevel === 'monthly' && `- MONTH ${selectedMonth}`}
                </h2>
                {viewLevel === 'monthly' && (
                    <button className="btn btn-outline-secondary fw-bold shadow-sm" onClick={() => { setViewLevel('yearly'); setSelectedMonth(null); }}>
                         <i className="bi bi-arrow-left me-2"></i> Back to Yearly Overview
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

            {/* Loading Spinner */}
            {loading && (
                <div className="text-center p-5">
                    <div className="spinner-border" style={{color: COLORS.PRIMARY}} role="status"></div>
                    <div className="mt-2 text-muted">Loading data...</div>
                </div>
            )}

            {/* LEVEL 1: TỔNG QUAN NĂM */}
            {!loading && viewLevel === 'yearly' && (
                <div className="card shadow-sm border-0 rounded-3 p-4 animate__animated animate__fadeIn">
                    <h5 className="fw-bold mb-4 text-dark">Total Service Revenue in {selectedYear}</h5>
                    <YearlyRevenueChart 
                        data={yearlyData} 
                        onMonthClick={(m) => { setSelectedMonth(m); setViewLevel('monthly'); }} 
                    />
                </div>
            )}

            {/* LEVEL 2: CHI TIẾT THÁNG (Pie Chart + Table) */}
            {!loading && viewLevel === 'monthly' && (
                <div className="row g-4 animate__animated animate__fadeInRight">
                    {/* Cột trái: Cơ cấu dịch vụ */}
                    <div className="col-lg-5">
                        <div className="card shadow-sm border-0 rounded-3 h-100">
                            <div className="card-header bg-white py-3 border-0">
                                <h5 className="fw-bold m-0 text-dark">Service Type Structure (%)</h5>
                                <small className="text-muted">Service Revenue Proportion</small>
                            </div>
                            <div className="card-body d-flex align-items-center justify-content-center">
                                {/* Component Pie Chart tự tính phần trăm dựa trên amount */}
                                <ExpensePieChart data={monthlyData} />
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Bảng chi tiết */}
                    <div className="col-lg-7">
                        <div className="card shadow-sm border-0 rounded-3 h-100">
                            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
                                <div>
                                    <h5 className="fw-bold m-0 text-dark">Service Revenue Details</h5>
                                    <small className="text-success fw-bold">Total: {formatCurrency(totalMonthlyRevenue)}</small>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {monthlyData.length === 0 ? (
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
                                                {monthlyData.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="fw-bold text-start ps-4 text-dark">{item.category}</td>
                                                        <td>
                                                            <span className="badge bg-secondary rounded-pill px-3 py-2">
                                                                {item.usageCount} times
                                                            </span>
                                                        </td>
                                                        <td className="text-end pe-4 text-primary fw-bold">
                                                            {formatCurrency(item.amount)}
                                                        </td>
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
        </div>
    );
};

export default ServiceRevenueReportScreen;