import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { serviceAPI } from '@/features/services/api/serviceApi';
import ServiceDetail from './ServiceDetail';
import EditService from './EditService';
import CreateService from './CreateService';
import './ServiceList.css';

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [viewModalId, setViewModalId] = useState(null);
  const [editModalId, setEditModalId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 5;

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceAPI.getAllServices(),
        serviceAPI.getCategories().catch(() => ({ data: [] })),
      ]);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (error) {
      setServices([]);
      const msg = error.response?.data?.message || error.response?.data || error.message;
      setLoadError(msg ? `Error: ${msg}` : 'Failed to load services. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const closeViewModal = () => setViewModalId(null);
  const closeEditModal = () => setEditModalId(null);
  const closeCreateModal = () => setCreateModalOpen(false);
  const onEditSuccess = () => {
    fetchServices();
    setEditModalId(null);
  };
  const onCreateSuccess = () => {
    fetchServices();
    setCreateModalOpen(false);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete service "${s.serviceName || 'ID ' + s.serviceId}"? This cannot be undone.`)) return;
    try {
      await serviceAPI.deleteService(s.serviceId);
      fetchServices();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message;
      alert(msg ? `Error: ${msg}` : 'Failed to delete service.');
    }
  };

  const formatPrice = (value) => {
    if (value == null) return '—';
    const n = Number(value);
    return isNaN(n) ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  const searchLower = searchTerm.trim().toLowerCase();
  const filteredServices = services.filter((s) => {
    const matchesSearch = searchLower === '' ||
      (s.serviceName && String(s.serviceName).toLowerCase().includes(searchLower)) ||
      (s.category && String(s.category).toLowerCase().includes(searchLower));
    const matchesCategory = selectedCategory === '' || (s.category && s.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / servicesPerPage));

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
  };
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="service-list-page">
        <div className="service-list-header">
          <h1 className="service-list-title">Service List</h1>
          <button type="button" className="btn btn-brand" onClick={() => setCreateModalOpen(true)}>
            <i className="bi bi-plus-lg me-1" /> Create Service
          </button>
        </div>
        <div className="service-list-loading">
          <div className="spinner-border text-primary" role="status" />
          <span>Loading...</span>
        </div>
        {createModalOpen && createPortal(
          <div className="service-modal-overlay" onClick={closeCreateModal} role="dialog" aria-modal="true" aria-labelledby="create-service-title">
            <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="service-modal-close" onClick={closeCreateModal} aria-label="Close"><i className="bi bi-x-lg" /></button>
              <CreateService onClose={closeCreateModal} onSuccess={onCreateSuccess} isModal />
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="service-list-page">
        <div className="service-list-header">
          <h1 className="service-list-title">Service List</h1>
          <button type="button" className="btn btn-brand" onClick={() => setCreateModalOpen(true)}>
            <i className="bi bi-plus-lg me-1" /> Create Service
          </button>
        </div>
        <div className="service-list-error alert alert-danger">{loadError}</div>
        {createModalOpen && createPortal(
          <div className="service-modal-overlay" onClick={closeCreateModal} role="dialog" aria-modal="true" aria-labelledby="create-service-title">
            <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="service-modal-close" onClick={closeCreateModal} aria-label="Close"><i className="bi bi-x-lg" /></button>
              <CreateService onClose={closeCreateModal} onSuccess={onCreateSuccess} isModal />
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="service-list-page">
      <div className="service-list-header">
        <h1 className="service-list-title">Service List</h1>
        <button type="button" className="btn btn-brand" onClick={() => setCreateModalOpen(true)}>
          <i className="bi bi-plus-lg me-1" /> Create Service
        </button>
      </div>

      {/* Toolbar - Search & Filter */}
      <div className="service-toolbar card">
        <div className="toolbar-row">
          <div className="search-box">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search services..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <i className="bi bi-search search-icon" />
          </div>
          <select
            className="form-select filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="action-buttons">
            <button type="button" className="btn-icon" onClick={handleReset} title="Reset filters">
              <i className="bi bi-arrow-counterclockwise" />
            </button>
          </div>
        </div>
      </div>

      <div className="service-list-table-wrap card">
        <table className="table table-hover service-list-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Service Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentServices.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  {services.length === 0 ? 'No services yet.' : 'No services match your search or filter.'}
                </td>
              </tr>
            ) : (
              currentServices.map((s, index) => (
                <tr key={s.serviceId}>
                  <td>{indexOfFirstService + index + 1}</td>
                  <td>{s.serviceName || '—'}</td>
                  <td>{formatPrice(s.basePrice)}</td>
                  <td>{s.category || '—'}</td>
                  <td>
                    <div className="action-icons">
                      <button
                        type="button"
                        className="action-btn view"
                        onClick={() => setViewModalId(s.serviceId)}
                        title="View details"
                      >
                        <i className="bi bi-eye" />
                      </button>
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={() => setEditModalId(s.serviceId)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => handleDelete(s)}
                        title="Delete"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {filteredServices.length === 0 ? 0 : indexOfFirstService + 1} to {Math.min(indexOfLastService, filteredServices.length)} of {filteredServices.length} entries
          </div>
          <div className="pagination">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                type="button"
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              className="pagination-btn"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {viewModalId != null && createPortal(
        <div
          className="service-modal-overlay"
          onClick={closeViewModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-detail-title"
        >
          <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="service-modal-close" onClick={closeViewModal} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
            <ServiceDetail serviceId={String(viewModalId)} onClose={closeViewModal} isModal />
          </div>
        </div>,
        document.body
      )}

      {editModalId != null && createPortal(
        <div
          className="service-modal-overlay"
          onClick={closeEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-service-title"
        >
          <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="service-modal-close" onClick={closeEditModal} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
            <EditService serviceId={String(editModalId)} onClose={closeEditModal} onSuccess={onEditSuccess} isModal />
          </div>
        </div>,
        document.body
      )}

      {createModalOpen && createPortal(
        <div
          className="service-modal-overlay"
          onClick={closeCreateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-service-title"
        >
          <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="service-modal-close" onClick={closeCreateModal} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
            <CreateService onClose={closeCreateModal} onSuccess={onCreateSuccess} isModal />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ServiceList;
