import React, { useState, useEffect, useMemo } from 'react';
import { COLORS } from '@/constants';

const ExpenseDeclarationForm = ({ 
    month, 
    year, 
    branchName, 
    initialData, 
    suggestions = [],
    onSave, 
    onCancel, 
    isSaving 
}) => {
    // Clone incoming data into form state
    const [formData, setFormData] = useState([]);

    // Build a case-insensitive lookup map: lowercase(category) -> { amount, note, originalCategory }
    const suggestionMap = React.useMemo(() => {
        const map = {};
        (suggestions || []).forEach(s => {
            if (s.category && s.amount != null) {
                map[s.category.toLowerCase()] = { amount: s.amount, note: s.note || '', original: s.category };
            }
        });
        return map;
    }, [suggestions]);

    useEffect(() => {
        const base = (initialData && initialData.length > 0)
            ? initialData.map(item => ({
                id: crypto.randomUUID(),
                category: item.category,
                amount: item.amount !== null ? item.amount : '',
                note: item.note || '',
              }))
            : [];

        // Auto-inject rows for suggestion categories not already in the form
        const existingCategories = new Set(base.map(r => r.category.toLowerCase()));
        const extras = Object.entries(suggestionMap)
            .filter(([key]) => !existingCategories.has(key))
            .map(([, val]) => ({
                id: crypto.randomUUID(),
                category: val.original,
                amount: val.amount,
                note: val.note,
            }));

        setFormData([...base, ...extras]);
    }, [initialData, suggestionMap]);

    const handleFormChange = (id, field, value) => {
        setFormData(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleAddCustomExpense = () => {
        setFormData(prev => [
            ...prev,
            { id: crypto.randomUUID(), category: '', amount: '', note: '', isCustom: true }
        ]);
    };

    const handleRemoveCustomExpense = (id) => {
        setFormData(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = () => {
        // Filter out empty rows
        const validExpenses = formData
            .filter(item => item.category && item.category.trim() !== '' && item.amount !== '' && item.amount !== null)
            .map(item => ({
                category: item.category.trim(),
                amount: parseFloat(item.amount),
                note: item.note
            }));
        onSave(validExpenses);
    };

    // Auto-calculate Total
    const totalAmount = useMemo(() => {
        return formData.reduce((sum, item) => {
            const val = parseFloat(item.amount);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    }, [formData]);

    const formatCurrency = (val) => new Intl.NumberFormat('en-US').format(val) + ' VND';

    const currentDate = new Date().toLocaleDateString('en-GB');

    return (
        <div className="card shadow-lg border-0 rounded-4 animate__animated animate__fadeInUp">
            {/* DOCUMENT HEADER */}
            <div className="card-header bg-white p-5 border-bottom border-2">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <h2 className="fw-bold mb-1" style={{ color: COLORS.PRIMARY, letterSpacing: '1px' }}>
                            OPERATING EXPENSE DECLARATION
                        </h2>
                        <h5 className="text-secondary mb-0">Monthly Financial Report</h5>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                        <div className="p-3 bg-light rounded-3 d-inline-block text-start border">
                            <div className="small text-muted fw-bold mb-1">REPORTING PERIOD</div>
                            <h4 className="fw-bold mb-0 text-dark">{month} / {year}</h4>
                        </div>
                    </div>
                </div>

                <div className="row mt-4 pt-3 border-top">
                    <div className="col-sm-6">
                        <div className="small text-muted fw-bold">BRANCH / LOCATION</div>
                        <div className="fw-bold fs-6 text-dark">{branchName || 'Main Branch'}</div>
                    </div>
                    <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
                        <div className="small text-muted fw-bold">DATE OF PREPARATION</div>
                        <div className="fw-bold fs-6 text-dark">{currentDate}</div>
                    </div>
                </div>
            </div>

            {/* DOCUMENT BODY - FORM */}
            <div className="card-body p-5 bg-light">
                <div className="mb-4">
                    <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i className="bi bi-list-check me-2 text-primary"></i>
                        Expense Line Items
                    </h5>
                    <p className="text-muted small">
                        Please declare all operational expenses incurred during this billing cycle. Attach or reference invoice numbers in the notes if applicable.
                    </p>
                </div>

                <div className="table-responsive bg-white rounded-3 shadow-sm border">
                    <table className="table table-hover table-borderless align-middle mb-0">
                        <thead className="table-light border-bottom">
                            <tr>
                                <th className="ps-4 py-3 text-secondary" style={{ width: '30%' }}>CATEGORY / DESCRIPTION</th>
                                <th className="py-3 text-secondary" style={{ width: '25%' }}>AMOUNT (VND)</th>
                                <th className="py-3 text-secondary" style={{ width: '15%' }}>SUGGESTION</th>
                                <th className="py-3 text-secondary" style={{ width: '25%' }}>NOTES / REFERENCE</th>
                                <th className="pe-4 py-3 text-center" style={{ width: '5%' }}>ACT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.map((item, index) => {
                                const suggEntry = suggestionMap[item.category?.toLowerCase()];
                                const suggestedAmt = suggEntry?.amount;
                                const hasSuggestion = suggestedAmt != null && (item.amount === '' || item.amount === null);
                                return (
                                <tr key={item.id} className="border-bottom">
                                    <td className="ps-4 py-3">
                                        <input 
                                            type="text" 
                                            className="form-control fw-bold border-secondary-subtle" 
                                            placeholder="e.g. Electricity, Laundry..."
                                            value={item.category}
                                            onChange={(e) => handleFormChange(item.id, 'category', e.target.value)}
                                        />
                                    </td>
                                    <td className="py-3">
                                        <div className="input-group">
                                            <span className="input-group-text bg-light text-muted fw-bold">&#8363;</span>
                                            <input 
                                                type="number" 
                                                className="form-control fw-bold text-end" 
                                                placeholder={hasSuggestion ? new Intl.NumberFormat('en-US').format(suggestedAmt) : '0'}
                                                value={item.amount}
                                                onChange={(e) => handleFormChange(item.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        {hasSuggestion ? (
                                            <div className="d-flex flex-column gap-1">
                                                <span 
                                                    className="badge rounded-pill px-2 py-1 fw-semibold"
                                                    style={{ fontSize: '0.7rem', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}
                                                    title="Suggested from system data"
                                                >
                                                    <i className="bi bi-stars me-1"></i>
                                                    {new Intl.NumberFormat('en-US').format(suggestedAmt)}
                                                </span>
                                                <button
                                                    className="btn btn-sm px-2 py-0 fw-bold"
                                                    style={{ fontSize: '0.7rem', backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', borderRadius: 6 }}
                                                    onClick={() => handleFormChange(item.id, 'amount', suggestedAmt)}
                                                    title="Apply suggested amount"
                                                    type="button"
                                                >
                                                    <i className="bi bi-check2 me-1"></i>Apply
                                                </button>
                                            </div>
                                        ) : suggestedAmt != null ? (
                                            <span 
                                                className="badge rounded-pill px-2 py-1 fw-semibold"
                                                style={{ fontSize: '0.7rem', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}
                                                title="Pre-filled from system data"
                                            >
                                                <i className="bi bi-stars me-1"></i>
                                                Auto
                                            </span>
                                        ) : (
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <input 
                                            type="text" 
                                            className="form-control text-secondary bg-light" 
                                            placeholder="Invoice ID or remarks..."
                                            value={item.note}
                                            onChange={(e) => handleFormChange(item.id, 'note', e.target.value)}
                                        />
                                    </td>
                                    <td className="pe-4 py-3 text-center">
                                        <button 
                                            className="btn btn-sm btn-outline-danger border-0 rounded-circle" 
                                            title="Remove Line" 
                                            onClick={() => handleRemoveCustomExpense(item.id)}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-start">
                    <button 
                        className="btn btn-outline-secondary fw-bold shadow-sm" 
                        onClick={handleAddCustomExpense}
                    >
                        <i className="bi bi-plus-circle-fill me-2"></i> Add Expense Line
                    </button>
                </div>

            </div>

            {/* DOCUMENT FOOTER - TOTALS & ACTIONS */}
            <div className="card-footer bg-white p-5 border-top border-2">
                <div className="row align-items-center">
                    <div className="col-md-6 mb-4 mb-md-0">
                        <div className="p-4 rounded-4" style={{ backgroundColor: '#fdf3f3', border: '1px solid #ffd0d0' }}>
                            <div className="text-danger fw-bold mb-1" style={{ letterSpacing: '1px' }}>TOTAL DECLARED EXPENSES</div>
                            <h2 className="fw-bold mb-0 text-danger">{formatCurrency(totalAmount)}</h2>
                        </div>
                    </div>
                    <div className="col-md-6 text-md-end">
                        <div className="d-flex flex-column flex-md-row justify-content-md-end gap-3">
                            <button 
                                className="btn btn-light border-secondary-subtle px-4 fw-bold py-3 text-secondary shadow-sm" 
                                onClick={onCancel} 
                                disabled={isSaving}
                            >
                                <i className="bi bi-x-circle me-2"></i> Cancel / Discard
                            </button>
                            <button 
                                className="btn text-white px-5 fw-bold py-3 shadow" 
                                style={{ backgroundColor: COLORS.PRIMARY }} 
                                onClick={handleSubmit} 
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span> Processing...</>
                                ) : (
                                    <><i className="bi bi-check2-circle me-2"></i> Authorize & Submit Report</>
                                )}
                            </button>
                        </div>
                        <p className="text-muted small mt-3 mb-0">
                            By submitting this document, you certify that the above expenses are accurate and supported by valid invoices or receipts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDeclarationForm;
