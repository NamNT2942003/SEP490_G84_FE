import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import AddInventoryModal from './AddInventoryModal';
import InventoryDetailModal from './InventoryDetailModal';
import ImportInventoryModal from './ImportInventoryModal';
import '../css/InventoryManagement.css';

const InventoryManagement = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
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
        { id: '', name: 'All Branches' },
        { id: 1, name: 'Hanoi Branch' },
        { id: 2, name: 'HCMC Branch' }
    ];

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await inventoryApi.searchInventory(filters);
            setInventory(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (error) {
            console.error("Error fetching inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [filters.page, filters.inStockOnly, filters.branchId]);

    const handleSearch = () => {
        setFilters({ ...filters, page: 0 });
        fetchInventory();
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setFilters({ ...filters, page: newPage });
        }
    };

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("❗ Are you sure you want to delete this item from the system?")) {
            try {
                await inventoryApi.deleteInventory(id);
                alert("Deleted successfully!");
                fetchInventory();
            } catch (error) {
                console.error("Error deleting item:", error);
                const msg = error.response?.data || "Cannot delete this item!";
                alert(msg);
            }
        }
    };

    return (
        <div className="inventory-wrapper">
            <div className="inventory-container">
                <div className="inventory-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1>Inventory Management</h1>
                    <button className="btn-add" style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setIsModalOpen(true)}>
                        <span>+</span> Add New Item
                    </button>
                </div>

                {/* --- BẮT ĐẦU KHU VỰC FILTER MỚI --- */}
                <div
                    className="inventory-toolbar p-3 mb-4 rounded d-flex flex-wrap align-items-center gap-3"
                    style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
                >
                    {/* Ô tìm kiếm */}
                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search item name..."
                            className="form-control"
                            style={{ width: '250px' }}
                            onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                        />
                    </div>

                    {/* Checkbox */}
                    <div className="form-check d-flex align-items-center mb-0 mt-1">
                        <input
                            className="form-check-input"
                            style={{ width: '18px', height: '18px', marginRight: '8px', cursor: 'pointer' }}
                            type="checkbox"
                            id="inStockOnly"
                            onChange={(e) => setFilters({...filters, inStockOnly: e.target.checked, page: 0})}
                        />
                        <label className="form-check-label" htmlFor="inStockOnly" style={{ whiteSpace: 'nowrap', cursor: 'pointer', color: '#4a5568' }}>
                            In Stock Only
                        </label>
                    </div>

                    {/* Chọn chi nhánh & Nút Tìm kiếm (Đẩy sang phải) */}
                    <div className="d-flex align-items-center gap-2" style={{ marginLeft: 'auto' }}>
                        <select
                            className="form-control"
                            style={{ minWidth: '200px', cursor: 'pointer' }}
                            value={filters.branchId}
                            onChange={(e) => setFilters({...filters, branchId: e.target.value, page: 0})}
                        >
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        <button
                            className="btn"
                            style={{
                                backgroundColor: '#4a5d4e',
                                color: 'white',
                                padding: '6px 20px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                border: 'none',
                                borderRadius: '4px'
                            }}
                            onClick={handleSearch}
                        >
                            Search
                        </button>
                    </div>
                </div>
                {/* --- KẾT THÚC KHU VỰC FILTER MỚI --- */}

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
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Item Name</th>
                            <th className="text-right" style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Price</th>
                            <th className="text-center" style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Branch</th>
                            <th className="text-center" style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Current Stock</th>
                            <th className="text-center" style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {inventory.length > 0 ? (
                            inventory.map(item => (
                                <tr key={item.inventoryId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td className="font-semibold" style={{ padding: '12px' }}>{item.inventoryName}</td>
                                    <td className="text-right" style={{ padding: '12px' }}>{item.price?.toLocaleString()} VND</td>
                                    <td className="text-center" style={{ padding: '12px' }}>
                                        {item.branch ? item.branch.branchName : 'No Branch'}
                                    </td>
                                    <td className="text-center" style={{ padding: '12px' }}>
                                        <span className={`badge ${item.stock > 10 ? 'badge-green' : 'badge-red'}`}
                                              style={{ color: 'black', padding: '4px 8px', borderRadius: '12px', display: 'inline-block' }}>
                                            {item.stock}
                                        </span>
                                    </td>
                                    <td className="text-center" style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            
                                            <button
                                                className="btn-detail"
                                                style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#f9fafb' }}
                                                onClick={() => handleViewDetails(item)}
                                            >
                                                Details
                                            </button>

                                            <button
                                                className="btn-detail"
                                                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                onClick={() => handleDelete(item.inventoryId)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center" style={{ padding: '30px' }}>No items found.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
                    <div className="pagination-container" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '20px', gap: '10px' }}>
                        <button
                            className="btn-page"
                            style={{ padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', background: filters.page === 0 ? '#f5f5f5' : '#fff', cursor: filters.page === 0 ? 'not-allowed' : 'pointer' }}
                            disabled={filters.page === 0}
                            onClick={() => handlePageChange(filters.page - 1)}
                        >
                            Previous
                        </button>
                        <span className="page-info" style={{ fontWeight: '500' }}>
                            Page {filters.page + 1} of {totalPages}
                        </span>
                        <button
                            className="btn-page"
                            style={{ padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', background: filters.page >= totalPages - 1 ? '#f5f5f5' : '#fff', cursor: filters.page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                            disabled={filters.page >= totalPages - 1}
                            onClick={() => handlePageChange(filters.page + 1)}
                        >
                            Next
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