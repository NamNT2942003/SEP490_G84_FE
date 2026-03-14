import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import '../css/AddInventoryModal.css';

const AddInventoryModal = ({ isOpen, onClose, onRefresh, branchId }) => {
    // State lưu dữ liệu form, thêm trường branchId
    const [formData, setFormData] = useState({
        inventoryName: '',
        price: 0,
        stock: 0,
        date: new Date().toISOString().split('T')[0],
        branchId: branchId || '' // Ưu tiên lấy prop branchId nếu có, không thì rỗng
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mảng chi nhánh (Bạn có thể sửa lại tên/ID cho khớp với Database của bạn)
    const branches = [
        { id: 1, name: 'Chi nhánh Hà Nội' },
        { id: 2, name: 'Chi nhánh TP.HCM' }
    ];

    useEffect(() => {
        if (isOpen) {
            setFormData({
                inventoryName: '',
                price: 0,
                stock: 0,
                date: new Date().toISOString().split('T')[0],
                branchId: branchId || ''
            });
            setError('');
        }
    }, [isOpen, branchId]);

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

        if (!formData.branchId) {
            setError('Vui lòng chọn chi nhánh!');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Kiểm tra xem vật phẩm đã tồn tại ở chi nhánh này chưa
            const searchRes = await inventoryApi.searchInventory({
                keyword: trimmedName,
                branchId: formData.branchId, // Lấy theo chi nhánh đang chọn trên form
                page: 0,
                size: 50
            });

            const existingItems = searchRes.data.content || [];
            const isExist = existingItems.some(
                item => item.inventoryName.toLowerCase() === trimmedName.toLowerCase() &&
                        item.branch?.branchId === Number(formData.branchId)

            );

            if (isExist) {
                setError(`Vật phẩm "${trimmedName}" đã tồn tại trong chi nhánh này!`);
                setIsSubmitting(false);
                return;
            }

            // 2. CHUẨN BỊ PAYLOAD ĐÚNG CHUẨN CHO SPRING BOOT
            const payload = {
                inventoryName: trimmedName,
                price: Number(formData.price) || 0,
                stock: Number(formData.stock) || 0,
                date: formData.date,
                // Đây là điểm mấu chốt để Spring Boot tự nhận diện được Branch Entity
                branch: {
                    branchId: Number(formData.branchId)
                }
            };

            // 3. GỌI API LƯU
            await inventoryApi.saveInventory(payload);

            onRefresh();
            onClose();

        } catch (err) {
            console.error("Lỗi khi thêm vật phẩm:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Có lỗi xảy ra khi lưu vào kho. Vui lòng kiểm tra lại kết nối!');
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

                        {/* THÊM DROPDOWN CHỌN CHI NHÁNH */}
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Chi nhánh *</label>
                            <select
                                name="branchId"
                                value={formData.branchId}
                                onChange={handleChange}
                                className="form-control"
                            >
                                <option value="">-- Chọn chi nhánh --</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row" style={{ marginTop: '15px' }}>
                            <div className="form-group">
                                <label>Giá bán/nhập (VND)</label>
                                <input
                                    type="number"
                                    name="price"
                                    min="0"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Số lượng tồn đầu</label>
                                <input
                                    type="number"
                                    name="stock"
                                    min="0"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '15px' }}>
                            {/* Đổi nhãn thành Ngày thêm vào kho */}
                            <label>Ngày thêm vào kho</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>

                        <div className="inventory-modal-footer">
                            <button type="button" onClick={onClose} className="inventory-btn-cancel" disabled={isSubmitting}>
                                Hủy
                            </button>
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