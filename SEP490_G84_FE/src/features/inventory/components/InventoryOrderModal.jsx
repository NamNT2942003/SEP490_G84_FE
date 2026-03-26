import React, { useState, useEffect } from 'react';
import './Inventory.css';
import { COLORS } from '@/constants';

const InventoryOrderModal = ({ open, onClose, inventoryItems, onSubmit }) => {
  const [rows, setRows] = useState([{ inventoryId: '', qty: 1, unitPrice: '' }]);
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRows([{ inventoryId: '', qty: 1, unitPrice: '', inventoryName: '', unit: '' }]);
      setImportDate(new Date().toISOString().split('T')[0]);
    }
  }, [open]);


  const updateRow = (i, field, value) =>
    setRows(p => p.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = async () => {
    const valid = rows.filter(r => (r.inventoryId === 'NEW' ? r.inventoryName?.trim() : r.inventoryId) && r.qty > 0);
    if (!valid.length) { alert('Add at least 1 valid item (provide all info & Qty > 0)!'); return; }

    setSubmitting(true);
    try {
      await onSubmit({
        importDate,
        items: valid.map(r => ({
          inventoryId: r.inventoryId === 'NEW' ? null : parseInt(r.inventoryId),
          inventoryName: r.inventoryId === 'NEW' ? r.inventoryName.trim() : undefined,
          unit: r.inventoryId === 'NEW' ? r.unit?.trim() : undefined,
          quantity: parseInt(r.qty),
          unitPrice: r.unitPrice ? parseFloat(r.unitPrice) : 0,
        })),
      });
      onClose();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  return (
    <div className={`inv-modal-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-header">
          <h6 className="fw-bold mb-0" style={{ color: COLORS.PRIMARY }}>
            <i className="bi bi-box-seam me-2" />Add Import Receipt
          </h6>

          <button className="inv-drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="inv-modal-body">
          {/* Date */}
          <div className="mb-3" style={{ maxWidth: 220 }}>
            <label className="form-label fw-bold text-muted" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Import Date
            </label>

            <input
              type="date"
              className="form-control"
              value={importDate}
              onChange={e => setImportDate(e.target.value)}
            />
          </div>

          {/* Item list header */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label fw-bold text-muted mb-0" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Item List
            </label>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setRows(p => [...p, { inventoryId: '', qty: 1, unitPrice: '', inventoryName: '', unit: '' }])}
            >

              + Add Row
            </button>
          </div>


          {/* Column headers */}
          <div className="inv-grid-header">
            {['Item', 'Unit', 'Qty', 'Unit Price', ''].map((h, i) => (

              <div key={i} className="text-muted" style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
            ))}
          </div>

          {rows.map((row, i) => {
            const isNew = row.inventoryId === 'NEW';
            const sel = (inventoryItems || []).find(it => it.inventoryId === parseInt(row.inventoryId));
            return (
              <div className="inv-import-item-grid" key={i}>
                {isNew ? (
                  <div className="d-flex gap-1">
                    <input autoFocus className="form-control form-control-sm" placeholder="New item name..." value={row.inventoryName || ''} onChange={e => updateRow(i, 'inventoryName', e.target.value)} />
                    <button className="btn btn-sm btn-light border text-muted" onClick={() => updateRow(i, 'inventoryId', '')} title="Select existing item">✕</button>
                  </div>
                ) : (
                  <select
                    className="form-select form-select-sm"
                    value={row.inventoryId}
                    onChange={e => updateRow(i, 'inventoryId', e.target.value)}
                  >
                    <option value="">-- Select item --</option>
                    <option value="NEW" className="fw-bold" style={{ color: COLORS.PRIMARY }}>+ Add new item</option>

                    {(inventoryItems || []).map(it => (
                      <option key={it.inventoryId} value={it.inventoryId}>{it.inventoryName}</option>
                    ))}
                  </select>
                )}
                
                {isNew ? (
                  <input className="form-control form-control-sm" placeholder="Unit..." value={row.unit || ''} onChange={e => updateRow(i, 'unit', e.target.value)} />

                ) : (
                  <input className="form-control form-control-sm" value={sel?.unit || ''} readOnly style={{ background: '#f8f9fa' }} />
                )}
                <input
                  className="form-control form-control-sm"
                  type="number" min="1" value={row.qty}
                  onChange={e => updateRow(i, 'qty', e.target.value)}
                />
                <input
                  className="form-control form-control-sm"
                  type="number" min="0" value={row.unitPrice}
                  placeholder="Price"

                  onChange={e => updateRow(i, 'unitPrice', e.target.value)}
                />
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setRows(p => p.filter((_, idx) => idx !== i))}
                >✕</button>
              </div>
            );
          })}
        </div>

        <div className="inv-modal-foot">
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button

            className="btn btn-sm text-white"
            style={{ background: COLORS.PRIMARY }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            <i className="bi bi-floppy me-1" />
            {submitting ? 'Đang lưu...' : 'Lưu đơn'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryOrderModal;
