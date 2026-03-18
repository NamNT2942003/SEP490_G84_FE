import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/inventory';

const ImportHistory = () => {
    // ================= STATE =================
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(1);
    const [historyList, setHistoryList] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([
        { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1, unit: '' }
    ]);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // ================= EFFECT =================
    useEffect(() => {
        setBranches([
            { id: 1, name: 'Cơ sở 1' },
            { id: 2, name: 'Cơ sở 2' },
            { id: 3, name: 'Cơ sở 3' }
        ]);
    }, []);

    const fetchImportHistory = async (branchId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/history`, {
                params: { branchId: branchId }
            });
            setHistoryList(response.data);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử:", error);
            setHistoryList([]);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            fetchImportHistory(selectedBranchId);
        }
    }, [selectedBranchId]);

    // ================= LOGIC API =================
    const submitImport = async () => {
        // 1. Lọc ra các item hợp lệ (Phải có giá > 0 và số lượng >= 1)
        const validItems = importList.filter(item =>
            (item.isNew && item.inventoryName.trim() !== '' && Number(item.price) > 0) ||
            (!item.isNew && item.inventoryId !== '' && Number(item.price) > 0)
        );

        if (validItems.length === 0) return alert("Vui lòng nhập đầy đủ Tên, Đơn giá (>0) và Số lượng!");

        // 2. CHUẨN HÓA PAYLOAD (Đảm bảo giá gửi đi là giá riêng lẻ của TỪNG món)
        const payloadItems = validItems.map(item => {
            const unitPrice = Number(item.price); // Đây là giá đơn lẻ của 1 sản phẩm
            return {
                inventoryId: item.isNew ? null : parseInt(item.inventoryId),
                inventoryName: item.isNew ? item.inventoryName.trim() : null,
                price: unitPrice,
                quantity: parseInt(item.quantity),
                unit: item.unit || "Cái"
            };
        });

        // Debug log để bạn kiểm tra trong F12 Console xem giá có bị gộp không
        console.log("Dữ liệu gửi đi:", { branchId: selectedBranchId, items: payloadItems });

        try {
            await axios.post(`${API_BASE_URL}/import`, {
                branchId: selectedBranchId,
                items: payloadItems
            });
            alert("Nhập kho thành công! Giá sản phẩm đã được cập nhật.");
            setIsModalOpen(false);
            fetchImportHistory(selectedBranchId);
        } catch (error) {
            console.error("Lỗi API:", error);
            alert("Lỗi khi nhập kho! Vui lòng kiểm tra lại dữ liệu.");
        }
    };

    // ================= XỬ LÝ UI =================
    const openImportModal = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/branch/${selectedBranchId}/items`);
            setAvailableItems(res.data);
            setImportList([{ isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1, unit: '' }]);
            setIsModalOpen(true);
        } catch (error) {
            alert("Lỗi tải danh sách vật phẩm!");
        }
    };

    const handleImportChange = (index, field, value) => {
        const newList = [...importList];
        newList[index][field] = value;

        // Nếu chọn hàng có sẵn, tự động điền đơn giá cũ và đơn vị cũ để tham khảo
        if (field === 'inventoryId' && !newList[index].isNew) {
            const selected = availableItems.find(i => i.inventoryId === parseInt(value));
            if (selected) {
                newList[index].price = selected.price || '';
                newList[index].unit = selected.unit || '';
            }
        }
        setImportList(newList);
    };

    const addImportRow = () => {
        setImportList([...importList, { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1, unit: '' }]);
    };

    const removeImportRow = (index) => {
        if (importList.length === 1) return;
        setImportList(importList.filter((_, i) => i !== index));
    };

    // Gom nhóm dữ liệu hiển thị (Bảng lịch sử bên ngoài)
    const groupedHistory = historyList.reduce((acc, current) => {
        const existingReceipt = acc.find(r => r.receiptId === current.receiptId);
        const itemTotal = (current.unitPrice || 0) * (current.quantity || 0);
        if (existingReceipt) {
            existingReceipt.details.push({ ...current, itemTotal });
            existingReceipt.totalReceiptAmount += itemTotal;
        } else {
            acc.push({
                receiptId: current.receiptId,
                importDate: current.importDate,
                totalReceiptAmount: itemTotal,
                details: [{ ...current, itemTotal }]
            });
        }
        return acc;
    }, []);
    groupedHistory.sort((a, b) => b.receiptId - a.receiptId);

    return (
        <div style={{ padding: '20px', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0 }}>Quản Lý Nhập Kho</h2>
                    <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(parseInt(e.target.value))}
                        style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <button onClick={openImportModal} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Lập Phiếu Nhập
                </button>
            </div>

            <table border="1" width="100%" style={{ borderCollapse: 'collapse', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                    <th style={{ padding: '12px' }}>Mã Phiếu</th>
                    <th>Ngày Nhập</th>
                    <th>Tổng Giá Trị</th>
                    <th>Hành Động</th>
                </tr>
                </thead>
                <tbody>
                {groupedHistory.map(receipt => (
                    <tr key={receipt.receiptId}>
                        <td style={{ padding: '10px' }}>#{receipt.receiptId}</td>
                        <td>{new Date(receipt.importDate).toLocaleString('vi-VN')}</td>
                        <td style={{ fontWeight: 'bold', color: '#d9534f' }}>{receipt.totalReceiptAmount.toLocaleString()} đ</td>
                        <td>
                            <button onClick={() => { setSelectedReceipt(receipt); setIsDetailModalOpen(true); }} style={{ cursor: 'pointer', background: '#17a2b8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px' }}>
                                Xem chi tiết
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* MODAL NHẬP KHO */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ width: '850px', backgroundColor: 'white', padding: '25px', borderRadius: '10px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Tạo Phiếu Nhập Mới</h3>

                        {importList.map((row, index) => (
                            <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <label style={{ cursor: 'pointer' }}><input type="radio" checked={!row.isNew} onChange={() => handleImportChange(index, 'isNew', false)} /> Hàng có sẵn</label>
                                        <label style={{ color: '#007bff', cursor: 'pointer' }}><input type="radio" checked={row.isNew} onChange={() => handleImportChange(index, 'isNew', true)} /> + Thêm hàng mới</label>
                                    </div>
                                    <button onClick={() => removeImportRow(index)} style={{ color: '#d9534f', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Xóa dòng</button>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {!row.isNew ? (
                                        <select
                                            value={row.inventoryId}
                                            onChange={(e) => handleImportChange(index, 'inventoryId', e.target.value)}
                                            style={{ flex: 3, padding: '10px', borderRadius: '4px' }}
                                        >
                                            <option value="">-- Chọn sản phẩm --</option>
                                            {availableItems.map(i => <option key={i.inventoryId} value={i.inventoryId}>{i.inventoryName} (Kho: {i.stock})</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type="text" placeholder="Tên sản phẩm..."
                                            value={row.inventoryName}
                                            onChange={(e) => handleImportChange(index, 'inventoryName', e.target.value)}
                                            style={{ flex: 3, padding: '10px', border: '1px solid #007bff', borderRadius: '4px' }}
                                        />
                                    )}
                                    <input
                                        type="text" placeholder="Đơn vị (Cái, Kg...)"
                                        value={row.unit}
                                        onChange={(e) => handleImportChange(index, 'unit', e.target.value)}
                                        style={{ width: '100px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                    <input
                                        type="number" placeholder="Đơn giá nhập"
                                        value={row.price}
                                        onChange={(e) => handleImportChange(index, 'price', e.target.value)}
                                        style={{ width: '130px', padding: '10px', border: '2px solid #28a745', borderRadius: '4px', fontWeight: 'bold' }}
                                    />
                                    <input
                                        type="number" placeholder="SL"
                                        value={row.quantity}
                                        onChange={(e) => handleImportChange(index, 'quantity', e.target.value)}
                                        style={{ width: '70px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>
                        ))}

                        <button onClick={addImportRow} style={{ width: '100%', padding: '12px', border: '2px dashed #bbb', background: '#fff', cursor: 'pointer', marginBottom: '20px', borderRadius: '5px' }}>+ Thêm sản phẩm khác</button>

                        <div style={{ textAlign: 'right', gap: '10px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 25px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>Hủy bỏ</button>
                            <button onClick={submitImport} style={{ padding: '10px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xác nhận Nhập kho</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT PHIẾU */}
            {isDetailModalOpen && selectedReceipt && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ width: '700px', backgroundColor: 'white', padding: '25px', borderRadius: '8px' }}>
                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Chi Tiết Phiếu Nhập #{selectedReceipt.receiptId}</h3>
                        <p><strong>Ngày nhập:</strong> {new Date(selectedReceipt.importDate).toLocaleString('vi-VN')}</p>
                        <table border="1" width="100%" style={{ borderCollapse: 'collapse', marginBottom: '20px', textAlign: 'center' }}>
                            <thead style={{ backgroundColor: '#f4f4f4' }}>
                            <tr>
                                <th style={{ padding: '8px' }}>Tên sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Đơn giá nhập</th>
                                <th>Thành tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedReceipt.details.map((d, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '8px' }}>{d.inventoryName}</td>
                                    <td>{d.quantity} {d.unit}</td>
                                    <td>{Number(d.unitPrice).toLocaleString()} đ</td>
                                    <td style={{ fontWeight: 'bold' }}>{(Number(d.unitPrice) * Number(d.quantity)).toLocaleString()} đ</td>
                                </tr>
                            ))}
                            <tr style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>
                                <td colSpan="3" style={{ textAlign: 'right', padding: '10px' }}>TỔNG CỘNG:</td>
                                <td style={{ color: '#d9534f' }}>{selectedReceipt.totalReceiptAmount.toLocaleString()} đ</td>
                            </tr>
                            </tbody>
                        </table>
                        <div style={{ textAlign: 'right' }}>
                            <button onClick={() => setIsDetailModalOpen(false)} style={{ padding: '8px 25px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportHistory;