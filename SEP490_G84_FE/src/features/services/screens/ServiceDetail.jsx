import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceAPI } from '@/features/services/api/serviceApi';
import './ServiceDetail.css';

const ServiceDetail = ({ serviceId: serviceIdProp, onClose, isModal }) => {
  const { id: idFromRoute } = useParams();
  const navigate = useNavigate();
  const serviceId = serviceIdProp ?? idFromRoute;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!serviceId) return;
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceAPI.getServiceById(serviceId);
      setService(res.data);
    } catch (e) {
      setService(null);
      setError(e.response?.status === 404 ? 'Service not found.' : (e.response?.data?.message || e.message || 'Failed to load details.'));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    if (value == null) return '—';
    const n = Number(value);
    return isNaN(n) ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  const handleBack = () => {
    if (isModal && onClose) onClose();
    else navigate('/services');
  };

  if (loading) {
    return (
      <div className="service-detail-page">
        <div className="service-detail-loading"><div className="spinner-border text-primary" /> <span>Loading...</span></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="service-detail-page">
        <p className="service-detail-error alert alert-danger">{error || 'Service not found.'}</p>
        <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>Back to list</button>
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      <h1 className="service-detail-title" id="service-detail-title">Service Detail</h1>
      <div className="service-detail-card">
        <dl className="service-detail-dl">
          <dt>Service Name</dt>
          <dd>{service.serviceName || '—'}</dd>
          <dt>Price</dt>
          <dd>{formatPrice(service.basePrice)}</dd>
          <dt>Category</dt>
          <dd>{service.category || '—'}</dd>
        </dl>
        <div className="service-detail-actions">
          <button type="button" className="btn btn-outline-brand" onClick={handleBack}>
            Back to list
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;