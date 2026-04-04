import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { accountAPI } from '@/features/accounts/api/accountApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import UserDetail from './UserDetail';
import CreateAccount from './CreateAccount';
import EditStaff from './EditStaff';
import SuccessNoticeModal from '@/features/accounts/components/SuccessNoticeModal';
import DeleteAccountConfirmModal from '@/features/accounts/components/DeleteAccountConfirmModal';
import AccountConfirmModal from '@/features/accounts/components/AccountConfirmModal';
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
  const [successNotice, setSuccessNotice] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    userId: null,
    username: '',
  });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState({
    open: false,
    userId: null,
    username: '',
    currentStatus: '',
    nextStatus: '',
  });
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const accountsPerPage = 5;

  const showSuccessNotice = (title, message) => {
    setSuccessNotice({ open: true, title, message });
  };
  const closeSuccessNotice = () => {
    setSuccessNotice((prev) => ({ ...prev, open: false }));
  };

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

  const getNextStatusForToggle = (currentStatus) => {
    const list = Array.isArray(statusesList) ? statusesList.filter((s) => typeof s === 'string' && String(s).trim()) : [];
    const cur = (currentStatus && String(currentStatus).trim()) || '';
    const other = list.find((s) => String(s).trim().toLowerCase() !== cur.toLowerCase());
    const nextStatus =
      other != null
        ? String(other).trim()
        : list[0] && cur.toLowerCase() !== String(list[0]).trim().toLowerCase()
          ? String(list[0]).trim()
          : list[1]
            ? String(list[1]).trim()
            : null;
    if (!nextStatus || nextStatus === cur) return null;
    return nextStatus;
  };

  const openStatusToggleConfirm = (account) => {
    const nextStatus = getNextStatusForToggle(account.status);
    if (nextStatus == null) return;
    setStatusConfirm({
      open: true,
      userId: account.userId,
      username: account.username || '',
      currentStatus: String(account.status || '').trim(),
      nextStatus,
    });
  };

  const closeStatusConfirm = () => {
    if (statusSubmitting) return;
    setStatusConfirm({
      open: false,
      userId: null,
      username: '',
      currentStatus: '',
      nextStatus: '',
    });
  };

  const confirmStatusToggle = async () => {
    const { userId, nextStatus } = statusConfirm;
    if (userId == null || !nextStatus) return;
    try {
      setStatusSubmitting(true);
      await accountAPI.updateAccountStatus(userId, nextStatus, currentUser?.userId);
      setStatusConfirm({
        open: false,
        userId: null,
        username: '',
        currentStatus: '',
        nextStatus: '',
      });
      fetchAccounts();
      showSuccessNotice('Status updated', `Account is now ${nextStatus}.`);
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || error.message;
      const status = error.response?.status;
      alert('Could not update account status!' + (status ? ` (${status})` : '') + (msg ? `\n${msg}` : ''));
    } finally {
      setStatusSubmitting(false);
    }
  };

  const openDeleteConfirm = (userId, username) => {
    setDeleteConfirm({
      open: true,
      userId,
      username: username || '',
    });
  };

  const closeDeleteConfirm = () => {
    if (deleteSubmitting) return;
    setDeleteConfirm({ open: false, userId: null, username: '' });
  };

  const confirmDeleteAccount = async () => {
    const { userId, username } = deleteConfirm;
    if (userId == null) return;
    try {
      setDeleteSubmitting(true);
      await accountAPI.deleteAccount(userId, currentUser?.userId);
      setDeleteConfirm({ open: false, userId: null, username: '' });
      fetchAccounts();
      showSuccessNotice(
        'Deleted successfully!',
        `Account "${username}" has been removed.`
      );
    } catch (error) {
      const msg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response?.data : error.message);
      alert('Could not delete account. ' + (msg || ''));
    } finally {
      setDeleteSubmitting(false);
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
  /** Chỉ refresh bảng; thông báo thành công nằm trong EditStaff / CreateAccount (SuccessNoticeModal). */
  const onEditSuccess = () => {
    fetchAccounts();
  };
  const onCreateSuccess = () => {
    fetchAccounts();
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
                type="button"
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
                  <table className="table account-table account-table-centered">
                    <thead>
                    <tr>
                      <th scope="col">User ID</th>
                      <th scope="col">Avatar</th>
                      <th scope="col">Username</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Main Branch</th>
                      <th scope="col">Additional Branches</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
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
                                    type="button"
                                    className={`status-toggle-btn ${account.status.toLowerCase()}`}
                                    onClick={() => openStatusToggleConfirm(account)}
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
                                      type="button"
                                      className="action-btn edit"
                                      title="Edit"
                                      onClick={() => setEditModalId(account.userId)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                      className="action-btn delete"
                                      title="Delete"
                                      onClick={() => openDeleteConfirm(account.userId, account.username)}
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
        {viewModalId != null && ReactDOM.createPortal(
            <div className="account-modal-overlay" onClick={closeViewModal} role="dialog" aria-modal="true">
              <div className="account-modal-box" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="service-modal-close" onClick={closeViewModal} aria-label="Close">
                  <i className="bi bi-x-lg" />
                </button>
                <UserDetail userId={viewModalId} onClose={closeViewModal} isModal />
              </div>
            </div>,
            document.body
        )}

        {/* Modal: Edit User */}
        {editModalId != null && ReactDOM.createPortal(
            <div className="account-modal-overlay" onClick={closeEditModal} role="dialog" aria-modal="true">
              <div className="account-modal-box" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="service-modal-close" onClick={closeEditModal} aria-label="Close">
                  <i className="bi bi-x-lg" />
                </button>
                <EditStaff id={String(editModalId)} onClose={closeEditModal} onSuccess={onEditSuccess} isModal />
              </div>
            </div>,
            document.body
        )}

        {/* Modal: Create Account */}
        {createModalOpen && ReactDOM.createPortal(
            <div className="account-modal-overlay" onClick={closeCreateModal} role="dialog" aria-modal="true">
              <div className="account-modal-box" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="service-modal-close" onClick={closeCreateModal} aria-label="Close">
                  <i className="bi bi-x-lg" />
                </button>
                <CreateAccount onClose={closeCreateModal} onSuccess={onCreateSuccess} isModal />
              </div>
            </div>,
            document.body
        )}

        <DeleteAccountConfirmModal
          open={deleteConfirm.open}
          username={deleteConfirm.username}
          onCancel={closeDeleteConfirm}
          onConfirm={confirmDeleteAccount}
          confirming={deleteSubmitting}
        />

        <AccountConfirmModal
          open={statusConfirm.open}
          title="Change account status?"
          message={
            <p style={{ margin: 0 }}>
              Are you sure you want to change status for <strong>&quot;{statusConfirm.username}&quot;</strong> from{' '}
              <strong>{statusConfirm.currentStatus}</strong> to <strong>{statusConfirm.nextStatus}</strong>?<br />
              This action takes effect immediately and cannot be undone from this dialog.
            </p>
          }
          confirmLabel="Change status"
          onCancel={closeStatusConfirm}
          onConfirm={confirmStatusToggle}
          confirming={statusSubmitting}
          variant="primary"
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

export default AccountList;