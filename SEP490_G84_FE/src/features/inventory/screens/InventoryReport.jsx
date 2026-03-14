import React, { useState, useEffect, useMemo } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import ImportInventoryModal from './ImportInventoryModal';

const InventoryReport = () => {
    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());
    const [branchId, setBranchId] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- State for Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Limit 5 items per page

    // --- State for Import Modal ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const branches = [
        { id: '', name: 'All Branches' },
        { id: 1, name: 'Hanoi Branch' },
        { id: 2, name: 'HCMC Branch' }
    ];

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await inventoryApi.getReport(month, year, branchId || null);
            setReportData(response.data);
            setCurrentPage(1); // Reset to page 1 when new data is loaded
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year, branchId]);

    // Open import modal
    const handleImportStock = (item) => {
        setSelectedItem({
            inventoryId: item.inventoryId,
            inventoryName: item.inventoryName
        });
        setIsImportModalOpen(true);
    };

    // Handle successful import from Modal
    const handleImportSuccess = () => {
        setIsImportModalOpen(false);
        fetchReport(); // Reload report to update "Imported Qty"
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
            alert(`Successfully closed and saved report for Month ${month}/${year}!`);
            fetchReport();
        } catch (error) {
            alert("Error saving report!");
        } finally {
            setLoading(false);
        }
    };

    // --- Pagination Logic ---
    const totalPages = Math.ceil(reportData.length / itemsPerPage);

    // Get 5 elements corresponding to the current page
    const currentData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return reportData.slice(startIndex, endIndex);
    }, [reportData, currentPage, itemsPerPage]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="inventory-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Inventory & Import Report</h1>
            </div>

            {/* NEW FILTER SECTION */}
            <div
                className="inventory-toolbar p-3 mb-4 rounded d-flex flex-wrap align-items-center gap-3"
                style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
            >
                {/* Time Selection */}
                <div className="d-flex align-items-center gap-2">
                    <span style={{ fontWeight: '600', color: '#4a5568', whiteSpace: 'nowrap' }}>Report Period:</span>
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="form-control"
                        style={{ width: '110px', cursor: 'pointer' }}
                    >
                        {[...Array(12).keys()].map(m => (
                            <option key={m + 1} value={m + 1}>Month {m + 1}</option>
                        ))}
                    </select>
                    <span style={{ fontWeight: 'bold', color: '#a0aec0' }}>/</span>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="form-control"
                        style={{ width: '90px' }}
                    />
                </div>

                {/* Branch Selection (Pushed to right) */}
                <div className="d-flex align-items-center gap-2" style={{ marginLeft: 'auto' }}>
                    <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="form-control"
                        style={{ minWidth: '220px', cursor: 'pointer' }}
                    >
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchReport}
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
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                {loading ? <p>Loading data...</p> : (
                    <>
                        <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Item Name</th>
                                <th className="text-center" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Beginning Stock</th>
                                <th className="text-center" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Imported Qty</th>
                                <th className="text-center" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Used Qty</th>
                                <th className="text-center" style={{ color: '#10b981', padding: '10px', borderBottom: '1px solid #ddd' }}>Ending Stock</th>
                                <th className="text-center" style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentData.map(item => (
                                <tr key={item.inventoryId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td className="font-semibold" style={{ padding: '10px' }}>{item.inventoryName}</td>
                                    <td className="text-center" style={{ padding: '10px' }}>{item.beginningStock}</td>
                                    <td className="text-center" style={{ color: '#3b82f6', fontWeight: 'bold', padding: '10px' }}>
                                        {item.importedQty}
                                    </td>
                                    <td className="text-center" style={{ padding: '10px' }}>
                                        <input
                                            type="number" min="0" value={item.usedQty}
                                            onChange={(e) => handleValueChange(item.inventoryId, 'usedQty', e.target.value)}
                                            style={{ width: '70px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ddd' }}
                                        />
                                    </td>
                                    <td className="text-center font-bold" style={{ padding: '10px' }}>{item.endingStock}</td>
                                    <td className="text-center" style={{ padding: '10px' }}>
                                        <button
                                            className="btn-add"
                                            style={{ padding: '5px 10px', fontSize: '12px' }}
                                            onClick={() => handleImportStock(item)}
                                        >
                                            + Import Stock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Pagination UI */}
                        {reportData.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '15px', gap: '10px' }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{ padding: '5px 15px', border: '1px solid #ccc', borderRadius: '4px', background: currentPage === 1 ? '#f5f5f5' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    Previous
                                </button>

                                <span>Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    style={{ padding: '5px 15px', border: '1px solid #ccc', borderRadius: '4px', background: currentPage === totalPages || totalPages === 0 ? '#f5f5f5' : '#fff', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {reportData.length > 0 && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button className="btn-add" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={handleSaveReport}>
                        💾 CLOSE & SAVE REPORT
                    </button>
                </div>
            )}

            {/* Import Modal */}
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