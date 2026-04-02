import React, { useState, useMemo } from 'react';

// Sample data (includes the 'unit' field)
const initialInventory = [
    { id: 1, name: 'Toothbrush', unit: 'Piece', price: 10000, branch: 'Grand Hanoi Hotel', beginStock: 937, importedQty: 0, endingStock: 716 },
    { id: 2, name: 'Snack Pack', unit: 'Pack', price: 15000, branch: 'Grand Hanoi Hotel', beginStock: 56, importedQty: 265, endingStock: 204 },
    { id: 3, name: 'G7 Coffee Pack', unit: 'Pack', price: 5000, branch: 'Grand Hanoi Hotel', beginStock: 50, importedQty: 100, endingStock: 0 },
    { id: 4, name: 'Aquafina Water 500ml', unit: 'Bottle', price: 15000, branch: 'An Nguyen Hotel CS2', beginStock: 40, importedQty: 10, endingStock: 30 },
];

const branches = ['Grand Hanoi Hotel', 'An Nguyen Hotel CS2'];

const InventoryManagement = () => {
    // State for report filters
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Data state
    const [inventory, setInventory] = useState(initialInventory);

    // Detail modal state
    const [detailItem, setDetailItem] = useState(null);

    // Currency formatter
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    };

    // Filter inventory by branch
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => item.branch === selectedBranch);
    }, [inventory, selectedBranch]);

    // Handle closing stock changes
    const handleEndingStockChange = (id, newStock) => {
        setInventory(prev => prev.map(item =>
            item.id === id ? { ...item, endingStock: Number(newStock) } : item
        ));
    };

    // Confirm report view
    const handleViewReport = () => {
        if (!selectedBranch) {
            alert("Please select a branch before viewing the report!");
            return;
        }
        setIsReportVisible(true);
    };

    // Close report and return to the selection screen
    const handleCloseReport = () => {
        setIsReportVisible(false);
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

            {/* MÀN HÌNH CHỌN THÔNG SỐ (Chỉ hiện khi chưa ấn Xem Báo Cáo) */}
            {!isReportVisible && (
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '600px', margin: '40px auto' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>Search Inventory Report</h2>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Select Branch: *</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="">-- Please select a branch --</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Month:</label>
                            <input
                                type="number" min="1" max="12"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Year:</label>
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
                        GENERATE IMPORT/EXPORT/STOCK REPORT
                    </button>
                </div>
            )}


            {/* MÀN HÌNH BÁO CÁO (Chỉ hiện sau khi đã chọn đủ thông tin) */}
            {isReportVisible && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                    {/* Header Vàng */}
                    <div style={{ backgroundColor: '#ffc107', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            MONTH {month}/{year} - IMPORT/EXPORT/STOCK REPORT ({selectedBranch})
                        </h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleCloseReport}
                                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #333', color: '#333', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Back
                            </button>
                            <button style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="bi bi-file-earmark-excel"></i> Export Excel
                            </button>
                        </div>
                    </div>

                    {/* Bảng dữ liệu chính */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '12px', textAlign: 'left', width: '25%' }}>Item Name</th>
                                <th style={{ padding: '12px' }}>Unit</th>
                                <th style={{ padding: '12px' }}>Opening Stock<br/><span style={{fontWeight: 'normal', fontSize: '12px'}}>(1)</span></th>
                                <th style={{ padding: '12px' }}>Imports<br/><span style={{fontWeight: 'normal', fontSize: '12px'}}>(2)</span></th>
                                <th style={{ padding: '12px' }}>Total Quantity<br/><span style={{fontWeight: 'normal', fontSize: '12px'}}>(1) + (2)</span></th>
                                <th style={{ padding: '12px', color: '#2563eb' }}>CLOSING STOCK<br/><span style={{fontWeight: 'normal', fontSize: '12px', color: '#666'}}>(Actual shelf count)</span></th>
                                <th style={{ padding: '12px', backgroundColor: '#bbf7d0', color: '#166534' }}>USED QUANTITY<br/><span style={{fontWeight: 'normal', fontSize: '12px', color: '#166534'}}>(Auto-calculated)</span></th>
                                <th style={{ padding: '12px' }}>Details</th>
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

                                        {/* Closing stock input */}
                                        <td style={{ padding: '16px 12px' }}>
                                            <input
                                                type="number"
                                                value={item.endingStock}
                                                onChange={(e) => handleEndingStockChange(item.id, e.target.value)}
                                                style={{ width: '80px', padding: '8px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
                                            />
                                        </td>

                                        {/* Auto-calculated usage cell */}
                                        <td style={{ padding: '16px 12px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: 'bold', fontSize: '16px' }}>
                                            {usedQty}
                                        </td>

                                        <td style={{ padding: '16px 12px' }}>
                                            <button
                                                onClick={() => setDetailItem(item)}
                                                style={{ padding: '6px 12px', backgroundColor: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No inventory data available for this branch.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Lưu Báo Cáo */}
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                        <button style={{ padding: '12px 24px', backgroundColor: '#4a5d4e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                            SAVE MONTHLY REPORT
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT (Chỉ hiện khi bấm nút Xem) */}
            {detailItem && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '12px' }}>Detail Information</h3>

                        <div style={{ marginBottom: '16px', lineHeight: '1.8' }}>
                            <div><strong>Item name:</strong> {detailItem.name}</div>
                            <div><strong>Unit price:</strong> <span style={{ color: '#d97706', fontWeight: 'bold' }}>{formatCurrency(detailItem.price)}</span></div>
                            <div><strong>Branch:</strong> {detailItem.branch}</div>
                            <div><strong>Unit:</strong> {detailItem.unit}</div>
                            <hr style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }} />
                            <div><strong>Opening stock:</strong> {detailItem.beginStock}</div>
                            <div><strong>Imported:</strong> {detailItem.importedQty}</div>
                            <div><strong>Closing stock:</strong> {detailItem.endingStock}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                            <button style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Delete item
                            </button>
                            <button
                                onClick={() => setDetailItem(null)}
                                style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InventoryManagement;