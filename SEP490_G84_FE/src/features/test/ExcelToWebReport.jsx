import React, { useState } from 'react';

export default function ExcelToWebReport() {
  // Mock data simulating that the backend has already calculated the inventory values
  const [reportItems, setReportItems] = useState([
    { 
      id: 1, name: 'Bàn chải', unit: 'Cái', 
      openingStock: 937, // Column (1) from the previous month
      importQuantity: 0, // Column (2) summed from import slips
      closingStock: 716  // Actual count from staff
    },
    { 
      id: 2, name: 'Bim Bim', unit: 'Gói', 
      openingStock: 56, 
      importQuantity: 265, // System auto-sums (49 + 96 + 120)
      closingStock: 204
    },
    { 
      id: 3, name: 'G7 Coffee Pack', unit: 'Pack', // Master data separated cleanly
      openingStock: 50, 
      importQuantity: 100, 
      closingStock: 0 // Chưa nhập số liệu
    }
  ]);

  // Handle when inventory staff enter the actual shelf count
  const handleUpdateClosingStock = (index, value) => {
    const newItems = [...reportItems];
    newItems[index].closingStock = value === '' ? '' : Number(value);
    setReportItems(newItems);
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="card shadow mb-4 border-0">
        <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center py-3">
          <h4 className="mb-0 fw-bold">NOVEMBER 2024 - IMPORT/EXPORT/STOCK REPORT</h4>
          <button className="btn btn-dark btn-sm">
            <i className="bi bi-file-earmark-excel"></i> Export Excel
          </button>
        </div>
        
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-hover mb-0 align-middle text-center">
              <thead className="table-secondary align-middle">
                <tr>
                  <th className="text-start" style={{width: '20%'}}>Depreciation Item</th>
                  <th style={{width: '8%'}}>Unit</th>
                  <th style={{width: '12%'}}>Opening Stock<br/>(1)</th>
                  <th style={{width: '12%'}}>Purchases in Month<br/>(2)</th>
                  <th className="bg-light" style={{width: '15%'}}>Total Quantity<br/>(1) + (2)</th>
                  <th className="bg-info bg-opacity-10 text-primary border-primary" style={{width: '18%'}}>
                    CLOSING STOCK<br/><small className="text-muted fw-normal">(Enter actual count)</small>
                  </th>
                  <th className="bg-success text-white bg-opacity-75" style={{width: '15%'}}>
                    USED QUANTITY<br/><small className="fw-normal">Auto-calculated</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportItems.map((item, index) => {
                  const totalAmount = item.openingStock + item.importQuantity;
                  // Nếu closingStock rỗng thì chưa tính, ngược lại tính ra số lượng đã dùng
                  const isCalculated = item.closingStock !== '';
                  const usedQuantity = isCalculated ? totalAmount - item.closingStock : 0;
                  const isError = isCalculated && usedQuantity < 0; // Đếm ra nhiều hơn số có trong kho

                  return (
                    <tr key={item.id} className={isError ? "table-danger" : ""}>
                      <td className="text-start fw-medium">{item.name}</td>
                      <td>{item.unit}</td>
                      
                      {/* Read-only columns */}
                      <td className="text-muted">{item.openingStock}</td>
                      <td className="text-muted">
                        {item.importQuantity > 0 ? `+${item.importQuantity}` : '-'}
                      </td>
                      <td className="fw-bold text-dark bg-light">
                        {totalAmount}
                      </td>

                      {/* Cột Tồn Cuối (Input duy nhất) */}
                      <td className="bg-info bg-opacity-10 border-primary border-opacity-50">
                        <input 
                          type="number" 
                          className={`form-control text-center fw-bold shadow-sm ${isError ? 'is-invalid' : ''}`}
                          placeholder="Enter..."
                          value={item.closingStock}
                          onChange={(e) => handleUpdateClosingStock(index, e.target.value)}
                        />
                        {isError && (
                          <div className="invalid-feedback d-block text-start" style={{fontSize: '11px'}}>
                            ⚠ Closing stock cannot exceed available quantity
                          </div>
                        )}
                      </td>

                      {/* Cột Số lượng sử dụng (Auto-calculated) */}
                      <td className="fw-bold fs-5 text-success bg-success bg-opacity-10">
                        {isCalculated ? (
                           isError ? <span className="text-danger fs-6">Data error</span> : usedQuantity
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card-footer bg-white py-3 d-flex justify-content-end">
          <button className="btn btn-primary btn-lg px-5 shadow-sm">
            SAVE MONTHLY REPORT
          </button>
        </div>
      </div>
    </div>
  );
}