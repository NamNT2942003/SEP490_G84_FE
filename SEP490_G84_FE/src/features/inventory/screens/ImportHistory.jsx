import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/InventoryManagement.css';
import '../css/InventoryReport.css';

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
            { id: 1, name: 'Branch 1' },
            { id: 2, name: 'Branch 2' },
            { id: 3, name: 'Branch 3' }
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

        if (validItems.length === 0) return alert("Please fill in Name, Unit Price (>0) and Quantity!");

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

        // Debug log to verify payload in browser console
        console.log("Dữ liệu gửi đi:", { branchId: selectedBranchId, items: payloadItems });

        try {
            await axios.post(`${API_BASE_URL}/import`, {
                branchId: selectedBranchId,
                items: payloadItems
            });
            alert("Import successfully! Item prices have been updated.");
            setIsModalOpen(false);
            fetchImportHistory(selectedBranchId);
        } catch (error) {
            console.error("API Error:", error);
            const msg = error?.response?.data?.message || "Import error! Please check your data.";
            alert(msg);
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
            alert("Failed to load inventory items!");
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

    // Group receipts for history table
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
        <div className="inventory-wrapper">
            <div className="inventory-container">
            <div className="inventory-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 style={{ margin: 0 }}>Import Management</h1>
                    <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(parseInt(e.target.value))}
                        className="search-input"
                        style={{ width: 'auto' }}
                    >
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <button onClick={openImportModal} className="btn-add">+ New Import Receipt</button>
            </div>

            <div className="table-responsive">
                <table className="inventory-table">
                    <thead>
                    <tr>
                        <th className="text-center">Receipt No.</th>
                        <th className="text-center">Imported At</th>
                        <th className="text-center">Total Amount</th>
                        <th className="text-center">Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {groupedHistory.map(receipt => (
                        <tr key={receipt.receiptId}>
                            <td className="font-semibold">#{receipt.receiptId}</td>
                            <td className="date-text text-center">
                                {new Date(receipt.importDate).toLocaleString('vi-VN')}
                            </td>
                            <td className="text-center font-semibold" style={{ color: '#d9534f' }}>
                                {receipt.totalReceiptAmount.toLocaleString()} đ
                            </td>
                            <td className="text-center">
                                <button
                                    onClick={() => { setSelectedReceipt(receipt); setIsDetailModalOpen(true); }}
                                    className="btn-detail"
                                >
                                    View details
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL NHẬP KHO */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '850px', width: '100%' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Create New Import Receipt</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>✖</button>
                        </div>

                        {importList.map((row, index) => (
                            <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <label style={{ cursor: 'pointer' }}><input type="radio" checked={!row.isNew} onChange={() => handleImportChange(index, 'isNew', false)} /> Existing item</label>
                                        <label style={{ color: '#007bff', cursor: 'pointer' }}><input type="radio" checked={row.isNew} onChange={() => handleImportChange(index, 'isNew', true)} /> + New item</label>
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
                                            <option value="">-- Select item --</option>
                                            {availableItems.map(i => <option key={i.inventoryId} value={i.inventoryId}>{i.inventoryName} (Stock: {i.stock})</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type="text" placeholder="Item name..."
                                            value={row.inventoryName}
                                            onChange={(e) => handleImportChange(index, 'inventoryName', e.target.value)}
                                            style={{ flex: 3, padding: '10px', border: '1px solid #007bff', borderRadius: '4px' }}
                                        />
                                    )}
                                    <input
                                        type="text" placeholder="Unit (Piece, Kg...)"
                                        value={row.unit}
                                        onChange={(e) => handleImportChange(index, 'unit', e.target.value)}
                                        style={{ width: '100px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                    <input
                                        type="number" placeholder="Unit price"
                                        value={row.price}
                                        onChange={(e) => handleImportChange(index, 'price', e.target.value)}
                                        style={{ width: '130px', padding: '10px', border: '2px solid #28a745', borderRadius: '4px', fontWeight: 'bold' }}
                                    />
                                    <input
                                        type="number" placeholder="Qty"
                                        value={row.quantity}
                                        onChange={(e) => handleImportChange(index, 'quantity', e.target.value)}
                                        style={{ width: '70px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addImportRow}
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', marginTop: '10px', borderStyle: 'dashed' }}
                        >
                            + Add another item
                        </button>

                        <div style={{ textAlign: 'right', gap: '10px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ marginRight: '10px' }}>Cancel</button>
                            <button onClick={submitImport} className="btn btn-success">Confirm Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT PHIẾU */}
            {isDetailModalOpen && selectedReceipt && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Import Receipt #{selectedReceipt.receiptId}</h3>
                            <button className="close-btn" onClick={() => setIsDetailModalOpen(false)}>✖</button>
                        </div>
                        <p><strong>Imported at:</strong> {new Date(selectedReceipt.importDate).toLocaleString('vi-VN')}</p>
                        <table border="1" width="100%" style={{ borderCollapse: 'collapse', marginBottom: '20px', textAlign: 'center' }}>
                            <thead style={{ backgroundColor: '#f4f4f4' }}>
                            <tr>
                                <th style={{ padding: '8px' }}>Item name</th>
                                <th>Quantity</th>
                                <th>Unit price</th>
                                <th>Subtotal</th>
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
                                <td colSpan="3" style={{ textAlign: 'right', padding: '10px' }}>TOTAL:</td>
                                <td style={{ color: '#d9534f' }}>{selectedReceipt.totalReceiptAmount.toLocaleString()} đ</td>
                            </tr>
                            </tbody>
                        </table>
                        <div style={{ textAlign: 'right' }}>
                            <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default ImportHistory;