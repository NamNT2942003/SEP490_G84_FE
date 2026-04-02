import React, { useState } from 'react';
// Yêu cầu: Đã import 'bootstrap/dist/css/bootstrap.min.css' trong file index/App.

export default function ImportInventoryBootstrap() {
  // 1. Fixed mock data representing items already in stock
  const mockDbItems = [
    { id: 1, name: 'Clear Shampoo Sachet', unit: 'Sachet', currentStock: 50 },
    { id: 2, name: 'Large White Towel', unit: 'Piece', currentStock: 120 }
  ];

  // State quản lý
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([
    // Seed two rows so both flows are visible in the grid
    { 
      id: 1, 
      name: 'Clear Shampoo Sachet', 
      unit: 'Sachet', 
      isNew: false, // Flow 1: existing item (already in DB)
      importQuantity: 100, 
      unitPrice: 5000 
    },
    { 
      id: null, // ID null báo hiệu Backend phải Insert mới
      name: 'Eco bamboo toothbrush', 
      unit: 'Piece', 
      isNew: true, // Flow 2: new item (not yet in DB)
      importQuantity: 200, 
      unitPrice: 3500 
    }
  ]);

  // Total amount calculation
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.importQuantity * item.unitPrice), 0);

  // Handle quantity / unit price changes
  const handleUpdateItem = (index, field, value) => {
    const newCart = [...cartItems];
    newCart[index][field] = Number(value);
    setCartItems(newCart);
  };

  // Remove from the grid
  const handleRemoveItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary mb-0">Create Stock Receipt</h2>
        <span className="text-muted">Import date: {new Date().toLocaleDateString('vi-VN')}</span>
      </div>

      <div className="row">
        {/* Left column: search and suggestions */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-bold">
              1. Find or Create Item
            </div>
            <div className="card-body">
              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Type item name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="button">Search</button>
              </div>
              
              <div className="text-muted small mb-2">Suggested actions (Demo):</div>
              <ul className="list-group">
                <li className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}}>
                  <div>
                    <strong>Large White Towel</strong> <br/>
                    <small className="text-muted">Stock: 120 pieces</small>
                  </div>
                  <span className="badge bg-secondary rounded-pill">+ Select</span>
                </li>
                <li className="list-group-item list-group-item-action list-group-item-primary text-primary" style={{cursor: 'pointer'}}>
                  <strong>+ Create new: "{searchTerm || 'Typed item'}"</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right column: data grid */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-light fw-bold">
              2. Stock Entry Details
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-bordered mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Item Name</th>
                      <th width="15%">Quantity</th>
                      <th width="20%">Unit Price (VND)</th>
                      <th width="20%">Amount</th>
                      <th width="5%"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="fw-medium">{item.name}</div>
                          {/* Distinguish the two flows in the UI */}
                          {item.isNew ? (
                            <span className="badge bg-success">New item (will create)</span>
                          ) : (
                            <span className="badge bg-info text-dark">Existing item (accumulate)</span>
                          )}
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            min="1" 
                            value={item.importQuantity}
                            onChange={(e) => handleUpdateItem(index, 'importQuantity', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(index, 'unitPrice', e.target.value)}
                          />
                        </td>
                        <td className="fw-bold text-danger">
                          {(item.importQuantity * item.unitPrice).toLocaleString()}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveItem(index)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer summary */}
            <div className="card-footer bg-white d-flex justify-content-between align-items-center p-3">
              <div className="fs-5">
                Total: <span className="fw-bold text-danger fs-4">{totalAmount.toLocaleString()} VNĐ</span>
              </div>
              <button className="btn btn-primary btn-lg px-4" onClick={() => alert('API payload sent: ' + JSON.stringify(cartItems))}>
                Submit Stock Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}