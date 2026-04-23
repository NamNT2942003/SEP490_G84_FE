import React, { useState, useEffect } from 'react';
import { financeApi } from '../api/financeApi';

const fmt = (v) => v != null ? new Intl.NumberFormat('en-US').format(Math.abs(v)) + ' VND' : '—';
const fmtDateTime = (v) => v ? new Date(v).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—';

const statusColor = {
    CONFIRMED: '#0d6efd', CHECKED_IN: '#0dcaf0', CHECKED_OUT: '#6c757d',
    CANCELLED: '#dc3545', NO_SHOW: '#212529', PENDING: '#ffc107',
    COMPLETED: '#198754', UNPAID: '#dc3545', PAID: '#198754',
};

const InfoRow = ({ label, value, color, bold }) => (
    <div className="d-flex justify-content-between align-items-start" style={{ padding: '6px 0', fontSize: '0.84rem' }}>
        <span style={{ color: '#888', minWidth: 130, fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: bold ? 700 : 500, color: color || '#333', textAlign: 'right' }}>{value || '—'}</span>
    </div>
);

const DebtRefundDetailDrawer = ({ show, onClose, type, id }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!show || !id) return;
        setLoading(true);
        const fetcher = type === 'REFUND' ? financeApi.getRefundDetail(id) : financeApi.getDebtDetail(id);
        fetcher.then(setData).catch(() => setData(null)).finally(() => setLoading(false));
    }, [show, type, id]);

    if (!show) return null;

    const getReason = () => {
        if (!data) return '';
        if (type === 'REFUND') {
            if (data.bookingStatus === 'CANCELLED') {
                return `Booking cancelled — refund ${data.snapshotRefundRate || 0}% of deposit`;
            }
            return 'Booking amended (room/night reduced) — refund excess payment';
        }
        if (data.invoiceType === 'SERVICE') {
            return 'Guest checked out with unpaid service charges';
        }
        return 'Guest checked out with unpaid room balance';
    };

    const isRefund = type === 'REFUND';

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1040 }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, width: 460, height: '100vh', zIndex: 1050,
                background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto',
                fontFamily: "'DM Sans', sans-serif",
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 22px', borderBottom: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: isRefund
                        ? 'linear-gradient(135deg, #fff5f5, #ffe3e3)'
                        : 'linear-gradient(135deg, #f0fff4, #d4edda)'
                }}>
                    <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e' }}>
                        {isRefund ? '💸 Refund Details' : '📥 Debt Details'}
                    </h5>
                    <button className="btn-close" onClick={onClose} />
                </div>

                <div style={{ padding: 22 }}>
                    {loading && (
                        <div className="text-center p-5"><div className="spinner-border" style={{ color: '#465c47' }} /></div>
                    )}

                    {!loading && data && (
                        <>
                            {/* === REASON === */}
                            <div style={{
                                background: isRefund ? '#fff3cd' : '#cfe2ff',
                                borderRadius: 10, padding: '14px 16px', marginBottom: 16,
                                border: `1px solid ${isRefund ? '#ffc107' : '#9ec5fe'}`
                            }}>
                                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    <i className="bi bi-info-circle me-1" />Reason
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2c3e50' }}>
                                    {getReason()}
                                </div>
                            </div>

                            {/* === AMOUNT === */}
                            <div style={{
                                background: isRefund ? '#fff5f5' : '#f0fff4',
                                borderRadius: 10, padding: '18px',
                                border: `1.5px solid ${isRefund ? '#f5c6cb' : '#a5d6a7'}`,
                                textAlign: 'center', marginBottom: 20
                            }}>
                                <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    {isRefund ? 'Amount to Refund' : 'Outstanding Balance'}
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc3545', marginTop: 6 }}>
                                    {isRefund ? fmt(data.refundAmount) : fmt(data.debtRemaining)}
                                </div>
                            </div>

                            {/* === BOOKING INFO === */}
                            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 18px', marginBottom: 16, border: '1px solid #e9ecef' }}>
                                <InfoRow label="Booking Code" value={data.bookingCode} bold />
                                <InfoRow label="Status" value={
                                    <span style={{
                                        background: statusColor[data.bookingStatus] || '#6c757d',
                                        color: '#fff', padding: '2px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600
                                    }}>{data.bookingStatus}</span>
                                } />
                                <InfoRow label="Guest Name" value={data.customerName} bold />
                                <InfoRow label="Phone" value={data.customerPhone} />
                                {data.customerEmail && <InfoRow label="Email" value={data.customerEmail} />}
                                <div style={{ borderTop: '1px solid #eee', margin: '8px 0' }} />
                                <InfoRow label="Arrival" value={fmtDate(data.arrivalDate)} />
                                <InfoRow label="Departure" value={fmtDate(data.departureDate)} />
                                <InfoRow label="Booking Total" value={fmt(data.bookingTotalAmount)} bold color="#2c3e50" />
                            </div>

                            {/* === CALCULATION (Refund) === */}
                            {isRefund && data.snapshotRefundRate != null && (
                                <div style={{ background: '#fafafa', borderRadius: 10, padding: '14px 18px', marginBottom: 16, border: '1px solid #eee' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        <i className="bi bi-calculator me-1" />Calculation
                                    </div>
                                    <InfoRow label="Deposit Paid" value={
                                        data.payments?.filter(p => p.amount > 0 && p.paymentStatus === 'COMPLETED')
                                            .reduce((s, p) => s + p.amount, 0) > 0
                                            ? fmt(data.payments.filter(p => p.amount > 0 && p.paymentStatus === 'COMPLETED').reduce((s, p) => s + p.amount, 0))
                                            : '—'
                                    } />
                                    <InfoRow label="Refund Rate" value={`${data.snapshotRefundRate}%`} bold />
                                    <InfoRow label="→ Refund" value={fmt(data.refundAmount)} bold color="#dc3545" />
                                </div>
                            )}

                            {/* === CALCULATION (Debt) === */}
                            {!isRefund && (
                                <div style={{ background: '#fafafa', borderRadius: 10, padding: '14px 18px', marginBottom: 16, border: '1px solid #eee' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        <i className="bi bi-calculator me-1" />Debt Breakdown
                                    </div>
                                    <InfoRow label="Invoice Total" value={fmt(data.invoiceTotalAmount)} />
                                    <InfoRow label="Amount Paid" value={
                                        fmt((data.invoiceTotalAmount || 0) - (data.debtRemaining || 0))
                                    } color="#198754" />
                                    <InfoRow label="→ Remaining" value={fmt(data.debtRemaining)} bold color="#dc3545" />
                                </div>
                            )}

                            {/* === STAFF === */}
                            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '12px 18px', marginBottom: 16, border: '1px solid #e9ecef' }}>
                                <InfoRow label={isRefund ? 'Processed by' : 'Checkout by'} value={
                                    data.staffName ? (
                                        <span><i className="bi bi-person-badge me-1" />{data.staffName}</span>
                                    ) : '—'
                                } bold />
                                <InfoRow label="Date/Time" value={
                                    isRefund
                                        ? fmtDateTime(data.payments?.find(p => p.amount < 0)?.createdAt)
                                        : fmtDateTime(data.actualCheckOut || data.departureDate)
                                } />
                            </div>
                        </>
                    )}

                    {!loading && !data && (
                        <div className="text-center p-5 text-muted">
                            <i className="bi bi-exclamation-circle fs-3 d-block mb-2 opacity-25" />
                            No data found
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DebtRefundDetailDrawer;
