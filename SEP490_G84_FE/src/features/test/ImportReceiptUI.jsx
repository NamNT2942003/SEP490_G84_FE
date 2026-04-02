import React, { useState } from 'react';

export default function ImportReceiptUI() {
  // Standard catalog (master data) for selection only
  const masterData = [
    { id: 1, name: 'Snack Pack', unit: 'Pack' },
    { id: 2, name: 'G7 Coffee Pack', unit: 'Pack' },
    { id: 3, name: 'Toothbrush', unit: 'Piece' }
  ];

  // State for import receipt rows
  const [importLines, setImportLines] = useState([
    { rowId: 1, itemId: 1, name: 'Snack Pack', unit: 'Pack', qty: 49, price: 5000 },
    { rowId: 2, itemId: '', name: '', unit: '', qty: 1, price: 0 } // Empty row for continued entry
  ]);

  // Handle selecting an item from the dropdown
  const handleSelectItem = (index, itemId) => {
    const selectedItem = masterData.find(item => item.id === Number(itemId));
    const newLines = [...importLines];
    if (selectedItem) {
      newLines[index] = { ...newLines[index], itemId: selectedItem.id, name: selectedItem.name, unit: selectedItem.unit };
    } else {
      newLines[index] = { ...newLines[index], itemId: '', name: '', unit: '' };
    }
    setImportLines(newLines);
  };

  // Handle quantity / price updates
  const handleUpdateLine = (index, field, value) => {
    const newLines = [...importLines];
    newLines[index][field] = Number(value);
    setImportLines(newLines);
  };

  // Add a new row
  const handleAddRow = () => {
    setImportLines([...importLines, { rowId: Date.now(), itemId: '', name: '', unit: '', qty: 1, price: 0 }]);
  };

  // Remove a row
  const handleRemoveRow = (index) => {
    const newLines = [...importLines];
    newLines.splice(index, 1);
    setImportLines(newLines);
  };

  // Calculate total receipt amount
  const totalReceiptAmount = importLines.reduce((sum, line) => sum + (line.qty * line.price), 0);

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="card shadow border-0">
        {/* Import receipt header */}
        <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">CREATE STOCK RECEIPT</h5>
          <div className="text-end">
            <small className="d-block text-white-50">Import date: {new Date().toLocaleDateString('vi-VN')}</small>
            <small className="d-block text-white-50">Prepared by: Hotel Admin</small>
          </div>
        </div>
        
        <div className="card-body p-4">
          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label fw-bold text-muted">Supplier / Notes</label>
              <input type="text" className="form-control" placeholder="e.g. Co Ba grocery distributor, batch 1..." />
            </div>
          </div>

          {/* Import detail grid */}
          <div className="table-responsive border rounded mb-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{width: '30%'}}>Item Name (Select from catalog)</th>
                  <th style={{width: '10%'}}>Unit</th>
                  <th style={{width: '15%'}}>Quantity</th>
                  <th style={{width: '20%'}}>Import Unit Price (VND)</th>
                  <th className="text-end" style={{width: '20%'}}>Amount</th>
                  <th style={{width: '5%'}}></th>
                </tr>
              </thead>
              <tbody>
                {importLines.map((line, index) => (
                  <tr key={line.rowId}>
                    {/* Item name column: force dropdown to standardize data */}
                    <td>
                      <select 
                        className="form-select border-primary shadow-sm" 
                        value={line.itemId}
                        onChange={(e) => handleSelectItem(index, e.target.value)}
                      >
                        <option value="">-- Select an item --</option>
                        {masterData.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </td>
                    
                    <td className="text-muted bg-light text-center">{line.unit || '-'}</td>
                    
                    <td>
                      <input 
                        type="number" 
                        className="form-control text-center" 
                        min="1" 
                        value={line.qty}
                        onChange={(e) => handleUpdateLine(index, 'qty', e.target.value)}
                        disabled={!line.itemId} // Chưa chọn món thì khóa ô nhập
                      />
                    </td>
                    
                    <td>
                      <div className="input-group">
                        <input 
                          type="number" 
                          className="form-control text-end" 
                          value={line.price}
                          onChange={(e) => handleUpdateLine(index, 'price', e.target.value)}
                          disabled={!line.itemId}
                        />
                        <span className="input-group-text bg-light text-muted">đ</span>
                      </div>
                    </td>
                    
                    <td className="text-end fw-bold text-dark fs-5 bg-light">
                      {line.itemId ? (line.qty * line.price).toLocaleString() : '0'}
                    </td>
                    
                    <td className="text-center">
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveRow(index)}>
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-outline-primary mb-4" onClick={handleAddRow}>
            + Add new row
          </button>

          {/* Receipt summary */}
          <div className="row justify-content-end">
            <div className="col-md-5">
              <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <span className="fs-5 fw-bold text-primary">GRAND TOTAL:</span>
                  <span className="fs-3 fw-bold text-danger">{totalReceiptAmount.toLocaleString()} VNĐ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-footer bg-white py-3 text-end">
          <button className="btn btn-secondary me-2">Cancel</button>
          <button className="btn btn-primary px-4 fw-bold shadow-sm">
            <i className="bi bi-check-circle me-2"></i> COMPLETE STOCK ENTRY
          </button>
        </div>
      </div>
    </div>
  );
}