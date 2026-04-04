import React, { useState } from 'react';
import './Inventory.css';
import { COLORS } from '@/constants';

const MONTHS_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];


const InventoryDrawer = ({ open, onClose, item, receipts, year, month }) => {
  const monthLabel = MONTHS_EN[(month - 1)] || '';

  const relevant = (receipts || []).filter(r =>
    r.details?.some(d => d.inventoryId === item?.inventoryId)
  );
  const totalQty = relevant.reduce((s, r) => {
    const d = r.details.find(d => d.inventoryId === item?.inventoryId);
    return s + (d ? d.importQuantity : 0);
  }, 0);
  const totalVal = relevant.reduce((s, r) => {
    const d = r.details.find(d => d.inventoryId === item?.inventoryId);
    return s + (d ? d.importQuantity * (d.unitPrice || 0) : 0);
  }, 0);
  const avgPrice = totalQty > 0 && totalVal > 0 ? Math.round(totalVal / totalQty) : 0;

  return (
    <div className={`inv-drawer-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="inv-drawer" onClick={e => e.stopPropagation()}>
        <div className="inv-drawer-header">
          <div>
            <div className="fw-bold" style={{ fontSize: '1.05rem', color: COLORS.PRIMARY }}>
              Import History — {item?.inventoryName}
            </div>
            <div className="text-muted" style={{ fontSize: '.78rem' }}>
              {monthLabel} {year} · {relevant.length} imports
            </div>

          </div>
          <button className="inv-drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="inv-drawer-body">
          {/* Summary cards */}
          <div className="inv-drawer-summary mb-3">
            {[
              { label: 'Imports', val: relevant.length, color: COLORS.PRIMARY },
              { label: 'Total Qty', val: `${totalQty} ${item?.unit || ''}`, color: '#212529' },
              { label: 'Avg Price', val: avgPrice ? avgPrice.toLocaleString('en-US') + ' VND' : '—', color: '#c8873a' },
            ].map((s, i) => (

              <div key={i} className="card border-0 shadow-sm">
                <div className="card-body py-2 px-3">
                  <div className="text-muted" style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                  <div className="fw-bold" style={{ color: s.color, fontSize: '1.05rem' }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {relevant.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-2 d-block mb-2" />
              No imports found
            </div>

          ) : (
            <div className="inv-timeline">
              {relevant.map(receipt => {
                const d = receipt.details.find(d => d.inventoryId === item?.inventoryId);
                const sub = d ? d.importQuantity * (d.unitPrice || 0) : 0;
                const dateStr = receipt.importDate ? new Date(receipt.importDate).toLocaleDateString('en-US') : '';
                return (
                  <div className="inv-tl-entry" key={receipt.importReceiptId}>
                    <div className="inv-tl-dot" />
                    <div>
                      <div className="fw-500" style={{ fontSize: '.88rem' }}>Receipt #{receipt.importReceiptId}</div>
                      <div className="text-muted" style={{ fontSize: '.75rem' }}>{dateStr}</div>

                    </div>
                    <div className="text-end">
                      <div className="fw-bold" style={{ fontFamily: 'monospace', color: COLORS.PRIMARY }}>
                        +{d?.importQuantity} {item?.unit}
                      </div>
                      {d?.unitPrice > 0 && (
                        <div style={{ fontFamily: 'monospace', fontSize: '.74rem', color: '#c8873a' }}>
                          {d.unitPrice.toLocaleString('en-US')} VND/{item?.unit}
                        </div>
                      )}
                      {sub > 0 && (
                        <div className="text-muted" style={{ fontSize: '.7rem' }}>= {sub.toLocaleString('en-US')} VND</div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalVal > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3 p-3 rounded-3"
              style={{ background: '#fff8f0', border: '1px solid #f0d8b8', fontSize: '.85rem' }}>
              <span className="text-muted">Total Import Cost</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c8873a' }}>
                {totalVal.toLocaleString('en-US')} VND
              </span>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDrawer;
