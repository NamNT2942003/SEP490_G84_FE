import React, { useState, useEffect, useCallback, useRef } from 'react';
import { COLORS } from '@/constants';
import { financeApi } from '../api/financeApi';
import { reportApi } from '../../report/api/reportApi';
import CashflowStatsCards from '../component/CashflowStatsCards';
import CashflowTable from '../component/CashflowTable';
import CashflowDetailDrawer from '../component/CashflowDetailDrawer';
import Buttons from '@/components/ui/Buttons';

const POLL_INTERVAL_MS = 30_000;

const today = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const CashflowScreen = () => {
  const [startDate, setStartDate]         = useState(today());
  const [endDate, setEndDate]             = useState(today());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [branches, setBranches]           = useState([]);
  const [branchId, setBranchId]           = useState('');
  const [items, setItems]                 = useState([]);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [summary, setSummary]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const pollingRef = useRef(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await reportApi.getReportBranches();
        setBranches(data || []);
        if (data && data.length === 1) setBranchId(data[0].branchId);
      } catch (err) {
        console.error('[CashflowScreen] load branches error:', err);
      }
    };
    fetchBranches();
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const filters = { startDate, endDate, paymentMethod: paymentMethod || undefined, branchId: branchId || undefined };
      const [itemsData, summaryData] = await Promise.all([
        financeApi.getCashflow({ ...filters, page, size: 10 }),
        financeApi.getCashflowSummary(filters),
      ]);
      setItems(itemsData.content || []);
      setTotalPages(itemsData.totalPages || itemsData.page?.totalPages || 1);
      setTotalElements(itemsData.totalElements || itemsData.page?.totalElements || 0);
      setSummary(summaryData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[CashflowScreen] fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [startDate, endDate, paymentMethod, branchId, page]);

  // Reset page to 0 when filters change (but don't do it in fetchData directly to avoid loops)
  // Instead, let the Apply button or filter changes trigger it appropriately if needed. 
  // For simplicity, whenever basic filters change we reset page
  useEffect(() => { setPage(0); }, [startDate, endDate, paymentMethod, branchId]);

  useEffect(() => { fetchData(false); }, [fetchData]);

  useEffect(() => {
    pollingRef.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(pollingRef.current);
  }, [fetchData]);

  const fmtUpdated = (d) => d
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', padding: '24px' }}>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: COLORS.PRIMARY }}>
            Cash Flow Report
          </h4>
          <small className="text-muted">
            Auto-refreshes every 30 seconds &nbsp;·&nbsp;
            Last updated: <strong>{fmtUpdated(lastUpdated)}</strong>
          </small>
        </div>
        <Buttons
          variant="outline"
          className="btn-sm"
          icon={<i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} />}
          onClick={() => fetchData(false)}
          isLoading={loading}
        >
          Refresh
        </Buttons>
      </div>

      {/* FILTER BAR */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">

            <div className="col-md-2">
              <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                From
              </label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                max={endDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                To
              </label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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

            <div className="col-md-3">
              <label className="form-label fw-semibold text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment Method
              </label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="">All methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="TRANSFER">Bank Transfer</option>
                <option value="STRIPE">Online (Stripe)</option>
              </select>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <Buttons variant="primary" className="w-100" onClick={() => fetchData(false)} isLoading={loading}>
                Apply
              </Buttons>
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <CashflowStatsCards summary={summary} loading={loading} />

      {/* TABLE */}
      <div className="card shadow-sm border-0" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4">
          <span className="fw-bold" style={{ color: '#1f2937' }}>
            Transaction List
          </span>
          <span className="badge" style={{ background: COLORS.PRIMARY + '1a', color: COLORS.PRIMARY, fontSize: '0.85rem', padding: '6px 12px' }}>
            {totalElements} transaction{totalElements !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="card-body p-0">
          <CashflowTable 
            items={items} 
            loading={loading} 
            onSelectItem={setSelectedPayment}
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            setPage={setPage}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>

      <CashflowDetailDrawer
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
};

export default CashflowScreen;
