import React, { useState, useEffect, useCallback, useRef } from 'react';
import { COLORS } from '@/constants';
import { financeApi } from '../api/financeApi';
import { reportApi } from '../../report/api/reportApi';
import RevenueStatsCards from '../component/RevenueStatsCards';
import RevenueInvoiceTable from '../component/RevenueInvoiceTable';
import RevenueDetailDrawer from '../component/RevenueDetailDrawer';
import Buttons from '@/components/ui/Buttons';

const POLL_INTERVAL_MS = 60_000;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// --- Filter defaults: show current month ---
const firstDayOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const RevenueCollectionScreen = () => {
  const [startDate, setStartDate]         = useState(firstDayOfMonth());
  const [endDate, setEndDate]             = useState(today());
  const [status, setStatus]               = useState('');        // '' = all
  const [invoiceType, setInvoiceType]     = useState('');        // '' = all
  const [branches, setBranches]           = useState([]);
  const [branchId, setBranchId]           = useState('');
  const [items, setItems]                 = useState([]);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [summary, setSummary]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const pollingRef = useRef(null);

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await reportApi.getReportBranches();
        setBranches(data || []);
        if (data && data.length === 1) setBranchId(data[0].branchId);
      } catch (err) {
        console.error('[RevenueCollectionScreen] load branches error:', err);
      }
    };
    fetchBranches();
  }, []);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const filters = {
          startDate,
          endDate,
          status: status || undefined,
          invoiceType: invoiceType || undefined,
          branchId: branchId || undefined,
        };
        const [itemsData, summaryData] = await Promise.all([
          financeApi.getRevenueInvoices({ ...filters, page, size: 10 }),
          financeApi.getRevenueSummary(filters),
        ]);
        setItems(itemsData?.content || []);
        setTotalPages(itemsData?.totalPages ?? 1);
        setTotalElements(itemsData?.totalElements ?? 0);
        setSummary(summaryData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('[RevenueCollectionScreen] fetch error:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [startDate, endDate, status, invoiceType, branchId, page]
  );

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [startDate, endDate, status, invoiceType, branchId]);

  // Fetch on filter/page change
  useEffect(() => { fetchData(false); }, [fetchData]);

  // Polling
  useEffect(() => {
    pollingRef.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(pollingRef.current);
  }, [fetchData]);

  const fmtUpdated = (d) =>
    d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  const unpaidCount = summary?.unpaidCount ?? 0;
  const hasUnpaid   = unpaidCount > 0;

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', padding: '24px' }}>

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="page-title mb-0">Quản Lý Thu</h4>
            {hasUnpaid && (
              <span
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.7rem' }} />
                {unpaidCount} chưa thu
              </span>
            )}
          </div>
          <small className="text-muted">
            Tự động cập nhật mỗi 60 giây &nbsp;·&nbsp;
            Cập nhật lần cuối: <strong>{fmtUpdated(lastUpdated)}</strong>
          </small>
        </div>
        <Buttons
          variant="outline"
          className="btn-sm"
          icon={<i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} />}
          onClick={() => fetchData(false)}
          isLoading={loading}
        >
          Làm Mới
        </Buttons>
      </div>

      {/* ── FILTER BAR ─────────────────────────────────── */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: 14 }}>
        <div className="card-body py-3 px-4">
          <div className="row g-3 align-items-end">

            {/* From */}
            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold text-secondary"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Từ Ngày
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* To */}
            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold text-secondary"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Đến Ngày
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Branch */}
            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold text-secondary"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Chi Nhánh
              </label>
              <select
                className="form-select form-select-sm"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={branches.length <= 1}
              >
                {branches.length > 1 && <option value="">Tất cả</option>}
                {branches.length === 0 && <option value="">Đang tải...</option>}
                {branches.map((b) => (
                  <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                ))}
              </select>
            </div>

            {/* Invoice Status */}
            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold text-secondary"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Trạng Thái
              </label>
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="UNPAID">Chưa Thu</option>
                <option value="PAID">Đã Thanh Toán</option>
                <option value="OPEN">Đang Mở</option>
                <option value="CANCELLED">Đã Hủy</option>
              </select>
            </div>

            {/* Invoice Type */}
            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold text-secondary"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Loại Hóa Đơn
              </label>
              <select
                className="form-select form-select-sm"
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="ROOM">Tiền Phòng</option>
                <option value="SERVICE">Dịch Vụ</option>
                <option value="CHECKOUT">Checkout</option>
                <option value="DAMAGE">Bồi Thường</option>
              </select>
            </div>

            {/* Apply btn */}
            <div className="col-6 col-md-2 d-flex align-items-end">
              <Buttons
                variant="primary"
                className="w-100 btn-sm"
                onClick={() => fetchData(false)}
                isLoading={loading}
              >
                Áp Dụng
              </Buttons>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ─────────────────────────────────── */}
      <RevenueStatsCards summary={summary} loading={loading} />

      {/* ── INVOICE TABLE ───────────────────────────────── */}
      <div className="card shadow-sm border-0" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div
          className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4"
        >
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold" style={{ color: '#1f2937' }}>
              Danh Sách Hóa Đơn
            </span>
            {/* Quick filter pills */}
            <div className="d-flex gap-2">
              {['', 'UNPAID', 'PAID'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 12px',
                    borderRadius: 20,
                    border: 'none',
                    cursor: 'pointer',
                    background:
                      status === s
                        ? s === 'UNPAID'
                          ? '#fee2e2'
                          : s === 'PAID'
                          ? '#d1fae5'
                          : COLORS.PRIMARY + '20'
                        : '#f3f4f6',
                    color:
                      status === s
                        ? s === 'UNPAID'
                          ? '#dc2626'
                          : s === 'PAID'
                          ? '#16a34a'
                          : COLORS.PRIMARY
                        : '#6b7280',
                    transition: 'all 0.15s',
                  }}
                >
                  {s === '' ? 'Tất Cả' : s === 'UNPAID' ? 'Chưa Thu' : 'Đã Thu'}
                </button>
              ))}
            </div>
          </div>
          <span
            className="badge"
            style={{
              background: COLORS.PRIMARY + '1a',
              color: COLORS.PRIMARY,
              fontSize: '0.82rem',
              padding: '6px 14px',
              borderRadius: 20,
            }}
          >
            {totalElements} hóa đơn
          </span>
        </div>
        <div className="card-body p-0">
          <RevenueInvoiceTable
            items={items}
            loading={loading}
            onSelectItem={setSelectedInvoice}
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

      <RevenueDetailDrawer
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};

export default RevenueCollectionScreen;
