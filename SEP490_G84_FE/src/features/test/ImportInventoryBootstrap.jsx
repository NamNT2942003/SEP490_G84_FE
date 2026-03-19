import React, { useState } from 'react';
// Yêu cầu: Đã import 'bootstrap/dist/css/bootstrap.min.css' trong file index/App.

export default function ImportInventoryBootstrap() {
  // 1. Dữ liệu Fix cứng (Mock DB) - Tượng trưng cho hàng đã có trong kho
  const mockDbItems = [
    { id: 1, name: 'Dầu gội dây (Clear)', unit: 'Dây', currentStock: 50 },
    { id: 2, name: 'Khăn tắm trắng lớn', unit: 'Cái', currentStock: 120 }
  ];

  // State quản lý
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([
    // Mình fix cứng sẵn 2 dòng này vào lưới để bạn thấy rõ 2 luồng đang chạy song song
    { 
      id: 1, 
      name: 'Dầu gội dây (Clear)', 
      unit: 'Dây', 
      isNew: false, // Luồng 1: Hàng Cũ (Đã có trong DB)
      importQuantity: 100, 
      unitPrice: 5000 
    },
    { 
      id: null, // ID null báo hiệu Backend phải Insert mới
      name: 'Bàn chải tre bảo vệ môi trường', 
      unit: 'Cái', 
      isNew: true, // Luồng 2: Hàng Mới (Chưa có trong DB)
      importQuantity: 200, 
      unitPrice: 3500 
    }
  ]);

  // Logic tính toán tổng tiền
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.importQuantity * item.unitPrice), 0);

  // Xử lý thay đổi số lượng/đơn giá
  const handleUpdateItem = (index, field, value) => {
    const newCart = [...cartItems];
    newCart[index][field] = Number(value);
    setCartItems(newCart);
  };

  // Xóa khỏi lưới
  const handleRemoveItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary mb-0">Tạo Phiếu Nhập Kho</h2>
        <span className="text-muted">Ngày nhập: {new Date().toLocaleDateString('vi-VN')}</span>
      </div>

      <div className="row">
        {/* Cột trái: Tìm kiếm & Gợi ý (Mô phỏng thao tác) */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light fw-bold">
              1. Tìm hoặc Tạo vật tư
            </div>
            <div className="card-body">
              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Gõ tên vật tư..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="button">Tìm</button>
              </div>
              
              <div className="text-muted small mb-2">Gợi ý thao tác (Demo):</div>
              <ul className="list-group">
                <li className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" style={{cursor: 'pointer'}}>
                  <div>
                    <strong>Khăn tắm trắng lớn</strong> <br/>
                    <small className="text-muted">Tồn kho: 120 Cái</small>
                  </div>
                  <span className="badge bg-secondary rounded-pill">+ Chọn</span>
                </li>
                <li className="list-group-item list-group-item-action list-group-item-primary text-primary" style={{cursor: 'pointer'}}>
                  <strong>+ Tạo mới: "{searchTerm || 'Sản phẩm gõ vào'}"</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cột phải: Lưới dữ liệu (Data Grid) */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-light fw-bold">
              2. Chi tiết nhập kho
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-bordered mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Tên vật tư</th>
                      <th width="15%">Số lượng</th>
                      <th width="20%">Đơn giá (VNĐ)</th>
                      <th width="20%">Thành tiền</th>
                      <th width="5%"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="fw-medium">{item.name}</div>
                          {/* ĐÂY LÀ ĐIỂM ĂN TIỀN: Phân biệt 2 luồng bằng UI */}
                          {item.isNew ? (
                            <span className="badge bg-success">Hàng mới (Sẽ tạo)</span>
                          ) : (
                            <span className="badge bg-info text-dark">Hàng cũ (Cộng dồn)</span>
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
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveItem(index)}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer Form: Tổng kết */}
            <div className="card-footer bg-white d-flex justify-content-between align-items-center p-3">
              <div className="fs-5">
                Tổng cộng: <span className="fw-bold text-danger fs-4">{totalAmount.toLocaleString()} VNĐ</span>
              </div>
              <button className="btn btn-primary btn-lg px-4" onClick={() => alert('Đã gửi payload API: ' + JSON.stringify(cartItems))}>
                Chốt Nhập Kho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}