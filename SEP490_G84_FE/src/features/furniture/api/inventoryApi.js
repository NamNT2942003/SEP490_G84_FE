import React, { useState, useEffect } from 'react';
import { inventoryApi } from './inventoryApi';

const ImportHistory = () => {
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

    const fetchImportHistory = async () => {
        try {
            const response = await inventoryApi.getImportHistory();
            const data = response.data.filter(item => item.branchId === selectedBranchId);
            setHistoryList(data);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử:", error);
        }
    };

    useEffect(() => {
        fetchImportHistory();
    }, [selectedBranchId]);

    // ================= SUBMIT =================
    const submitImport = async () => {
        const validItems = importList.filter(item =>
            (item.isNew && item.inventoryName.trim() !== '' && Number(item.price) > 0) ||
            (!item.isNew && item.inventoryId !== '' && Number(item.price) > 0)
        );

        if (validItems.length === 0) return alert("Vui lòng nhập đầy đủ thông tin!");

        const payload = {
            branchId: selectedBranchId,
            items: validItems.map(item => ({
                inventoryId: item.isNew ? null : parseInt(item.inventoryId),
                inventoryName: item.isNew ? item.inventoryName.trim() : null,
                price: Number(item.price),
                quantity: parseInt(item.quantity),
                unit: item.unit || "Cái"
            }))
        };

        try {
            await inventoryApi.importInventory(payload);
            alert("Import successful!");
            setIsModalOpen(false);
            fetchImportHistory();
        } catch (error) {
            alert("Lỗi khi gửi dữ liệu sang API!");
        }
    };

    // ================= FIX CHÍNH Ở ĐÂY =================
    const handleImportChange = (index, field, value) => {
        const newList = importList.map((item, i) => {
            if (i !== index) return item;

            let updatedItem = { ...item, [field]: value };

            if (field === 'inventoryId' && !item.isNew) {
                const selected = availableItems.find(i => i.inventoryId === parseInt(value));

                if (selected) {
                    // ✅ CHỈ set giá nếu user chưa nhập
                    if (!item.price) {
                        updatedItem.price = selected.price || '';
                    }
                    updatedItem.unit = selected.unit || '';
                }
            }

            return updatedItem;
        });

        setImportList(newList);
    };

    const addImportRow = () =>
        setImportList([
            ...importList,
            { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1, unit: '' }
        ]);

    const removeImportRow = (index) =>
        importList.length > 1 &&
        setImportList(importList.filter((_, i) => i !== index));

    // ================= GROUP HISTORY =================
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

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Lịch Sử Nhập Kho</h2>
                <button onClick={openImportModal} style={{ padding: '10px', backgroundColor: '#28a745', color: '#fff' }}>
                    + Nhập Kho Mới
                </button>
            </div>

            {/* TABLE */}
            <table border="1" width="100%" style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                <tr>
                    <th>Mã Phiếu</th>
                    <th>Ngày Nhập</th>
                    <th>Tổng</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {groupedHistory.map(r => (
                    <tr key={r.receiptId}>
                        <td>#{r.receiptId}</td>
                        <td>{new Date(r.importDate).toLocaleString('vi-VN')}</td>
                        <td>{r.totalReceiptAmount.toLocaleString()} đ</td>
                        <td>
                            <button onClick={() => { setSelectedReceipt(r); setIsDetailModalOpen(true); }}>
                                Chi tiết
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal">
                    <h3>Tạo Phiếu Nhập</h3>

                    {importList.map((row, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="checkbox"
                                checked={row.isNew}
                                onChange={(e) => handleImportChange(index, 'isNew', e.target.checked)}
                            />

                            {row.isNew ? (
                                <input
                                    placeholder="Tên hàng"
                                    value={row.inventoryName}
                                    onChange={(e) => handleImportChange(index, 'inventoryName', e.target.value)}
                                />
                            ) : (
                                <select
                                    value={row.inventoryId}
                                    onChange={(e) => handleImportChange(index, 'inventoryId', e.target.value)}
                                >
                                    <option value="">Chọn...</option>
                                    {availableItems.map(i => (
                                        <option key={i.inventoryId} value={i.inventoryId}>
                                            {i.inventoryName}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <input
                                type="number"
                                value={row.price}
                                onChange={(e) => handleImportChange(index, 'price', e.target.value)}
                                placeholder="Giá"
                            />

                            <input
                                type="number"
                                value={row.quantity}
                                onChange={(e) => handleImportChange(index, 'quantity', e.target.value)}
                            />

                            <button onClick={() => removeImportRow(index)}>X</button>
                        </div>
                    ))}

                    <button onClick={addImportRow}>+ Thêm dòng</button>
                    <button onClick={submitImport}>Xác nhận</button>
                </div>
            )}
        </div>
    );
};

export default ImportHistory;