import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import '../css/AddInventoryModal.css';

// Đổi onRefresh thành onSuccess để khớp với file InventoryReport.jsx
const ImportInventoryModal = ({ isOpen, onClose, onSuccess, selectedItem }) => {
    const [importQuantity, setImportQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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
            // Gọi API cập nhật
            await inventoryApi.importInventory(selectedItem.inventoryId, quantity);

            // GỌI ĐÚNG TÊN PROP Ở ĐÂY ĐỂ FIX LỖI TYPEERROR
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err) {
            console.error("Lỗi khi nhập hàng:", err);
            setError('Có lỗi xảy ra khi cập nhật. Vui lòng kiểm tra lại kết nối!');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !selectedItem) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2>Nhập Thêm Hàng</h2>
                    <button type="button" onClick={onClose} className="close-btn">&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Tên vật phẩm</label>
                            <input
                                type="text"
                                value={selectedItem.inventoryName || ''}
                                className="form-control"
                                disabled
                                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                            />
                        </div>

                        {/* Thêm ô hiển thị Tồn kho hiện tại để làm base */}
                        <div className="form-group" style={{ marginTop: '12px' }}>
                            <label>Tồn kho hiện tại</label>
                            <input
                                type="text"
                                value={selectedItem.beginningStock || 0}
                                className="form-control"
                                disabled
                                style={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' }}
                            />
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

                        <div className="inventory-modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={onClose} className="inventory-btn-cancel" style={{ flex: 1 }} disabled={isSubmitting}>
                                Hủy
                            </button>
                            <button type="submit" className="inventory-btn-submit" style={{ flex: 1 }} disabled={isSubmitting}>
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