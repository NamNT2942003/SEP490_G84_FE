import React, { useState } from 'react';

export default function MonthlyReportBootstrap() {
  // Mock data: the system has already calculated opening stock and monthly imports
  const [reportItems, setReportItems] = useState([
    { 
      id: 1, 
      name: 'Dầu gội dây (Clear)', 
      unit: 'Dây', 
      openingStock: 50,  // Opening stock carried over from the previous month
      importQuantity: 100, // Total imports for this month
      closingStock: 40   // Actual count on the shelf
    },
    { 
      id: 2, 
      name: 'Khăn tắm trắng lớn', 
      unit: 'Cái', 
      openingStock: 120, 
      importQuantity: 0, 
      closingStock: 150  // Intentional invalid value: opening stock 120, no imports, but counted 150
    }
  ]);

  // Update closing stock entered by staff
  const handleUpdateClosingStock = (index, value) => {
    const newItems = [...reportItems];
    newItems[index].closingStock = Number(value);
    setReportItems(newItems);
  };

  return (
    <div className="container py-4">
      {/* Header & Filter */}
      <div className="d-flex justify-content-between align-items-end mb-4 border-bottom pb-3">
        <div>
          <h2 className="text-primary mb-1">Monthly Inventory Check & Close</h2>
          <span className="text-muted">Branch: Central Hotel | Reporting period: March 2026</span>
        </div>
        <button className="btn btn-outline-secondary">
          <i className="bi bi-printer"></i> Print Count List
        </button>
      </div>

      {/* Lưới dữ liệu (Bảng tính tự động) */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center fw-bold">
          <span>Item Detail Sheet</span>
          <span className="badge bg-warning text-dark">Note: Only fill the Closing Stock column</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered mb-0 align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th className="text-start">Item Name</th>
                  <th>Unit</th>
                  <th className="bg-light">Opening Stock (1)</th>
                  <th className="bg-light">Imports (2)</th>
                  <th className="bg-info bg-opacity-10 text-primary w-25">
                    CLOSING STOCK (3) <br/><small className="text-muted fw-normal">(Actual shelf count)</small>
                  </th>
                  <th className="bg-light">
                    USED QUANTITY <br/><small className="text-muted fw-normal">=(1) + (2) - (3)</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportItems.map((item, index) => {
                  // AUTO-CALCULATE: Sức mạnh của phần mềm nằm ở dòng này
                  const usedQuantity = item.openingStock + item.importQuantity - item.closingStock;
                  const isError = usedQuantity < 0; // Bắt lỗi nếu số đếm vô lý

                  return (
                    <tr key={item.id} className={isError ? "table-danger" : ""}>
                      <td className="text-start fw-medium">{item.name}</td>
                      <td>{item.unit}</td>
                      <td>{item.openingStock}</td>
                      <td>
                        {item.importQuantity > 0 ? (
                          <span className="text-success fw-bold">+{item.importQuantity}</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      
                      {/* CỘT DUY NHẤT CHO PHÉP USER NHẬP LIỆU */}
                      <td className="bg-info bg-opacity-10">
                        <input 
                          type="number" 
                          className={`form-control text-center fw-bold ${isError ? 'is-invalid border-danger text-danger' : 'border-primary'}`}
                          min="0"
                          value={item.closingStock}
                          onChange={(e) => handleUpdateClosingStock(index, e.target.value)}
                        />
                        {isError && (
                          <div className="invalid-feedback d-block text-start" style={{fontSize: '0.75rem'}}>
                            ⚠ Closing stock cannot exceed (Opening + Imports)
                          </div>
                        )}
                      </td>

                      {/* Cột hiển thị kết quả tiêu hao */}
                      <td>
                        {isError ? (
                          <span className="badge bg-danger">Data error</span>
                        ) : (
                          <span className="fs-5 fw-bold text-danger">{usedQuantity}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Form: Action */}
      <div className="d-flex justify-content-end gap-3">
        <button className="btn btn-secondary px-4">Save Draft</button>
        <button 
          className="btn btn-success btn-lg px-5 shadow" 
          onClick={() => alert('Month closed successfully! This month\'s data will be locked.')}
        >
          <i className="bi bi-lock-fill me-2"></i>Close This Month
        </button>
      </div>
    </div>
  );
}