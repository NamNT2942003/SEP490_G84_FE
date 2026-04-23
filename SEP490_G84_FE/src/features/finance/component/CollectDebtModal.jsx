import React, { useState } from 'react';

const CollectDebtModal = ({ show, onClose, debt, onCollect }) => {
    const [method, setMethod] = useState('CASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fmt = (v) => v ? new Intl.NumberFormat('vi-VN').format(v) + ' ₫' : '0 ₫';

    const handleCollect = async () => {
        setError('');
        setLoading(true);
        try {
            await onCollect(debt.invoiceId, { amount: debt.remainingAmount, paymentMethod: method });
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

                        {/* Amount to collect */}
                        <div style={{
                            background: '#f8d7da', borderRadius: 10, padding: '16px',
                            border: '1px solid #f5c6cb', textAlign: 'center', marginBottom: 16
                        }}>
                            <div style={{ fontSize: '0.82rem', color: '#856404', fontWeight: 600 }}>Số tiền thu</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc3545', marginTop: 4 }}>
                                {fmt(debt.remainingAmount)}
                            </div>
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
                            Xác nhận thu {fmt(debt.remainingAmount)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectDebtModal;
