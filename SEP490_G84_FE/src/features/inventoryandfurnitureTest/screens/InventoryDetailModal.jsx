import React from 'react';

const InventoryDetailModal = ({ item, onClose, onDelete }) => {
    if (!item) return null;

    // Hàm format tiền
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '12px' }}>Thông tin chi tiết</h3>

                <div style={{ marginBottom: '16px', lineHeight: '1.8' }}>
                    <div><strong>Tên vật phẩm:</strong> {item.name}</div>
                    <div><strong>Đơn giá:</strong> <span style={{ color: '#d97706', fontWeight: 'bold' }}>{formatCurrency(item.price)}</span></div>
                    <div><strong>Chi nhánh:</strong> {item.branch}</div>
                    <div><strong>Đơn vị tính:</strong> {item.unit}</div>
                    <hr style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }} />
                    <div><strong>Tồn đầu:</strong> {item.beginStock}</div>
                    <div><strong>Nhập thêm:</strong> {item.importedQty}</div>
                    <div><strong>Tồn cuối:</strong> {item.endingStock}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button
                        onClick={() => onDelete(item.id)}
                        style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Xóa vật phẩm
                    </button>
                    <button
                        onClick={onClose}
                        style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryDetailModal;