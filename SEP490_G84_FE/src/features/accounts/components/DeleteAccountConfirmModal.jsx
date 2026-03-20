import React from 'react';
import ReactDOM from 'react-dom';
import './DeleteAccountConfirmModal.css';

/** Confirm-delete modal (replaces window.confirm); matches SuccessNoticeModal layout. */
const DeleteAccountConfirmModal = ({
  open,
  username,
  onCancel,
  onConfirm,
  confirming = false,
}) => {
  if (!open) return null;

  const node = (
    <div
      className="delete-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-desc"
      onClick={onCancel}
    >
      <div
        className="delete-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-confirm-icon-wrap" aria-hidden="true">
          <i className="bi bi-exclamation-lg delete-confirm-icon" />
        </div>
        <h2 id="delete-confirm-title" className="delete-confirm-title">
          Delete this account?
        </h2>
        <p id="delete-confirm-desc" className="delete-confirm-message">
          Are you sure you want to delete account <strong>&quot;{username}&quot;</strong>?<br />
          This action cannot be undone.
        </p>
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
            className="delete-confirm-btn-delete"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Deleting...' : 'Delete'}
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

export default DeleteAccountConfirmModal;
