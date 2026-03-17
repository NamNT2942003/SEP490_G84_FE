import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ImportHistory = () => {
    // --- STATE CHO BẢNG LỊCH SỬ ---
    const [historyList, setHistoryList] = useState([]);

    // --- STATE CHO MODAL NHẬP KHO ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [branchIdForImport, setBranchIdForImport] = useState(1);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([{ inventoryId: '', quantity: 1 }]);

    // 1. Lấy danh sách lịch sử (Di chuyển lên trước useEffect)
    const fetchHistory = async () => {
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/history`);
            setHistoryList(res.data);
        } catch (error) {
            console.error("Lỗi lấy lịch sử:", error);
        }
    };

    useEffect(() => {
        // Fix cảnh báo Promise returned is ignored
        const loadHistory = async () => {
            await fetchHistory();
        }
        loadHistory().catch(console.error);
    }, []);

    // 2. Mở Modal & Tải danh sách vật phẩm theo chi nhánh
    const openImportModal = async () => {
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/branch/${branchIdForImport}/items`);
            setAvailableItems(res.data);
            setImportList([{ inventoryId: '', quantity: 1 }]); // Reset form
            setIsModalOpen(true);
        } catch (error) {
            console.error("Lỗi tải danh sách vật phẩm:", error); // Fix unused 'error'
            alert("Lỗi tải danh sách vật phẩm!");
        }
    };

    // 3. Xử lý logic Modal
    const handleImportChange = (index, field, value) => {
        const newList = [...importList];
        newList[index][field] = value;
        setImportList(newList);
    };

    const addImportRow = () => setImportList([...importList, { inventoryId: '', quantity: 1 }]);

    const submitImport = async () => {
        const validItems = importList.filter(item => item.inventoryId !== '');
        if (validItems.length === 0) return alert("Vui lòng chọn ít nhất 1 mặt hàng!");

        try {
            await axios.post(`http://localhost:8080/api/inventory/import`, {
                branchId: branchIdForImport,
                items: validItems
            });
            alert("Nhập kho thành công!");
            setIsModalOpen(false);
            await fetchHistory(); // Thêm await để fix cảnh báo "Missing await"
        } catch (error) {
            console.error("Lỗi nhập kho:", error); // Fix unused 'error'
            alert("Lỗi nhập kho!");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Lịch Sử Nhập Kho</h2>
                <button onClick={openImportModal} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    + Nhập Kho
                </button>
            </div>

            {/* Bảng Lịch Sử */}
            <table border="1" width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f4f4f4' }}>
                <tr>
                    <th>Ngày Nhập</th>
                    <th>Mã Phiếu</th>
                    <th>Tên Vật Phẩm</th>
                    <th>Số Lượng</th>
                    <th>Đơn Giá</th>
                    <th>Thành Tiền</th>
                </tr>
                </thead>
                <tbody>
                {historyList.map((item, idx) => (
                    <tr key={idx}>
                        {/* Thêm optional chaining cho importDate để phòng hờ */}
                        <td>{item?.importDate ? new Date(item.importDate).toLocaleString('vi-VN') : 'N/A'}</td>
                        <td>#{item.receiptId}</td>
                        <td>{item.inventoryName}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unitPrice?.toLocaleString()} đ</td>
                        <td style={{ fontWeight: 'bold' }}>{item.totalAmount?.toLocaleString()} đ</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* MODAL NHẬP KHO */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: '10%', left: '30%', width: '40%',
                    backgroundColor: 'white', padding: '20px', border: '2px solid #333', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}>
                    <h3>Nhập Hàng Mới</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Chi nhánh: </label>
                        <input type="number" value={branchIdForImport} onChange={(e) => setBranchIdForImport(e.target.value)} style={{ width: '50px' }} />
                        <button onClick={openImportModal} style={{ marginLeft: '10px' }}>Tải lại mặt hàng</button>
                    </div>

                    {importList.map((row, index) => (
                        <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                            <select
                                value={row.inventoryId}
                                onChange={(e) => handleImportChange(index, 'inventoryId', parseInt(e.target.value))}
                                style={{ flex: 1, padding: '5px' }}
                            >
                                <option value="">-- Chọn vật phẩm --</option>
                                {availableItems.map(i => (
                                    <option key={i.inventoryId} value={i.inventoryId}>{i.inventoryName} (Tồn: {i.stock})</option>
                                ))}
                            </select>
                            <input
                                type="number" min="1" value={row.quantity}
                                onChange={(e) => handleImportChange(index, 'quantity', parseInt(e.target.value))}
                                style={{ width: '80px', padding: '5px' }}
                            />
                        </div>
                    ))}

                    <button onClick={addImportRow} style={{ marginBottom: '20px' }}>+ Thêm dòng khác</button>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ padding: '8px 15px' }}>Hủy</button>
                        <button onClick={submitImport} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none' }}>Xác nhận Nhập</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportHistory;