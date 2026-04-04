import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { serviceAPI } from '@/features/services/api/serviceApi';
import ServiceDetail from './ServiceDetail';
import EditService from './EditService';
import CreateService from './CreateService';
import SuccessNoticeModal from '@/features/accounts/components/SuccessNoticeModal';
import DeleteServiceConfirmModal from '@/features/services/components/DeleteServiceConfirmModal';
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

  const [successNotice, setSuccessNotice] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    service: null,
  });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const showSuccessNotice = (title, message) => {
    setSuccessNotice({ open: true, title, message });
  };
  const closeSuccessNotice = () => {
    setSuccessNotice((prev) => ({ ...prev, open: false }));
  };

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

  const onEditSuccess = (meta) => {
    fetchServices();
    setEditModalId(null);
    const name = meta?.serviceName;
    showSuccessNotice(
      'Service updated!',
      name
        ? `"${name}" has been saved successfully.`
        : 'The service has been updated successfully.'
    );
  };

  const onCreateSuccess = (meta) => {
    fetchServices();
    setCreateModalOpen(false);
    const name = meta?.serviceName;
    showSuccessNotice(
      'Service created!',
      name
        ? `"${name}" has been added to the list.`
        : 'The new service has been created successfully.'
    );
  };

  const openDeleteConfirm = (s) => {
    setDeleteConfirm({ open: true, service: s });
  };

  const closeDeleteConfirm = () => {
    if (deleteSubmitting) return;
    setDeleteConfirm({ open: false, service: null });
  };

  const confirmDeleteService = async () => {
    const s = deleteConfirm.service;
    if (!s) return;
    try {
      setDeleteSubmitting(true);
      await serviceAPI.deleteService(s.serviceId);
      const name = s.serviceName || `ID ${s.serviceId}`;
      setDeleteConfirm({ open: false, service: null });
      fetchServices();
      showSuccessNotice(
        'Service deleted!',
        `"${name}" has been removed.`
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message;
      alert(msg ? `Could not delete service: ${msg}` : 'Failed to delete service.');
    } finally {
      setDeleteSubmitting(false);
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

  return (
    <div className="service-list-page">
      <div className="service-list-header">
        <h1 className="service-list-title">Service List</h1>
        <button type="button" className="btn btn-brand" onClick={() => setCreateModalOpen(true)}>
          <i className="bi bi-plus-lg me-1" /> Create Service
        </button>
      </div>

      {loading ? (
        <div className="service-list-loading">
          <div className="spinner-border text-primary" role="status" />
          <span>Loading...</span>
        </div>
      ) : loadError ? (
        <div className="service-list-error alert alert-danger">{loadError}</div>
      ) : (
        <>
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
            <table className="table table-hover service-list-table service-list-table-centered">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Service Name</th>
                  <th scope="col">Price</th>
                  <th scope="col">Category</th>
                  <th scope="col">Actions</th>
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
                            onClick={() => openDeleteConfirm(s)}
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
        </>
      )}

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

      <DeleteServiceConfirmModal
        open={deleteConfirm.open}
        serviceName={deleteConfirm.service?.serviceName}
        onCancel={closeDeleteConfirm}
        onConfirm={confirmDeleteService}
        confirming={deleteSubmitting}
      />

      <SuccessNoticeModal
        open={successNotice.open}
        title={successNotice.title}
        message={successNotice.message}
        onClose={closeSuccessNotice}
      />
    </div>
  );
};

export default ServiceList;