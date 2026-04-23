import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/financeApi';
import CollectDebtModal from '../component/CollectDebtModal';
import DebtRefundDetailDrawer from '../component/DebtRefundDetailDrawer';

const fmt = (v) => v ? new Intl.NumberFormat('vi-VN').format(Math.abs(v)) : '0';

const DebtRefundScreen = () => {
    const [refunds, setRefunds] = useState([]);
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('refunds');
    const [collectModal, setCollectModal] = useState({ show: false, debt: null });
    const [confirmingId, setConfirmingId] = useState(null);
    const [drawer, setDrawer] = useState({ show: false, type: null, id: null });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [r, d] = await Promise.all([
                financeApi.getPendingRefunds(),
                financeApi.getOutstandingDebts(),
            ]);
            setRefunds(r || []);
            setDebts(d || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleConfirmRefund = async (paymentId) => {
        setConfirmingId(paymentId);
        try {
            await financeApi.confirmRefund(paymentId);
            fetchData();
        } catch {
            // silent
        } finally {
            setConfirmingId(null);
        }
    };

    const handleCollectDebt = async (invoiceId, body) => {
        await financeApi.collectDebt(invoiceId, body);
        fetchData();
    };

    const totalRefund = refunds.reduce((s, r) => s + Math.abs(r.amount || 0), 0);
    const totalDebt = debts.reduce((s, d) => s + (d.remainingAmount || 0), 0);

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>
                        <i className="bi bi-cash-coin me-2" />Debt & Refund
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
                        Quản lý các khoản cần hoàn cho khách và thu nợ từ khách
                    </p>
                </div>
                <button className="btn btn-outline-secondary" onClick={fetchData} disabled={loading}
                    style={{ borderRadius: 8 }}>
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spinner-border spinner-border-sm' : ''}`} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0" style={{
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)',
                        boxShadow: '0 2px 8px rgba(220,53,69,0.1)'
                    }}>
                        <div className="card-body">
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888', marginBottom: 4 }}>
                                <i className="bi bi-arrow-up-circle me-1" style={{ color: '#dc3545' }} />
                                Cần hoàn cho khách
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc3545' }}>
                                {fmt(totalRefund)} ₫
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 2 }}>
                                {refunds.length} khoản đang chờ
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0" style={{
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #f0fff4 0%, #d4edda 100%)',
                        boxShadow: '0 2px 8px rgba(25,135,84,0.1)'
                    }}>
                        <div className="card-body">
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888', marginBottom: 4 }}>
                                <i className="bi bi-arrow-down-circle me-1" style={{ color: '#198754' }} />
                                Cần thu từ khách
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#198754' }}>
                                {fmt(totalDebt)} ₫
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 2 }}>
                                {debts.length} khách đang nợ
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0" style={{
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8e9f7 100%)',
                        boxShadow: '0 2px 8px rgba(91,95,199,0.1)'
                    }}>
                        <div className="card-body">
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888', marginBottom: 4 }}>
                                <i className="bi bi-list-check me-1" style={{ color: '#5b5fc7' }} />
                                Tổng cộng
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#5b5fc7' }}>
                                {refunds.length + debts.length} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>khoản</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 2 }}>
                                Cần xử lý
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="card-header bg-white" style={{ borderBottom: '2px solid #f0f0f0', borderRadius: '12px 12px 0 0', padding: 0 }}>
                    <ul className="nav nav-tabs border-0" style={{ padding: '0 20px' }}>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'refunds' ? 'active' : ''}`}
                                onClick={() => setActiveTab('refunds')}
                                style={{
                                    fontWeight: 700, border: 'none', fontSize: '0.9rem',
                                    borderBottom: activeTab === 'refunds' ? '3px solid #dc3545' : '3px solid transparent',
                                    color: activeTab === 'refunds' ? '#dc3545' : '#888',
                                    padding: '12px 20px', background: 'transparent'
                                }}
                            >
                                💸 Cần Hoàn ({refunds.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'debts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('debts')}
                                style={{
                                    fontWeight: 700, border: 'none', fontSize: '0.9rem',
                                    borderBottom: activeTab === 'debts' ? '3px solid #198754' : '3px solid transparent',
                                    color: activeTab === 'debts' ? '#198754' : '#888',
                                    padding: '12px 20px', background: 'transparent'
                                }}
                            >
                                📥 Cần Thu ({debts.length})
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body p-0">
                    {loading && (
                        <div className="text-center p-4">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    )}

                    {/* Tab: Pending Refunds */}
                    {activeTab === 'refunds' && !loading && (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0" style={{ fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafafa' }}>
                                        <th style={{ fontWeight: 700, color: '#555', padding: '12px 16px' }}>Booking</th>
                                        <th style={{ fontWeight: 700, color: '#555' }}>Khách hàng</th>
                                        <th style={{ fontWeight: 700, color: '#555' }}>Loại</th>
                                        <th style={{ fontWeight: 700, color: '#555', textAlign: 'right' }}>Số tiền hoàn</th>
                                        <th style={{ fontWeight: 700, color: '#555' }}>Ngày tạo</th>
                                        <th style={{ fontWeight: 700, color: '#555' }}>Người tạo</th>
                                        <th style={{ fontWeight: 700, color: '#555', textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {refunds.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center p-4 text-muted">
                                                🎉 Không có khoản hoàn tiền nào đang chờ!
                                            </td>
                                        </tr>
                                    ) : refunds.map((r) => (
                                        <tr key={r.paymentId} style={{ cursor: 'pointer' }} onClick={() => setDrawer({ show: true, type: 'REFUND', id: r.paymentId })}>
                                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0d6efd', textDecoration: 'underline' }}>
                                                {r.bookingCode}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{r.customerName || '—'}</div>
                                                {r.customerPhone && (
                                                    <div style={{ fontSize: '0.78rem', color: '#888' }}>
                                                        <i className="bi bi-telephone me-1" />{r.customerPhone}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${r.reason === 'CANCEL' ? 'bg-danger' : 'bg-warning text-dark'}`}
                                                    style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                                    {r.reason === 'CANCEL' ? 'Hủy booking' : 'Sửa booking'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc3545', fontSize: '0.95rem' }}>
                                                -{fmt(r.amount)} ₫
                                            </td>
                                            <td style={{ color: '#666' }}>
                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                                }) : '—'}
                                            </td>
                                            <td style={{ color: '#555', fontSize: '0.85rem' }}>
                                                {r.staffName ? (
                                                    <span><i className="bi bi-person-badge me-1" />{r.staffName}</span>
                                                ) : <span className="text-muted">—</span>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    disabled={confirmingId === r.paymentId}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Xác nhận đã chuyển khoản ${fmt(r.amount)} ₫ cho ${r.customerName || 'khách'}?`)) {
                                                            handleConfirmRefund(r.paymentId);
                                                        }
                                                    }}
                                                    style={{ borderRadius: 6, fontWeight: 600, fontSize: '0.8rem' }}
                                                >
                                                    {confirmingId === r.paymentId ? (
                                                        <span className="spinner-border spinner-border-sm me-1" />
                                                    ) : (
                                                        <i className="bi bi-check-circle me-1" />
                                                    )}
                                                    Confirm
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tab: Outstanding Debts */}
                    {activeTab === 'debts' && !loading && (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0" style={{ fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafafa' }}>
                                        <th style={{ fontWeight: 700, color: '#555', padding: '12px 16px' }}>Booking</th>
                                        <th style={{ fontWeight: 700, color: '#555' }}>Khách hàng</th>
                                        <th style={{ fontWeight: 700, color: '#555', textAlign: 'right' }}>Tổng HĐ</th>
                                        <th style={{ fontWeight: 700, color: '#555', textAlign: 'right' }}>Đã thu</th>
                                        <th style={{ fontWeight: 700, color: '#555', textAlign: 'right' }}>Còn nợ</th>
                                        <th style={{ fontWeight: 700, color: '#555' }}>Ngày checkout</th>
                                        <th style={{ fontWeight: 700, color: '#555' }}>Người tạo</th>
                                        <th style={{ fontWeight: 700, color: '#555', textAlign: 'center' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {debts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-4 text-muted">
                                                🎉 Không có khách nào đang nợ!
                                            </td>
                                        </tr>
                                    ) : debts.map((d) => (
                                        <tr key={d.invoiceId} style={{ cursor: 'pointer' }} onClick={() => setDrawer({ show: true, type: 'DEBT', id: d.invoiceId })}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ fontWeight: 700, color: '#0d6efd', textDecoration: 'underline' }}>{d.bookingCode}</span>
                                                <br />
                                                <span className={`badge ${d.invoiceType === 'SERVICE' ? 'bg-info' : 'bg-secondary'}`}
                                                    style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                                    {d.invoiceType === 'SERVICE' ? '🛎 Dịch vụ' : '🏠 Tiền phòng'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{d.customerName || '—'}</div>
                                                {d.customerPhone && (
                                                    <div style={{ fontSize: '0.78rem', color: '#888' }}>
                                                        <i className="bi bi-telephone me-1" />{d.customerPhone}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#555' }}>{fmt(d.totalAmount)} ₫</td>
                                            <td style={{ textAlign: 'right', color: '#198754', fontWeight: 600 }}>{fmt(d.paidAmount)} ₫</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc3545', fontSize: '0.95rem' }}>
                                                {fmt(d.remainingAmount)} ₫
                                            </td>
                                            <td style={{ color: '#666' }}>
                                                {d.checkoutDate ? new Date(d.checkoutDate).toLocaleDateString('vi-VN') : '—'}
                                            </td>
                                            <td style={{ color: '#555', fontSize: '0.85rem' }}>
                                                {d.staffName ? (
                                                    <span><i className="bi bi-person-badge me-1" />{d.staffName}</span>
                                                ) : <span className="text-muted">—</span>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); setCollectModal({ show: true, debt: d }); }}
                                                    style={{ borderRadius: 6, fontWeight: 600, fontSize: '0.8rem' }}
                                                >
                                                    💰 Collect
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Collect Debt Modal */}
            <CollectDebtModal
                show={collectModal.show}
                debt={collectModal.debt}
                onClose={() => setCollectModal({ show: false, debt: null })}
                onCollect={handleCollectDebt}
            />

            {/* Detail Drawer */}
            <DebtRefundDetailDrawer
                show={drawer.show}
                type={drawer.type}
                id={drawer.id}
                onClose={() => setDrawer({ show: false, type: null, id: null })}
            />
        </div>
    );
};

export default DebtRefundScreen;
