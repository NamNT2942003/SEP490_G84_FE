import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountAPI, branchAPI } from '@/features/accounts/api/accountApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './CreateAccount.css';

const CreateAccount = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: '',
    primaryBranch: '',
    additionalBranches: []
  });

  const [branches, setBranches] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (currentUser?.permissions?.canAccessAccountList) {
      fetchBranches();
      fetchAssignableRoles();
    }
  }, [currentUser]);

  const fetchAssignableRoles = async () => {
    if (!currentUser?.userId) return;
    try {
      const res = await accountAPI.getAssignableRoles(currentUser.userId);
      const list = res.data || [];
      setAssignableRoles(list);
      setFormData(prev => ({ ...prev, role: prev.role || list[0]?.value || '' }));
    } catch (err) {
      console.warn('Assignable roles not loaded:', err);
      setAssignableRoles([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchAPI.getAllBranches();
      setBranches(response.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Unable to load branch list');
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
    setFormData(prev => ({
      ...prev,
      primaryBranch: selectedId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.username || !formData.password || !formData.fullName || !formData.email || !formData.role || !formData.primaryBranch) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Invalid email');
        setLoading(false);
        return;
      }

      // Convert branch names to IDs
      const additionalBranchIds = branches
        .filter(b => formData.additionalBranches.includes(b.branchName))
        .map(b => b.branchId);

      // Prepare data for API
      const requestData = {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        primaryBranchId: parseInt(formData.primaryBranch),
        additionalBranchIds: additionalBranchIds
      };

      await accountAPI.createAccount(requestData, currentUser.userId);

      alert('Account created successfully!');
      navigate('/accounts');
    } catch (err) {
      console.error('Error creating account:', err);
      const errorMessage = err.response?.data?.message || err.response?.data || 'Unable to create account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounts');
  };

  // Get available roles based on current user's role (from API)
  const roleOptions = assignableRoles;

  if (!currentUser || !currentUser.permissions?.canAccessAccountList) return null;

  return (
    <div className="create-account-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-nav">
        <span onClick={handleCancel} className="breadcrumb-link">Users</span>
        <i className="bi bi-chevron-right"></i>
        <span className="breadcrumb-current">Create New Account</span>
      </div>

      {/* Title */}
      <h1 className="create-account-title">Create New Account</h1>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="create-account-form">
        <div className="form-card">
          {/* Username & Full Name */}
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
                placeholder="Enter username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          {/* Email & Password */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Gmail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
                placeholder="example@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {/* Role & Primary Branch */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <div className="select-arrow-wrapper">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-control select-with-arrow"
                  required
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

            <div className="form-group">
              <label htmlFor="primaryBranch">Primary Branch</label>
              <div className="select-arrow-wrapper">
                <select
                  id="primaryBranch"
                  name="primaryBranch"
                  value={formData.primaryBranch}
                  onChange={handlePrimaryBranchChange}
                  className="form-control select-with-arrow"
                  required
                >
                  <option value="">Select primary branch...</option>
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

          <button
            type="submit"
            className="btn btn-submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAccount;
