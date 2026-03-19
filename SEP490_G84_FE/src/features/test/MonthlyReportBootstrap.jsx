import React, { useState } from 'react';

export default function MonthlyReportBootstrap() {
  // Mock data: Hệ thống đã tự động tính sẵn Tồn đầu và Tổng nhập trong tháng
  const [reportItems, setReportItems] = useState([
    { 
      id: 1, 
      name: 'Dầu gội dây (Clear)', 
      unit: 'Dây', 
      openingStock: 50,  // Tồn từ tháng trước chuyển sang
      importQuantity: 100, // Tổng đã nhập trong tháng này
      closingStock: 40   // Số liệu nhân viên kho thực tế đếm được trên kệ
    },
    { 
      id: 2, 
      name: 'Khăn tắm trắng lớn', 
      unit: 'Cái', 
      openingStock: 120, 
      importQuantity: 0, 
      closingStock: 150  // Cố tình nhập sai: Tồn đầu 120, không nhập thêm mà đếm ra 150 -> Vô lý!
    }
  ]);

  // Cập nhật số liệu Tồn cuối do nhân viên gõ vào
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
          <h2 className="text-primary mb-1">Kiểm Kê & Chốt Kho Tháng</h2>
          <span className="text-muted">Chi nhánh: Khách sạn Trung tâm | Kỳ báo cáo: Tháng 3/2026</span>
        </div>
        <button className="btn btn-outline-secondary">
          <i className="bi bi-printer"></i> In danh sách đi đếm
        </button>
      </div>

      {/* Lưới dữ liệu (Bảng tính tự động) */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center fw-bold">
          <span>Bảng kê chi tiết vật tư</span>
          <span className="badge bg-warning text-dark">Lưu ý: Chỉ điền vào cột Tồn Cuối Kỳ</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered mb-0 align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th className="text-start">Tên vật tư</th>
                  <th>ĐVT</th>
                  <th className="bg-light">Tồn đầu kỳ (1)</th>
                  <th className="bg-light">Nhập trong tháng (2)</th>
                  <th className="bg-info bg-opacity-10 text-primary w-25">
                    TỒN CUỐI KỲ (3) <br/><small className="text-muted fw-normal">(Thực tế đếm trên kệ)</small>
                  </th>
                  <th className="bg-light">
                    SỐ LƯỢNG ĐÃ DÙNG <br/><small className="text-muted fw-normal">=(1) + (2) - (3)</small>
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
                            ⚠ Tồn cuối không thể lớn hơn (Đầu + Nhập)
                          </div>
                        )}
                      </td>

                      {/* Cột hiển thị kết quả tiêu hao */}
                      <td>
                        {isError ? (
                          <span className="badge bg-danger">Lỗi số liệu</span>
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
        <button className="btn btn-secondary px-4">Lưu nháp</button>
        <button 
          className="btn btn-success btn-lg px-5 shadow" 
          onClick={() => alert('Chốt sổ thành công! Số liệu tháng này sẽ bị khóa.')}
        >
          🔒 CHỐT SỔ THÁNG NÀY
        </button>
      </div>
    </div>
  );
}