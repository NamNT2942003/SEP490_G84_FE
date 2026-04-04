import React from 'react';
import ReactDOM from 'react-dom';
import './DeleteAccountConfirmModal.css';

/**
 * Generic confirm dialog — same layout as delete confirmation (icon, title, message, Cancel + primary action).
 * @param {'danger' | 'primary'} variant — danger = red confirm (e.g. destructive), primary = brand green
 */
const AccountConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  confirming = false,
  variant = 'primary',
}) => {
  if (!open) return null;

  const confirmClass =
    variant === 'danger'
      ? 'delete-confirm-btn-delete'
      : 'delete-confirm-btn-confirm-primary';

  const node = (
    <div
      className="delete-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-confirm-title"
      aria-describedby="account-confirm-desc"
      onClick={onCancel}
    >
      <div
        className="delete-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-confirm-icon-wrap" aria-hidden="true">
          <i className="bi bi-exclamation-lg delete-confirm-icon" />
        </div>
        <h2 id="account-confirm-title" className="delete-confirm-title">
          {title}
        </h2>
        <div id="account-confirm-desc" className="delete-confirm-message">
          {message}
        </div>
        <div className="delete-confirm-actions">
          <button
            type="button"
            className="delete-confirm-btn-cancel"
            onClick={onCancel}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};

export default AccountConfirmModal;
