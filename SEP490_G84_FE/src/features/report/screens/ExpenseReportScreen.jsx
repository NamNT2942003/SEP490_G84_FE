import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';
import { COLORS } from '@/constants';
import YearlyRevenueChart from '../component/YearlyRevenueChart'; 
import ExpensePieChart from '../component/ExpensePieChart';
import 'bootstrap/dist/css/bootstrap.min.css';

const ExpenseReportScreen = () => {
    // 1. Global Filters
   const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // 2. Navigation State
    const [viewLevel, setViewLevel] = useState('yearly'); 
    const [selectedMonth, setSelectedMonth] = useState(null);

    // 3. Data States
    const [yearlyData, setYearlyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(false);

    // 4. Form States (Quản lý Modal nhập liệu)
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

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
    const handleOpenModal = () => {
        // Clone data hiện tại đổ vào form. Nếu amount null thì set giá trị input là chuỗi rỗng
        const initialForm = monthlyData.map(item => ({
            category: item.category,
            amount: item.amount !== null ? item.amount : '',
            note: item.note || ''
        }));
        setFormData(initialForm);
        setShowModal(true);
    };

    const handleFormChange = (index, field, value) => {
        const newForm = [...formData];
        newForm[index][field] = value;
        setFormData(newForm);
    };

    const handleAddCustomExpense = () => {
        setFormData([
            ...formData,
            { category: '', amount: '', note: '', isCustom: true }
        ]);
    };

    const handleRemoveCustomExpense = (index) => {
        const newForm = [...formData];
        newForm.splice(index, 1);
        setFormData(newForm);
    };

    const handleSaveExpenses = async () => {
        setIsSaving(true);
        try {
            // Lọc ra những mục user có nhập tiền (bỏ qua những mục để trống)
            const validExpenses = formData
                .filter(item => item.category && item.category.trim() !== '' && item.amount !== '' && item.amount !== null)
                .map(item => ({
                    category: item.category.trim(),
                    amount: parseFloat(item.amount),
                    note: item.note
                }));

            const payload = {
                branchId: selectedBranch,
                month: selectedMonth,
                year: selectedYear,
                expenses: validExpenses
            };

            await reportApi.saveMonthlyExpenses(payload);
            setShowModal(false);
            fetchMonthlyData(); // Cập nhật lại giao diện ngay lập tức
            alert('Expenses saved successfully!');
        } catch (error) {
            alert('Error saving data. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const totalMonthlyExpense = monthlyData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const formatCurrency = (val) => val !== null && val !== undefined ? new Intl.NumberFormat('en-US').format(val) + ' VND' : 'N/A';

    return (
        <div className="container-fluid p-0 position-relative">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0" style={{ color: COLORS.PRIMARY }}>
                    EXPENSE REPORT {viewLevel === 'monthly' && `- MONTH ${selectedMonth}`}
                </h2>
                {viewLevel === 'monthly' && (
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
            {!loading && viewLevel === 'yearly' && (
                <div className="card shadow-sm border-0 rounded-3 p-4 animate__animated animate__fadeIn">
                    <h5 className="fw-bold mb-4 text-dark">Total Operating Expenses in {selectedYear}</h5>
                    <YearlyRevenueChart data={yearlyData} onMonthClick={(m) => { setSelectedMonth(m); setViewLevel('monthly'); }} />
                </div>
            )}

            {/* LEVEL 2: THÁNG */}
            {!loading && viewLevel === 'monthly' && (
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
                        <div className="card shadow-sm border-0 rounded-3 h-100">
                            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
                                <div>
                                    <h5 className="fw-bold m-0 text-dark">Category Details</h5>
                                    <small className="text-danger fw-bold">Total Expenses: {formatCurrency(totalMonthlyExpense)}</small>
                                </div>
                                <button 
                                    className="btn text-white fw-bold btn-sm shadow-sm" 
                                    style={{ backgroundColor: COLORS.PRIMARY }}
                                    onClick={handleOpenModal}
                                >
                                    <i className="bi bi-pencil-square me-1"></i> Update Data
                                </button>
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
            )}

            {/* Custom Modal Nhập Liệu (Sử dụng overlay CSS thuần để không phụ thuộc JS Bootstrap) */}
            {showModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="card border-0 shadow-lg" style={{ width: '600px', maxWidth: '95%' }}>
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold m-0" style={{ color: COLORS.PRIMARY }}>Update Expenses for {selectedMonth}/{selectedYear}</h5>
                            <button className="btn-close" onClick={() => setShowModal(false)}></button>
                        </div>
                        <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {formData.map((item, index) => (
                                <div className="row mb-3 align-items-center" key={index}>
                                    <div className="col-md-4 fw-bold text-dark">
                                        {item.isCustom ? (
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Category Name"
                                                value={item.category}
                                                onChange={(e) => handleFormChange(index, 'category', e.target.value)}
                                            />
                                        ) : (
                                            item.category
                                        )}
                                    </div>
                                    <div className={item.isCustom ? "col-md-7" : "col-md-8"}>
                                        <div className="input-group mb-2">
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                placeholder="Enter amount..."
                                                value={item.amount}
                                                onChange={(e) => handleFormChange(index, 'amount', e.target.value)}
                                            />
                                            <span className="input-group-text">VND</span>
                                        </div>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm" 
                                            placeholder="Note (Optional)"
                                            value={item.note}
                                            onChange={(e) => handleFormChange(index, 'note', e.target.value)}
                                        />
                                    </div>
                                    {item.isCustom && (
                                        <div className="col-md-1 text-end">
                                            <button className="btn btn-sm btn-outline-danger" title="Remove" onClick={() => handleRemoveCustomExpense(index)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button className="btn btn-outline-primary btn-sm mt-2 fw-bold" onClick={handleAddCustomExpense}>
                                <i className="bi bi-plus-circle me-1"></i> Add Custom Expense
                            </button>
                        </div>
                        <div className="card-footer bg-white py-3 text-end">
                            <button className="btn btn-secondary me-2 fw-bold" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                            <button className="btn text-white fw-bold" style={{ backgroundColor: COLORS.PRIMARY }} onClick={handleSaveExpenses} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseReportScreen;