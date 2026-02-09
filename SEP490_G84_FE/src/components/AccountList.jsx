import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountAPI } from '@/utils/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './AccountList.css';

const AccountList = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 5;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role === 'STAFF') {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'STAFF') return;
    fetchAccounts();
  }, [currentUser?.userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedBranch, selectedStatus]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountAPI.getAllAccounts({ currentUserId: currentUser.userId });
      setAccounts(response.data);
    } catch (error) {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const params = {};
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
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await accountAPI.updateAccountStatus(userId, newStatus);
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
      await accountAPI.deleteAccount(userId);
      alert('Account deleted successfully.');
      fetchAccounts();
    } catch (error) {
      alert('Could not delete account. ' + (error.response?.data || error.message));
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

  if (!currentUser || currentUser.role === 'STAFF') return null;

  return (
    <div className="account-management-container">
      {/* Header */}
      <div className="account-header">
        <div>
          <h1 className="account-title">
            {currentUser.role === 'MANAGER'
              ? 'Staff Management'
              : 'Account Management'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="btn-add-account"
            onClick={() => navigate('/accounts/create')}
          >
            <i className="bi bi-person-plus-fill"></i>
            {currentUser.role === 'MANAGER' ? 'Create Staff' : 'Create Account'}
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
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="STAFF">STAFF</option>
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Action Buttons - Chỉ giữ Filter */}
          <div className="action-buttons">
            <button className="btn-icon" onClick={handleFilter} title="Apply Filter">
              <i className="bi bi-funnel"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="account-table-container card">
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
                                  : (accountAPI.getBaseURL?.() || 'http://localhost:8081') + account.image
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
                          <div className="fw-semibold">{account.fullName}</div>
                        </td>
                        <td>{account.email}</td>
                        <td>{account.role}</td>
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
                            title={`Click to ${account.status === 'Active' ? 'deactivate' : 'activate'}`}
                          >
                            <i className={`bi ${account.status === 'Active' ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                            <span>{account.status}</span>
                          </button>
                        </td>
                        <td>
                          <div className="action-icons">
                            {/* View - Hiển thị cho cả Admin và Manager */}
                            <button 
                              className="action-btn view" 
                              title="View" 
                              onClick={() => navigate(`/accounts/${account.userId}`)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            
                            {/* Edit & Delete - Admin và Manager đều có quyền */}
                            <button 
                              className="action-btn edit" 
                              title="Edit"
                              onClick={() => navigate(`/accounts/${account.userId}/edit`)}
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
                        No accounts found
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
    </div>
  );
};

export default AccountList;
