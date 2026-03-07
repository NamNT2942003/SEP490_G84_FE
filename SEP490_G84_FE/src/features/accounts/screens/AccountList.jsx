import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { accountAPI } from '@/features/accounts/api/accountApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import UserDetail from './UserDetail';
import CreateAccount from './CreateAccount';
import EditStaff from './EditStaff';
import './AccountList.css';

/** Fallback khi API /accounts/roles lỗi hoặc rỗng — giống các trang khác */
const DEFAULT_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'STAFF', label: 'Staff' },
];
const DEFAULT_STATUSES = ['Active', 'Deactive'];

const AccountList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();

  const [accounts, setAccounts] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [statusesList, setStatusesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModalId, setViewModalId] = useState(null);
  const [editModalId, setEditModalId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const accountsPerPage = 5;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!currentUser.permissions?.canAccessAccountList) {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || !currentUser.permissions?.canAccessAccountList) return;
    if (location.pathname === '/accounts') fetchAccounts();
  }, [currentUser?.userId, location.pathname, location.state?.refreshList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedBranch, selectedStatus]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      // Luôn gọi roles và statuses trước (để dropdown có đủ option kể cả khi danh sách account lỗi)
      try {
        const [rolesRes, statusesRes] = await Promise.all([
          accountAPI.getRoles(),
          accountAPI.getStatuses(),
        ]);
        const roles = rolesRes.data || [];
        const statuses = statusesRes.data || [];
        setRolesList(roles.length > 0 ? roles : DEFAULT_ROLES);
        setStatusesList(Array.isArray(statuses) && statuses.length > 0 ? statuses : DEFAULT_STATUSES);
      } catch (e) {
        console.warn('Roles/Statuses not loaded, using defaults:', e);
        setRolesList(DEFAULT_ROLES);
        setStatusesList(DEFAULT_STATUSES);
      }
      const response = await accountAPI.getAllAccounts({ currentUserId: currentUser.userId });
      setAccounts(response.data ?? []);
    } catch (error) {
      setAccounts([]);
      const msg = error.response?.data?.message || error.response?.data || error.message;
      const status = error.response?.status;
      let errText = status ? `Error ${status}: ${msg || 'Failed to load data'}` : `Error: ${msg || 'Check that backend is running.'}`;
      if (status === 404 && (msg || '').toLowerCase().includes('static resource')) {
        errText = 'Backend is not running or wrong application. Run Spring Boot (gradlew bootRun) in SEP490_G84 folder.';
      }
      setLoadError(errText);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const params = { currentUserId: currentUser?.userId };
      const branchIdNum = parseInt(selectedBranch, 10);
      if (!isNaN(branchIdNum)) params.branchId = branchIdNum;
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm) params.fullName = searchTerm;

      const response = await accountAPI.filterAccounts(params);
      setAccounts(response.data);
      setCurrentPage(1);
    } catch (error) {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedBranch('');
    setSelectedStatus('');
    fetchAccounts();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const list = Array.isArray(statusesList) ? statusesList.filter(s => typeof s === 'string' && String(s).trim()) : [];
      const cur = (currentStatus && String(currentStatus).trim()) || '';
      const other = list.find(s => String(s).trim().toLowerCase() !== cur.toLowerCase());
      const nextStatus = other != null ? String(other).trim() : (list[0] && cur.toLowerCase() !== String(list[0]).trim().toLowerCase() ? String(list[0]).trim() : list[1] ? String(list[1]).trim() : null);
      if (!nextStatus || nextStatus === cur) return;
      await accountAPI.updateAccountStatus(userId, nextStatus, currentUser?.userId);
      fetchAccounts();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || error.message;
      const status = error.response?.status;
      alert('Could not update account status!' + (status ? ` (${status})` : '') + (msg ? `\n${msg}` : ''));
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete account "${username}"?\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await accountAPI.deleteAccount(userId, currentUser?.userId);
      alert('Account deleted successfully.');
      fetchAccounts();
    } catch (error) {
      const msg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response?.data : error.message);
      alert('Could not delete account. ' + (msg || ''));
    }
  };

  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  const uniqueBranches = [...new Set(accounts.map(a => a.mainBranch).filter(Boolean))].sort();
  const searchLower = searchTerm.trim().toLowerCase();
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchLower === '' ||
      (account.fullName && String(account.fullName).toLowerCase().includes(searchLower)) ||
      (account.username && String(account.username).toLowerCase().includes(searchLower)) ||
      (account.email && String(account.email).toLowerCase().includes(searchLower));
    const matchesRole = selectedRole === '' || (account.role && account.role.toUpperCase() === selectedRole);
    const matchesBranch = selectedBranch === '' || account.mainBranch === selectedBranch;
    const matchesStatus = selectedStatus === '' || account.status === selectedStatus;

    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  const currentAccounts = filteredAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const closeViewModal = () => setViewModalId(null);
  const closeEditModal = () => setEditModalId(null);
  const closeCreateModal = () => setCreateModalOpen(false);
  const onEditSuccess = () => {
    fetchAccounts();
    setEditModalId(null);
  };
  const onCreateSuccess = () => {
    fetchAccounts();
    setCreateModalOpen(false);
  };

  if (!currentUser || !currentUser.permissions?.canAccessAccountList) return null;

  return (
    <div className="account-management-container">
      {/* Header */}
      <div className="account-header">
        <div>
          <h1 className="account-title">
            Account List
          </h1>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn-add-account"
            onClick={() => setCreateModalOpen(true)}
          >
            <i className="bi bi-person-plus-fill"></i>
            {currentUser.permissions?.isManager ? 'Create Staff' : 'Create Account'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="account-toolbar card">
        <div className="toolbar-row">
          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <i className="bi bi-search search-icon"></i>
          </div>

          {/* Filters - Horizontal */}
          <select
            className="form-select filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {rolesList.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select
            className="form-select filter-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {uniqueBranches.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>

          <select
            className="form-select filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {statusesList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Action buttons */}
          <div className="action-buttons">
            <button className="btn-icon" onClick={handleFilter} title="Apply Filter">
              <i className="bi bi-funnel"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="account-table-container card">
        {loadError && (
          <div className="alert alert-danger mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {loadError}
            <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => { setLoadError(null); fetchAccounts(); }}>Retry</button>
          </div>
        )}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table account-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Avatar</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Main Branch</th>
                    <th>Additional Branches</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAccounts.length > 0 ? (
                    currentAccounts.map((account, index) => (
                      <tr key={account.userId}>
                        <td>{(currentPage - 1) * accountsPerPage + index + 1}</td>
                        <td>
                          <img
                            src={
                              account.image
                                ? account.image.startsWith('http')
                                  ? account.image
                                  : (accountAPI.getBaseURL?.() || (typeof window !== 'undefined' ? window.location.origin : '')) + account.image
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(account.fullName || 'U')}&size=40&background=56785e&color=fff`
                            }
                            alt={account.fullName}
                            className="avatar-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.fullName || 'U')}&size=40&background=56785e&color=fff`;
                            }}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold">{account.username}</div>
                        </td>
                        <td>{account.email}</td>
                        <td>{account.role || '—'}</td>
                        <td>
                          <span className="badge-branch">{account.mainBranch || 'N/A'}</span>
                        </td>
                        <td>
                          {account.additionalBranches && account.additionalBranches.length > 0 ? (
                            <div className="additional-branches">
                              {account.additionalBranches.map((branch, index) => (
                                <span key={index} className="badge-branch-sm">
                                  {branch}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`status-toggle-btn ${account.status.toLowerCase()}`}
                            onClick={() => handleToggleStatus(account.userId, account.status)}
                            title={`Click to ${account.status === statusesList?.[0] ? 'deactivate' : 'activate'}`}
                          >
                            <i className={`bi ${account.status === statusesList?.[0] ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                            <span>{account.status}</span>
                          </button>
                        </td>
                        <td>
                          <div className="action-icons">
                            {/* View */}
                            <button
                              className="action-btn view"
                              title="View"
                              onClick={() => setViewModalId(account.userId)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            {/* Edit & Delete */}
                            <button
                              className="action-btn edit"
                              title="Edit"
                              onClick={() => setEditModalId(account.userId)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="action-btn delete"
                              title="Delete"
                              onClick={() => handleDelete(account.userId, account.username)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted">
                        {loadError ? 'Failed to load data.' : 'No accounts found'}
                        {!loadError && currentUser?.permissions?.isManager && ' (Manager can only view Staff accounts.)'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - Always show */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstAccount + 1} to {Math.min(indexOfLastAccount, filteredAccounts.length)} of {filteredAccounts.length} entries
              </div>
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                    onClick={() => paginate(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  className="pagination-btn"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: View User Details */}
      {viewModalId != null && (
        <div
          className="service-modal-overlay"
          onClick={closeViewModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-detail-title"
        >
          <div className="service-modal-box account-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="service-modal-close" onClick={closeViewModal} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
            <UserDetail userId={viewModalId} onClose={closeViewModal} isModal />
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editModalId != null && (
        <div
          className="service-modal-overlay"
          onClick={closeEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
        >
          <div className="service-modal-box account-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="service-modal-close" onClick={closeEditModal} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
            <EditStaff id={String(editModalId)} onClose={closeEditModal} onSuccess={onEditSuccess} isModal />
          </div>
        </div>
      )}

      {/* Modal: Create Account */}
      {createModalOpen && (
        <div
          className="service-modal-overlay"
          onClick={closeCreateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-account-title"
        >
          <div className="service-modal-box account-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="service-modal-close" onClick={closeCreateModal} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
            <CreateAccount onClose={closeCreateModal} onSuccess={onCreateSuccess} isModal />
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountList;
