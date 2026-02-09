import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountAPI } from '../utils/api';
import './AccountList.css';

const AccountList = () => {
  const navigate = useNavigate();
  
  // ========== MOCK CURRENT USER ==========
  // Comment/Uncomment để test các role khác nhau:
  const currentUser = { userId: 1, role: 'ADMIN' };    // Test ADMIN - Xem tất cả users
  // const currentUser = { userId: 2, role: 'MANAGER' }; // Test MANAGER - Xem tất cả STAFF
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 5;

  useEffect(() => {
    fetchAccounts();
  }, [currentUser.userId]);

  // Reset trang về 1 khi search/filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedBranch, selectedStatus]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Gọi API với currentUserId để backend kiểm tra phân quyền
      const response = await accountAPI.getAllAccounts({ currentUserId: currentUser.userId });
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm) params.fullName = searchTerm;

      const response = await accountAPI.filterAccounts(params);
      setAccounts(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error filtering accounts:', error);
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
      
      // Refresh danh sách
      fetchAccounts();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Không thể thay đổi trạng thái tài khoản!');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${username}"?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      await accountAPI.deleteAccount(userId);
      alert('Xóa tài khoản thành công!');
      
      // Refresh danh sách
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Không thể xóa tài khoản! ' + (error.response?.data || error.message));
    }
  };

  // Pagination logic - Filter accounts client-side
  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  
  // Client-side filtering
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchTerm === '' || 
      (account.fullName && account.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === '' || account.role === selectedRole;
    const matchesBranch = selectedBranch === '' || account.mainBranch === selectedBranch;
    const matchesStatus = selectedStatus === '' || account.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });
  
  const currentAccounts = filteredAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d', fontStyle: 'italic' }}>
            Current User: <strong>{currentUser.role}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Nút Create Account - Admin & Manager có quyền thêm */}
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
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Filters - Horizontal */}
          <select
            className="form-select filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="Manager">Manager</option>
          </select>

          <select
            className="form-select filter-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            <option value="1">Hanoi Branch</option>
            <option value="2">Ho Chi Minh Branch</option>
            <option value="3">Da Nang Branch</option>
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

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-icon" onClick={handleFilter} title="Apply Filter">
              <i className="bi bi-funnel"></i>
            </button>
            <button className="btn-icon" title="Export">
              <i className="bi bi-download"></i>
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
                    currentAccounts.map((account) => (
                      <tr key={account.userId}>
                        <td>{account.userId}</td>
                        <td>
                          <img
                            src={account.image || 'https://via.placeholder.com/40'}
                            alt={account.fullName}
                            className="avatar-img"
                          />
                        </td>
                        <td className="fw-semibold">{account.fullName}</td>
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
                Showing {indexOfFirstAccount + 1} to {Math.min(indexOfLastAccount, accounts.length)} of {accounts.length} entries
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
