import React, { useState } from 'react';

export default function ImportReceiptUI() {
  // Danh mục hàng hóa chuẩn (Master Data) để user chọn, không cho gõ linh tinh
  const masterData = [
    { id: 1, name: 'Bim Bim', unit: 'Gói' },
    { id: 2, name: 'Cafe gói G7', unit: 'Gói' },
    { id: 3, name: 'Bàn chải', unit: 'Cái' }
  ];

  // State quản lý các dòng nhập trong phiếu
  const [importLines, setImportLines] = useState([
    { rowId: 1, itemId: 1, name: 'Bim Bim', unit: 'Gói', qty: 49, price: 5000 },
    { rowId: 2, itemId: '', name: '', unit: '', qty: 1, price: 0 } // Dòng trống để nhập tiếp
  ]);

  // Handle khi chọn một mặt hàng từ Dropdown
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

  // Handle update số lượng / giá
  const handleUpdateLine = (index, field, value) => {
    const newLines = [...importLines];
    newLines[index][field] = Number(value);
    setImportLines(newLines);
  };

  // Thêm dòng mới
  const handleAddRow = () => {
    setImportLines([...importLines, { rowId: Date.now(), itemId: '', name: '', unit: '', qty: 1, price: 0 }]);
  };

  // Xóa dòng
  const handleRemoveRow = (index) => {
    const newLines = [...importLines];
    newLines.splice(index, 1);
    setImportLines(newLines);
  };

  // Tính tổng tiền phiếu nhập
  const totalReceiptAmount = importLines.reduce((sum, line) => sum + (line.qty * line.price), 0);

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="card shadow border-0">
        {/* Header Phiếu Nhập */}
        <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">TẠO PHIẾU NHẬP KHO</h5>
          <div className="text-end">
            <small className="d-block text-white-50">Ngày nhập: {new Date().toLocaleDateString('vi-VN')}</small>
            <small className="d-block text-white-50">Người lập: Admin Khách sạn</small>
          </div>
        </div>
        
        <div className="card-body p-4">
          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label fw-bold text-muted">Nhà cung cấp / Ghi chú</label>
              <input type="text" className="form-control" placeholder="VD: Đại lý tạp hóa Cô Ba giao đợt 1..." />
            </div>
          </div>

          {/* Lưới chi tiết nhập hàng */}
          <div className="table-responsive border rounded mb-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary">
                <tr>
                  <th style={{width: '30%'}}>Tên vật tư (Chọn từ danh mục)</th>
                  <th style={{width: '10%'}}>ĐVT</th>
                  <th style={{width: '15%'}}>Số lượng</th>
                  <th style={{width: '20%'}}>Đơn giá nhập (VNĐ)</th>
                  <th className="text-end" style={{width: '20%'}}>Thành tiền</th>
                  <th style={{width: '5%'}}></th>
                </tr>
              </thead>
              <tbody>
                {importLines.map((line, index) => (
                  <tr key={line.rowId}>
                    {/* Cột Tên Vật Tư: Ép dùng Dropdown để chuẩn hóa dữ liệu */}
                    <td>
                      <select 
                        className="form-select border-primary shadow-sm" 
                        value={line.itemId}
                        onChange={(e) => handleSelectItem(index, e.target.value)}
                      >
                        <option value="">-- Chọn mặt hàng --</option>
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
                        <i className="bi bi-trash"></i> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-outline-primary mb-4" onClick={handleAddRow}>
            + Thêm dòng mới
          </button>

          {/* Tổng kết phiếu */}
          <div className="row justify-content-end">
            <div className="col-md-5">
              <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <span className="fs-5 fw-bold text-primary">TỔNG CỘNG:</span>
                  <span className="fs-3 fw-bold text-danger">{totalReceiptAmount.toLocaleString()} VNĐ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-footer bg-white py-3 text-end">
          <button className="btn btn-secondary me-2">Hủy bỏ</button>
          <button className="btn btn-primary px-4 fw-bold shadow-sm">
            <i className="bi bi-check-circle me-2"></i> HOÀN TẤT NHẬP KHO
          </button>
        </div>
      </div>
    </div>
  );
}