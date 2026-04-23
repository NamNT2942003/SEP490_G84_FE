import React, { useState, useEffect, useCallback } from 'react';
import { COLORS } from '@/constants';
import { financeApi } from '../api/financeApi';
import { reportApi } from '../../report/api/reportApi';
import CollectDebtModal from '../component/CollectDebtModal';
import DebtRefundDetailDrawer from '../component/DebtRefundDetailDrawer';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';

const fmt = (v) => v ? new Intl.NumberFormat('en-US').format(Math.abs(v)) : '0';
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const DebtRefundScreen = () => {
    const [refunds, setRefunds] = useState([]);
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('refunds');
    const [collectModal, setCollectModal] = useState({ show: false, debt: null });
    const [confirmingId, setConfirmingId] = useState(null);
    const [drawer, setDrawer] = useState({ show: false, type: null, id: null });
    const [search, setSearch] = useState('');

    // Branch filter
    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState('');

    const authUser = useSelector((state) => state.auth.user);
    const userRole = authUser?.role || '';

    // Load branches user has access to
    useEffect(() => {
        const loadBranches = async () => {
            try {
                const data = await reportApi.getReportBranches();
                setBranches(data || []);
                if (data && data.length === 1) setBranchId(data[0].branchId);
            } catch {
                // silent
            }
        };
        loadBranches();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const bid = branchId || undefined;
            const [r, d] = await Promise.all([
                financeApi.getPendingRefunds(bid),
                financeApi.getOutstandingDebts(bid),
            ]);
            setRefunds(r || []);
            setDebts(d || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleConfirmRefund = async (paymentId, customerName, amount) => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Confirm Refund',
            html: `Are you sure you have refunded <strong>${fmt(amount)} VND</strong> to <strong>${customerName || 'guest'}</strong>?`,
            showCancelButton: true,
            confirmButtonText: 'Yes, Confirmed',
            cancelButtonText: 'Cancel',
            confirmButtonColor: COLORS.PRIMARY,
        });
        if (!result.isConfirmed) return;

        setConfirmingId(paymentId);
        try {
            await financeApi.confirmRefund(paymentId);
            Swal.fire({ icon: 'success', title: 'Refund Confirmed', timer: 1500, showConfirmButton: false });
            fetchData();
        } catch {
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not confirm refund.' });
        } finally {
            setConfirmingId(null);
        }
    };

    const handleCollectDebt = async (invoiceId, body) => {
        await financeApi.collectDebt(invoiceId, body);
        fetchData();
    };

    // Filter by search
    const matchSearch = (item) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (item.bookingCode || '').toLowerCase().includes(q) ||
            (item.customerName || '').toLowerCase().includes(q) ||
            (item.customerPhone || '').toLowerCase().includes(q)
        );
    };

    const filteredRefunds = refunds.filter(matchSearch);
    const filteredDebts = debts.filter(matchSearch);

    const totalRefund = refunds.reduce((s, r) => s + Math.abs(r.amount || 0), 0);
    const totalDebt = debts.reduce((s, d) => s + (d.remainingAmount || 0), 0);

    // Role check
    const canConfirmRefund = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(userRole);
    const canCollectDebt = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST'].includes(userRole);

    return (
        <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', padding: '24px' }}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="page-title">Debt & Refund</h4>
                    <small className="text-muted">
                        Manage pending refunds and collect outstanding debts
                    </small>
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchData} disabled={loading}
                    style={{ borderRadius: 8 }}>
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} />
                    {' '}Refresh
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: 12 }}>
                <div className="card-body py-3">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label fw-semibold text-secondary" style={labelStyle}>
                                Search
                            </label>
                            <div style={{ position: 'relative' }}>
                                <i className="bi bi-search" style={{
                                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                    color: '#aaa', fontSize: '0.85rem'
                                }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Booking code, guest name, or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ paddingLeft: 36 }}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold text-secondary" style={labelStyle}>
                                Branch
                            </label>
                            <select
                                className="form-select"
                                value={branchId}
                                onChange={e => setBranchId(e.target.value)}
                                disabled={branches.length <= 1}
                            >
                                {branches.length > 1 && <option value="">All branches</option>}
                                {branches.length === 0 && <option value="">Loading...</option>}
                                {branches.map(b => (
                                    <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                {/* Refunds */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
                        <div className="card-body" style={{ padding: '18px 20px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Pending Refunds
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
                                {fmt(totalRefund)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9ca3af' }}>VND</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>
                                {refunds.length} {refunds.length === 1 ? 'item' : 'items'} pending
                            </div>
                        </div>
                    </div>
                </div>
                {/* Debts */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
                        <div className="card-body" style={{ padding: '18px 20px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Outstanding Debts
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.PRIMARY }}>
                                {fmt(totalDebt)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9ca3af' }}>VND</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>
                                {debts.length} {debts.length === 1 ? 'guest' : 'guests'} with debt
                            </div>
                        </div>
                    </div>
                </div>
                {/* Total */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
                        <div className="card-body" style={{ padding: '18px 20px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Total Items
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151' }}>
                                {refunds.length + debts.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9ca3af' }}>items</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>
                                Require action
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs + Table */}
            <div className="card shadow-sm border-0" style={{ borderRadius: 12 }}>
                <div className="card-header bg-white" style={{ borderBottom: '2px solid #f0f0f0', borderRadius: '12px 12px 0 0', padding: 0 }}>
                    <ul className="nav nav-tabs border-0" style={{ padding: '0 20px' }}>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'refunds' ? 'active' : ''}`}
                                onClick={() => setActiveTab('refunds')}
                                style={{
                                    fontWeight: 700, border: 'none', fontSize: '0.88rem',
                                    borderBottom: activeTab === 'refunds' ? `3px solid ${COLORS.PRIMARY}` : '3px solid transparent',
                                    color: activeTab === 'refunds' ? COLORS.PRIMARY : '#9ca3af',
                                    padding: '14px 20px', background: 'transparent', transition: 'all .2s',
                                }}
                            >
                                Pending Refunds ({refunds.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'debts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('debts')}
                                style={{
                                    fontWeight: 700, border: 'none', fontSize: '0.88rem',
                                    borderBottom: activeTab === 'debts' ? `3px solid ${COLORS.PRIMARY}` : '3px solid transparent',
                                    color: activeTab === 'debts' ? COLORS.PRIMARY : '#9ca3af',
                                    padding: '14px 20px', background: 'transparent', transition: 'all .2s',
                                }}
                            >
                                Outstanding Debts ({debts.length})
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body p-0">
                    {loading && (
                        <div className="text-center p-5">
                            <div className="spinner-border" style={{ color: COLORS.PRIMARY }} role="status" />
                        </div>
                    )}

                    {/* Tab: Pending Refunds */}
                    {activeTab === 'refunds' && !loading && (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0" style={{ fontSize: '0.87rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafbfc' }}>
                                        <th style={thStyle}>Booking</th>
                                        <th style={thStyle}>Guest</th>
                                        <th style={thStyle}>Type</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Refund Amount</th>
                                        <th style={thStyle}>Created</th>
                                        <th style={thStyle}>Staff</th>
                                        <th style={{ ...thStyle, textAlign: 'center', width: 100 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRefunds.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center p-4 text-muted">
                                                {search ? 'No matching refunds found.' : 'No pending refunds. All clear!'}
                                            </td>
                                        </tr>
                                    ) : filteredRefunds.map((r) => (
                                        <tr key={r.paymentId} style={{ cursor: 'pointer' }}
                                            onClick={() => setDrawer({ show: true, type: 'REFUND', id: r.paymentId })}>
                                            <td style={{ padding: '12px 16px', fontWeight: 700, color: COLORS.PRIMARY }}>
                                                {r.bookingCode}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#374151' }}>{r.customerName || '—'}</div>
                                                {r.customerPhone && (
                                                    <div style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
                                                        {r.customerPhone}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                    padding: '3px 10px', borderRadius: 20,
                                                    background: r.reason === 'CANCEL' ? '#fee2e2' : '#fef3c7',
                                                    color: r.reason === 'CANCEL' ? '#991b1b' : '#92400e',
                                                }}>
                                                    {r.reason === 'CANCEL' ? 'Cancellation' : 'Amendment'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626', fontSize: '0.93rem' }}>
                                                -{fmt(r.amount)} VND
                                            </td>
                                            <td style={{ color: '#6b7280' }}>{fmtDate(r.createdAt)}</td>
                                            <td style={{ color: '#374151', fontSize: '0.84rem' }}>
                                                {r.staffName || <span className="text-muted">—</span>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {canConfirmRefund && (
                                                    <button
                                                        className="btn btn-sm"
                                                        disabled={confirmingId === r.paymentId}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleConfirmRefund(r.paymentId, r.customerName, r.amount);
                                                        }}
                                                        style={{
                                                            borderRadius: 8, fontWeight: 600, fontSize: '0.78rem',
                                                            background: COLORS.PRIMARY, color: '#fff', border: 'none',
                                                            padding: '6px 14px',
                                                        }}
                                                    >
                                                        {confirmingId === r.paymentId ? (
                                                            <span className="spinner-border spinner-border-sm me-1" />
                                                        ) : (
                                                            <i className="bi bi-check-circle me-1" />
                                                        )}
                                                        Confirm
                                                    </button>
                                                )}
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
                            <table className="table table-hover mb-0" style={{ fontSize: '0.87rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafbfc' }}>
                                        <th style={thStyle}>Booking</th>
                                        <th style={thStyle}>Guest</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Invoice Total</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Paid</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Remaining</th>
                                        <th style={thStyle}>Checkout</th>
                                        <th style={thStyle}>Staff</th>
                                        <th style={{ ...thStyle, textAlign: 'center', width: 100 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDebts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-4 text-muted">
                                                {search ? 'No matching debts found.' : 'No outstanding debts. All clear!'}
                                            </td>
                                        </tr>
                                    ) : filteredDebts.map((d) => (
                                        <tr key={d.invoiceId} style={{ cursor: 'pointer' }}
                                            onClick={() => setDrawer({ show: true, type: 'DEBT', id: d.invoiceId })}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ fontWeight: 700, color: COLORS.PRIMARY }}>{d.bookingCode}</span>
                                                <br />
                                                <span style={{
                                                    fontSize: '0.68rem', fontWeight: 600,
                                                    padding: '2px 8px', borderRadius: 20,
                                                    background: d.invoiceType === 'SERVICE' ? '#eff6ff' : '#f3f4f6',
                                                    color: d.invoiceType === 'SERVICE' ? '#1d4ed8' : '#374151',
                                                }}>
                                                    {d.invoiceType === 'SERVICE' ? 'Service' : 'Room'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#374151' }}>{d.customerName || '—'}</div>
                                                {d.customerPhone && (
                                                    <div style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
                                                        {d.customerPhone}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#374151' }}>{fmt(d.totalAmount)} VND</td>
                                            <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{fmt(d.paidAmount)} VND</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626', fontSize: '0.93rem' }}>
                                                {fmt(d.remainingAmount)} VND
                                            </td>
                                            <td style={{ color: '#6b7280' }}>
                                                {d.checkoutDate ? fmtDate(d.checkoutDate) : '—'}
                                            </td>
                                            <td style={{ color: '#374151', fontSize: '0.84rem' }}>
                                                {d.staffName || <span className="text-muted">—</span>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {canCollectDebt && (
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={(e) => { e.stopPropagation(); setCollectModal({ show: true, debt: d }); }}
                                                        style={{
                                                            borderRadius: 8, fontWeight: 600, fontSize: '0.78rem',
                                                            background: COLORS.PRIMARY, color: '#fff', border: 'none',
                                                            padding: '6px 14px',
                                                        }}
                                                    >
                                                        <i className="bi bi-cash-coin me-1" />Collect
                                                    </button>
                                                )}
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

const labelStyle = { fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' };
const thStyle = { fontWeight: 700, color: '#6b7280', padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' };

export default DebtRefundScreen;
