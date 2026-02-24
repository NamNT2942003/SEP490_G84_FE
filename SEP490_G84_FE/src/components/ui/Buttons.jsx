import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Button Component theo brand color
 * * @param {string} variant - Loại nút: 'primary' (đặc), 'outline' (viền), 'text' (chữ)
 * @param {string} className - Các class bổ sung (ví dụ: w-100, mb-3)
 * @param {boolean} isLoading - Trạng thái đang tải (hiện spinner)
 * @param {node} icon - Icon hiển thị trước chữ (ví dụ: <i className="bi bi-save"></i>)
 * @param {function} onClick - Hàm xử lý sự kiện click
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
  
  // Map variant sang class Bootstrap tương ứng đã định nghĩa trong CSS
  const getButtonsClass = () => {
    switch (variant) {
      case 'outline': return 'btn-outline-brand';
      case 'text': return 'btn-text-brand';
      case 'danger': return 'btn-danger text-white'; // Giữ nguyên màu đỏ cho nút xóa
      default: return 'btn-brand'; // Mặc định là nút xanh rêu đặc
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