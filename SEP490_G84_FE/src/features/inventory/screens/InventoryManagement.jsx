import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import AddInventoryModal from './AddInventoryModal';
import InventoryDetailModal from './InventoryDetailModal';
import ImportInventoryModal from './ImportInventoryModal';
import '../css/InventoryManagement.css';

const InventoryManagement = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false); // Sẽ sử dụng để hiển thị trạng thái tải
    const [totalPages, setTotalPages] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [filters, setFilters] = useState({
        keyword: '',
        branchId: '',
        inStockOnly: false,
        page: 0,
        size: 5
    });

    const branches = [
        { id: '', name: 'Tất cả chi nhánh' },
        { id: 1, name: 'Chi nhánh Hà Nội' },
        { id: 2, name: 'Chi nhánh TP.HCM' }
    ];

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await inventoryApi.searchInventory(filters);
            setInventory(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu kho:", error);
        } finally {
            setLoading(false);
        }
    };

    // Theo dõi thay đổi trang, chi nhánh, lọc tồn kho
    useEffect(() => {
        fetchInventory();
    }, [filters.page, filters.inStockOnly, filters.branchId]);

    const handleSearch = () => {
        setFilters({ ...filters, page: 0 });
        fetchInventory(); // Ép buộc tải lại khi bấm nút Tìm kiếm
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setFilters({ ...filters, page: newPage });
        }
    };

    const handleImportStock = (item) => {
        setSelectedItem(item);
        setIsImportModalOpen(true);
    };

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
    };

    // Hàm xóa vật phẩm
    const handleDelete = async (id) => {
        if (window.confirm("❗ Bạn có chắc chắn muốn xóa vật phẩm này khỏi hệ thống không?")) {
            try {
                await inventoryApi.deleteInventory(id);
                alert("Xóa thành công!");
                fetchInventory(); // Refresh lại bảng
            } catch (error) {
                console.error("Lỗi khi xóa:", error);
                const msg = error.response?.data || "Không thể xóa vật phẩm này!";
                alert(msg);
            }
        }
    };

    return (
        <div className="inventory-wrapper">
            <div className="inventory-container">
                <div className="inventory-header">
                    <h1>Quản lý kho (Inventory)</h1>
                    <button className="btn-add" onClick={() => setIsModalOpen(true)}>
                        <span>+</span> Thêm vật phẩm mới
                    </button>
                </div>

                <div className="inventory-toolbar">
                    <input
                        type="text"
                        placeholder="Tìm tên vật phẩm..."
                        className="search-input"
                        onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                    />

                    <select
                        className="search-input"
                        style={{width: 'auto'}}
                        value={filters.branchId}
                        onChange={(e) => setFilters({...filters, branchId: e.target.value, page: 0})}
                    >
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <button className="btn-search" onClick={handleSearch}>
                        Tìm kiếm
                    </button>
                    <label className="filter-label">
                        <input
                            type="checkbox"
                            onChange={(e) => setFilters({...filters, inStockOnly: e.target.checked, page: 0})}
                        />
                        Chỉ hiện món còn hàng
                    </label>
                </div>

                <div className="table-responsive" style={{ position: 'relative' }}>
                    {/* Hiển thị hiệu ứng mờ khi đang tải dữ liệu */}
                    {loading && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 1,
                            display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}>
                            <span>⌛ Đang tải...</span>
                        </div>
                    )}

                    <table className="inventory-table">
                        <thead>
                        <tr>
                            <th>Tên vật phẩm</th>
                            <th className="text-right">Giá</th>
                            <th className="text-center">Số lượng nhập</th>
                            <th className="text-center">Tồn kho hiện tại</th>
                            <th className="text-center">Hành động</th>
                        </tr>
                        </thead>

                        <tbody>
                        {inventory.length > 0 ? (
                            inventory.map(item => (
                                <tr key={item.inventoryId}>
                                    <td className="font-semibold">{item.inventoryName}</td>
                                    <td className="text-right">{item.price?.toLocaleString()} đ</td>
                                    <td className="text-center">
                                        <span className="badge badge-yellow">{item.totalImported || 0}</span>
                                    </td>
                                    <td className="text-center">
                                        <span className={`badge ${item.stock > 10 ? 'badge-green' : 'badge-red'}`}>
                                            {item.stock}
                                        </span>
                                    </td>
                                    <td className="text-center" style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                                        <button
                                            className="btn-add"
                                            style={{padding: '6px 12px', fontSize: '12px'}}
                                            onClick={() => handleImportStock(item)}
                                        >
                                            Nhập hàng
                                        </button>
                                        <button className="btn-detail" onClick={() => handleViewDetails(item)}>
                                            Chi tiết
                                        </button>
                                        <button
                                            className="btn-detail"
                                            style={{ backgroundColor: '#dc2626', color: 'white' }}
                                            onClick={() => handleDelete(item.inventoryId)}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center" style={{ padding: '20px' }}>Không tìm thấy vật phẩm nào.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
                    <div className="pagination-container">
                        <button
                            className="btn-page"
                            disabled={filters.page === 0}
                            onClick={() => handlePageChange(filters.page - 1)}
                        >
                            Trước
                        </button>
                        <span className="page-info">
                            Trang {filters.page + 1} / {totalPages}
                        </span>
                        <button
                            className="btn-page"
                            disabled={filters.page >= totalPages - 1}
                            onClick={() => handlePageChange(filters.page + 1)}
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            <AddInventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchInventory}/>
            <InventoryDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} item={selectedItem}/>
            <ImportInventoryModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onRefresh={fetchInventory}
                selectedItem={selectedItem}
            />
        </div>
    );
};

export default InventoryManagement;