import React from 'react';

export default function FilterBar({ selectedBranch, setSelectedBranch, searchTerm, setSearchTerm, onRefresh, userRole, branches }) {
  
  const isManager = userRole === 'MANAGER' || userRole === 'ADMIN';

  return (
    <div className="row g-2 mb-4 p-3 bg-white rounded shadow-sm border border-light">
      
      {isManager && branches && branches.length > 1 && (
        <div className="col-md-3">
          <select 
            className="form-select border-secondary-subtle fw-medium" 
            value={selectedBranch || ''} 
            onChange={(e) => setSelectedBranch(Number(e.target.value))}
          >
            {branches.map((b) => (
              <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
            ))}
          </select>
        </div>
      )}

      <div className={isManager && branches && branches.length > 1 ? "col-md-7" : "col-md-10"}>
        <div className="input-group">
          <span className="input-group-text bg-white border-secondary-subtle text-muted">
            <i className="bi bi-search"></i>
          </span>
          <input 
            type="text" 
            className="form-control border-secondary-subtle border-start-0 ps-0" 
            placeholder="Search by guest name, booking code, or room number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <span 
              className="input-group-text bg-white border-secondary-subtle"
              style={{ cursor: 'pointer' }}
              onClick={() => setSearchTerm('')}
            >
              <i className="bi bi-x-lg text-danger"></i>
            </span>
          )}
        </div>
      </div>

      <div className="col-md-2">
        <button className="btn btn-primary w-100 fw-bold shadow-sm" onClick={onRefresh}>
          <i className="bi bi-arrow-clockwise me-2"></i> Refresh
        </button>
      </div>

    </div>
  );
}