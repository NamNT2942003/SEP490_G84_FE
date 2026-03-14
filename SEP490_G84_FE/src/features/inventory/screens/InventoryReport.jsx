import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import ImportInventoryModal from './ImportInventoryModal'; // Đảm bảo bạn đã import modal này

const InventoryReport = () => {
    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());
    const [branchId, setBranchId] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- State cho Modal Nhập hàng ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const branches = [
        { id: '', name: 'Tất cả chi nhánh' },
        { id: 1, name: 'Chi nhánh Hà Nội' },
        { id: 2, name: 'Chi nhánh TP.HCM' }
    ];

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Theo code Java bạn gửi, branchId có thể null
            const response = await inventoryApi.getReport(month, year, branchId || null);
            setReportData(response.data);
        } catch (error) {
            console.error("Lỗi lấy báo cáo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year, branchId]);

    // Mở modal nhập hàng
    const handleImportStock = (item) => {
        setSelectedItem({
            inventoryId: item.inventoryId,
            inventoryName: item.inventoryName
        });
        setIsImportModalOpen(true);
    };

    // Xử lý sau khi nhập hàng thành công từ Modal
    const handleImportSuccess = () => {
        setIsImportModalOpen(false);
        fetchReport(); // Tải lại báo cáo để cập nhật cột "Nhập trong kỳ"
    };

    const handleValueChange = (inventoryId, field, newValue) => {
        const val = parseInt(newValue) || 0;
        setReportData(prevData => prevData.map(item => {
            if (item.inventoryId === inventoryId) {
                const updatedItem = { ...item, [field]: val };
                let newEnding = updatedItem.beginningStock + updatedItem.importedQty - updatedItem.usedQty;
                return { ...updatedItem, endingStock: newEnding < 0 ? 0 : newEnding };
            }
            return item;
        }));
    };

    const handleSaveReport = async () => {
        try {
            setLoading(true);
            await inventoryApi.saveReport(reportData);
            alert(`Đã chốt sổ thành công báo cáo Tháng ${month}/${year}!`);
            fetchReport();
        } catch (error) {
            alert("Lỗi khi lưu báo cáo!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="inventory-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Báo Cáo Tồn Kho & Nhập Hàng</h1>
            </div>

            <div className="inventory-toolbar" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="form-control">
                    {[...Array(12).keys()].map(m => (
                        <option key={m + 1} value={m + 1}>Tháng {m + 1}</option>
                    ))}
                </select>

                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="form-control" style={{width: '100px'}} />

                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="form-control">
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                <button onClick={fetchReport} className="btn-search">Tải Lại</button>
            </div>

            <div className="table-responsive">
                {loading ? <p>Đang tải dữ liệu...</p> : (
                    <table className="inventory-table">
                        <thead>
                        <tr>
                            <th>Tên vật phẩm</th>
                            <th className="text-center">Tồn Đầu</th>
                            <th className="text-center">Nhập Trong Kỳ</th>
                            <th className="text-center">Xuất Trong Kỳ</th>
                            <th className="text-center" style={{ color: '#10b981' }}>Tồn Cuối</th>
                            <th className="text-center">Thao Tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reportData.map(item => (
                            <tr key={item.inventoryId}>
                                <td className="font-semibold">{item.inventoryName}</td>
                                <td className="text-center">{item.beginningStock}</td>
                                <td className="text-center" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                    {item.importedQty}
                                </td>
                                <td className="text-center">
                                    <input
                                        type="number" min="0" value={item.usedQty}
                                        onChange={(e) => handleValueChange(item.inventoryId, 'usedQty', e.target.value)}
                                        style={{ width: '70px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </td>
                                <td className="text-center font-bold">{item.endingStock}</td>
                                <td className="text-center">
                                    <button
                                        className="btn-add"
                                        style={{ padding: '5px 10px', fontSize: '12px' }}
                                        onClick={() => handleImportStock(item)}
                                    >
                                        + Nhập hàng
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {reportData.length > 0 && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button className="btn-add" style={{ padding: '10px 20px', backgroundColor: '#10b981' }} onClick={handleSaveReport}>
                        💾 CHỐT SỔ & LƯU BÁO CÁO
                    </button>
                </div>
            )}

            {/* Modal Nhập hàng */}
            {isImportModalOpen && (
                <ImportInventoryModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={handleImportSuccess}
                    selectedItem={selectedItem}
                />
            )}
        </div>
    );
};

export default InventoryReport;