import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountAPI } from '@/utils/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './UserDetail.css';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(null);
  const [error403, setError403] = useState(false);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        setError403(false);
        const params = currentUser?.userId != null ? { currentUserId: currentUser.userId } : {};
        const response = await accountAPI.getAccountById(id, params);
        const userData = response.data;
        const baseURL = accountAPI.getBaseURL?.() || 'http://localhost:8081';
        const imageUrl = userData.image
          ? (userData.image.startsWith('http') ? userData.image : baseURL + userData.image)
          : 'https://i.pravatar.cc/150?img=12';
        const transformedUser = {
          userId: userData.userId,
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email ?? '',
          password: '***********',
          image: imageUrl,
          role: {
            id: 1,
            name: userData.role || 'Staff',
            description: 'Full system access and management'
          },
          primaryBranch: {
            id: 1,
            name: userData.mainBranch || 'Main Branch',
            address: '123 Main Street, New York, NY 10001'
          },
          assignedBranches: [
            { 
              id: 1, 
              name: userData.mainBranch || 'Main Branch', 
              address: '123 Main Street, New York, NY 10001', 
              isPrimary: true 
            },
            ...(userData.additionalBranches || []).map((branch, index) => ({
              id: index + 2,
              name: branch,
              address: 'Branch Address',
              isPrimary: false
            }))
          ]
        };
        setUser(transformedUser);
      } catch (error) {
        if (error.response?.status === 403) {
          setUser(null);
          setError403(true);
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser !== undefined) fetchUserDetail();
  }, [id, currentUser?.userId]);

  useEffect(() => {
    if (!currentUser || !id) return;
    const fetchOrder = async () => {
      try {
        const res = await accountAPI.getAllAccounts({ currentUserId: currentUser.userId });
        const list = Array.isArray(res.data) ? res.data : [];
        const index = list.findIndex((a) => String(a.userId) === String(id));
        setDisplayOrder(index >= 0 ? index + 1 : null);
      } catch (e) {
        setDisplayOrder(null);
      }
    };
    fetchOrder();
  }, [currentUser?.userId, id]);

  const handleBack = () => {
    navigate('/accounts');
  };

  if (loading) {
    return (
      <div className="user-detail-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail-container">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-link" onClick={handleBack}>Users</span>
          <i className="bi bi-chevron-right"></i>
          <span className="breadcrumb-current">User Details</span>
        </div>
        <div className="alert alert-danger">
          <h4>{error403 ? 'Access denied' : 'User not found'}</h4>
          <p>{error403 ? 'Manager can only view staff accounts.' : `Unable to load user details for ID: ${id}`}</p>
          <button className="btn btn-primary" onClick={handleBack}>
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-detail-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-nav">
        <span className="breadcrumb-link" onClick={handleBack}>Users</span>
        <i className="bi bi-chevron-right"></i>
        <span className="breadcrumb-current">User Details</span>
      </div>

      {/* Header */}
      <div className="detail-header">
        <h1 className="detail-title">User Details</h1>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Left Column */}
        <div className="detail-left">
          {/* User Information */}
          <div className="detail-card">
            <h3 className="card-title">User Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>User ID</label>
                <input type="text" value={displayOrder != null ? displayOrder : user.userId} readOnly className="form-control" />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={user.username} readOnly className="form-control" />
              </div>
              <div className="form-group full-width">
                <label>Email</label>
                <input type="email" value={user.email} readOnly className="form-control" />
              </div>
              <div className="form-group full-width">
                <label>Password</label>
                <div className="password-field">
                  <input 
                    type="text"
                    value={showPassword ? "Password hidden for security" : "***********"} 
                    readOnly 
                    className="form-control" 
                    style={{ fontStyle: showPassword ? 'italic' : 'normal' }}
                  />
                  <button 
                    className="btn-toggle-password" 
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Primary Branch */}
          <div className="detail-card">
            <h3 className="card-title">Role & Primary Branch</h3>
            
            <div className="info-section">
              <label>Role</label>
              <div className="role-info">
                <div>
                  <div className="role-name">{user.role.name}</div>
                  <div className="role-description">{user.role.description}</div>
                </div>
                <span className="badge-dark">Role ID {user.role.id}</span>
              </div>
            </div>

            <div className="info-section">
              <label>Primary Branch</label>
              <div className="branch-info">
                <div>
                  <div className="branch-name">{user.primaryBranch.name}</div>
                  <div className="branch-address">{user.primaryBranch.address}</div>
                </div>
                <span className="badge-dark">Branch ID {user.primaryBranch.id}</span>
              </div>
            </div>
          </div>

          {/* Assigned Branches */}
          <div className="detail-card">
            <h3 className="card-title">Assigned Branches</h3>

            <div className="branches-list">
              {user.assignedBranches.map((branch) => (
                <div key={branch.id} className="branch-item">
                  <div className="branch-icon">
                    <i className="bi bi-building"></i>
                  </div>
                  <div className="branch-details">
                    <div className="branch-name">{branch.name}</div>
                    <div className="branch-address">{branch.address}</div>
                  </div>
                  {branch.isPrimary && (
                    <span className="badge-primary-branch">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Profile */}
        <div className="detail-right">
          <div className="detail-card profile-card">
            <h3 className="card-title">Profile</h3>
            <div className="profile-content">
              <img
                src={user.image}
                alt={user.fullName}
                className="profile-avatar"
              />
              <h4 className="profile-name">{user.fullName}</h4>
              <p className="profile-username">@{user.username}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
