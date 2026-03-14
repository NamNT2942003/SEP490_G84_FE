import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';

const ImportHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await inventoryApi.getImportHistory();
            setHistory(response.data);
        } catch (error) {
            console.error("Lỗi lấy lịch sử:", error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm format tiền tệ VNĐ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm format ngày tháng
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="inventory-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Lịch Sử Nhập Kho</h1>
                <button onClick={fetchHistory} className="btn-search">Tải Lại Lịch Sử</button>
            </div>

            <div className="table-responsive">
                {loading ? <p>Đang tải dữ liệu...</p> : (
                    <table className="inventory-table">
                        <thead>
                        <tr>
                            <th>Mã Phiếu</th>
                            <th>Ngày Nhập</th>
                            <th>Tên Vật Phẩm</th>
                            <th className="text-center">Số Lượng</th>
                            <th className="text-right">Đơn Giá</th>
                            <th className="text-right" style={{ color: '#dc2626' }}>Tổng Tiền</th>
                        </tr>
                        </thead>
                        <tbody>
                        {history.length > 0 ? history.map((item, index) => (
                            <tr key={index}>
                                <td className="font-semibold text-center">#{item.receiptId}</td>
                                <td>{formatDate(item.importDate)}</td>
                                <td className="font-semibold">{item.inventoryName}</td>
                                <td className="text-center" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                    + {item.quantity}
                                </td>
                                <td className="text-right">{formatCurrency(item.price)}</td>
                                <td className="text-right font-bold" style={{ color: '#dc2626' }}>
                                    {formatCurrency(item.totalAmount)}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center">Chưa có dữ liệu nhập kho nào.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ImportHistory;