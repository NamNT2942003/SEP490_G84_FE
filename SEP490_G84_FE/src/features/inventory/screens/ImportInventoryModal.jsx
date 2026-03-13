import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi'; // Import đúng file API của bạn
import '../css/AddInventoryModal.css'; // Dùng chung CSS với form Thêm Mới luôn cho đồng bộ

const ImportInventoryModal = ({ isOpen, onClose, onRefresh, selectedItem }) => {
    // State lưu số lượng nhập thêm
    const [importQuantity, setImportQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Reset form mỗi khi mở lại modal hoặc đổi sản phẩm
    useEffect(() => {
        if (isOpen) {
            setImportQuantity('');
            setError('');
        }
    }, [isOpen, selectedItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const quantity = parseInt(importQuantity, 10);

        if (!quantity || quantity <= 0) {
            setError('Vui lòng nhập số lượng hợp lệ (lớn hơn 0)!');
            return;
        }

        setIsSubmitting(true);

        try {
            // GỌI API ĐỂ CỘNG DỒN SỐ LƯỢNG (Bạn sẽ cần sửa tên hàm API cho khớp với file inventoryApi.js của bạn)
            // Giả sử API của bạn nhận vào inventoryId và số lượng cần cộng thêm
            await inventoryApi.importInventory(selectedItem.inventoryId, quantity);

            onRefresh(); // Load lại bảng dữ liệu bên ngoài
            onClose();   // Đóng popup

        } catch (err) {
            console.error("Lỗi khi nhập hàng:", err);
            setError('Có lỗi xảy ra khi cập nhật số lượng. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !selectedItem) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '400px' }}> {/* Form này nhỏ hơn form Thêm Mới */}
                <div className="modal-header">
                    <h2>Nhập Thêm Hàng</h2>
                    <button type="button" onClick={onClose} className="close-btn">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', fontWeight: '500' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Tên vật phẩm</label>
                            <input
                                type="text"
                                value={selectedItem.inventoryName || ''}
                                className="form-control"
                                disabled // Không cho sửa tên ở đây
                                style={{ backgroundColor: '#f3f4f6' }}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tồn kho hiện tại</label>
                                <input
                                    type="text"
                                    value={selectedItem.stock || 0}
                                    className="form-control"
                                    disabled // Không cho sửa tồn kho hiện tại
                                    style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold', color: '#10b981' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <label style={{ color: '#dc2626', fontWeight: 'bold' }}>Số lượng nhập thêm *</label>
                            <input
                                type="number"
                                value={importQuantity}
                                onChange={(e) => {
                                    setImportQuantity(e.target.value);
                                    setError('');
                                }}
                                placeholder="Nhập số lượng..."
                                className="form-control"
                                autoFocus
                            />
                        </div>

                        <div className="inventory-modal-footer">
                            <button type="button" onClick={onClose} className="inventory-btn-cancel" disabled={isSubmitting}>
                                Hủy
                            </button>
                            <button type="submit" className="inventory-btn-submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : 'Xác nhận nhập'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportInventoryModal;