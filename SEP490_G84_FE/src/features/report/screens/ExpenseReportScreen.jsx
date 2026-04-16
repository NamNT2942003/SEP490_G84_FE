import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { reportApi } from '../api/reportApi';
import { COLORS } from '@/constants';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import YearlyExpenseDashboard from '../component/YearlyExpenseDashboard';
import ExpensePieChart from '../component/ExpensePieChart';
import ExpenseDeclarationForm from '../component/ExpenseDeclarationForm';
import 'bootstrap/dist/css/bootstrap.min.css';

const ExpenseReportScreen = () => {
    const [searchParams] = useSearchParams();
    const currentUser = useCurrentUser();

    const isAdmin = currentUser?.permissions?.isAdmin;

    // Pre-populate from URL params if navigated from Aggregated Report
    const initBranch = searchParams.get('branchId') ? Number(searchParams.get('branchId')) : null;
    const initYear   = searchParams.get('year')     ? Number(searchParams.get('year'))     : new Date().getFullYear();
    const initMonth  = searchParams.get('month')    ? Number(searchParams.get('month'))    : null;

    // 1. Global Filters
   const [selectedBranch, setSelectedBranch] = useState(initBranch);
    const [selectedYear, setSelectedYear] = useState(initYear);
    
    // 2. Navigation State
    const [viewLevel, setViewLevel] = useState(initMonth ? 'monthly' : 'yearly');
    const [selectedMonth, setSelectedMonth] = useState(initMonth);

    // 3. Data States
    const [yearlyData, setYearlyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(false);

    // 4. Form States (Quản lý Form nhập liệu)
    const [isDeclaring, setIsDeclaring] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // 1. Khai báo state lưu danh sách chi nhánh lấy từ API
    const [branches, setBranches] = useState([]);

    // 2. Logic sinh mảng Năm tự động (từ 2024 đến năm hiện tại)
    const START_YEAR = 2024;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const years = Array.from(
        { length: currentYear - START_YEAR + 1 }, 
        (_, index) => START_YEAR + index
    );

    // ── Permission: can this user edit the selected month? ──
    const canEditSelectedMonth = isAdmin || (selectedYear === currentYear && selectedMonth === currentMonth);

    // 3. Gọi API lấy danh sách chi nhánh ngay khi mở trang
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await reportApi.getReportBranches();
                setBranches(data);
                
                // Only auto-select first branch if not navigated from Aggregated Report
                if (!initBranch && data && data.length > 0) {
                    setSelectedBranch(data[0].branchId);
                }
            } catch (error) {
                console.error("Error loading branches:", error);
            }
        };
        fetchBranches();
    }, []);


   

    useEffect(() => {
        if (viewLevel === 'yearly') {
            const fetchYearlyData = async () => {
                setLoading(true);
                try {
                    const data = await reportApi.getYearlyExpenses(selectedBranch, selectedYear);
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

    // Lấy chi tiết 1 tháng
    const fetchMonthlyData = async () => {
        setLoading(true);
        try {
            const data = await reportApi.getMonthlyExpenses(selectedBranch, selectedMonth, selectedYear);
            setMonthlyData(data);
        } catch (error) {
            setMonthlyData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (viewLevel === 'monthly' && selectedMonth) {
            fetchMonthlyData();
        }

    }, [selectedBranch, selectedYear, selectedMonth, viewLevel]);

    // --- LOGIC XỬ LÝ FORM NHẬP LIỆU ---
    const handleSaveExpenses = async (validExpenses) => {
        setIsSaving(true);
        try {
            const payload = {
                branchId: selectedBranch,
                month: selectedMonth,
                year: selectedYear,
                expenses: validExpenses
            };

            await reportApi.saveMonthlyExpenses(payload);
            setIsDeclaring(false);
            fetchMonthlyData();
            Swal.fire({
                icon: 'success',
                title: 'Declaration Submitted',
                text: 'Expenses declared successfully!',
                confirmButtonColor: COLORS.PRIMARY,
                timer: 2500,
                timerProgressBar: true,
            });
        } catch (error) {
            const msg = error?.response?.data?.error || 'Error saving data. Please try again.';
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: msg,
                confirmButtonColor: COLORS.PRIMARY,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Open the declaration form and load suggestions in parallel
    const handleOpenDeclare = async () => {
        setIsDeclaring(true);
        try {
            const data = await reportApi.getExpenseSuggestions(selectedBranch, selectedMonth, selectedYear);
            setSuggestions(data || []);
        } catch {
            setSuggestions([]);
        }
    };

    const totalMonthlyExpense = monthlyData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const formatCurrency = (val) => val !== null && val !== undefined ? new Intl.NumberFormat('en-US').format(val) + ' VND' : 'N/A';
    const hasData = monthlyData.some(d => d.amount !== null);

    return (
        <div className="container-fluid p-0 position-relative">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0" style={{ color: COLORS.PRIMARY }}>
                    EXPENSE REPORT {viewLevel === 'monthly' && `- MONTH ${selectedMonth}`}
                </h2>
                {viewLevel === 'monthly' && !isDeclaring && (
                    <button className="btn btn-outline-secondary fw-bold shadow-sm" onClick={() => setViewLevel('yearly')}>
                         <i className="bi bi-arrow-left me-2"></i> Back to Overview
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

            {loading && <div className="text-center p-5"><div className="spinner-border" style={{color: COLORS.PRIMARY}}></div></div>}

            {/* LEVEL 1: NĂM */}
            {!loading && viewLevel === 'yearly' && Array.isArray(yearlyData) && yearlyData.length > 0 && (
                <YearlyExpenseDashboard
                    yearlyData={yearlyData}
                    selectedYear={selectedYear}
                    onMonthClick={(m) => { setSelectedMonth(m); setViewLevel('monthly'); }}
                />
            )}

            {/* LEVEL 2: THÁNG */}
            {!loading && viewLevel === 'monthly' && (
                isDeclaring ? (
                    <ExpenseDeclarationForm
                        month={selectedMonth}
                        year={selectedYear}
                        branchName={branches.find(b => b.branchId === selectedBranch)?.branchName}
                        initialData={monthlyData}
                        suggestions={suggestions}
                        onSave={handleSaveExpenses}
                        onCancel={() => setIsDeclaring(false)}
                        isSaving={isSaving}
                    />
                ) : (
                <div className="row g-4 animate__animated animate__fadeInRight">
                    <div className="col-lg-5">
                        <div className="card shadow-sm border-0 rounded-3 h-100">
                            <div className="card-header bg-white py-3 border-0">
                                <h5 className="fw-bold m-0 text-dark">Expense Structure (%)</h5>
                            </div>
                            <div className="card-body d-flex align-items-center justify-content-center">
                                {/* Component PieChart tự động ignore các category có amount null */}
                                <ExpensePieChart data={monthlyData} />
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-7">
                        {/* Cảnh báo chưa khai báo chi phí */}
                        {!hasData && (
                            <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center mb-4 text-start">
                                <i className="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning"></i>
                                <div>
                                    <h6 className="fw-bold mb-1">Action Required: Monthly Expense Declaration Pending</h6>
                                    <span className="small">The operating expenses for {selectedMonth}/{selectedYear} have not been declared yet. Please submit the report to reflect accurate financial data.</span>
                                </div>
                            </div>
                        )}

                        {/* Locked banner - shown when Manager tries to view a past month */}
                        {!canEditSelectedMonth && hasData && (
                            <div className="alert alert-info border-0 shadow-sm d-flex align-items-center mb-4 text-start">
                                <i className="bi bi-lock-fill fs-4 me-3 text-info"></i>
                                <div>
                                    <h6 className="fw-bold mb-1">Report Locked</h6>
                                    <span className="small">This expense report for {selectedMonth}/{selectedYear} is finalized and cannot be edited. Only Admin users can modify past reports.</span>
                                </div>
                            </div>
                        )}

                        {!canEditSelectedMonth && !hasData && (
                            <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4 text-start">
                                <i className="bi bi-lock-fill fs-4 me-3 text-danger"></i>
                                <div>
                                    <h6 className="fw-bold mb-1">Submission Period Expired</h6>
                                    <span className="small">The deadline to declare expenses for {selectedMonth}/{selectedYear} has passed. Please contact an Admin to submit this report.</span>
                                </div>
                            </div>
                        )}

                        <div className="card shadow-sm border-0 rounded-3 h-100">
                            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
                                <div className="text-start">
                                    <h5 className="fw-bold m-0 text-dark">Category Details</h5>
                                    <small className="text-danger fw-bold">Total Expenses: {formatCurrency(totalMonthlyExpense)}</small>
                                </div>
                                {canEditSelectedMonth && (
                                    <button 
                                        className="btn text-white fw-bold btn-sm shadow-sm px-3" 
                                        style={{ backgroundColor: COLORS.PRIMARY }}
                                        onClick={handleOpenDeclare}
                                    >
                                        <i className="bi bi-journal-text me-2"></i> {hasData ? 'Review / Edit Declaration' : 'Declare Expenses'}
                                    </button>
                                )}
                                {!canEditSelectedMonth && (
                                    <span className="badge bg-secondary-subtle text-secondary px-3 py-2 fw-semibold" style={{ fontSize: '0.8rem' }}>
                                        <i className="bi bi-lock-fill me-1"></i> Read Only
                                    </span>
                                )}
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
                                        {monthlyData.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-bold ps-4">{item.category}</td>
                                                <td className={`text-end fw-bold ${item.amount ? 'text-danger' : 'text-muted'}`}>
                                                    {formatCurrency(item.amount)}
                                                </td>
                                                <td className="text-center">
                                                    {item.growth !== null && item.growth !== undefined ? (
                                                        <span className={`badge ${item.growth > 0 ? 'bg-danger-subtle text-danger' : item.growth < 0 ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
                                                            {item.growth > 0 ? '↑ Up' : item.growth < 0 ? '↓ Down' : '-'} {Math.abs(item.growth).toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                )
            )}

        </div>
    );
};

export default ExpenseReportScreen;