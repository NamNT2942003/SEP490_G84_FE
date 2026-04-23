import React, { useState } from 'react';

const CollectDebtModal = ({ show, onClose, debt, onCollect }) => {
    const [method, setMethod] = useState('CASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fmt = (v) => v ? new Intl.NumberFormat('en-US').format(v) + ' VND' : '0 VND';

    const handleCollect = async () => {
        setError('');
        setLoading(true);
        try {
            await onCollect(debt.invoiceId, { amount: debt.remainingAmount, paymentMethod: method });
            setMethod('CASH');
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'An error occurred while processing the collection.');
        } finally {
            setLoading(false);
        }
    };

    if (!show || !debt) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
                <div className="modal-content" style={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', fontFamily: "'DM Sans', sans-serif" }}>
                    <div className="modal-header" style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px' }}>
                        <h5 className="modal-title" style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e' }}>
                            <i className="bi bi-cash-coin me-2" style={{ color: '#198754' }} />Collect Debt
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body" style={{ padding: 20 }}>
                        {/* Booking Info */}
                        <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #e9ecef' }}>
                            <div style={{ fontSize: '0.78rem', color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Booking</div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2c3e50' }}>{debt.bookingCode}</div>
                            <div style={{ fontSize: '0.78rem', color: '#999', marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Guest</div>
                            <div style={{ fontWeight: 600, color: '#333' }}>{debt.customerName || '—'}</div>
                        </div>

                        {/* Amount to collect */}
                        <div style={{
                            background: '#fff5f5', borderRadius: 10, padding: '18px',
                            border: '1.5px solid #f5c6cb', textAlign: 'center', marginBottom: 16
                        }}>
                            <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Amount to Collect</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc3545', marginTop: 6 }}>
                                {fmt(debt.remainingAmount)}
                            </div>
                        </div>

                        {/* Method */}
                        <div className="mb-3">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Payment Method</label>
                            <select
                                className="form-select"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                style={{ borderRadius: 8, padding: '10px 14px', fontSize: '0.9rem', border: '1.5px solid #dde3dd' }}
                            >
                                <option value="CASH">💵 Cash</option>
                                <option value="TRANSFER">🏦 Bank Transfer</option>
                                <option value="CARD">💳 Card</option>
                            </select>
                        </div>

                        {error && <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem', borderRadius: 8 }}>{error}</div>}

                        {/* Submit */}
                        <button
                            className="btn w-100"
                            disabled={loading}
                            onClick={handleCollect}
                            style={{
                                fontWeight: 700, borderRadius: 10, height: 46, fontSize: '0.95rem',
                                background: '#198754', color: '#fff', border: 'none',
                            }}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" />
                            ) : (
                                <i className="bi bi-check-circle me-1" />
                            )}
                            Confirm Collection — {fmt(debt.remainingAmount)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectDebtModal;
