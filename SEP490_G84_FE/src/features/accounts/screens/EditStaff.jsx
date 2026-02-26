import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accountAPI, branchAPI } from '@/features/accounts/api/accountApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './EditStaff.css';

const EditStaff = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = useCurrentUser();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    primaryBranchId: '',
    primaryBranchName: '',
    additionalBranches: []
  });

  const [branches, setBranches] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (currentUser?.permissions?.canAccessAccountList) fetchData();
  }, [id, currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let branchesList = [];
      try {
        const branchesRes = await branchAPI.getAllBranches();
        branchesList = branchesRes.data || [];
      } catch (e) {
        console.warn('Branches not loaded:', e);
      }
      setBranches(branchesList);

      let assignableList = [];
      if (currentUser?.userId) {
        try {
          const rolesRes = await accountAPI.getAssignableRoles(currentUser.userId);
          assignableList = rolesRes.data || [];
          setAssignableRoles(assignableList);
        } catch (e) {
          console.warn('Assignable roles not loaded:', e);
          setAssignableRoles([]);
        }
      }

      const params = currentUser?.userId != null ? { currentUserId: currentUser.userId } : {};
      const userRes = await accountAPI.getAccountById(id, params);
      const user = userRes.data;
      const primaryBranch = branchesList.find(b => b.branchName === user.mainBranch);

      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '********',
        role: user.role || assignableList[0]?.value || '',
        primaryBranchId: primaryBranch ? primaryBranch.branchId : '',
        primaryBranchName: user.mainBranch || '',
        additionalBranches: user.additionalBranches || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403) {
        alert('Manager can only edit staff accounts.');
        navigate('/accounts');
      } else {
        alert('Could not load user. Check that the user exists.');
      }
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

      // Map branch names to IDs
      const additionalBranchIds = branches
        .filter(b => formData.additionalBranches.includes(b.branchName))
        .map(b => b.branchId);

      const updateData = {
        role: formData.role,
        primaryBranchId: formData.primaryBranchId || null,
        additionalBranchIds: additionalBranchIds
      };
      if (currentUser?.permissions?.canEditUsername) {
        updateData.username = formData.username;
        updateData.email = formData.email;
      }

      await accountAPI.updateAccount(id, updateData, currentUser?.userId);

      alert('Updated successfully.');
      navigate('/accounts', { state: { refreshList: true } });
    } catch (error) {
      console.error('Error updating user:', error);
      const msg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response?.data : JSON.stringify(error.response?.data));
      alert('Could not update user.' + (msg ? '\n' + msg : ''));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = () => {
    if (window.confirm('Are you sure you want to reset password for this user?')) {
      alert('Reset Password feature will be implemented later.');
    }
  };

  const handleCancel = () => {
    navigate('/accounts');
  };

  // Role options from API (assignable roles for current user)
  const roleOptions = assignableRoles.some(r => r.value === formData.role)
    ? assignableRoles
    : [...assignableRoles, { value: formData.role, label: formData.role }];

  if (!currentUser || !currentUser.permissions?.canAccessAccountList) return null;

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
                readOnly={!currentUser?.permissions?.canEditUsername}
                title={!currentUser?.permissions?.canEditUsername ? 'Only Admin can edit username' : ''}
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
                readOnly={!currentUser?.permissions?.canEditEmail}
                title={!currentUser?.permissions?.canEditEmail ? 'Only Admin can edit email' : ''}
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
              <div className="select-arrow-wrapper">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-control select-with-arrow"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <i className="bi bi-chevron-down select-arrow-icon" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Primary Branch */}
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="primaryBranch">Primary Branch</label>
              <div className="select-arrow-wrapper">
                <select
                  id="primaryBranch"
                  name="primaryBranch"
                  value={formData.primaryBranchId || ''}
                  onChange={handlePrimaryBranchChange}
                  className="form-control select-with-arrow"
                >
                  <option value="">— No branch —</option>
                  {branches.map(branch => (
                    <option key={branch.branchId} value={branch.branchId}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
                <i className="bi bi-chevron-down select-arrow-icon" aria-hidden="true" />
              </div>
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
