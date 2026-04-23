import React, { useState, useEffect } from 'react';
import { financeApi } from '../api/financeApi';

const fmt = (v) => v != null ? new Intl.NumberFormat('vi-VN').format(Math.abs(v)) + ' ₫' : '—';
const fmtDateTime = (v) => v ? new Date(v).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—';

const statusColor = {
    CONFIRMED: '#0d6efd', CHECKED_IN: '#0dcaf0', CHECKED_OUT: '#6c757d',
    CANCELLED: '#dc3545', NO_SHOW: '#212529', PENDING: '#ffc107',
    COMPLETED: '#198754', UNPAID: '#dc3545', PAID: '#198754',
};

const InfoRow = ({ label, value, color, bold }) => (
    <div className="d-flex justify-content-between align-items-start" style={{ padding: '5px 0', fontSize: '0.84rem' }}>
        <span style={{ color: '#777', minWidth: 120 }}>{label}</span>
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

    // Xác định lý do
    const getReason = () => {
        if (!data) return '';
        if (type === 'REFUND') {
            if (data.bookingStatus === 'CANCELLED') {
                return `Khách hủy booking → hoàn ${data.snapshotRefundRate || 0}% tiền cọc`;
            }
            return 'Khách sửa booking (giảm phòng/ngày) → hoàn tiền thừa';
        }
        return 'Khách checkout nhưng chưa trả hết tiền phòng';
    };

    const isRefund = type === 'REFUND';

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1040 }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, width: 460, height: '100vh', zIndex: 1050,
                background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', overflowY: 'auto',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: isRefund
                        ? 'linear-gradient(135deg, #fff5f5, #ffe3e3)'
                        : 'linear-gradient(135deg, #f0fff4, #d4edda)'
                }}>
                    <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
                        {isRefund ? '💸 Chi tiết hoàn tiền' : '📥 Chi tiết khoản nợ'}
                    </h5>
                    <button className="btn-close" onClick={onClose} />
                </div>

                <div style={{ padding: 20 }}>
                    {loading && (
                        <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
                    )}

                    {!loading && data && (
                        <>
                            {/* === LÝ DO === */}
                            <div style={{
                                background: isRefund ? '#fff3cd' : '#cfe2ff',
                                borderRadius: 10, padding: '14px 16px', marginBottom: 16,
                                border: `1px solid ${isRefund ? '#ffc107' : '#9ec5fe'}`
                            }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: 4 }}>
                                    <i className="bi bi-info-circle me-1" />LÝ DO
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2c3e50' }}>
                                    {getReason()}
                                </div>
                            </div>

                            {/* === SỐ TIỀN === */}
                            <div style={{
                                background: '#f8d7da', borderRadius: 10, padding: '16px',
                                border: '1px solid #f5c6cb', textAlign: 'center', marginBottom: 20
                            }}>
                                <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>
                                    {isRefund ? 'Số tiền cần hoàn cho khách' : 'Số tiền khách còn nợ'}
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc3545', marginTop: 4 }}>
                                    {isRefund ? fmt(data.refundAmount) : fmt(data.debtRemaining)}
                                </div>
                            </div>

                            {/* === BOOKING + KHÁCH === */}
                            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #e9ecef' }}>
                                <InfoRow label="Mã booking" value={data.bookingCode} bold />
                                <InfoRow label="Trạng thái" value={
                                    <span style={{
                                        background: statusColor[data.bookingStatus] || '#6c757d',
                                        color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600
                                    }}>{data.bookingStatus}</span>
                                } />
                                <InfoRow label="Khách hàng" value={data.customerName} bold />
                                <InfoRow label="SĐT" value={data.customerPhone} />
                                {data.customerEmail && <InfoRow label="Email" value={data.customerEmail} />}
                                <div style={{ borderTop: '1px solid #eee', margin: '8px 0' }} />
                                <InfoRow label="Ngày đến" value={fmtDate(data.arrivalDate)} />
                                <InfoRow label="Ngày đi" value={fmtDate(data.departureDate)} />
                                <InfoRow label="Tổng booking" value={fmt(data.bookingTotalAmount)} bold color="#2c3e50" />
                            </div>

                            {/* === TÍNH TOÁN (cho Refund) === */}
                            {isRefund && data.snapshotRefundRate != null && (
                                <div style={{ background: '#f0f0f0', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #ddd' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', marginBottom: 8 }}>
                                        <i className="bi bi-calculator me-1" />Cách tính
                                    </div>
                                    <InfoRow label="Đã cọc/trả" value={
                                        data.payments?.filter(p => p.amount > 0 && p.paymentStatus === 'COMPLETED')
                                            .reduce((s, p) => s + p.amount, 0) > 0
                                            ? fmt(data.payments.filter(p => p.amount > 0 && p.paymentStatus === 'COMPLETED').reduce((s, p) => s + p.amount, 0))
                                            : '—'
                                    } />
                                    <InfoRow label="Tỷ lệ hoàn" value={`${data.snapshotRefundRate}%`} bold />
                                    <InfoRow label="→ Hoàn" value={fmt(data.refundAmount)} bold color="#dc3545" />
                                </div>
                            )}

                            {/* === TÍNH TOÁN (cho Debt) === */}
                            {!isRefund && (
                                <div style={{ background: '#f0f0f0', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #ddd' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#555', marginBottom: 8 }}>
                                        <i className="bi bi-calculator me-1" />Chi tiết nợ
                                    </div>
                                    <InfoRow label="Tổng hóa đơn" value={fmt(data.invoiceTotalAmount)} />
                                    <InfoRow label="Đã thu" value={
                                        fmt((data.invoiceTotalAmount || 0) - (data.debtRemaining || 0))
                                    } color="#198754" />
                                    <InfoRow label="→ Còn nợ" value={fmt(data.debtRemaining)} bold color="#dc3545" />
                                </div>
                            )}

                            {/* === NGƯỜI TẠO === */}
                            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid #e9ecef' }}>
                                <InfoRow label={isRefund ? 'Người hủy/sửa' : 'Người checkout'} value={
                                    data.staffName ? (
                                        <span><i className="bi bi-person-badge me-1" />{data.staffName}</span>
                                    ) : '—'
                                } bold />
                                <InfoRow label="Thời gian" value={
                                    isRefund
                                        ? fmtDateTime(data.payments?.find(p => p.amount < 0)?.createdAt)
                                        : fmtDateTime(data.actualCheckOut || data.departureDate)
                                } />
                            </div>
                        </>
                    )}

                    {!loading && !data && (
                        <div className="text-center p-5 text-muted">Không tìm thấy dữ liệu</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DebtRefundDetailDrawer;
