import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';

const ImportHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Thêm state để quản lý việc mở/đóng Modal và lưu thông tin item được chọn
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await inventoryApi.getImportHistory();
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm format tiền tệ VNĐ nhưng hiển thị chuẩn
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
    };

    // Hàm format ngày tháng
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Hàm xử lý khi bấm nút View Details
    const handleViewDetail = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="inventory-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Import History</h1>
                <button
                    onClick={fetchHistory}
                    className="btn"
                    style={{ backgroundColor: '#4a5d4e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Refresh History
                </button>
            </div>

            <div className="table-responsive" style={{ position: 'relative' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 1,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 'bold' }}>⌛ Loading...</span>
                    </div>
                )}

                <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Receipt ID</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Import Date</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Item Name</th>
                        <th className="text-center" style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Quantity</th>
                        <th className="text-right" style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                        <th className="text-right" style={{ padding: '12px', borderBottom: '1px solid #ddd', color: '#dc2626' }}>Total Amount</th>
                        <th className="text-center" style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {history.length > 0 ? history.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td className="font-semibold text-center" style={{ padding: '12px' }}>#{item.receiptId}</td>
                            <td style={{ padding: '12px' }}>{formatDate(item.importDate)}</td>
                            <td className="font-semibold" style={{ padding: '12px' }}>{item.inventoryName}</td>
                            <td className="text-center" style={{ padding: '12px', color: '#3b82f6', fontWeight: 'bold' }}>
                                + {item.quantity}
                            </td>
                            <td className="text-right" style={{ padding: '12px' }}>{formatCurrency(item.price)}</td>
                            <td className="text-right font-bold" style={{ padding: '12px', color: '#dc2626' }}>
                                {formatCurrency(item.totalAmount)}
                            </td>
                            <td className="text-center" style={{ padding: '12px' }}>
                                {/* NÚT VIEW DETAIL MỚI THÊM */}
                                <button
                                    className="btn-detail"
                                    style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#f9fafb' }}
                                    onClick={() => handleViewDetail(item)}
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="7" className="text-center" style={{ padding: '30px' }}>No import history found.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL HIỂN THỊ CHI TIẾT PHIẾU NHẬP --- */}
            {isModalOpen && selectedItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '8px',
                        width: '450px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '20px' }}>
                            Receipt Details #{selectedItem.receiptId}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Item Name:</span>
                                <span style={{ fontWeight: '600' }}>{selectedItem.inventoryName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Import Date:</span>
                                <span>{formatDate(selectedItem.importDate)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Quantity:</span>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>+ {selectedItem.quantity}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Unit Price:</span>
                                <span>{formatCurrency(selectedItem.price)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
                                <span style={{ color: '#111827', fontWeight: 'bold' }}>Total Amount:</span>
                                <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '1.1em' }}>
                                    {formatCurrency(selectedItem.totalAmount)}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ padding: '8px 20px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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

export default ImportHistory;