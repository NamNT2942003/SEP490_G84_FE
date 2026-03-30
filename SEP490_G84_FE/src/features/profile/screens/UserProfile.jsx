import React, { useEffect, useState } from 'react';
import { profileAPI } from '@/features/profile/api/profileApi';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './UserProfile.css';

const UserProfile = () => {
  const currentUser = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Update full name
  const [fullName, setFullName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  // Change password
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await profileAPI.getMyProfile();
        const data = res.data;
        setProfile(data);
        setFullName(data.fullName || '');
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!fullName.trim()) {
      setNameError('Full name is required');
      return;
    }

    try {
      setNameSaving(true);
      const res = await profileAPI.updateMyProfile({ fullName: fullName.trim() });
      setProfile(res.data);
      setNameSuccess('Full name updated successfully');
    } catch (err) {
      setNameError(err?.response?.data?.message || 'Failed to update full name');
    } finally {
      setNameSaving(false);
    }
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.currentPassword) {
      setPwError('Current password is required');
      return;
    }
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Confirm password does not match');
      return;
    }

    try {
      setPwSaving(true);
      await profileAPI.changePassword(pwForm);
      setPwSuccess('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-error-card">
          <h3>User profile</h3>
          <p>{error || 'Unable to load profile information.'}</p>
        </div>
      </div>
    );
  }

  const initials =
    (profile.fullName || currentUser?.fullName || profile.username || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'AN';

  const additionalBranches = Array.isArray(profile.additionalBranches)
    ? profile.additionalBranches
    : [];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>User Profile</h1>
        <p>{profile.fullName || currentUser?.fullName}</p>
        {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}
      </div>

      <div className="profile-grid">
        <div className="profile-card profile-summary">
          <div className="profile-avatar-circle">
            <span>{initials}</span>
          </div>
          <h2 className="profile-name">{profile.fullName || profile.username}</h2>
          <p className="profile-role">{profile.role || 'User'}</p>

          <div className="profile-info-row">
            <span className="label">Username</span>
            <span className="value">{profile.username}</span>
          </div>
          <div className="profile-info-row">
            <span className="label">Email</span>
            <span className="value">{profile.email || '—'}</span>
          </div>
          <div className="profile-info-row">
            <span className="label">Main Branch</span>
            <span className="value">{profile.mainBranch || '—'}</span>
          </div>
          <div className="profile-info-row">
            <span className="label">Additional Branches</span>
            <div className="value">
              {additionalBranches.length === 0 ? (
                '—'
              ) : (
                <div className="profile-badge-group">
                  {additionalBranches.map((b, idx) => (
                    <span key={idx} className="profile-badge">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="profile-info-row">
            <span className="label">Status</span>
            <span className={`profile-status profile-status-${(profile.status || '').toLowerCase()}`}>
              {profile.status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="profile-card profile-edit">
          <h2>Update Personal Details</h2>

          {nameError && <div className="alert alert-danger mb-2">{nameError}</div>}
          {nameSuccess && <div className="alert alert-success mb-2">{nameSuccess}</div>}

          <form onSubmit={handleSaveName} className="profile-form mb-4">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="btn btn-success" disabled={nameSaving}>
                {nameSaving ? 'Saving...' : 'Save Full Name'}
              </button>
            </div>
          </form>

          <div className="profile-divider" />

          <h3 className="mt-3 mb-2">Change Password</h3>

          {pwError && <div className="alert alert-danger mb-2">{pwError}</div>}
          {pwSuccess && <div className="alert alert-success mb-2">{pwSuccess}</div>}

          <form onSubmit={handleSavePassword} className="profile-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="form-control"
                value={pwForm.currentPassword}
                onChange={handlePwChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="form-control"
                value={pwForm.newPassword}
                onChange={handlePwChange}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-control"
                value={pwForm.confirmPassword}
                onChange={handlePwChange}
                placeholder="Re-enter new password"
              />
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="btn btn-success" disabled={pwSaving}>
                {pwSaving ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

