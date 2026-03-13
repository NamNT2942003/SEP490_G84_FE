import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import '../css/AddInventoryModal.css';

const AddInventoryModal = ({ isOpen, onClose, onRefresh, branchId }) => {
    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        inventoryName: '',
        price: 0,
        stock: 0,
        date: new Date().toISOString().split('T')[0]
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                inventoryName: '',
                price: 0,
                stock: 0,
                date: new Date().toISOString().split('T')[0]
            });
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedName = formData.inventoryName.trim();
        if (!trimmedName) {
            setError('Vui lòng nhập tên vật phẩm!');
            return;
        }

        setIsSubmitting(true);

        try {
            const searchRes = await inventoryApi.searchInventory({
                keyword: trimmedName,
                branchId: branchId || '',
                page: 0,
                size: 50
            });

            const existingItems = searchRes.data.content || [];

            const isExist = existingItems.some(
                item => item.inventoryName.toLowerCase() === trimmedName.toLowerCase()
            );

            if (isExist) {
                setError(`Vật phẩm "${trimmedName}" đã tồn tại trong kho!`);
                setIsSubmitting(false);
                return;
            }

            await inventoryApi.saveInventory({
                ...formData,
                branchId: branchId
            });

            onRefresh();
            onClose();

        } catch (err) {
            console.error("Lỗi khi thêm vật phẩm:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Có lỗi xảy ra khi lưu vào kho. Vui lòng thử lại!');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Thêm Vật Phẩm Mới</h2>
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
                                name="inventoryName"
                                value={formData.inventoryName}
                                onChange={handleChange}
                                placeholder="VD: Aquafina 500ml"
                                className="form-control"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Giá nhập (VND)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Số lượng</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Ngày nhập kho</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>

                        {/* Di chuyển cụm nút vào bên trong modal-body để nó ăn trọn lề (padding) */}
                        <div className="inventory-modal-footer">
                            <button type="button" onClick={onClose} className="inventory-btn-cancel" disabled={isSubmitting}>
                                Hủy
                            </button>
                            {/* Đổi class thành inventory-btn-submit cho khớp với CSS của bạn */}
                            <button type="submit" className="inventory-btn-submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : 'Lưu vào kho'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInventoryModal;