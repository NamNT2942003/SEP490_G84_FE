import React, { useState } from 'react';
import axios from 'axios';
import '../css/InventoryReport.css';

const InventoryReport = () => {
    // --- STATE CHO BÁO CÁO ---
    const [branches] = useState([
        { id: 1, name: "Cơ sở 1" },
        { id: 2, name: "Cơ sở 2" },
        { id: 3, name: "Cơ sở 3" }
    ]);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState([]);
    const [isReportLoaded, setIsReportLoaded] = useState(false);

    // --- STATE CHO MODAL LỊCH SỬ & CHI TIẾT PHIẾU NHẬP ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyList, setHistoryList] = useState([]);

    // Thêm state cho modal xem chi tiết Phiếu Nhập (Giống trang ImportHistory)
    const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // --- STATE CHO MODAL NHẬP KHO MỚI ---
    const [showImportModal, setShowImportModal] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([
        { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1 }
    ]);

    // --- STATE CHI TIẾT SẢN PHẨM (Dùng ở bảng báo cáo) ---
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [productDetail, setProductDetail] = useState(null);

    // ================= LOGIC BÁO CÁO =================
    const handleFetchReport = async () => {
        if (!selectedBranch) {
            alert("Vui lòng chọn Cơ sở trước khi xem báo cáo!");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/report`, {
                params: {
                    month: parseInt(month),
                    year: parseInt(year),
                    branchId: parseInt(selectedBranch)
                }
            });
            setReportData(res.data);
            setIsReportLoaded(true);
        } catch (error) {
            console.error("Lỗi lấy báo cáo:", error);
            alert("Lỗi khi tải dữ liệu báo cáo!");
        }
    };

    const handleClosingStockChange = (index, value) => {
        const newValue = parseInt(value) || 0;
        const newData = [...reportData];
        newData[index].closingStock = newValue;
        const used = (newData[index].openingStock + newData[index].importQuantity) - newValue;
        newData[index].usedQuantity = used > 0 ? used : 0;
        setReportData(newData);
    };

    const saveReport = async () => {
        try {
            await axios.post(`http://localhost:8081/api/inventory/report/save`, reportData);
            alert(`Đã lưu báo cáo tháng ${month}/${year} thành công!`);
        } catch (error) {
            console.error("Lỗi lưu báo cáo:", error);
            alert("Lỗi khi lưu báo cáo!");
        }
    };

    // ================= LOGIC LỊCH SỬ NHẬP KHO =================
    const openHistoryModal = async () => {
        if (!selectedBranch) {
            alert("Vui lòng chọn Cơ sở để xem lịch sử nhập kho tương ứng!");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/history`, {
                params: { branchId: parseInt(selectedBranch) }
            });
            setHistoryList(res.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error("Lỗi tải lịch sử nhập kho:", error);
            alert("Lỗi tải lịch sử nhập kho!");
        }
    };

    // GOM NHÓM DỮ LIỆU LỊCH SỬ (Giống trang ImportHistory)
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

    const openReceiptDetail = (receipt) => {
        setSelectedReceipt(receipt);
        setShowReceiptDetailModal(true);
    };

    // ================= LOGIC TẠO PHIẾU NHẬP =================
    const openImportModal = async () => {
        if (!selectedBranch) {
            alert("Vui lòng chọn Cơ sở trước!");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/branch/${selectedBranch}/items`);
            setAvailableItems(res.data);
            setImportList([{ isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1 }]);
            setShowImportModal(true);
        } catch (error) {
            console.error("Lỗi tải danh mục vật phẩm:", error);
            alert("Không thể tải danh sách vật phẩm của cơ sở này.");
        }
    };

    const handleImportChange = (index, field, value) => {
        const newList = [...importList];
        newList[index][field] = value;
        setImportList(newList);
    };

    const removeImportRow = (index) => {
        if (importList.length === 1) return alert("Phải có ít nhất 1 mặt hàng!");
        const newList = importList.filter((_, i) => i !== index);
        setImportList(newList);
    };

    const submitImport = async () => {
        const validItems = importList.filter(item =>
            (item.isNew && item.inventoryName.trim() !== '' && item.price !== '') ||
            (!item.isNew && item.inventoryId !== '')
        );

        if (validItems.length === 0) return alert("Vui lòng nhập đầy đủ thông tin cho ít nhất 1 mặt hàng!");

        for (let item of validItems) {
            if (item.isNew) {
                const isDuplicate = availableItems.some(
                    available => available.inventoryName.toLowerCase() === item.inventoryName.trim().toLowerCase()
                );
                if (isDuplicate) {
                    alert(`Sản phẩm "${item.inventoryName}" đã tồn tại trong kho. Vui lòng chọn "Chọn hàng có sẵn"!`);
                    return;
                }
            }
        }

        const payloadItems = validItems.map(item => {
            if (item.isNew) {
                return {
                    isNew: true,
                    inventoryName: item.inventoryName.trim(),
                    unitPrice: item.price,
                    quantity: parseInt(item.quantity)
                };
            } else {
                return {
                    isNew: false,
                    inventoryId: parseInt(item.inventoryId),
                    quantity: parseInt(item.quantity)
                };
            }
        });

        try {
            await axios.post(`http://localhost:8081/api/inventory/import`, {
                branchId: parseInt(selectedBranch),
                items: payloadItems
            });
            alert("Nhập kho thành công!");
            setShowImportModal(false);
            openHistoryModal();
            if (isReportLoaded) handleFetchReport();
        } catch (error) {
            console.error("Lỗi nhập kho:", error);
            alert("Lỗi khi nhập kho!");
        }
    };

    // ================= LOGIC XEM CHI TIẾT SẢN PHẨM =================
    const handleViewDetail = async (id) => {
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/${id}`);
            setProductDetail(res.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error("Lỗi lấy chi tiết sản phẩm:", error);
            alert("Không thể tải thông tin chi tiết sản phẩm!");
        }
    };

    return (
        <div className="inventory-container">
            <div className="report-card">
                <div className="report-header">
                    <h2>Báo cáo kiểm kê kho</h2>
                    <button className="btn btn-primary" onClick={openHistoryModal}>Lịch sử nhập kho</button>
                </div>

                <div className="filter-group">
                    <div className="filter-item">
                        <select value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setIsReportLoaded(false); }}>
                            <option value="">-- Chọn Cơ sở --</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <input type="number" value={month} onChange={e => setMonth(e.target.value)} style={{ width: '80px' }} />
                        <span> / </span>
                        <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: '100px' }} />
                    </div>
                    <button className="btn btn-success" onClick={handleFetchReport}>Xem Báo Cáo</button>
                </div>

                {isReportLoaded && (
                    <>
                        <table className="custom-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên vật phẩm</th>
                                <th>Tồn đầu</th>
                                <th>Nhập kho</th>
                                <th>Tồn cuối</th>
                                <th>Sử dụng</th>
                                <th>Hành động</th>
                            </tr>
                            </thead>
                            <tbody>
                            {reportData.length > 0 ? reportData.map((row, index) => (
                                <tr key={row.inventoryId}>
                                    <td>{row.inventoryId}</td>
                                    <td>{row.inventoryName}</td>
                                    <td>{row.openingStock}</td>
                                    <td>{row.importQuantity}</td>
                                    <td>
                                        <input type="number" min="0" className="stock-input" value={row.closingStock}
                                               onChange={(e) => handleClosingStockChange(index, e.target.value)} />
                                    </td>
                                    <td style={{ color: 'red', fontWeight: 'bold' }}>{row.usedQuantity}</td>
                                    <td>
                                        <button className="btn btn-info btn-sm" onClick={() => handleViewDetail(row.inventoryId)}>
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7">Không có dữ liệu.</td></tr>
                            )}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn btn-primary" onClick={saveReport}>Lưu Báo Cáo</button>
                        </div>
                    </>
                )}
            </div>

            {/* MODAL LỊCH SỬ (GOM NHÓM THEO PHIẾU GIỐNG IMPORT HISTORY) */}
            {showHistoryModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>Lịch sử nhập kho - {branches.find(b => b.id === parseInt(selectedBranch))?.name}</h3>
                            <div>
                                <button className="btn btn-success" onClick={openImportModal} style={{ marginRight: '10px' }}>+ Nhập mới</button>
                                <button className="close-btn" onClick={() => setShowHistoryModal(false)}>✖</button>
                            </div>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table border="1" width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead style={{ backgroundColor: '#f4f4f4', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Mã Phiếu</th>
                                    <th style={{ padding: '12px' }}>Ngày Nhập</th>
                                    <th style={{ padding: '12px' }}>Tổng Tiền Đơn Hàng</th>
                                    <th style={{ padding: '12px' }}>Hành Động</th>
                                </tr>
                                </thead>
                                <tbody>
                                {groupedHistory.length > 0 ? (
                                    groupedHistory.map((receipt) => (
                                        <tr key={receipt.receiptId}>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>#{receipt.receiptId}</td>
                                            <td>{receipt?.importDate ? new Date(receipt.importDate).toLocaleString('vi-VN') : 'N/A'}</td>
                                            <td style={{ fontWeight: 'bold', color: '#d9534f' }}>
                                                {receipt.totalReceiptAmount.toLocaleString()} đ
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => openReceiptDetail(receipt)}
                                                    style={{ padding: '6px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Xem Chi Tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', color: '#666' }}>Không có dữ liệu phiếu nhập.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XEM CHI TIẾT PHIẾU NHẬP */}
            {showReceiptDetailModal && selectedReceipt && (
                <div className="modal-overlay" style={{ zIndex: 1050 }}>
                    <div className="modal-content" style={{ maxWidth: '700px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Chi Tiết Phiếu Nhập #{selectedReceipt.receiptId}</h3>
                            <span style={{ color: '#666' }}>
                                Ngày: {new Date(selectedReceipt.importDate).toLocaleString('vi-VN')}
                            </span>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table border="1" width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px' }}>STT</th>
                                    <th style={{ padding: '10px' }}>Tên Sản Phẩm</th>
                                    <th style={{ padding: '10px' }}>Số Lượng</th>
                                    <th style={{ padding: '10px' }}>Đơn Giá</th>
                                    <th style={{ padding: '10px' }}>Thành Tiền</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedReceipt.details.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '8px' }}>{index + 1}</td>
                                        <td>{item.inventoryName}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unitPrice?.toLocaleString()} đ</td>
                                        <td style={{ fontWeight: 'bold' }}>{item.itemTotal?.toLocaleString()} đ</td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>
                                    <td colSpan="4" style={{ padding: '10px', textAlign: 'right' }}>Tổng cộng:</td>
                                    <td style={{ color: '#d9534f' }}>{selectedReceipt.totalReceiptAmount.toLocaleString()} đ</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '20px' }}>
                            <button
                                onClick={() => setShowReceiptDetailModal(false)}
                                className="btn btn-secondary"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NHẬP KHO */}
            {showImportModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
                        <div className="modal-header">
                            <h3>Tạo Phiếu Nhập - {branches.find(b => b.id === parseInt(selectedBranch))?.name}</h3>
                            <button className="close-btn" onClick={() => setShowImportModal(false)}>✖</button>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                            {importList.map((row, index) => (
                                <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <label style={{ cursor: 'pointer', fontWeight: row.isNew ? 'normal' : 'bold' }}>
                                                <input
                                                    type="radio" name={`type-report-${index}`} checked={!row.isNew}
                                                    onChange={() => handleImportChange(index, 'isNew', false)}
                                                /> Có sẵn
                                            </label>
                                            <label style={{ cursor: 'pointer', fontWeight: row.isNew ? 'bold' : 'normal', color: '#007bff' }}>
                                                <input
                                                    type="radio" name={`type-report-${index}`} checked={row.isNew}
                                                    onChange={() => handleImportChange(index, 'isNew', true)}
                                                /> + Hàng mới
                                            </label>
                                        </div>
                                        <button
                                            onClick={() => removeImportRow(index)}
                                            style={{ color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            ✖ Xóa
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {!row.isNew ? (
                                            <select
                                                className="stock-input"
                                                value={row.inventoryId || ''}
                                                onChange={(e) => handleImportChange(index, 'inventoryId', e.target.value)}
                                                style={{ flex: 1, padding: '8px' }}
                                            >
                                                <option value="">-- Chọn mặt hàng --</option>
                                                {availableItems.map(i => (
                                                    <option key={i.inventoryId} value={i.inventoryId}>
                                                        {i.inventoryName} (Tồn: {i.stock})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                                <input
                                                    type="text" className="stock-input" placeholder="Tên sản phẩm..."
                                                    value={row.inventoryName || ''}
                                                    onChange={(e) => handleImportChange(index, 'inventoryName', e.target.value)}
                                                    style={{ flex: 1, padding: '8px', border: '1px solid #007bff' }}
                                                />
                                                <input
                                                    type="number" className="stock-input" min="0" placeholder="Giá nhập (đ)"
                                                    value={row.price || ''}
                                                    onChange={(e) => handleImportChange(index, 'price', e.target.value)}
                                                    style={{ width: '110px', padding: '8px', border: '1px solid #007bff' }}
                                                />
                                            </div>
                                        )}

                                        <input
                                            type="number" min="1" className="stock-input" placeholder="SL"
                                            value={row.quantity || ''}
                                            onChange={(e) => handleImportChange(index, 'quantity', e.target.value)}
                                            style={{ width: '70px', padding: '8px' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', marginTop: '10px', borderStyle: 'dashed' }}
                            onClick={() => setImportList([...importList, { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1 }])}
                        >
                            + Thêm một dòng sản phẩm nữa
                        </button>

                        <div style={{ marginTop: '20px', textAlign: 'right', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)} style={{ marginRight: '10px' }}>Hủy</button>
                            <button className="btn btn-success" onClick={submitImport}>Xác nhận Nhập</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT SẢN PHẨM (Mở từ bảng ngoài cùng) */}
            {showDetailModal && productDetail && (
                <div className="modal-overlay" style={{ zIndex: 1200 }}>
                    <div className="modal-content small">
                        <div className="modal-header">
                            <h3>Thông tin chi tiết</h3>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>✖</button>
                        </div>
                        <div style={{ textAlign: 'left', lineHeight: '2' }}>
                            <p><strong>Mã sản phẩm:</strong> {productDetail.inventoryId}</p>
                            <p><strong>Tên vật phẩm:</strong> {productDetail.inventoryName}</p>
                            <p><strong>Đơn vị tính:</strong> {productDetail.unit || '---'}</p>
                            <p><strong>Giá nhập hiện tại:</strong> {productDetail.price?.toLocaleString()} đ</p>
                            <p><strong>Tồn kho hệ thống:</strong> {productDetail.stock}</p>
                            <p><strong>Ngày cập nhật:</strong> {productDetail.date ? new Date(productDetail.date).toLocaleDateString('vi-VN') : '---'}</p>
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryReport;