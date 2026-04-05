import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyBranches } from '@/hooks/useMyBranches';
import '../css/InventoryManagement.css';
import '../css/InventoryReport.css';

const ImportHistory = () => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();

    // Permission Check
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        // Only ADMIN and MANAGER can access inventory history
        if (!currentUser.permissions?.isAdmin && !currentUser.permissions?.isManager) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    // ================= STATE =================
    const { branches } = useMyBranches();
    const [selectedBranchId, setSelectedBranchId] = useState(currentUser?.defaultBranchId || 1);
    const [historyList, setHistoryList] = useState([]);

    useEffect(() => {
        if (branches.length > 0) {
            const isManaged = branches.some(b => b.branchId === selectedBranchId);
            if (!isManaged) {
                setSelectedBranchId(branches[0].branchId);
            }
        }
    }, [branches, selectedBranchId]);

    const today = new Date();
    const [draftMonth, setDraftMonth] = useState(today.getMonth() + 1);
    const [draftYear, setDraftYear] = useState(today.getFullYear());
    const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(today.getFullYear());
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([
        { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1, unit: '' }
    ]);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLines, setEditLines] = useState([]);

    const fetchImportHistory = React.useCallback(async (branchId) => {
        try {
            const response = await apiClient.get(`/inventory/history`, {
                params: { branchId: branchId, userId: currentUser?.userId }
            });
            setHistoryList(response.data);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử:", error);
            setHistoryList([]);
        }
    }, [currentUser]);

    useEffect(() => {
        if (selectedBranchId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchImportHistory(selectedBranchId);
        }
    }, [selectedBranchId, fetchImportHistory]);

    const applyFilter = () => {
        setFilterMonth(draftMonth);
        setFilterYear(draftYear);
        setPage(1);
    };


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
            await apiClient.post(`/inventory/import`, {
                branchId: selectedBranchId,
                items: payloadItems,
                userId: currentUser?.userId
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
            const res = await apiClient.get(`/inventory/branch/${selectedBranchId}/items`, {
                params: { userId: currentUser?.userId }
            });
            setAvailableItems(res.data);
            setImportList([{ isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1, unit: '' }]);
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
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

    // ================= EDIT IMPORT =================
    const handleEditLineChange = (index, field, value) => {
        const newLines = [...editLines];
        newLines[index] = { ...newLines[index], [field]: value };
        setEditLines(newLines);
    };

    const submitEditImport = async () => {
        if (!selectedReceipt) return;
        const receiptId = selectedReceipt.receiptId;

        const d = selectedReceipt.importDate ? new Date(selectedReceipt.importDate) : null;
        const receiptMonth = d ? d.getMonth() + 1 : filterMonth;
        const receiptYear = d ? d.getFullYear() : filterYear;

        const items = editLines
            .filter((l) => l && l.inventoryId != null)
            .map((l) => ({
                inventoryId: parseInt(l.inventoryId),
                quantity: parseInt(l.quantity),
                unitPrice: l.unitPrice != null && l.unitPrice !== '' ? l.unitPrice : 0
            }));

        if (items.length === 0) return alert('No items to edit.');

        try {
            await apiClient.put(`/inventory/import/${receiptId}/edit`, {
                month: receiptMonth,
                year: receiptYear,
                items,
                userId: currentUser?.userId
            });
            alert('Import receipt updated successfully!');
            setIsEditModalOpen(false);
            setIsDetailModalOpen(false);
            fetchImportHistory(selectedBranchId);
        } catch (error) {
            console.error('Edit import error:', error);
            const msg = error?.response?.data?.message || 'Failed to update import receipt.';
            alert(msg);
        }
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

    const filteredGroupedHistory = groupedHistory.filter((r) => {
        if (!r.importDate) return false;
        const d = new Date(r.importDate);
        return (d.getMonth() + 1 === filterMonth) && d.getFullYear() === filterYear;
    });

    const totalPages = Math.max(1, Math.ceil(filteredGroupedHistory.length / pageSize));
    const pagedHistory = filteredGroupedHistory.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPage(1);
    }, [filterMonth, filterYear, selectedBranchId]);

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
                        {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                    </select>

                        <select
                            value={draftMonth}
                            onChange={(e) => setDraftMonth(parseInt(e.target.value, 10))}
                            className="search-input"
                            style={{ width: 'auto' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>Month {m}</option>
                            ))}
                        </select>

                        <input
                            type="number"
                            value={draftYear}
                            onChange={(e) => {
                                const v = e.target.value;
                                const parsed = parseInt(v, 10);
                                setDraftYear(Number.isFinite(parsed) ? parsed : today.getFullYear());
                            }}
                            className="search-input"
                            style={{ width: '120px' }}
                        />

                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={applyFilter}
                            type="button"
                            style={{ height: 34 }}
                        >
                            Filter
                        </button>
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
                    {pagedHistory.map(receipt => {
                        const d = receipt.importDate ? new Date(receipt.importDate) : null;
                const isEditable = d
                    && (d.getMonth() + 1 === today.getMonth() + 1)
                    && (d.getFullYear() === today.getFullYear());

                        return (
                        <tr key={receipt.receiptId}>
                            <td className="font-semibold">#{receipt.receiptId}</td>
                            <td className="date-text text-center">
                                {new Date(receipt.importDate).toLocaleString('vi-VN')}
                            </td>
                            <td className="text-center font-semibold" style={{ color: '#d9534f' }}>
                                {receipt.totalReceiptAmount.toLocaleString()} đ
                            </td>
                            <td className="text-center">
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    <button
                                        onClick={() => { setSelectedReceipt(receipt); setIsDetailModalOpen(true); }}
                                        className="btn-detail"
                                    >
                                        View details
                                    </button>
                                    {isEditable && (
                                        <button
                                            onClick={() => {
                                                setSelectedReceipt(receipt);
                                                setEditLines(
                                                    (receipt.details || []).map((it) => ({
                                                        inventoryId: it.inventoryId,
                                                        inventoryName: it.inventoryName,
                                                        furnitureId: it.furnitureId,
                                                        furnitureName: it.furnitureName,
                                                        quantity: it.quantity,
                                                        unitPrice: it.unitPrice
                                                    }))
                                                );
                                                setIsEditModalOpen(true);
                                            }}
                                            className="btn-detail"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
                <button
                    className="btn-page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    type="button"
                >
                    Previous
                </button>
                <span className="page-info">
                    Page {page} / {totalPages}
                </span>
                <button
                    className="btn-page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    type="button"
                >
                    Next
                </button>
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
                                    <button onClick={() => removeImportRow(index)} style={{ color: '#d9534f', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
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
                                    <td style={{ padding: '8px' }}>{d.inventoryName || d.furnitureName || 'N/A'}</td>
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

            {/* MODAL EDIT PHIẾU NHẬP */}
            {isEditModalOpen && selectedReceipt && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Edit Import Receipt #{selectedReceipt.receiptId}</h3>
                            <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>✖</button>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <strong>Imported at:</strong>{' '}
                            {selectedReceipt.importDate ? new Date(selectedReceipt.importDate).toLocaleString('vi-VN') : 'N/A'}
                        </div>

                        <table border="1" width="100%" style={{ borderCollapse: 'collapse', textAlign: 'center', marginBottom: 18 }}>
                            <thead style={{ backgroundColor: '#f4f4f4' }}>
                            <tr>
                                <th>Item name</th>
                                <th>Quantity</th>
                                <th>Unit price</th>
                            </tr>
                            </thead>
                            <tbody>
                            {editLines.map((line, idx) => (
                                <tr key={line.inventoryId || line.furnitureId || idx}>
                                    <td style={{ padding: '8px' }}>{line.inventoryName || line.furnitureName || 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={line.quantity}
                                            onChange={(e) => handleEditLineChange(idx, 'quantity', e.target.value)}
                                            style={{ width: 90, padding: '6px', borderRadius: 6, border: '1px solid #ccc' }}
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={line.unitPrice}
                                            onChange={(e) => handleEditLineChange(idx, 'unitPrice', e.target.value)}
                                            style={{ width: 120, padding: '6px', borderRadius: 6, border: '1px solid #ccc' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={submitEditImport} className="btn btn-success">Save</button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default ImportHistory;