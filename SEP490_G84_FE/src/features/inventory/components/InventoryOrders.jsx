import React, { useState } from 'react';
import './Inventory.css';
import { COLORS } from '@/constants';

const MONTHS_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];


const InventoryOrders = ({ reportData, onAddOrder, year, month, hideHeader }) => {

  const [openIds, setOpenIds] = useState({});
  const receipts = reportData?.receipts || [];
  const monthLabel = MONTHS_EN[month - 1];


  const toggle = (id) => setOpenIds(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className={hideHeader ? 'p-3' : 'inv-page'}>
      {!hideHeader && (
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: COLORS.PRIMARY }}>
              <i className="bi bi-box me-2" />Import Receipts
            </h4>
            <small className="text-muted">{monthLabel} {year} · {receipts.length} orders</small>
          </div>
          <button className="btn btn-sm text-white" style={{ background: COLORS.PRIMARY }} onClick={onAddOrder}>
            <i className="bi bi-plus-lg me-1" /> Add Receipt
          </button>

        </div>
      )}
      {receipts.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-2" />
            No import receipts yet
          </div>
        </div>

      ) : (
        receipts.map((receipt) => {
          const totalQty = receipt.details?.reduce((s, d) => s + d.importQuantity, 0) || 0;
          const totalVal = receipt.details?.reduce((s, d) => s + d.importQuantity * (d.unitPrice || 0), 0) || 0;
          const dateStr  = receipt.importDate ? new Date(receipt.importDate).toLocaleDateString('en-US') : '';

          const isOpen   = openIds[receipt.importReceiptId];

          return (
            <div className="card shadow-sm border-0 mb-2" key={receipt.importReceiptId}>
              <div
                className="card-body d-flex align-items-center justify-content-between py-3 px-3"
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(receipt.importReceiptId)}
              >
                <div className="d-flex align-items-center gap-3">
                  <span className="badge border text-muted bg-light" style={{ fontFamily: 'monospace' }}>
                    #{receipt.importReceiptId}
                  </span>
                  <div>
                    <div className="text-muted" style={{ fontSize: '.78rem' }}>
                      <i className="bi bi-calendar3 me-1" />{dateStr}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="text-muted" style={{ fontSize: '.82rem' }}>
                    {receipt.details?.length || 0} items
                  </span>
                  <span className="fw-bold" style={{ color: COLORS.PRIMARY, fontFamily: 'monospace' }}>
                    +{totalQty} qty
                  </span>
                  {totalVal > 0 && (
                    <span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#c8873a' }}>
                      {totalVal.toLocaleString('en-US')} VND
                    </span>
                  )}

                  <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-muted`} style={{ fontSize: '.8rem' }} />
                </div>
              </div>

              {isOpen && (
                <div className="border-top bg-light px-3 py-2">
                  {(receipt.details || []).map(d => {
                    const sub = d.importQuantity * (d.unitPrice || 0);
                    return (
                      <div key={d.importDetailId}
                        className="d-flex align-items-center justify-content-between py-2 border-bottom"
                        style={{ fontSize: '.85rem' }}>
                        <span>
                          {d.inventoryName}
                          <span className="badge bg-light text-muted border ms-2">{d.unit}</span>
                        </span>
                        <span className="d-flex align-items-center gap-3">
                          <span style={{ fontFamily: 'monospace', color: COLORS.PRIMARY }}>×{d.importQuantity}</span>
                          {d.unitPrice > 0 && (
                            <span style={{ fontFamily: 'monospace', fontSize: '.78rem', color: '#c8873a' }}>
                              {d.unitPrice.toLocaleString('en-US')} VND/{d.unit}
                            </span>
                          )}
                          {sub > 0 && (
                            <span style={{ fontFamily: 'monospace', color: '#c8873a' }}>
                              = {sub.toLocaleString('en-US')} VND
                            </span>
                          )}

                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default InventoryOrders;
