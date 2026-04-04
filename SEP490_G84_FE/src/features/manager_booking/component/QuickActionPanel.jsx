import React from 'react';

export default function QuickActionPanel() {
  return (
    <div className="card shadow-sm border-0 text-white h-100" style={{ backgroundColor: '#1e293b', borderRadius: '12px' }}>
      <div className="card-body">
        <h6 className="mb-1">Quick Actions</h6>
        <p className="text-secondary small mb-3">Find booking and perform Check In / Out</p>
        
        <div className="mb-3">
          <label className="form-label small text-secondary">BOOKING CODE / ID PASSPORT</label>
          <input type="text" className="form-control border-0 text-white" style={{ backgroundColor: '#334155' }} placeholder="Enter code..." defaultValue="BK-2026-047" />
        </div>

        <div className="row mb-3 g-2">
          <div className="col-6">
            <label className="form-label small text-secondary">DATE</label>
            <input type="date" className="form-control border-0 text-white" style={{ backgroundColor: '#334155' }} />
          </div>
          <div className="col-6">
            <label className="form-label small text-secondary">TYPE</label>
            <select className="form-select border-0 text-white" style={{ backgroundColor: '#334155' }}>
              <option>Check In</option>
              <option>Check Out</option>
            </select>
          </div>
        </div>

        {/* Selected Booking Details */}
        <div className="card border-0 mb-3" style={{ backgroundColor: '#334155' }}>
          <div className="card-body p-3 text-white">
            <h6 className="mb-0">Tran Minh Tuan</h6>
            <p className="small text-secondary mb-2">BK-2026-047</p>
            <hr className="border-secondary" />
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-secondary">Room:</span> <strong>501 - Deluxe King</strong>
            </div>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-secondary">Check In:</span> <strong>07/03/2026</strong>
            </div>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-secondary">Total:</span> <strong>4,500,000 VND</strong>
            </div>
            <div className="d-flex justify-content-between small text-danger">
              <span>Status:</span> <strong>Unpaid</strong>
            </div>
          </div>
        </div>

        <button className="btn btn-success w-100 mb-2 py-2 fw-bold">Confirm Check In</button>
        <button className="btn btn-outline-light w-100 py-2">Print Key Card</button>
      </div>
    </div>
  );
}