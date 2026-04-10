import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportApi } from '../api/reportApi';
import YearlyRevenueDashboard from '../component/YearlyRevenueDashboard';
import MonthlyRevenueDashboard from '../component/MonthlyRevenueDashboard';
import { COLORS } from '@/constants';
import 'bootstrap/dist/css/bootstrap.min.css';

const RevenueReportScreen = () => {
    const [searchParams] = useSearchParams();

    // Global Filters — pre-populate from URL params if navigated from Aggregated Report
    const initBranch = searchParams.get('branchId') ? Number(searchParams.get('branchId')) : null;
    const initYear   = searchParams.get('year')     ? Number(searchParams.get('year'))     : new Date().getFullYear();
    const initMonth  = searchParams.get('month')    ? Number(searchParams.get('month'))    : null;

    const [selectedBranch, setSelectedBranch] = useState(initBranch);
    const [selectedYear, setSelectedYear] = useState(initYear);

    // Drill-down State — jump to monthly view if month param provided
    const [viewLevel, setViewLevel] = useState(initMonth ? 'monthly' : 'yearly');
    const [selectedMonth, setSelectedMonth] = useState(initMonth);
    
    // Data States
    const [yearlyData, setYearlyData] = useState(null);
    const [monthlyData, setMonthlyData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [branches, setBranches] = useState([]);

    const START_YEAR = 2024;
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: currentYear - START_YEAR + 1 }, 
        (_, index) => START_YEAR + index
    );

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await reportApi.getReportBranches();
                setBranches(data);
                if (!initBranch && data && data.length > 0) {
                    setSelectedBranch(data[0].branchId);
                }
            } catch (error) {
                console.error("Error loading branches:", error);
            }
        };
        fetchBranches();
    }, []);

    // Effect 1: Gọi data TỔNG QUAN NĂM khi đổi chi nhánh hoặc năm, hoặc quay lại view yearly
    useEffect(() => {
        // Guard: không gọi API nếu chưa có branchId (branch đang load async)
        if (viewLevel === 'yearly' && selectedBranch) {
            const fetchYearlyData = async () => {
                setLoading(true);
                try {
                    const data = await reportApi.getYearlyRoomDashboard(selectedBranch, selectedYear);
                    setYearlyData(data);
                } catch (error) {
                    setYearlyData(null);
                } finally {
                    setLoading(false);
                }
            };
            fetchYearlyData();
        }
    }, [selectedBranch, selectedYear, viewLevel]);

    // Effect 2: Gọi data CHI TIẾT THÁNG
    useEffect(() => {
        // Guard: không gọi API nếu chưa có branchId
        if (viewLevel === 'monthly' && selectedMonth && selectedBranch) {
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

    const handleDrillDown = (month) => {
        setSelectedMonth(month);
        setViewLevel('monthly');
    };

    const handleGoBack = () => {
        setViewLevel('yearly');
        setSelectedMonth(null);
    };

    return (
        <div className="container-fluid p-0" style={{ backgroundColor: '#f9fafc', minHeight: '100vh', paddingBottom: '40px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white shadow-sm rounded-bottom-4">
                <h4 className="fw-bold m-0" style={{ color: COLORS.PRIMARY, letterSpacing: '0.5px' }}>
                    REVENUE REPORT {viewLevel === 'monthly' && `- MONTH ${selectedMonth}`}
                </h4>
                {viewLevel === 'monthly' && (
                    <button className="btn btn-sm btn-outline-secondary fw-bold" onClick={handleGoBack}>
                        <i className="bi bi-arrow-left me-2"></i> Back to Yearly Report
                    </button>
                )}
            </div>

            {/* Global Filters */}
            {viewLevel === 'yearly' && (
                <div className="mx-3 mb-3">
                    <div className="card shadow-sm border-0 p-3" style={{ borderRadius: '12px' }}>
                        <div className="row g-3 align-items-end">
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
                                <label className="form-label fw-bold text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Report Year</label>
                                <select 
                                    className="form-select" 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    style={{ borderRadius: '8px' }}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center p-5 mt-5">
                    <div className="spinner-border" style={{color: COLORS.PRIMARY, width: '3rem', height: '3rem'}}></div>
                </div>
            )}

            {/* ================= LEVEL 1: YEARLY OVERVIEW ================= */}
            {!loading && viewLevel === 'yearly' && yearlyData && (
                <YearlyRevenueDashboard 
                    yearlyData={yearlyData}
                    selectedYear={selectedYear}
                    handleDrillDown={handleDrillDown}
                />
            )}

            {/* ================= LEVEL 2: MONTHLY DETAILS ================= */}
            {!loading && viewLevel === 'monthly' && monthlyData && (
                <MonthlyRevenueDashboard monthlyData={monthlyData} />
            )}
        </div>
    );
};

export default RevenueReportScreen;