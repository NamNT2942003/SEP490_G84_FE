import React, { useState } from 'react';

const CollectDebtModal = ({ show, onClose, debt, onCollect }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('CASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fmt = (v) => v ? new Intl.NumberFormat('vi-VN').format(v) + ' ₫' : '0 ₫';

    const handleCollect = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            setError('Vui lòng nhập số tiền hợp lệ');
            return;
        }
        if (numAmount > debt.remainingAmount) {
            setError(`Số tiền không được vượt quá ${fmt(debt.remainingAmount)}`);
            return;
        }
        setError('');
        setLoading(true);
        try {
            await onCollect(debt.invoiceId, { amount: numAmount, paymentMethod: method });
            setAmount('');
            setMethod('CASH');
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    if (!show || !debt) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
                <div className="modal-content" style={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                    <div className="modal-header" style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px' }}>
                        <h5 className="modal-title" style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                            💰 Thu tiền nợ
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body" style={{ padding: 20 }}>
                        {/* Booking Info */}
                        <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #e9ecef' }}>
                            <div style={{ fontSize: '0.82rem', color: '#666' }}>Booking</div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2c3e50' }}>{debt.bookingCode}</div>
                            <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 8 }}>Khách hàng</div>
                            <div style={{ fontWeight: 600 }}>{debt.customerName || '—'}</div>
                        </div>

                        {/* Remaining */}
                        <div style={{
                            background: '#fff3cd', borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                            border: '1px solid #ffc107', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <span style={{ fontWeight: 600, color: '#856404' }}>Còn nợ</span>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#d63384' }}>
                                {fmt(debt.remainingAmount)}
                            </span>
                        </div>

                        {/* Amount */}
                        <div className="mb-3">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Số tiền thu</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    className="form-control form-control-lg"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Nhập số tiền"
                                    min="1000"
                                    max={debt.remainingAmount}
                                />
                                <span className="input-group-text">₫</span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 mt-1"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => setAmount(String(debt.remainingAmount))}
                            >
                                Thu toàn bộ ({fmt(debt.remainingAmount)})
                            </button>
                        </div>

                        {/* Method */}
                        <div className="mb-3">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Phương thức</label>
                            <select
                                className="form-select form-select-lg"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                            >
                                <option value="CASH">💵 Tiền mặt</option>
                                <option value="TRANSFER">🏦 Chuyển khoản</option>
                                <option value="CARD">💳 Thẻ</option>
                            </select>
                        </div>

                        {error && <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem' }}>{error}</div>}

                        {/* Submit */}
                        <button
                            className="btn btn-success btn-lg w-100"
                            disabled={loading}
                            onClick={handleCollect}
                            style={{ fontWeight: 700, borderRadius: 8, height: 46 }}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" />
                            ) : '✅ '}
                            Xác nhận thu tiền
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectDebtModal;
