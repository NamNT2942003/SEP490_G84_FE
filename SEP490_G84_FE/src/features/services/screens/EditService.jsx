import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceAPI } from '@/features/services/api/serviceApi';
import './EditService.css';

const EditService = ({ serviceId: serviceIdProp, onClose, onSuccess, isModal }) => {
  const { id: idFromRoute } = useParams();
  const navigate = useNavigate();
  const serviceId = serviceIdProp ?? idFromRoute;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ serviceName: '', basePrice: '', category: '' });

  useEffect(() => {
    if (!serviceId) return;
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceAPI.getServiceById(serviceId);
      const s = res.data;
      setForm({
        serviceName: s.serviceName || '',
        basePrice: s.basePrice != null ? String(s.basePrice) : '',
        category: s.category || '',
      });
    } catch (e) {
      setError(e.response?.status === 404 ? 'Service not found.' : (e.response?.data?.message || e.message || 'Failed to load data.'));
    } finally {
      setLoading(false);
    }
  };

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
      await serviceAPI.updateService(serviceId, payload);
      alert('Service updated successfully.');
      if (isModal && onSuccess) onSuccess();
      if (isModal && onClose) onClose();
      else navigate(`/services/${serviceId}`);
    } catch (e) {
      const data = e.response?.data;
      const msg = (data && typeof data === 'object' && data.message) || (typeof data === 'string' ? data : null) || e.message || 'Update failed.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isModal && onClose) onClose();
    else navigate(`/services/${serviceId}`);
  };

  const handleBackToList = () => {
    if (isModal && onClose) onClose();
    else navigate('/services');
  };

  if (loading) {
    return (
      <div className="edit-service-page">
        <div className="edit-service-loading"><div className="spinner-border text-primary" /> <span>Loading...</span></div>
      </div>
    );
  }

  if (error && !form.serviceName && form.basePrice === '' && form.category === '') {
    return (
      <div className="edit-service-page">
        <p className="alert alert-danger">{error}</p>
        <button type="button" className="btn btn-outline-secondary" onClick={handleBackToList}>Back to list</button>
      </div>
    );
  }

  return (
    <div className="edit-service-page">
      <h1 className="edit-service-title" id="edit-service-title">Edit Service</h1>
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
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" className="btn btn-outline-brand" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditService;
