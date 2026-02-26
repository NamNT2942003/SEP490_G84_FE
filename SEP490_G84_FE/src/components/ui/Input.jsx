// src/components/ui/Input.jsx

const Input = ({ label, icon, id, ...props }) => (
  <div className="mb-3">
    <label htmlFor={id} className="form-label small fw-bold">{label}</label>
    <div className="input-group">
      <span className="input-group-text bg-white">
        <i className={`fa-solid ${icon} text-muted`}></i>
      </span>
      <input id={id} className="form-control form-control-lg fs-6" {...props} />
    </div>
  </div>
);

export default Input;