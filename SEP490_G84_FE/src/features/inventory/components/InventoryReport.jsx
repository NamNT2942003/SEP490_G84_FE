import React, { useState } from 'react';
import './Inventory.css';
import InventoryDrawer from './InventoryDrawer';
import InventoryOrders from './InventoryOrders';
import { COLORS } from '@/constants';

const MONTHS_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const PAGE_SIZE = 15;

const _today = new Date();
const CURRENT_YEAR  = _today.getFullYear();
const CURRENT_MONTH = _today.getMonth() + 1;

const InventoryReport = ({
  reportData, year, month,
  onAddOrder, onSave, onUnsave,
  closingMap, onClosingChange,
}) => {
  const [searchQ, setSearchQ]       = useState('');
  const [page, setPage]             = useState(1);
  const [drawerItem, setDrawerItem] = useState(null);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const items     = reportData?.items    || [];
  const monthLabel = MONTHS_EN[month - 1];
  const isSaved   = reportData?.saved;


  // Chỉ tháng hiện tại mới được chỉnh sửa
  const isCurrentMonth = (year === CURRENT_YEAR && month === CURRENT_MONTH);
  const canEdit        = isCurrentMonth && !isSaved;

  // Tự tính: Sử dụng = Tồn đầu + Nhập - Tồn cuối
  const calcUsed = (item) => {
    const opening = item.openingStock || 0;
    const imp     = item.importQuantity || 0;
    const closing = closingMap[item.inventoryId]?.closing ?? item.closingStock ?? 0;
    const used    = opening + imp - closing;
    return Math.max(0, used);
  };

  const filtered = items.filter(it =>
    it.inventoryName.toLowerCase().includes(searchQ.toLowerCase())
  );
  const total  = filtered.length;
  const pages  = Math.ceil(total / PAGE_SIZE) || 1;
  const sliced = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Tính tổng sử dụng từ closingMap
  const totalUsedCalc = items.reduce((s, it) => s + calcUsed(it), 0);

  return (
    <div className="inv-page">

      {/* ── Header ── */}
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: COLORS.PRIMARY }}>
            {monthLabel} {year}
          </h4>
          <small className="text-muted">Inventory Report · {items.length} items</small>
        </div>
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setOrdersOpen(true)}>
            <i className="bi bi-box me-1" /> Receipts ({reportData?.totalImportReceipts || 0})
          </button>
          {isCurrentMonth && (
            <button className="btn btn-outline-secondary btn-sm" onClick={onAddOrder}>
              <i className="bi bi-plus-lg me-1" /> Add Receipt
            </button>
          )}
          {isCurrentMonth && (
            isSaved
              ? <button className="btn btn-outline-warning btn-sm" onClick={onUnsave}>
                  <i className="bi bi-unlock me-1" /> Unsave
                </button>
              : <button className="btn btn-sm text-white" style={{ background: COLORS.PRIMARY }} onClick={onSave}>
                  <i className="bi bi-floppy me-1" /> Save Report
                </button>
          )}
        </div>
      </div>


      {/* ── Alerts ── */}
      {isSaved && isCurrentMonth && (
        <div className="inv-saved-bar mb-3">
          <i className="bi bi-check-circle-fill" />
          Report saved · Closing stock is locked.
        </div>
      )}
      {!isCurrentMonth && (
        <div className="alert alert-light border d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: '.84rem' }}>
          <i className="bi bi-eye text-muted" />
          <span className="text-muted">
            <strong>View mode.</strong> Only <strong>{MONTHS_EN[CURRENT_MONTH - 1]} {CURRENT_YEAR}</strong> can be edited.
          </span>
        </div>
      )}


      {/* ── Table ── */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-2 px-3">
          <h6 className="fw-bold mb-0" style={{ fontSize: '.9rem' }}>Item Details</h6>
          <div className="input-group" style={{ width: 210 }}>
            <span className="input-group-text bg-white border-end-0 px-2">
              <i className="bi bi-search text-muted" style={{ fontSize: '.85rem' }} />
            </span>
            <input
              className="form-control form-control-sm border-start-0"
              placeholder="Search items..."
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setPage(1); }}
            />
          </div>
        </div>


        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0" style={{ tableLayout: 'fixed', minWidth: 900 }}>
            <colgroup>
              <col style={{ width: 42 }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: 60 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 160 }} />
              <col />
            </colgroup>
            <thead className="table-light">
              <tr>
                <td colSpan={9} className="text-center py-2" style={{ backgroundColor: '#fff200', fontWeight: 600 }}>
                  MONTH {month}/{year}
                </td>
              </tr>
              <tr>
                <th className="text-center text-muted" style={{ fontSize: '.72rem' }}>#</th>
                <th style={{ fontSize: '.8rem' }}>Inventory Item</th>
                <th className="text-center" style={{ fontSize: '.8rem' }}>Unit</th>
                <th className="text-center" style={{ fontSize: '.8rem' }}>Opening Stock ( 1 )</th>
                <th className="text-center" style={{ fontSize: '.8rem' }}>Imported ( 2 )</th>
                <th className="text-center" style={{ fontSize: '.8rem' }}>Total (1)+(2)</th>
                <th className="text-center" style={{ fontSize: '.8rem' }}>Used Quantity</th>
                <th className="text-center" style={{ fontSize: '.8rem' }}>Closing Stock ✎</th>
                <th style={{ fontSize: '.8rem' }}>Note</th>
              </tr>
            </thead>

            <tbody>
              {sliced.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-4">No items found</td>
                </tr>
              )}

              {sliced.map((item, i) => {
                const imp     = item.importQuantity || 0;
                const opening = item.openingStock   || 0;
                const tot     = opening + imp;
                const closing = closingMap[item.inventoryId]?.closing ?? item.closingStock ?? 0;
                const used    = calcUsed(item);   // auto-calculated
                const note    = closingMap[item.inventoryId]?.note ?? item.note ?? '';

                return (
                  <tr key={item.inventoryId}>
                    <td className="text-center text-muted" style={{ fontSize: '.8rem' }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.inventoryName}
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-secondary border" style={{ fontSize: '.72rem' }}>{item.unit}</span>
                    </td>
                    <td className="text-center text-muted" style={{ fontFamily: 'monospace', fontSize: '.84rem' }}>
                      {opening > 0 ? opening : '—'}
                    </td>
                    <td
                      className={`text-center inv-td-import-link ${imp > 0 ? '' : 'zero'}`}
                      onClick={() => imp > 0 && setDrawerItem(item)}
                    >
                      {imp > 0 ? <span className="bg-light border px-2 py-1 rounded">{imp} ↗</span> : '—'}
                    </td>
                    <td className="text-center fw-bold" style={{ fontFamily: 'monospace', fontSize: '.84rem' }}>
                      {tot > 0 ? tot : '—'}
                    </td>
                    {/* ── Đã dùng: tự tính ── */}
                    <td className="text-center" style={{ fontFamily: 'monospace', fontSize: '.88rem', color: '#dc3545' }}>
                      {!canEdit ? (used > 0 ? `-${used}` : '0') : '—'}
                    </td>
                    {/* ── Tồn cuối: duy nhất cột được nhập ── */}
                    <td className="text-center">
                      {canEdit ? (
                        <input
                          className="inv-closing-inp text-center mx-auto"
                          type="number" min="0" max={tot}
                          value={closing}
                          placeholder="0"
                          onChange={e => onClosingChange(item.inventoryId, 'closing', parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span style={{ fontFamily: 'monospace', fontSize: '.84rem' }}>{closing > 0 ? closing : '0'}</span>
                      )}
                    </td>
                    <td>
                      {canEdit ? (
                        <input
                          className="inv-note-inp"
                          value={note}
                          placeholder="Note..."
                          onChange={e => onClosingChange(item.inventoryId, 'note', e.target.value)}
                        />

                      ) : (
                        <span className="text-muted" style={{ fontSize: '.8rem' }}>{note}</span>
                      )}
                    </td>
                  </tr>

                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="card-footer bg-white border-0 d-flex align-items-center justify-content-between py-2 px-3">
          <span className="text-muted" style={{ fontSize: '.78rem' }}>
            {total === 0 ? 'No items'
              : `${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,total)} / ${total} items`}
          </span>

          {pages > 1 && (
            <div className="inv-pager">
              {page > 1 && <button className="inv-pager-btn" onClick={() => setPage(p => p-1)}>‹</button>}
              {Array.from({ length: pages }, (_, idx) => idx+1).map(p => (
                <button key={p} className={`inv-pager-btn ${p===page?'on':''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              {page < pages && <button className="inv-pager-btn" onClick={() => setPage(p => p+1)}>›</button>}
            </div>
          )}
        </div>
      </div>

      {/* ── Import history drawer (per item) ── */}
      <InventoryDrawer
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        item={drawerItem}
        receipts={reportData?.receipts}
        year={year}
        month={month}
      />

      {/* ── Orders modal ── */}
      <div className={`inv-modal-overlay ${ordersOpen ? 'open' : ''}`} onClick={() => setOrdersOpen(false)}>
        <div className="inv-modal" style={{ width: 700 }} onClick={e => e.stopPropagation()}>
          <div className="inv-modal-header">
            <h6 className="fw-bold mb-0" style={{ color: COLORS.PRIMARY }}>
              <i className="bi bi-box me-2" />Đơn nhập — {monthLabel} {year}
            </h6>
            <button className="inv-drawer-close" onClick={() => setOrdersOpen(false)}>✕</button>
          </div>
          <div className="inv-modal-body p-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <InventoryOrders
              reportData={reportData}
              year={year}
              month={month}
              onAddOrder={() => { setOrdersOpen(false); onAddOrder(); }}
              hideHeader
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
