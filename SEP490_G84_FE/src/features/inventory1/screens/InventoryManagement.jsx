import React, { useState, useMemo } from 'react';

// Dữ liệu mẫu (Đã thêm trường 'unit' - Đơn vị tính)
const initialInventory = [
    { id: 1, name: 'Bàn chải', unit: 'Cái', price: 10000, branch: 'Khách sạn Grand Hà Nội', beginStock: 937, importedQty: 0, endingStock: 716 },
    { id: 2, name: 'Bim Bim', unit: 'Gói', price: 15000, branch: 'Khách sạn Grand Hà Nội', beginStock: 56, importedQty: 265, endingStock: 204 },
    { id: 3, name: 'Cafe gói G7', unit: 'Gói', price: 5000, branch: 'Khách sạn Grand Hà Nội', beginStock: 50, importedQty: 100, endingStock: 0 },
    { id: 4, name: 'Aquafina Water 500ml', unit: 'Chai', price: 15000, branch: 'Khách sạn An Nguyễn CS2', beginStock: 40, importedQty: 10, endingStock: 30 },
];

const branches = ['Khách sạn Grand Hà Nội', 'Khách sạn An Nguyễn CS2'];

const InventoryManagement = () => {
    // State quản lý điều kiện xem báo cáo
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // State dữ liệu
    const [inventory, setInventory] = useState(initialInventory);

    // State Modal Chi tiết
    const [detailItem, setDetailItem] = useState(null);

    // Hàm format tiền
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    };

    // Lọc dữ liệu hiển thị theo Branch
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => item.branch === selectedBranch);
    }, [inventory, selectedBranch]);

    // Xử lý Thay đổi Ending Stock
    const handleEndingStockChange = (id, newStock) => {
        setInventory(prev => prev.map(item =>
            item.id === id ? { ...item, endingStock: Number(newStock) } : item
        ));
    };

    // Xử lý xác nhận xem báo cáo
    const handleViewReport = () => {
        if (!selectedBranch) {
            alert("Vui lòng chọn cơ sở (Branch) trước khi xem báo cáo!");
            return;
        }
        setIsReportVisible(true);
    };

    // Xử lý đóng báo cáo (Quay lại màn hình chọn)
    const handleCloseReport = () => {
        setIsReportVisible(false);
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

            {/* MÀN HÌNH CHỌN THÔNG SỐ (Chỉ hiện khi chưa ấn Xem Báo Cáo) */}
            {!isReportVisible && (
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '600px', margin: '40px auto' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>Tra cứu Báo Cáo Kho</h2>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Chọn Cơ Sở (Branch): *</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="">-- Vui lòng chọn cơ sở --</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Tháng:</label>
                            <input
                                type="number" min="1" max="12"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Năm:</label>
                            <input
                                type="number" min="2000" max="2100"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleViewReport}
                        style={{ width: '100%', padding: '12px', backgroundColor: '#4a5d4e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                    >
                        TẠO BÁO CÁO NHẬP XUẤT TỒN
                    </button>
                </div>
            )}


            {/* MÀN HÌNH BÁO CÁO (Chỉ hiện sau khi đã chọn đủ thông tin) */}
            {isReportVisible && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                    {/* Header Vàng */}
                    <div style={{ backgroundColor: '#ffc107', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            THÁNG {month}/{year} - BÁO CÁO NHẬP XUẤT TỒN ({selectedBranch})
                        </h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleCloseReport}
                                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #333', color: '#333', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Quay lại
                            </button>
                            <button style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📄</span> Xuất file Excel
                            </button>
                        </div>
                    </div>

                    {/* Bảng dữ liệu chính */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '12px', textAlign: 'left', width: '25%' }}>Hạng mục khấu hao</th>
                                <th style={{ padding: '12px' }}>ĐVT</th>
                                <th style={{ padding: '12px' }}>Tồn kho đầu tháng<br/><span style={{fontWeight: 'normal', fontSize: '12px'}}>(1)</span></th>
                                <th style={{ padding: '12px' }}>Hàng mua trong tháng<br/><span style={{fontWeight: 'normal', fontSize: '12px'}}>(2)</span></th>
                                <th style={{ padding: '12px' }}>Tổng số lượng<br/><span style={{fontWeight: 'normal', fontSize: '12px'}}>(1) + (2)</span></th>
                                <th style={{ padding: '12px', color: '#2563eb' }}>TỒN KHO CUỐI THÁNG<br/><span style={{fontWeight: 'normal', fontSize: '12px', color: '#666'}}>(Gõ số đếm thực tế)</span></th>
                                <th style={{ padding: '12px', backgroundColor: '#bbf7d0', color: '#166534' }}>SỐ LƯỢNG SỬ DỤNG<br/><span style={{fontWeight: 'normal', fontSize: '12px', color: '#166534'}}>(Tự động tính)</span></th>
                                <th style={{ padding: '12px' }}>Chi tiết</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredInventory.map((item) => {
                                const totalQty = item.beginStock + item.importedQty;
                                const usedQty = totalQty - item.endingStock;

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 'bold' }}>{item.name}</td>
                                        <td style={{ padding: '16px 12px' }}>{item.unit}</td>
                                        <td style={{ padding: '16px 12px' }}>{item.beginStock}</td>
                                        <td style={{ padding: '16px 12px', color: item.importedQty > 0 ? '#10b981' : '#666' }}>
                                            {item.importedQty === 0 ? '-' : `+${item.importedQty}`}
                                        </td>
                                        <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{totalQty}</td>

                                        {/* Ô nhập Tồn cuối */}
                                        <td style={{ padding: '16px 12px' }}>
                                            <input
                                                type="number"
                                                value={item.endingStock}
                                                onChange={(e) => handleEndingStockChange(item.id, e.target.value)}
                                                style={{ width: '80px', padding: '8px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
                                            />
                                        </td>

                                        {/* Ô tính tự động (Sử dụng) - Nền xanh lá */}
                                        <td style={{ padding: '16px 12px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: 'bold', fontSize: '16px' }}>
                                            {usedQty}
                                        </td>

                                        <td style={{ padding: '16px 12px' }}>
                                            <button
                                                onClick={() => setDetailItem(item)}
                                                style={{ padding: '6px 12px', backgroundColor: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Không có dữ liệu trong kho cho cơ sở này.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Lưu Báo Cáo */}
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                        <button style={{ padding: '12px 24px', backgroundColor: '#4a5d4e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                            LƯU BÁO CÁO THÁNG
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT (Chỉ hiện khi bấm nút Xem) */}
            {detailItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '12px' }}>Thông tin chi tiết</h3>

                        <div style={{ marginBottom: '16px', lineHeight: '1.8' }}>
                            <div><strong>Tên vật phẩm:</strong> {detailItem.name}</div>
                            <div><strong>Đơn giá:</strong> <span style={{ color: '#d97706', fontWeight: 'bold' }}>{formatCurrency(detailItem.price)}</span></div>
                            <div><strong>Chi nhánh:</strong> {detailItem.branch}</div>
                            <div><strong>Đơn vị tính:</strong> {detailItem.unit}</div>
                            <hr style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }} />
                            <div><strong>Tồn đầu:</strong> {detailItem.beginStock}</div>
                            <div><strong>Nhập thêm:</strong> {detailItem.importedQty}</div>
                            <div><strong>Tồn cuối:</strong> {detailItem.endingStock}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                            <button style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Xóa vật phẩm
                            </button>
                            <button
                                onClick={() => setDetailItem(null)}
                                style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InventoryManagement;