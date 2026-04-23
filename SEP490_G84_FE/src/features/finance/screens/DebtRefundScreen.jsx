import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/financeApi';
import { reportApi } from '../../report/api/reportApi';
import CollectDebtModal from '../component/CollectDebtModal';
import DebtRefundDetailDrawer from '../component/DebtRefundDetailDrawer';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';

const fmt = (v) => v ? new Intl.NumberFormat('en-US').format(Math.abs(v)) : '0';
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—';

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
                // If user only has 1 branch, auto-select it
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
            confirmButtonColor: '#2e7d32',
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

    // Filter by search + role
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
        <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e', letterSpacing: '-0.3px' }}>
                        <i className="bi bi-wallet2 me-2" style={{ color: '#465c47' }} />Debt & Refund
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
                        Manage pending refunds to guests and collect outstanding debts
                    </p>
                </div>
                <button className="btn" onClick={fetchData} disabled={loading}
                    style={{ borderRadius: 8, border: '1.5px solid #dde3dd', background: '#fff', padding: '8px 14px' }}>
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spinner-border spinner-border-sm' : ''}`}
                        style={{ color: '#465c47' }} />
                </button>
            </div>

            {/* Search + Branch Filter */}
            <div className="row g-3 mb-4 align-items-end">
                <div className="col-md-5">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888' }}>
                        Search
                    </label>
                    <div style={{ position: 'relative' }}>
                        <i className="bi bi-search" style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: '#aaa', fontSize: '0.9rem'
                        }} />
                        <input
                            type="text"
                            placeholder="Booking code, guest name, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-control"
                            style={{
                                paddingLeft: 38, borderRadius: 10,
                                border: '1.5px solid #dde3dd', fontSize: '0.88rem',
                            }}
                        />
                    </div>
                </div>
                <div className="col-md-3">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888' }}>
                        Branch
                    </label>
                    <select
                        className="form-select"
                        value={branchId}
                        onChange={e => setBranchId(e.target.value)}
                        disabled={branches.length <= 1}
                        style={{ borderRadius: 10, border: '1.5px solid #dde3dd', fontSize: '0.88rem' }}
                    >
                        {branches.length > 1 && <option value="">All branches</option>}
                        {branches.length === 0 && <option value="">Loading...</option>}
                        {branches.map(b => (
                            <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0" style={{
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)',
                        boxShadow: '0 2px 8px rgba(220,53,69,0.08)'
                    }}>
                        <div className="card-body" style={{ padding: '18px 20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <i className="bi bi-arrow-up-circle me-1" style={{ color: '#dc3545' }} />
                                Pending Refunds
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc3545' }}>
                                {fmt(totalRefund)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>VND</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#aaa', marginTop: 2 }}>
                                {refunds.length} {refunds.length === 1 ? 'item' : 'items'} pending
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0" style={{
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #f0fff4 0%, #d4edda 100%)',
                        boxShadow: '0 2px 8px rgba(25,135,84,0.08)'
                    }}>
                        <div className="card-body" style={{ padding: '18px 20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <i className="bi bi-arrow-down-circle me-1" style={{ color: '#198754' }} />
                                Outstanding Debts
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#198754' }}>
                                {fmt(totalDebt)} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>VND</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#aaa', marginTop: 2 }}>
                                {debts.length} {debts.length === 1 ? 'guest' : 'guests'} with debt
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0" style={{
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8e9f7 100%)',
                        boxShadow: '0 2px 8px rgba(91,95,199,0.08)'
                    }}>
                        <div className="card-body" style={{ padding: '18px 20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <i className="bi bi-list-check me-1" style={{ color: '#5b5fc7' }} />
                                Total Items
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#5b5fc7' }}>
                                {refunds.length + debts.length} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>items</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#aaa', marginTop: 2 }}>
                                Require action
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card border-0" style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div className="card-header bg-white" style={{ borderBottom: '2px solid #f0f0f0', borderRadius: '12px 12px 0 0', padding: 0 }}>
                    <ul className="nav nav-tabs border-0" style={{ padding: '0 20px' }}>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'refunds' ? 'active' : ''}`}
                                onClick={() => setActiveTab('refunds')}
                                style={{
                                    fontWeight: 700, border: 'none', fontSize: '0.88rem',
                                    borderBottom: activeTab === 'refunds' ? '3px solid #dc3545' : '3px solid transparent',
                                    color: activeTab === 'refunds' ? '#dc3545' : '#999',
                                    padding: '14px 20px', background: 'transparent', transition: 'all .2s',
                                }}
                            >
                                <i className="bi bi-arrow-up-right me-1" />Pending Refunds ({refunds.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'debts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('debts')}
                                style={{
                                    fontWeight: 700, border: 'none', fontSize: '0.88rem',
                                    borderBottom: activeTab === 'debts' ? '3px solid #198754' : '3px solid transparent',
                                    color: activeTab === 'debts' ? '#198754' : '#999',
                                    padding: '14px 20px', background: 'transparent', transition: 'all .2s',
                                }}
                            >
                                <i className="bi bi-arrow-down-left me-1" />Outstanding Debts ({debts.length})
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body p-0">
                    {loading && (
                        <div className="text-center p-5">
                            <div className="spinner-border" style={{ color: '#465c47' }} role="status" />
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
                                                <i className="bi bi-check-circle fs-4 d-block mb-2 opacity-25" />
                                                {search ? 'No matching refunds found.' : 'No pending refunds. All clear!'}
                                            </td>
                                        </tr>
                                    ) : filteredRefunds.map((r) => (
                                        <tr key={r.paymentId} style={{ cursor: 'pointer' }}
                                            onClick={() => setDrawer({ show: true, type: 'REFUND', id: r.paymentId })}>
                                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0d6efd' }}>
                                                {r.bookingCode}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#333' }}>{r.customerName || '—'}</div>
                                                {r.customerPhone && (
                                                    <div style={{ fontSize: '0.76rem', color: '#999' }}>
                                                        <i className="bi bi-telephone me-1" />{r.customerPhone}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className="px-2 py-1 rounded-2 fw-semibold"
                                                    style={{
                                                        fontSize: '0.72rem',
                                                        background: r.reason === 'CANCEL' ? '#ffebee' : '#fff3e0',
                                                        color: r.reason === 'CANCEL' ? '#c62828' : '#e65100',
                                                    }}>
                                                    {r.reason === 'CANCEL' ? 'Cancellation' : 'Amendment'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc3545', fontSize: '0.93rem' }}>
                                                -{fmt(r.amount)} VND
                                            </td>
                                            <td style={{ color: '#777' }}>{fmtDate(r.createdAt)}</td>
                                            <td style={{ color: '#555', fontSize: '0.84rem' }}>
                                                {r.staffName ? (
                                                    <span><i className="bi bi-person-badge me-1" />{r.staffName}</span>
                                                ) : <span className="text-muted">—</span>}
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
                                                            background: '#465c47', color: '#fff', border: 'none',
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
                                        <th style={thStyle}>Checkout Date</th>
                                        <th style={thStyle}>Staff</th>
                                        <th style={{ ...thStyle, textAlign: 'center', width: 100 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDebts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center p-4 text-muted">
                                                <i className="bi bi-check-circle fs-4 d-block mb-2 opacity-25" />
                                                {search ? 'No matching debts found.' : 'No outstanding debts. All clear!'}
                                            </td>
                                        </tr>
                                    ) : filteredDebts.map((d) => (
                                        <tr key={d.invoiceId} style={{ cursor: 'pointer' }}
                                            onClick={() => setDrawer({ show: true, type: 'DEBT', id: d.invoiceId })}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ fontWeight: 700, color: '#0d6efd' }}>{d.bookingCode}</span>
                                                <br />
                                                <span className="px-2 py-1 rounded-2 fw-semibold d-inline-block mt-1"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        background: d.invoiceType === 'SERVICE' ? '#e3f2fd' : '#f5f5f5',
                                                        color: d.invoiceType === 'SERVICE' ? '#1565c0' : '#666',
                                                    }}>
                                                    {d.invoiceType === 'SERVICE' ? 'Service' : 'Room'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#333' }}>{d.customerName || '—'}</div>
                                                {d.customerPhone && (
                                                    <div style={{ fontSize: '0.76rem', color: '#999' }}>
                                                        <i className="bi bi-telephone me-1" />{d.customerPhone}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#555' }}>{fmt(d.totalAmount)} VND</td>
                                            <td style={{ textAlign: 'right', color: '#198754', fontWeight: 600 }}>{fmt(d.paidAmount)} VND</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc3545', fontSize: '0.93rem' }}>
                                                {fmt(d.remainingAmount)} VND
                                            </td>
                                            <td style={{ color: '#777' }}>
                                                {d.checkoutDate ? fmtDate(d.checkoutDate) : '—'}
                                            </td>
                                            <td style={{ color: '#555', fontSize: '0.84rem' }}>
                                                {d.staffName ? (
                                                    <span><i className="bi bi-person-badge me-1" />{d.staffName}</span>
                                                ) : <span className="text-muted">—</span>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {canCollectDebt && (
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={(e) => { e.stopPropagation(); setCollectModal({ show: true, debt: d }); }}
                                                        style={{
                                                            borderRadius: 8, fontWeight: 600, fontSize: '0.78rem',
                                                            background: '#198754', color: '#fff', border: 'none',
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

const thStyle = { fontWeight: 700, color: '#666', padding: '12px 16px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' };

export default DebtRefundScreen;
