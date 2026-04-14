import React, { useState } from 'react';
import { serviceAPI } from '@/features/services/api/serviceApi';
import './EditService.css';

const COST_TYPES = [
  { value: 'NONE',         label: 'None (No profit tracking — e.g. Minibar)' },
  { value: 'PERCENT',      label: 'Percent of Revenue (e.g. Laundry 40%, Motorbike 75%)' },
  { value: 'FIXED_PROFIT', label: 'Fixed Profit per Order (e.g. Airport Transfer +50,000₫)' },
  { value: 'MANUAL',       label: 'Manual Entry (staff inputs cost at sale — e.g. Tour)' },
];

const CreateService = ({ onClose, onSuccess, isModal }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const [form, setForm]     = useState({
    serviceName: '', basePrice: '', category: '',
    costType: 'NONE', costRate: '', fixedProfit: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const name = form.serviceName.trim();
    const cat  = form.category.trim();
    const bp   = form.basePrice.trim();

    if (!name) { setError('Service Name is required.'); return; }
    if (!cat) { setError('Category is required.'); return; }

    // basePrice là optional
    let basePriceNum = null;
    if (form.basePrice.trim()) {
      basePriceNum = parseFloat(form.basePrice.replace(/,/g, '.'));
      if (isNaN(basePriceNum) || basePriceNum < 0) { setError('Price must be a valid number ≥ 0.'); return; }
    }

    let costRate    = null;
    let fixedProfit = null;
    if (form.costType === 'PERCENT') {
      const r = parseFloat(form.costRate);
      if (isNaN(r) || r < 0 || r > 1) { setError('Cost Rate must be between 0 and 1 (e.g. 0.40 for 40%).'); return; }
      costRate = r;
    }
    if (form.costType === 'FIXED_PROFIT') {
      const fp = parseFloat(form.fixedProfit.replace(/,/g, '.'));
      if (isNaN(fp) || fp < 0) { setError('Fixed Profit must be a valid number ≥ 0.'); return; }
      fixedProfit = fp;
    }

    setSaving(true);
    try {
      await serviceAPI.createService({ serviceName: name, category: cat, basePrice: basePriceNum, costType: form.costType, costRate, fixedProfit });
      if (onSuccess) onSuccess({ serviceName: name });
      else alert('Service created successfully.');
    } catch (e) {
      const data = e.response?.data;
      setError((data && typeof data === 'object' && data.message) || (typeof data === 'string' ? data : null) || e.message || 'Create failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-service-page">
      <h1 className="edit-service-title" id="create-service-title">Create Service</h1>
      <form onSubmit={handleSubmit} className="edit-service-form">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Service Name <span className="text-danger">*</span></label>
          <input type="text" name="serviceName" className="form-control" value={form.serviceName} onChange={handleChange} placeholder="Enter service name" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Price (VND) <small className="text-muted">(optional — suggested price hint for staff)</small></label>
          <input type="text" name="basePrice" className="form-control" value={form.basePrice} onChange={handleChange} placeholder="Leave empty if price varies each time" />
          <small className="text-muted">If left empty, staff will enter the price manually when selling this service.</small>
        </div>
        <div className="mb-3">
          <label className="form-label">Category <span className="text-danger">*</span></label>
          <input type="text" name="category" className="form-control" value={form.category} onChange={handleChange} placeholder="e.g. Laundry, Tour" required />
        </div>

        {/* ── Cost Formula ───────────────────────────────────────── */}
        <hr />
        <div className="mb-1">
          <label className="form-label fw-bold">
            <i className="bi bi-calculator me-1 text-primary" />
            Cost Formula
          </label>
          <small className="d-block text-muted mb-2">
            Defines how the hotel's cost (Tổng chi) is calculated from the sale price (Tổng thu).
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label">Formula Type</label>
          <select name="costType" className="form-select" value={form.costType} onChange={handleChange}>
            {COST_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
          </select>
        </div>

        {form.costType === 'PERCENT' && (
          <div className="mb-3">
            <label className="form-label">Cost Rate <span className="text-danger">*</span> <small className="text-muted">(decimal, e.g. 0.40 = 40%)</small></label>
            <div className="input-group">
              <input type="number" name="costRate" className="form-control" value={form.costRate} onChange={handleChange} min="0" max="1" step="0.01" placeholder="e.g. 0.40" required />
              <span className="input-group-text">{form.costRate ? `${Math.round(parseFloat(form.costRate) * 100)}% of revenue` : '—'}</span>
            </div>
            <small className="text-muted">Example: 0.40 → Sale 100,000₫ → Cost 40,000₫ → Profit 60,000₫</small>
          </div>
        )}

        {form.costType === 'FIXED_PROFIT' && (
          <div className="mb-3">
            <label className="form-label">Fixed Profit per Order <span className="text-danger">*</span> <small className="text-muted">(VND)</small></label>
            <input type="number" name="fixedProfit" className="form-control" value={form.fixedProfit} onChange={handleChange} min="0" step="1000" placeholder="e.g. 50000" required />
            <small className="text-muted">Example: 50,000 → Sale 300,000₫ → Cost 250,000₫ → Profit 50,000₫</small>
          </div>
        )}

        {form.costType === 'MANUAL' && (
          <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.85rem' }}>
            <i className="bi bi-info-circle me-1" /> Staff will enter the actual cost manually each time this service is sold.
          </div>
        )}

        {form.costType === 'NONE' && (
          <div className="alert alert-secondary py-2 mb-3" style={{ fontSize: '0.85rem' }}>
            <i className="bi bi-dash-circle me-1" /> No profit tracking. Cost = Revenue (e.g. Minibar items).
          </div>
        )}

        <div className="edit-service-actions">
          <button type="submit" className="btn btn-brand" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
          <button type="button" className="btn btn-outline-brand" onClick={() => isModal && onClose && onClose()} disabled={saving}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateService;