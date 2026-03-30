import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '@/features/profile/api/profileApi';
import './UpdateProfile.css';

const UpdateProfile = () => {
  const navigate = useNavigate();

  // ─── Full Name state ───────────────────────────────────────────────────────
  const [fullName, setFullName]     = useState('');
  const [fnLoading, setFnLoading]   = useState(true);
  const [fnSaving, setFnSaving]     = useState(false);
  const [fnError, setFnError]       = useState('');
  const [fnSuccess, setFnSuccess]   = useState('');
  const [originalName, setOriginalName] = useState('');

  // ─── Change Password state ─────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showPw, setShowPw]       = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Load current profile để prefill full name
  useEffect(() => {
    const load = async () => {
      try {
        setFnLoading(true);
        const res = await profileAPI.getMyProfile();
        const name = res.data.fullName || '';
        setFullName(name);
        setOriginalName(name);
      } catch {
        setFnError('Failed to load profile');
      } finally {
        setFnLoading(false);
      }
    };
    load();
  }, []);

  // ─── Save Full Name ────────────────────────────────────────────────────────
  const handleSaveName = async (e) => {
    e.preventDefault();
    setFnError('');
    setFnSuccess('');
    if (!fullName.trim()) {
      setFnError('Full name is required');
      return;
    }
    try {
      setFnSaving(true);
      await profileAPI.updateMyProfile({ fullName: fullName.trim() });
      setOriginalName(fullName.trim());
      setFnSuccess('Full name updated successfully');
    } catch (err) {
      setFnError(err?.response?.data?.message || 'Failed to update full name');
    } finally {
      setFnSaving(false);
    }
  };

  // ─── Change Password ───────────────────────────────────────────────────────
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

  const toggleShow = (field) =>
    setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="update-profile-page">
      <div className="update-profile-header">
        <button
          className="btn-back"
          onClick={() => navigate('/profile')}
          title="Back to Profile"
        >
          <i className="bi bi-arrow-left me-2" />
          Back to Profile
        </button>
        <h1>Update Profile</h1>
      </div>

      <div className="update-profile-grid">

        {/* ── Section 1: Change Full Name ─────────────────────────────────── */}
        <div className="up-card">
          <div className="up-card-header">
            <i className="bi bi-person-fill me-2" />
            Change Full Name
          </div>

          {fnLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" role="status" />
            </div>
          ) : (
            <form onSubmit={handleSaveName}>
              {fnError   && <div className="alert alert-danger py-2 mb-3">{fnError}</div>}
              {fnSuccess && <div className="alert alert-success py-2 mb-3">{fnSuccess}</div>}

              <div className="form-group mb-3">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="up-actions">
                <button type="submit" className="btn btn-success" disabled={fnSaving}>
                  {fnSaving ? 'Saving...' : 'Save Name'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={fnSaving}
                  onClick={() => { setFullName(originalName); setFnError(''); setFnSuccess(''); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Section 2: Change Password ──────────────────────────────────── */}
        <div className="up-card">
          <div className="up-card-header">
            <i className="bi bi-shield-lock-fill me-2" />
            Change Password
          </div>

          <form onSubmit={handleSavePassword}>
            {pwError   && <div className="alert alert-danger py-2 mb-3">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success py-2 mb-3">{pwSuccess}</div>}

            {/* Current password */}
            <div className="form-group mb-3">
              <label className="form-label">Current Password</label>
              <div className="input-pw">
                <input
                  name="currentPassword"
                  type={showPw.current ? 'text' : 'password'}
                  className="form-control"
                  value={pwForm.currentPassword}
                  onChange={handlePwChange}
                  placeholder="Enter current password"
                />
                <button type="button" className="btn-eye" onClick={() => toggleShow('current')}>
                  <i className={`bi bi-eye${showPw.current ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="form-group mb-3">
              <label className="form-label">New Password</label>
              <div className="input-pw">
                <input
                  name="newPassword"
                  type={showPw.new ? 'text' : 'password'}
                  className="form-control"
                  value={pwForm.newPassword}
                  onChange={handlePwChange}
                  placeholder="At least 6 characters"
                />
                <button type="button" className="btn-eye" onClick={() => toggleShow('new')}>
                  <i className={`bi bi-eye${showPw.new ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="form-group mb-3">
              <label className="form-label">Confirm New Password</label>
              <div className="input-pw">
                <input
                  name="confirmPassword"
                  type={showPw.confirm ? 'text' : 'password'}
                  className="form-control"
                  value={pwForm.confirmPassword}
                  onChange={handlePwChange}
                  placeholder="Re-enter new password"
                />
                <button type="button" className="btn-eye" onClick={() => toggleShow('confirm')}>
                  <i className={`bi bi-eye${showPw.confirm ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            <div className="up-actions">
              <button type="submit" className="btn btn-success" disabled={pwSaving}>
                {pwSaving ? 'Saving...' : 'Change Password'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={pwSaving}
                onClick={() => { setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwError(''); setPwSuccess(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default UpdateProfile;
