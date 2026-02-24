const Input = ({ label, icon, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
        <i className={`fa-solid ${icon}`}></i>
      </span>
      <input 
        className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-olive focus:border-olive" 
        {...props} 
      />
    </div>
  </div>
);

export default Input