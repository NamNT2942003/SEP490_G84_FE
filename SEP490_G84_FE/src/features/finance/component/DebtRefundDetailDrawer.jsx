import React, { useState, useEffect } from 'react';
import { financeApi } from '../api/financeApi';

const fmt = (v) => v != null ? new Intl.NumberFormat('vi-VN').format(Math.abs(v)) + ' ₫' : '—';
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtDateTime = (v) => v ? new Date(v).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const statusBadge = (status) => {
    const map = {
        CONFIRMED: 'bg-primary', CHECKED_IN: 'bg-info text-dark', CHECKED_OUT: 'bg-secondary',
        CANCELLED: 'bg-danger', NO_SHOW: 'bg-dark', PENDING: 'bg-warning text-dark',
        COMPLETED: 'bg-success', UNPAID: 'bg-danger', PAID: 'bg-success', OPEN: 'bg-info text-dark',
    };
    return map[status] || 'bg-secondary';
};

const Section = ({ icon, title, children }) => (
    <div style={{ marginBottom: 20 }}>
        <h6 style={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.9rem', marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
            <i className={`bi ${icon} me-2`} />{title}
        </h6>
        {children}
    </div>
);

const InfoRow = ({ label, value, color, bold }) => (
    <div className="d-flex justify-content-between align-items-center" style={{ padding: '4px 0', fontSize: '0.84rem' }}>
        <span style={{ color: '#777' }}>{label}</span>
        <span style={{ fontWeight: bold ? 700 : 500, color: color || '#333' }}>{value || '—'}</span>
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

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1040, transition: 'opacity 0.3s' }}
            />
            {/* Drawer */}
            <div style={{
                position: 'fixed', top: 0, right: 0, width: 520, height: '100vh', zIndex: 1050,
                background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                overflowY: 'auto', transition: 'transform 0.3s',
                transform: show ? 'translateX(0)' : 'translateX(100%)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: type === 'REFUND'
                        ? 'linear-gradient(135deg, #fff5f5, #ffe3e3)'
                        : 'linear-gradient(135deg, #f0fff4, #d4edda)'
                }}>
                    <div>
                        <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>
                            {type === 'REFUND' ? '💸 Chi tiết hoàn tiền' : '📥 Chi tiết khoản nợ'}
                        </h5>
                        {data && <span style={{ fontSize: '0.8rem', color: '#666' }}>{data.bookingCode}</span>}
                    </div>
                    <button className="btn-close" onClick={onClose} />
                </div>

                {/* Body */}
                <div style={{ padding: 20 }}>
                    {loading && (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" />
                        </div>
                    )}

                    {!loading && data && (
                        <>
                            {/* Key Amount */}
                            <div style={{
                                background: type === 'REFUND' ? '#fff3cd' : '#f8d7da',
                                borderRadius: 10, padding: '14px 16px', marginBottom: 20,
                                border: `1px solid ${type === 'REFUND' ? '#ffc107' : '#f5c6cb'}`,
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>
                                    {type === 'REFUND' ? 'Số tiền cần hoàn' : 'Số tiền còn nợ'}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc3545', marginTop: 4 }}>
                                    {type === 'REFUND' ? fmt(data.refundAmount) : fmt(data.debtRemaining)}
                                </div>
                                {data.staffName && (
                                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>
                                        <i className="bi bi-person-badge me-1" />Người tạo: <b>{data.staffName}</b>
                                    </div>
                                )}
                            </div>

                            {/* Booking Info */}
                            <Section icon="bi-calendar-event" title="Thông tin Booking">
                                <InfoRow label="Mã booking" value={data.bookingCode} bold />
                                <InfoRow label="Trạng thái" value={
                                    <span className={`badge ${statusBadge(data.bookingStatus)}`} style={{ fontSize: '0.72rem' }}>
                                        {data.bookingStatus}
                                    </span>
                                } />
                                <InfoRow label="Nguồn" value={data.source} />
                                <InfoRow label="Chi nhánh" value={data.branchName} />
                                <InfoRow label="Ngày đặt" value={fmtDateTime(data.bookingCreatedAt)} />
                                <InfoRow label="Ngày đến" value={fmtDate(data.arrivalDate)} />
                                <InfoRow label="Ngày đi" value={fmtDate(data.departureDate)} />
                                {data.actualCheckIn && <InfoRow label="Check-in thực tế" value={fmtDateTime(data.actualCheckIn)} />}
                                {data.actualCheckOut && <InfoRow label="Check-out thực tế" value={fmtDateTime(data.actualCheckOut)} />}
                                <InfoRow label="Tổng tiền booking" value={fmt(data.bookingTotalAmount)} bold color="#2c3e50" />
                            </Section>

                            {/* Customer Info */}
                            <Section icon="bi-person" title="Khách hàng">
                                <InfoRow label="Họ tên" value={data.customerName} bold />
                                <InfoRow label="Email" value={data.customerEmail} />
                                <InfoRow label="SĐT" value={data.customerPhone} />
                                <InfoRow label="CCCD/Passport" value={data.customerIdentity} />
                            </Section>

                            {/* Cancellation Policy */}
                            {(data.snapshotRefundRate != null || data.snapshotFreeCancelDays != null) && (
                                <Section icon="bi-shield-exclamation" title="Chính sách hủy (snapshot)">
                                    <InfoRow label="Tỷ lệ hoàn tiền" value={data.snapshotRefundRate != null ? `${data.snapshotRefundRate}%` : '0%'} />
                                    <InfoRow label="Hủy miễn phí trước" value={data.snapshotFreeCancelDays != null ? `${data.snapshotFreeCancelDays} ngày` : '—'} />
                                </Section>
                            )}

                            {/* Invoice Info */}
                            <Section icon="bi-receipt" title="Hóa đơn">
                                <InfoRow label="Mã HĐ" value={`#${data.invoiceId}`} />
                                <InfoRow label="Loại" value={data.invoiceType} />
                                <InfoRow label="Trạng thái" value={
                                    <span className={`badge ${statusBadge(data.invoiceStatus)}`} style={{ fontSize: '0.72rem' }}>
                                        {data.invoiceStatus}
                                    </span>
                                } />
                                <InfoRow label="Tổng HĐ" value={fmt(data.invoiceTotalAmount)} bold color="#2c3e50" />
                            </Section>

                            {/* Payment History */}
                            {data.payments && data.payments.length > 0 && (
                                <Section icon="bi-credit-card" title="Lịch sử thanh toán">
                                    {data.payments.map((p, i) => (
                                        <div key={i} style={{
                                            background: '#f8f9fa', borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                                            border: '1px solid #eee'
                                        }}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: p.amount < 0 ? '#dc3545' : '#198754' }}>
                                                        {p.amount < 0 ? '-' : '+'}{fmt(p.amount)}
                                                    </span>
                                                    <span className={`badge ms-2 ${statusBadge(p.paymentStatus)}`} style={{ fontSize: '0.65rem' }}>
                                                        {p.paymentStatus}
                                                    </span>
                                                </div>
                                                <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                                                    {p.paymentMethod}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>
                                                {p.paidAt ? fmtDateTime(p.paidAt) : fmtDateTime(p.createdAt)}
                                                {p.staffName && <span> · <i className="bi bi-person-badge me-1" />{p.staffName}</span>}
                                                {p.providerTxnId && <span className="ms-2" style={{ color: '#aaa' }}>({p.providerTxnId})</span>}
                                            </div>
                                        </div>
                                    ))}
                                </Section>
                            )}
                        </>
                    )}

                    {!loading && !data && (
                        <div className="text-center p-5 text-muted">
                            Không tìm thấy dữ liệu
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DebtRefundDetailDrawer;
