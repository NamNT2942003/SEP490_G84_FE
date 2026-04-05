import React, { useState, useEffect, useCallback } from 'react';
import '../components/Inventory.css';
import { inventoryApi } from '../api/inventoryApi';
import InventoryReport from '../components/InventoryReport';
import InventoryOrderModal from '../components/InventoryOrderModal';
import { reportApi } from '@/features/report/api/reportApi';
import { COLORS } from '@/constants';
import { useCurrentUser } from '@/hooks/useCurrentUser';



const MONTHS_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];


const today = new Date();

const InventoryScreen = () => {
  const user = useCurrentUser();
  const isAdmin = user?.permissions?.isAdmin || user?.role === 'ADMIN';

  const [view, setView]         = useState('home');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [curYear, setCurYear]   = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(null);

  const [yearOverview, setYearOverview]     = useState([]);
  const [reportData, setReportData]         = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading]               = useState(false);
  const [closingMap, setClosingMap]         = useState({});
  const [modalOpen, setModalOpen]           = useState(false);
  const [toasts, setToasts]                 = useState([]);

  const toast = useCallback((msg, type = '') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  /* ── Data fetching ── */
  const loadYearOverview = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      setYearOverview(await inventoryApi.getYearOverview(selectedBranch, curYear));
    } catch { toast('Failed to load overview data', 'err'); }
    finally { setLoading(false); }

  }, [selectedBranch, curYear]);


  const loadMonthlyReport = useCallback(async (year, month) => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const data = await inventoryApi.getMonthlyReport(selectedBranch, year, month);
      setReportData(data);
      const map = {};
      (data.items || []).forEach(it => {
        map[it.inventoryId] = { closing: it.closingStock, used: it.usedQuantity, note: it.note || '' };
      });
      setClosingMap(map);
    } catch { toast('Failed to load monthly report', 'err'); }
    finally { setLoading(false); }

  }, [selectedBranch]);


  useEffect(() => {
    reportApi.getReportBranches()
      .then(data => {
        setBranches(data);
        if (data && data.length > 0) setSelectedBranch(data[0].branchId);
      })
      .catch(() => toast('Failed to load branch list', 'err'));
  }, []);


  useEffect(() => {
    if (selectedBranch) {
      inventoryApi.getInventoryItems(selectedBranch).then(setInventoryItems).catch(() => {});
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (view === 'home' && selectedBranch) loadYearOverview();
  }, [view, curYear, selectedBranch, loadYearOverview]);


  /* ── Navigation ── */
  const goHome = () => { setView('home'); setReportData(null); };

  const goReport = async (month) => {
    setCurMonth(month);
    setView('report');
    await loadMonthlyReport(curYear, month);
  };

  /* ── Actions ── */
  const handleClosingChange = (inventoryId, field, value) => {
    setClosingMap(p => ({ ...p, [inventoryId]: { ...(p[inventoryId] || {}), [field]: value } }));
  };

  const handleSave = async () => {
    try {
      await inventoryApi.saveMonthlyReport({
        branchId: selectedBranch, year: curYear, month: curMonth,
        items: (reportData?.items || []).map(it => {
          const opening = it.openingStock || 0;
          const imp     = it.importQuantity || 0;
          const closing = closingMap[it.inventoryId]?.closing ?? it.closingStock ?? 0;
          const used    = Math.max(0, opening + imp - closing); // tự tính
          return {
            inventoryId:  it.inventoryId,
            closingStock: closing,
            usedQuantity: used,
            note:         closingMap[it.inventoryId]?.note ?? it.note ?? '',
          };
        }),
      });

      toast('✅ Report saved successfully!', 'ok');
      await loadMonthlyReport(curYear, curMonth);
      loadYearOverview();
    } catch { toast('Failed to save report', 'err'); }
  };


  const handleUnsave = async () => {
    try {
      await inventoryApi.unsaveMonthlyReport(selectedBranch, curYear, curMonth);

      toast('🔓 Report unsaved');
      await loadMonthlyReport(curYear, curMonth);
      loadYearOverview();
    } catch { toast('Failed to unsave report', 'err'); }
  };


  const handleCreateReceipt = async (payload) => {
    await inventoryApi.createImportReceipt(selectedBranch, payload);

    toast(`✅ Import receipt saved — ${payload.items.length} items`, 'ok');
    if (curMonth) await loadMonthlyReport(curYear, curMonth);
    loadYearOverview();
  };


  /* ── Home view (12-month grid) ── */
  const nowM = today.getMonth() + 1;
  const nowY = today.getFullYear();

  const renderHome = () => (
    <div className="inv-page">
      {/* Page header & Global Filter */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: COLORS.PRIMARY }}>
            <i className="bi bi-box-seam me-2" />
            Inventory Management — <span className="inv-year-accent">{curYear}</span>
          </h2>
          <small className="text-muted">Monthly inventory reports · 12 reports / year</small>
        </div>

        
        <div className="d-flex align-items-center gap-3">
          {/* Branch Dropdown */}
          <div className="d-flex align-items-center bg-white border rounded ps-2 overflow-hidden shadow-sm">
            <i className="bi bi-shop text-muted pe-1" />
            <select
              className="form-select form-select-sm border-0 shadow-none fw-bold"
              style={{ minWidth: 200, color: COLORS.PRIMARY }}
              value={selectedBranch || ''}
              onChange={e => setSelectedBranch(Number(e.target.value))}
              disabled={branches.length <= 1}
            >
              {branches.length === 0 ? <option>Loading...</option> : branches.map(b => (
                <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
              ))}
            </select>
          </div>


          {/* Year Nav */}
          <div className="d-flex align-items-center gap-1 bg-white border rounded p-1 shadow-sm">
            <button className="btn btn-sm text-secondary fw-bold px-2 py-0 border-0" onClick={() => setCurYear(y => y - 1)}>
              ‹ {curYear - 1}
            </button>
            <span className="fw-bold px-2" style={{ color: COLORS.PRIMARY }}>{curYear}</span>
            <button className="btn btn-sm text-secondary fw-bold px-2 py-0 border-0" onClick={() => setCurYear(y => y + 1)}>
              {curYear + 1} ›
            </button>
          </div>
        </div>
      </div>


      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: COLORS.PRIMARY }} />
        </div>
      ) : (
        <div className="inv-months-grid">
          {(yearOverview.length > 0
            ? yearOverview
            : Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year: curYear, saved: false, totalReceipts: 0 }))
          ).map(mo => {
            const isCurrent = mo.year === nowY && mo.month === nowM;
            const icon = mo.saved ? '📁' : (isCurrent || isAdmin ? '📄' : '🔒');
            const statusText = mo.saved ? 'SAVED' : (isCurrent ? 'OPEN' : (isAdmin ? 'OPEN (Admin)' : 'UNOPENED'));
            const statusClass = mo.saved ? 'saved' : (isCurrent || isAdmin ? 'open' : '');
            
            return (
            <div
              key={mo.month}
              className={`inv-month-card ${statusClass} ${isCurrent ? 'current' : ''}`}
              onClick={() => goReport(mo.month)}
            >
              <div className="inv-mc-icon">{icon}</div>
              <div className="inv-mc-name">{MONTHS_EN[mo.month - 1]}</div>
              <div className="inv-mc-year">{mo.year}</div>
              <div className="inv-mc-meta">
                <span className={`inv-mc-status ${statusClass}`}
                  style={(!mo.saved && !isCurrent && !isAdmin) ? { color: '#adb5bd' } : {}}>
                  {statusText}
                </span>
                <span className={`inv-mc-orders ${mo.totalReceipts > 0 ? 'has' : ''}`}>
                  {mo.totalReceipts > 0 ? `${mo.totalReceipts} receipts` : 'No receipts'}
                </span>
              </div>

              <div className="inv-mc-arrow">→</div>
            </div>
          )})}
        </div>
      )}
    </div>
  );

  /* ── Breadcrumb ── */
  const renderBreadcrumb = () => (
    <nav aria-label="breadcrumb" className="mb-3">
      <ol className="breadcrumb mb-0" style={{ fontSize: '.82rem' }}>
        <li className="breadcrumb-item">
          <span style={{ color: COLORS.PRIMARY, cursor: 'pointer' }} onClick={goHome}>
            Inventory Management
          </span>
        </li>
        {(view === 'report' || view === 'orders') && curMonth && (
          <li className="breadcrumb-item">
            <span style={{ color: COLORS.PRIMARY, cursor: 'pointer' }} onClick={() => goReport(curMonth)}>
              {MONTHS_EN[curMonth - 1]} {curYear}
            </span>
          </li>
        )}
        {view === 'orders' && (
          <li className="breadcrumb-item active">Import History</li>
        )}
      </ol>
    </nav>
  );


  return (
    <div className="container-fluid p-4">
      {/* Breadcrumb (khi không ở trang home) */}
      {view !== 'home' && renderBreadcrumb()}

      {/* Views */}
      {view === 'home' && renderHome()}

      {view === 'report' && (
        loading
          ? <div className="text-center py-5"><div className="spinner-border" style={{ color: COLORS.PRIMARY }} /></div>
          : <InventoryReport
              reportData={reportData}
              year={curYear}
              month={curMonth}
              onAddOrder={() => setModalOpen(true)}
              onSave={handleSave}
              onUnsave={handleUnsave}
              closingMap={closingMap}
              onClosingChange={handleClosingChange}
            />
      )}

      {/* Modal */}
      <InventoryOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        inventoryItems={inventoryItems}
        onSubmit={handleCreateReceipt}
      />

      {/* Toasts */}
      <div className="inv-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`inv-toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
};

export default InventoryScreen;
