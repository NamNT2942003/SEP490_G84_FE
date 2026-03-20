import React, { useState } from 'react';
import { serviceAPI } from '@/features/services/api/serviceApi';
import './EditService.css';

const CreateService = ({ onClose, onSuccess, isModal }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ serviceName: '', basePrice: '', category: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const name = form.serviceName.trim();
    const cat = form.category.trim();
    const bp = form.basePrice.trim();
    if (!name) {
      setError('Service Name is required.');
      return;
    }
    if (!bp) {
      setError('Price (VND) is required.');
      return;
    }
    const num = parseFloat(bp.replace(/,/g, '.'));
    if (isNaN(num) || num < 0) {
      setError('Price must be a valid number greater than or equal to 0.');
      return;
    }
    if (!cat) {
      setError('Category is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        serviceName: name,
        category: cat,
        basePrice: num,
      };
      await serviceAPI.createService(payload);
      if (onSuccess) {
        onSuccess({ serviceName: name });
      } else {
        alert('Service created successfully.');
      }
    } catch (e) {
      const data = e.response?.data;
      const msg = (data && typeof data === 'object' && data.message) || (typeof data === 'string' ? data : null) || e.message || 'Create failed.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isModal && onClose) onClose();
  };

  return (
    <div className="edit-service-page">
      <h1 className="edit-service-title" id="create-service-title">Create Service</h1>
      <form onSubmit={handleSubmit} className="edit-service-form">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <label className="form-label required">Service Name <span className="text-danger">*</span></label>
          <input
            type="text"
            name="serviceName"
            className="form-control"
            value={form.serviceName}
            onChange={handleChange}
            placeholder="Enter service name"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label required">Price (VND) <span className="text-danger">*</span></label>
          <input
            type="text"
            name="basePrice"
            className="form-control"
            value={form.basePrice}
            onChange={handleChange}
            placeholder="e.g. 100000"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label required">Category <span className="text-danger">*</span></label>
          <input
            type="text"
            name="category"
            className="form-control"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. F&B, Laundry"
            required
          />
        </div>
        <div className="edit-service-actions">
          <button type="submit" className="btn btn-brand" disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </button>
          <button type="button" className="btn btn-outline-brand" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateService;
