import React, { useState } from 'react';
import { COLORS } from '@/constants';

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
                <div className="modal-content" style={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f0f0f0',
                        background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY}cc 100%)`,
                        color: '#fff', borderRadius: '12px 12px 0 0',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Collect Debt</span>
                            <button onClick={onClose} style={{
                                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                                width: 28, height: 28, color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
                                lineHeight: '28px', textAlign: 'center',
                            }}>×</button>
                        </div>
                    </div>

                    <div className="modal-body" style={{ padding: 20 }}>
                        {/* Booking Info */}
                        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking</div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: COLORS.PRIMARY, fontFamily: 'monospace' }}>{debt.bookingCode}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guest</div>
                            <div style={{ fontWeight: 600, color: '#374151' }}>{debt.customerName || '—'}</div>
                        </div>

                        {/* Amount */}
                        <div style={{
                            background: '#fef2f2', borderRadius: 10, padding: '18px',
                            border: '1px solid #fecaca', textAlign: 'center', marginBottom: 16
                        }}>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount to Collect</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: 6 }}>
                                {fmt(debt.remainingAmount)}
                            </div>
                        </div>

                        {/* Method */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method</label>
                            <select
                                className="form-select"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                            >
                                <option value="CASH">Cash</option>
                                <option value="TRANSFER">Bank Transfer</option>
                                <option value="CARD">Card</option>
                            </select>
                        </div>

                        {error && <div className="alert alert-danger py-2" style={{ fontSize: '0.85rem', borderRadius: 8 }}>{error}</div>}

                        {/* Submit */}
                        <button
                            className="btn w-100"
                            disabled={loading}
                            onClick={handleCollect}
                            style={{
                                fontWeight: 700, borderRadius: 8, height: 44, fontSize: '0.9rem',
                                background: COLORS.PRIMARY, color: '#fff', border: 'none',
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
