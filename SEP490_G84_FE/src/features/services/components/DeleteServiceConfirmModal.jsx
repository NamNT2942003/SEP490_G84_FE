import React from 'react';
import ReactDOM from 'react-dom';
import '@/features/accounts/components/DeleteAccountConfirmModal.css';

/** Confirm delete service — same styles as account delete confirm. */
const DeleteServiceConfirmModal = ({
  open,
  serviceName,
  onCancel,
  onConfirm,
  confirming = false,
}) => {
  if (!open) return null;

  const displayName = serviceName || 'this service';

  const node = (
    <div
      className="delete-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-service-confirm-title"
      aria-describedby="delete-service-confirm-desc"
      onClick={onCancel}
    >
      <div
        className="delete-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-confirm-icon-wrap" aria-hidden="true">
          <i className="bi bi-exclamation-lg delete-confirm-icon" />
        </div>
        <h2 id="delete-service-confirm-title" className="delete-confirm-title">
          Delete this service?
        </h2>
        <p id="delete-service-confirm-desc" className="delete-confirm-message">
          Are you sure you want to delete service <strong>&quot;{displayName}&quot;</strong>?<br />
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

export default DeleteServiceConfirmModal;
