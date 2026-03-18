import React, { useMemo, useState } from 'react';
import axios from 'axios';
import '../css/InventoryReport.css';

const InventoryReport = () => {
    // --- STATE CHO BÁO CÁO ---
    const [branches] = useState([
        { id: 1, name: "Branch 1" },
        { id: 2, name: "Branch 2" },
        { id: 3, name: "Branch 3" }
    ]);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState([]);
    const [isReportLoaded, setIsReportLoaded] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 5;

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
            alert("Please select a Branch before viewing the report!");
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
            setPage(1);
        } catch (error) {
            console.error("Error loading report:", error);
            alert("Failed to load inventory report!");
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

    const totalPages = useMemo(() => {
        const total = reportData.length || 0;
        return Math.max(1, Math.ceil(total / pageSize));
    }, [reportData.length]);

    const pagedReportData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return reportData.slice(start, start + pageSize);
    }, [reportData, page]);

    const saveReport = async () => {
        try {
            await axios.post(`http://localhost:8081/api/inventory/report/save`, reportData);
            alert(`Saved inventory report for ${month}/${year} successfully!`);
        } catch (error) {
            console.error("Error saving report:", error);
            alert("Failed to save report!");
        }
    };

    // ================= LOGIC LỊCH SỬ NHẬP KHO =================
    const openHistoryModal = async () => {
        if (!selectedBranch) {
            alert("Please select a Branch to view import history!");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/history`, {
                params: { branchId: parseInt(selectedBranch) }
            });
            setHistoryList(res.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error("Error loading import history:", error);
            alert("Failed to load import history!");
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
            alert("Please select a Branch first!");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/branch/${selectedBranch}/items`);
            setAvailableItems(res.data);
            setImportList([{ isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1 }]);
            setShowImportModal(true);
        } catch (error) {
            console.error("Error loading inventory items:", error);
            alert("Failed to load inventory items for this branch.");
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

        if (validItems.length === 0) return alert("Please fill in information for at least one item!");

        for (let item of validItems) {
            if (item.isNew) {
                const isDuplicate = availableItems.some(
                    available => available.inventoryName.toLowerCase() === item.inventoryName.trim().toLowerCase()
                );
                if (isDuplicate) {
                    alert(`Item "${item.inventoryName}" already exists in this inventory. Please choose "Existing item".`);
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
            alert("Import successfully!");
            setShowImportModal(false);
            openHistoryModal();
            if (isReportLoaded) handleFetchReport();
        } catch (error) {
            console.error("Import error:", error);
            alert("Error while importing items!");
        }
    };

    // ================= LOGIC XEM CHI TIẾT SẢN PHẨM =================
    const handleViewDetail = async (id) => {
        try {
            const res = await axios.get(`http://localhost:8081/api/inventory/${id}`);
            setProductDetail(res.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error("Error loading item detail:", error);
            alert("Failed to load item detail!");
        }
    };

    return (
        <div className="inventory-container">
            <div className="report-card">
                <div className="report-header">
                    <h2>Inventory Stocktake Report</h2>
                    <button className="btn btn-primary" onClick={openHistoryModal}>Import History</button>
                </div>

                <div className="filter-group">
                    <div className="filter-item">
                        <select value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setIsReportLoaded(false); setReportData([]); setPage(1); }}>
                            <option value="">-- Select Branch --</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <input type="number" value={month} onChange={e => { setMonth(e.target.value); setIsReportLoaded(false); setReportData([]); setPage(1); }} style={{ width: '80px' }} />
                        <span> / </span>
                        <input type="number" value={year} onChange={e => { setYear(e.target.value); setIsReportLoaded(false); setReportData([]); setPage(1); }} style={{ width: '100px' }} />
                    </div>
                    <button className="btn btn-success" onClick={handleFetchReport}>View Report</button>
                </div>

                {isReportLoaded && (
                    <>
                        <table className="custom-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Item name</th>
                                <th>Opening stock</th>
                                <th>Imported</th>
                                <th>Closing stock</th>
                                <th>Used</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {reportData.length > 0 ? pagedReportData.map((row, localIndex) => {
                                const index = (page - 1) * pageSize + localIndex;
                                return (
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
                                );
                            }) : (
                                <tr><td colSpan="7">No data. This month only appears after the previous month\'s report is saved or this month has been saved.</td></tr>
                            )}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Trang trước
                                </button>
                                <span style={{ color: '#666' }}>Trang {page}/{totalPages}</span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Trang sau
                                </button>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={saveReport}
                                disabled={reportData.length === 0}
                            >
                                Save Report
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* MODAL LỊCH SỬ (GOM NHÓM THEO PHIẾU GIỐNG IMPORT HISTORY) */}
            {showHistoryModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>Import History - {branches.find(b => b.id === parseInt(selectedBranch))?.name}</h3>
                            <div>
                                <button className="btn btn-success" onClick={openImportModal} style={{ marginRight: '10px' }}>+ New Import</button>
                                <button className="close-btn" onClick={() => setShowHistoryModal(false)}>✖</button>
                            </div>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table border="1" width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead style={{ backgroundColor: '#f4f4f4', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Receipt No.</th>
                                    <th style={{ padding: '12px' }}>Imported At</th>
                                    <th style={{ padding: '12px' }}>Order Total</th>
                                    <th style={{ padding: '12px' }}>Action</th>
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
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', color: '#666' }}>No import receipts.</td>
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
                            <h3 style={{ margin: 0 }}>Import Receipt #{selectedReceipt.receiptId}</h3>
                            <span style={{ color: '#666' }}>
                                Date: {new Date(selectedReceipt.importDate).toLocaleString('vi-VN')}
                            </span>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table border="1" width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px' }}>#</th>
                                    <th style={{ padding: '10px' }}>Item</th>
                                    <th style={{ padding: '10px' }}>Quantity</th>
                                    <th style={{ padding: '10px' }}>Unit Price</th>
                                    <th style={{ padding: '10px' }}>Subtotal</th>
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
                                    <td colSpan="4" style={{ padding: '10px', textAlign: 'right' }}>Total:</td>
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
                                Close
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
                            <h3>Create Import Receipt - {branches.find(b => b.id === parseInt(selectedBranch))?.name}</h3>
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
                                                /> Existing
                                            </label>
                                            <label style={{ cursor: 'pointer', fontWeight: row.isNew ? 'bold' : 'normal', color: '#007bff' }}>
                                                <input
                                                    type="radio" name={`type-report-${index}`} checked={row.isNew}
                                                    onChange={() => handleImportChange(index, 'isNew', true)}
                                                /> + New item
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
                                                <option value="">-- Select item --</option>
                                                {availableItems.map(i => (
                                                    <option key={i.inventoryId} value={i.inventoryId}>
                                                        {i.inventoryName} (Stock: {i.stock})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                                <input
                                                    type="text" className="stock-input" placeholder="Item name..."
                                                    value={row.inventoryName || ''}
                                                    onChange={(e) => handleImportChange(index, 'inventoryName', e.target.value)}
                                                    style={{ flex: 1, padding: '8px', border: '1px solid #007bff' }}
                                                />
                                                <input
                                                    type="number" className="stock-input" min="0" placeholder="Unit price"
                                                    value={row.price || ''}
                                                    onChange={(e) => handleImportChange(index, 'price', e.target.value)}
                                                    style={{ width: '110px', padding: '8px', border: '1px solid #007bff' }}
                                                />
                                            </div>
                                        )}

                                        <input
                                            type="number" min="1" className="stock-input" placeholder="Qty"
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
                            + Add another item row
                        </button>

                        <div style={{ marginTop: '20px', textAlign: 'right', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)} style={{ marginRight: '10px' }}>Cancel</button>
                            <button className="btn btn-success" onClick={submitImport}>Confirm Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT SẢN PHẨM (Mở từ bảng ngoài cùng) */}
            {showDetailModal && productDetail && (
                <div className="modal-overlay" style={{ zIndex: 1200 }}>
                    <div className="modal-content small">
                        <div className="modal-header">
                            <h3>Item Detail</h3>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>✖</button>
                        </div>
                        <div style={{ textAlign: 'left', lineHeight: '2' }}>
                            <p><strong>Item ID:</strong> {productDetail.inventoryId}</p>
                            <p><strong>Item name:</strong> {productDetail.inventoryName}</p>
                            <p><strong>Unit:</strong> {productDetail.unit || '---'}</p>
                            <p><strong>Current import price:</strong> {productDetail.price?.toLocaleString()} đ</p>
                            <p><strong>System stock:</strong> {productDetail.stock}</p>
                            <p><strong>Last updated:</strong> {productDetail.date ? new Date(productDetail.date).toLocaleDateString('vi-VN') : '---'}</p>
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryReport;