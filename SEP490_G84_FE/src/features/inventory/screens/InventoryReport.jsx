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

    // --- STATE CHO MODALS ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([{ inventoryId: '', quantity: 1 }]);

    // --- STATE CHI TIẾT SẢN PHẨM ---
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
            console.error("Lỗi lấy báo cáo:", error.response?.data || error.message);
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
            console.error("Lỗi lưu báo cáo:", error.response?.data || error.message);
            alert("Lỗi khi lưu báo cáo!");
        }
    };

    // ================= LOGIC LỊCH SỬ & CHI TIẾT =================
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

    const openHistoryModal = async () => {
        // 1. Kiểm tra nếu chưa chọn cơ sở thì yêu cầu chọn
        if (!selectedBranch) {
            alert("Vui lòng chọn Cơ sở để xem lịch sử nhập kho tương ứng!");
            return;
        }

        try {
            // 2. Gửi params branchId lên backend
            const res = await axios.get(`http://localhost:8081/api/inventory/history`, {
                params: { branchId: parseInt(selectedBranch) }
            });
            setHistoryList(res.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error("Lỗi tải lịch sử nhập kho:", error.response?.data || error.message);
            alert("Lỗi tải lịch sử nhập kho!");
        }
    };

    const openImportModal = async () => {
        if (!selectedBranch) {
            alert("Vui lòng chọn Cơ sở trước!");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/branch/${selectedBranch}/items`);
            setAvailableItems(res.data);
            setImportList([{ inventoryId: '', quantity: 1 }]);
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

    const submitImport = async () => {
        const validItems = importList
            .filter(item => item.inventoryId !== '')
            .map(item => ({
                receiptId: parseInt(item.inventoryId),
                quantity: parseInt(item.quantity),
                inventoryName: "",
                unitPrice: 0
            }));

        if (validItems.length === 0) return alert("Vui lòng chọn ít nhất 1 mặt hàng!");

        try {
            await axios.post(`http://localhost:8081/api/inventory/import`, {
                branchId: parseInt(selectedBranch),
                items: validItems
            });
            alert("Nhập kho thành công!");
            setShowImportModal(false);
            openHistoryModal();
            if (isReportLoaded) handleFetchReport();
        } catch (error) {
            console.error("Lỗi nhập kho:", error.response?.data || error.message);
            alert("Lỗi khi nhập kho!");
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

            {/* MODAL LỊCH SỬ */}
            {showHistoryModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Lịch sử nhập kho</h3>
                            <div>
                                <button className="btn btn-success" onClick={openImportModal} style={{ marginRight: '10px' }}>+ Nhập mới</button>
                                <button className="close-btn" onClick={() => setShowHistoryModal(false)}>✖</button>
                            </div>
                        </div>
                        <table className="custom-table">
                            <thead>
                            <tr>
                                <th>Mã phiếu</th>
                                <th>Ngày nhập</th>
                                <th>Tên vật phẩm</th>
                                <th>Số lượng</th>
                                <th>Tổng tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            {historyList.map((item, idx) => (
                                <tr key={idx}>
                                    <td>#{item.receiptId}</td>
                                    <td>{item.importDate ? new Date(item.importDate).toLocaleString('vi-VN') : '---'}</td>
                                    <td>{item.inventoryName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.totalAmount?.toLocaleString()} đ</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL NHẬP KHO */}
            {showImportModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content small">
                        <div className="modal-header">
                            <h3>Tạo phiếu nhập mới</h3>
                            <button className="close-btn" onClick={() => setShowImportModal(false)}>✖</button>
                        </div>
                        {importList.map((row, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <select className="stock-input" style={{ flex: 2 }} value={row.inventoryId}
                                        onChange={(e) => handleImportChange(index, 'inventoryId', e.target.value)}>
                                    <option value="">-- Chọn mặt hàng --</option>
                                    {availableItems.map(i => <option key={i.inventoryId} value={i.inventoryId}>{i.inventoryName}</option>)}
                                </select>
                                <input type="number" min="1" className="stock-input" style={{ flex: 1 }} value={row.quantity}
                                       onChange={(e) => handleImportChange(index, 'quantity', e.target.value)} />
                            </div>
                        ))}
                        <button className="btn btn-secondary btn-sm" onClick={() => setImportList([...importList, { inventoryId: '', quantity: 1 }])}>+ Thêm dòng</button>
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)} style={{ marginRight: '10px' }}>Hủy</button>
                            <button className="btn btn-success" onClick={submitImport}>Xác nhận nhập</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT SẢN PHẨM (Mới thêm) */}
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