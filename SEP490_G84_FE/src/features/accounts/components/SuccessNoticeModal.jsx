import React from 'react';
import ReactDOM from 'react-dom';
import './SuccessNoticeModal.css';

/** Success modal: dimmed overlay, green check icon, purple Close button. */
const SuccessNoticeModal = ({ open, title, message, onClose }) => {
  if (!open) return null;

  const node = (
    <div
      className="success-notice-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-notice-title"
      aria-describedby="success-notice-desc"
      onClick={onClose}
    >
      <div
        className="success-notice-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="success-notice-icon-wrap" aria-hidden="true">
          <i className="bi bi-check-lg success-notice-check" />
        </div>
        <h2 id="success-notice-title" className="success-notice-title">
          {title}
        </h2>
        <p id="success-notice-desc" className="success-notice-message">
          {message}
        </p>
        <button
          type="button"
          className="success-notice-btn-close"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};

export default SuccessNoticeModal;