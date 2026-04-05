import React from 'react';
import ReactDOM from 'react-dom';
import './AccountErrorModal.css';

/** Thông báo lỗi (thay alert) — cùng phong cách modal xác nhận tài khoản. */
const AccountErrorModal = ({
  open,
  title = 'Something went wrong',
  message,
  closeLabel = 'OK',
  onClose,
}) => {
  if (!open) return null;

  const hasMessage = message != null && message !== '';

  const node = (
    <div
      className="account-error-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="account-error-title"
      aria-describedby={hasMessage ? 'account-error-desc' : undefined}
      onClick={onClose}
    >
      <div className="account-error-card" onClick={(e) => e.stopPropagation()}>
        <div className="account-error-icon-wrap" aria-hidden="true">
          <i className="bi bi-exclamation-lg account-error-icon" />
        </div>
        <h2 id="account-error-title" className="account-error-title">
          {title}
        </h2>
        {hasMessage ? (
          <div id="account-error-desc" className="account-error-message">
            {message}
          </div>
        ) : null}
        <button type="button" className="account-error-btn-ok" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};

export default AccountErrorModal;
