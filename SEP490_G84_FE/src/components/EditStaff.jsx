import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accountAPI, branchAPI } from '../utils/api';
import './EditStaff.css';

const EditStaff = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // ========== MOCK CURRENT USER ==========
  // Comment/Uncomment để test các role khác nhau:
  const currentUser = { userId: 1, role: 'ADMIN' };    // Test ADMIN
  // const currentUser = { userId: 2, role: 'MANAGER' }; // Test MANAGER
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STAFF',
    primaryBranchId: '',
    primaryBranchName: '',
    additionalBranches: [] // Array of branch names
  });
  
  const [branches, setBranches] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Load branches
      const branchesRes = await branchAPI.getAllBranches();
      setBranches(branchesRes.data);
      
      // Load user data
      const userRes = await accountAPI.getAccountById(id);
      const user = userRes.data;
      
      // Tìm branchId của primary branch
      const primaryBranch = branchesRes.data.find(b => b.branchName === user.mainBranch);
      
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '********', // Không load password thật
        role: user.role || 'STAFF',
        primaryBranchId: primaryBranch ? primaryBranch.branchId : '',
        primaryBranchName: user.mainBranch || '',
        additionalBranches: user.additionalBranches || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Không thể load thông tin!');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBranchToggle = (branchName) => {
    setFormData(prev => {
      const isSelected = prev.additionalBranches.includes(branchName);
      return {
        ...prev,
        additionalBranches: isSelected
          ? prev.additionalBranches.filter(b => b !== branchName)
          : [...prev.additionalBranches, branchName]
      };
    });
  };

  const handlePrimaryBranchChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedBranch = branches.find(b => b.branchId === selectedId);
    
    setFormData(prev => ({
      ...prev,
      primaryBranchId: selectedId,
      primaryBranchName: selectedBranch ? selectedBranch.branchName : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Chuyển đổi branch names thành IDs
      const additionalBranchIds = branches
        .filter(b => formData.additionalBranches.includes(b.branchName))
        .map(b => b.branchId);
      
      const updateData = {
        email: formData.email,
        role: formData.role,
        primaryBranchId: formData.primaryBranchId,
        additionalBranchIds: additionalBranchIds
      };
      
      // DEBUG: Log data gửi lên backend
      console.log('=== UPDATE DATA ===');
      console.log('User ID:', id);
      console.log('Update Data:', updateData);
      console.log('Primary Branch ID:', updateData.primaryBranchId);
      console.log('Additional Branch IDs:', updateData.additionalBranchIds);
      
      await accountAPI.updateAccount(id, updateData);
      
      alert('Cập nhật thành công!');
      navigate('/accounts');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Không thể cập nhật user!');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = () => {
    if (window.confirm('Bạn có chắc muốn reset password cho user này?')) {
      alert('Chức năng Reset Password sẽ được implement sau!');
    }
  };

  const handleCancel = () => {
    navigate('/accounts');
  };

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (currentUser.role === 'ADMIN') {
      // Admin có thể đổi account thành MANAGER hoặc STAFF (không thể tạo ADMIN mới)
      return [
        { value: 'MANAGER', label: 'Manager' },
        { value: 'STAFF', label: 'Staff' }
      ];
    } else if (currentUser.role === 'MANAGER') {
      // Manager chỉ có thể phân role STAFF
      return [
        { value: 'STAFF', label: 'Staff' }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="edit-staff-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-staff-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-nav">
        <span onClick={() => navigate('/accounts')} className="breadcrumb-link">Users</span>
        <i className="bi bi-chevron-right"></i>
        <span className="breadcrumb-current">Edit User</span>
      </div>

      {/* Title */}
      <h1 className="edit-staff-title">Edit User Details</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="edit-staff-form">
        <div className="form-card">
          {/* Username & Email */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="form-control"
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Gmail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Password & Role */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-control"
                  disabled
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-control"
              >
                {getAvailableRoles().map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Branch */}
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="primaryBranch">Primary Branch</label>
              <select
                id="primaryBranch"
                name="primaryBranch"
                value={formData.primaryBranchId}
                onChange={handlePrimaryBranchChange}
                className="form-control"
                required
              >
                <option value="">Select primary branch...</option>
                {branches.map(branch => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Branch Access */}
          <div className="form-group full-width">
            <label>Additional Branch Access</label>
            <div className="branch-checkboxes">
              {branches.map(branch => (
                <div key={branch.branchId} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`branch-${branch.branchId}`}
                    checked={formData.additionalBranches.includes(branch.branchName)}
                    onChange={() => handleBranchToggle(branch.branchName)}
                  />
                  <label htmlFor={`branch-${branch.branchId}`}>{branch.branchName}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-cancel"
          >
            Cancel
          </button>
          
          <div className="right-actions">
            <button
              type="button"
              onClick={handleResetPassword}
              className="btn btn-reset"
            >
              Reset Password
            </button>
            
            <button
              type="submit"
              className="btn btn-submit"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditStaff;
