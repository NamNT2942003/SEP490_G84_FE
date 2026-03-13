import React from 'react';
import "../css/AddInventoryModal.css";// Tái sử dụng lại CSS siêu chuẩn ban nãy!

const InventoryDetailModal = ({ isOpen, onClose, item }) => {
    // Nếu không mở hoặc không có data item thì không render gì cả
    if (!isOpen || !item) return null;

    // Xử lý cắt chuỗi ngày tháng (VD: "2026-03-13T17:00:00.000Z" -> "2026-03-13")
    const formattedDate = item.date
        ? new Date(item.date).toISOString().split('T')[0]
        : '';

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Chi Tiết Vật Phẩm</h2>
                    <button type="button" onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Tên vật phẩm</label>
                        <input
                            type="text"
                            value={item.inventoryName || ''}
                            readOnly
                            className="form-control"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Giá nhập (VND)</label>
                            <input
                                type="number"
                                value={item.price || ''}
                                readOnly
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Số lượng tồn</label>
                            <input
                                type="number"
                                value={item.stock || ''}
                                readOnly
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Ngày nhập kho</label>
                        <input
                            type="date"
                            value={formattedDate}
                            readOnly
                            className="form-control"
                        />
                    </div>

                    {/* Footer chỉ cần 1 nút Đóng */}
                    <div className="inventory-modal-footer">
                        <button type="button" onClick={onClose} className="inventory-btn-cancel">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryDetailModal;