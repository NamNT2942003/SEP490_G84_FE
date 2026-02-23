import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Button Component theo brand color
 * @param {string} variant - 'primary' | 'outline' | 'text' | 'danger'
 * @param {string} className - Additional CSS classes
 * @param {boolean} isLoading - Show spinner when loading
 * @param {node} icon - Icon node
 * @param {function} onClick - Click handler
 */
const Buttons = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  className = '', 
  isLoading = false, 
  disabled = false, 
  icon = null,
  onClick,
  ...props 
}) => {
  
  // Map variant to Bootstrap-style classes
  const getButtonsClass = () => {
    switch (variant) {
      case 'outline': return 'btn-outline-brand';
      case 'text': return 'btn-text-brand';
      case 'danger': return 'btn-danger text-white';
      default: return 'btn-brand';
    }
  };

  return (
    <button
      type={type}
      className={`btn ${getButtonsClass()} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="me-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

Buttons.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'outline', 'text', 'danger']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export default Buttons;