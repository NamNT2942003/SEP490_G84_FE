import React, { useMemo, useState } from 'react';
import axios from 'axios';
import '../css/InventoryReport.css';
import * as XLSX from 'xlsx';

const InventoryReport = () => {
    // --- STATE CHO BÁO CÁO ---
    const [branches] = useState([
        { id: 1, name: "Branch 1" },
        { id: 2, name: "Branch 2" },
        { id: 3, name: "Branch 3" }
    ]);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState([]);
    const [isReportLoaded, setIsReportLoaded] = useState(false);
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const [nameQuery, setNameQuery] = useState('');
    const [nameApplied, setNameApplied] = useState('');
    const pageSize = 5;

    // --- STATE CHO MODAL LỊCH SỬ & CHI TIẾT PHIẾU NHẬP ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyList, setHistoryList] = useState([]);

    // Thêm state cho modal xem chi tiết Phiếu Nhập (Giống trang ImportHistory)
    const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    // --- STATE CHO MODAL NHẬP KHO MỚI ---
    const [showImportModal, setShowImportModal] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([
        { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1 }
    ]);

    // --- STATE CHI TIẾT SẢN PHẨM (Dùng ở bảng báo cáo) ---
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [productDetail, setProductDetail] = useState(null);

    const reportTitle = isReportLoaded
        ? `Inventory Stocktake Report - Month ${month} / ${year}`
        : 'Inventory Stocktake Report';

    // ================= LOGIC BÁO CÁO =================
    const handleFetchReport = async (monthToFetchOverride = null) => {
        if (!selectedBranch) {
            alert("Please select a Branch before viewing the report!");
            return;
        }

        const monthToFetch = monthToFetchOverride ?? month;
        try {
            const res = await axios.get(`http://[::1]:8081/api/inventory/report`, {
                params: {
                    month: parseInt(monthToFetch),
                    year: parseInt(year),
                    branchId: parseInt(selectedBranch)
                }
            });
            setReportData(res.data);
            setIsReportLoaded(true);
            setPage(1);
            setPageInput('1');
            setNameQuery('');
            setNameApplied('');
        } catch (error) {
            console.error("Error loading report:", error);
            alert("Failed to load inventory report!");
        }
    };

    const handleFetchReportForMonth = async (monthToFetch) => {
        setIsReportLoaded(false);
        setReportData([]);
        setPage(1);
        setPageInput('1');
        setNameQuery('');
        setNameApplied('');
        setMonth(monthToFetch);
        await handleFetchReport(monthToFetch);
    };

    const handleBackToMonthSelector = () => {
        setIsReportLoaded(false);
        setReportData([]);
        setPage(1);
        setPageInput('1');
        setNameQuery('');
        setNameApplied('');
        // Keep selectedBranch/year/month so user can quickly switch again.
    };

    const handleClosingStockChange = (index, value) => {
        const newValue = parseInt(value) || 0;
        const newData = [...reportData];
        newData[index].closingStock = newValue;
        const used = (newData[index].openingStock + newData[index].importQuantity) - newValue;
        newData[index].usedQuantity = used > 0 ? used : 0;
        setReportData(newData);
    };

    const handleNoteChange = (index, value) => {
        const newData = [...reportData];
        newData[index].note = value;
        setReportData(newData);
    };

    const changePage = (nextPage) => {
        const target = Math.max(1, Math.min(totalPages, nextPage));
        setPage(target);
        setPageInput(String(target));
    };

    const commitPageInput = () => {
        const raw = pageInput?.trim?.() ?? '';
        if (!raw) return setPageInput(String(page));
        const parsed = parseInt(raw, 10);
        if (!Number.isFinite(parsed)) return setPageInput(String(page));
        changePage(parsed);
    };

    const applyNameSearch = () => {
        setNameApplied(nameQuery.trim());
        setPage(1);
        setPageInput('1');
    };

    const clearNameSearch = () => {
        setNameQuery('');
        setNameApplied('');
        setPage(1);
        setPageInput('1');
    };

    const reportDataFiltered = useMemo(() => {
        const q = nameApplied.trim().toLowerCase();
        if (!q) return reportData;
        return reportData.filter((r) => (r.inventoryName || '').toLowerCase().includes(q));
    }, [reportData, nameApplied]);

    const totalPages = useMemo(() => {
        const total = reportDataFiltered.length || 0;
        return Math.max(1, Math.ceil(total / pageSize));
    }, [reportDataFiltered.length]);

    const pagedReportData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return reportDataFiltered.slice(start, start + pageSize);
    }, [reportDataFiltered, page]);

    const saveReport = async () => {
        try {
            await axios.post(`http://[::1]:8081/api/inventory/report/save`, reportData);
            alert(`Saved inventory report for ${month}/${year} successfully!`);
        } catch (error) {
            console.error("Error saving report:", error);
            alert("Failed to save report!");
        }
    };

    const exportToExcel = () => {
        if (!reportDataFiltered || reportDataFiltered.length === 0) {
            alert('No data to export!');
            return;
        }

        const branchName = branches.find((b) => String(b.id) === String(selectedBranch))?.name || selectedBranch;

        const headers = [
            'ID',
            'Name',
            'Unit',
            'Opening Strock',
            'Imported',
            'Used',
            'Closing Stock',
            'Note'
        ];

        const title = `Report Inventory - Month ${month} / ${year}`;

        const dataRows = reportDataFiltered.map((r) => ([
            r.inventoryId,
            r.inventoryName,
            r.unit || '',
            r.openingStock,
            r.importQuantity,
            r.usedQuantity,
            r.closingStock,
            r.note || ''
        ]));

        const worksheet = XLSX.utils.aoa_to_sheet([
            [title],
            [''],
            headers,
            ...dataRows
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Inventory');

        const safeMonth = String(month).padStart(2, '0');
        const fileName = `Report_Inventory_Month_${safeMonth}_${year}_Branch_${branchName}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // ================= LOGIC LỊCH SỬ NHẬP KHO =================
    const openHistoryModal = async () => {
        if (!selectedBranch) {
            alert("Please select a Branch to view import history!");
            return;
        }
        try {
            const res = await axios.get(`http://[::1]:8081/api/inventory/history`, {
                params: { branchId: parseInt(selectedBranch) }
            });
            // Only show receipts that belong to the selected month/year
            const targetMonth = parseInt(month, 10);
            const targetYear = parseInt(year, 10);
            const filtered = (res.data || []).filter((item) => {
                const d = new Date(item.importDate);
                return (d.getMonth() + 1 === targetMonth) && d.getFullYear() === targetYear;
            });
            setHistoryList(filtered);
            setShowHistoryModal(true);
        } catch (error) {
            console.error("Error loading import history:", error);
            alert("Failed to load import history!");
        }
    };

    // GOM NHÓM DỮ LIỆU LỊCH SỬ (Giống trang ImportHistory)
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

    const openReceiptDetail = (receipt) => {
        setSelectedReceipt(receipt);
        setShowReceiptDetailModal(true);
    };

    // ================= LOGIC TẠO PHIẾU NHẬP =================
    const openImportModal = async () => {
        if (!selectedBranch) {
            alert("Please select a Branch first!");
            return;
        }
        try {
            const res = await axios.get(`http://[::1]:8081/api/inventory/branch/${selectedBranch}/items`);
            setAvailableItems(res.data);
            setImportList([{ isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1 }]);
            setShowImportModal(true);
        } catch (error) {
            console.error("Error loading inventory items:", error);
            alert("Failed to load inventory items for this branch.");
        }
    };

    const handleImportChange = (index, field, value) => {
        const newList = [...importList];
        const current = newList[index];
        const updatedItem = { ...current, [field]: value };

        // If choosing an existing item, also fill price from availableItems
        if (field === 'inventoryId' && !current.isNew) {
            const selected = availableItems.find(
                (i) => i.inventoryId === parseInt(value)
            );
            if (selected) {
                updatedItem.price = selected.price != null ? selected.price : '';
            }
        }

        newList[index] = updatedItem;
        setImportList(newList);
    };

    const removeImportRow = (index) => {
        if (importList.length === 1) return alert("At least one item is required!");
        const newList = importList.filter((_, i) => i !== index);
        setImportList(newList);
    };

    const submitImport = async () => {
        const validItems = importList.filter(item =>
            (item.isNew && item.inventoryName.trim() !== '' && item.price !== '') ||
            (!item.isNew && item.inventoryId !== '')
        );

        if (validItems.length === 0) return alert("Please fill in information for at least one item!");

        for (let item of validItems) {
            if (item.isNew) {
                const isDuplicate = availableItems.some(
                    available => available.inventoryName.toLowerCase() === item.inventoryName.trim().toLowerCase()
                );
                if (isDuplicate) {
                    alert(`Item "${item.inventoryName}" already exists in this inventory. Please choose "Existing item".`);
                    return;
                }
            }
        }

        const payloadItems = validItems.map(item => {
            if (item.isNew) {
                return {
                    isNew: true,
                    inventoryName: item.inventoryName.trim(),
                    price: item.price,
                    quantity: parseInt(item.quantity)
                };
            } else {
                return {
                    isNew: false,
                    inventoryId: parseInt(item.inventoryId),
                    quantity: parseInt(item.quantity),
                    // Send price so backend can update latest price/date
                    price: item.price !== '' ? item.price : null
                };
            }
        });

        try {
            await axios.post(`http://[::1]:8081/api/inventory/import`, {
                branchId: parseInt(selectedBranch),
                items: payloadItems
            });
            alert("Import successfully!");
            setShowImportModal(false);
            openHistoryModal();
            if (isReportLoaded) handleFetchReport();
        } catch (error) {
            console.error("Import error:", error);
            alert("Error while importing items!");
        }
    };

    // ================= LOGIC XEM CHI TIẾT SẢN PHẨM =================
    const handleViewDetail = async (id) => {
        try {
            const res = await axios.get(`http://[::1]:8081/api/inventory/${id}`);
            setProductDetail(res.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error("Error loading item detail:", error);
            alert("Failed to load item detail!");
        }
    };

    return (
        <div className="inventory-container">
            <div className="report-card">
                <div className="report-header">
                    <h2>{reportTitle}</h2>
                </div>

                <div className="inventory-toolbar">
                    <div className="filter-group" style={{ marginBottom: 0 }}>
                        <div className="filter-item">
                            <select value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setIsReportLoaded(false); setReportData([]); setPage(1); }}>
                                <option value="">-- Select Branch --</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-item">
                            <input type="number" value={year} onChange={e => { setYear(e.target.value); setIsReportLoaded(false); setReportData([]); setPage(1); }} style={{ width: '100px' }} />
                        </div>

                        {isReportLoaded && (
                            <div className="filter-item name-search-filter-item">
                                <div className="name-search-wrapper">
                                    <input
                                        type="text"
                                        className="name-search-input"
                                        placeholder="Search by name..."
                                        value={nameQuery}
                                        onChange={(e) => setNameQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') applyNameSearch();
                                        }}
                                    />
                                    <button
                                        className="icon-search-btn"
                                    onClick={applyNameSearch}
                                    type="button"
                                    aria-label="Search by name"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path
                                                d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M21 21L16.65 16.65"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                {nameApplied && (
                                    <button
                                        className="icon-clear-btn"
                                        onClick={clearNameSearch}
                                        type="button"
                                        aria-label="Clear search"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path
                                                d="M6 6L18 18"
                                                stroke="currentColor"
                                                strokeWidth="2.2"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M18 6L6 18"
                                                stroke="currentColor"
                                                strokeWidth="2.2"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isReportLoaded && (
                        <div className="toolbar-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={handleBackToMonthSelector}
                            >
                                Back to month selector
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={openHistoryModal}
                            >
                                Import History
                            </button>
                        </div>
                    )}
                </div>

                {/* Month selector (hide after report is loaded) */}
                {!isReportLoaded && (
                    <div className="month-selector">
                        <div className="month-grid">
                            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={`month-tile ${m === month ? 'active' : ''}`}
                                    disabled={!selectedBranch}
                                    onClick={() => handleFetchReportForMonth(m)}
                                >
                                    <span className="month-icon" aria-hidden="true">
                                        {/* Folder + file icon (inline SVG) */}
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M3.5 7.5C3.5 6.39543 4.39543 5.5 5.5 5.5H9.2C9.6 5.5 9.98 5.67 10.25 5.97L11.3 7.15C11.57 7.45 11.95 7.6 12.35 7.6H18.5C19.6046 7.6 20.5 8.49543 20.5 9.6V17C20.5 18.1046 19.6046 19 18.5 19H5.5C4.39543 19 3.5 18.1046 3.5 17V7.5Z"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M7.2 12.2H16.8"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M7.2 15H13.5"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </span>
                                    <span className="month-label">Month {m}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isReportLoaded && (
                    <>
                        <table className="custom-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Unit</th>
                                <th>Opening Strock</th>
                                <th>Imported</th>
                                <th>Used</th>
                                <th>Closing Stock</th>
                                <th>Note</th>
                            </tr>
                            </thead>
                            <tbody>
                            {reportDataFiltered.length > 0 ? pagedReportData.map((row, localIndex) => {
                                const originalIndex = reportData.findIndex((r) => r.inventoryId === row.inventoryId);
                                return (
                                    <tr key={row.inventoryId}>
                                        <td>{row.inventoryId}</td>
                                        <td>{row.inventoryName}</td>
                                        <td>{row.unit || '-'}</td>
                                        <td>
                                            {row.openingStock}
                                        </td>
                                        <td>{row.importQuantity}</td>
                                        <td style={{ color: 'red', fontWeight: 'bold' }}>{row.usedQuantity}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                className="stock-input"
                                                value={row.closingStock}
                                                    onChange={(e) => handleClosingStockChange(originalIndex, e.target.value)}
                                            />
                                        </td>
                                        <td style={{ minWidth: 180 }}>
                                            <input
                                                type="text"
                                                className="note-input"
                                                placeholder="Enter note..."
                                                value={row.note || ''}
                                                onChange={(e) => handleNoteChange(originalIndex, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="8">
                                        No data. This month only appears after the previous month&apos;s report is saved or this month has been saved.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div className="inventory-pagination">
                                <button
                                    className="page-nav-btn"
                                    disabled={page <= 1}
                                    onClick={() => changePage(page - 1)}
                                    aria-label="Previous page"
                                    type="button"
                                >
                                    &lt;
                                </button>
                                <input
                                    className="page-jump-input"
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') commitPageInput();
                                    }}
                                    onBlur={commitPageInput}
                                />
                                <button
                                    className="page-nav-btn"
                                    disabled={page >= totalPages}
                                    onClick={() => changePage(page + 1)}
                                    aria-label="Next page"
                                    type="button"
                                >
                                    &gt;
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={exportToExcel}
                                    disabled={reportDataFiltered.length === 0}
                                >
                                    Export Excel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={saveReport}
                                    disabled={reportDataFiltered.length === 0}
                                >
                                    Save Report
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* MODAL LỊCH SỬ (GOM NHÓM THEO PHIẾU GIỐNG IMPORT HISTORY) */}
            {showHistoryModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>Import History - {branches.find(b => b.id === parseInt(selectedBranch))?.name}</h3>
                            <div>
                                <button className="close-btn" onClick={() => setShowHistoryModal(false)}>✖</button>
                            </div>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table border="1" width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead style={{ backgroundColor: '#f4f4f4', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Receipt No.</th>
                                    <th style={{ padding: '12px' }}>Imported At</th>
                                    <th style={{ padding: '12px' }}>Order Total</th>
                                    <th style={{ padding: '12px' }}>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {groupedHistory.length > 0 ? (
                                    groupedHistory.map((receipt) => (
                                        <tr key={receipt.receiptId}>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>#{receipt.receiptId}</td>
                                            <td>{receipt?.importDate ? new Date(receipt.importDate).toLocaleString('vi-VN') : 'N/A'}</td>
                                            <td style={{ fontWeight: 'bold', color: '#d9534f' }}>
                                                {receipt.totalReceiptAmount.toLocaleString()} đ
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => openReceiptDetail(receipt)}
                                                    style={{ padding: '6px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', color: '#666' }}>No import receipts.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XEM CHI TIẾT PHIẾU NHẬP */}
            {showReceiptDetailModal && selectedReceipt && (
                <div className="modal-overlay" style={{ zIndex: 1050 }}>
                    <div className="modal-content" style={{ maxWidth: '700px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Import Receipt #{selectedReceipt.receiptId}</h3>
                            <span style={{ color: '#666' }}>
                                Date: {new Date(selectedReceipt.importDate).toLocaleString('vi-VN')}
                            </span>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table border="1" width="100%" style={{ textAlign: 'center', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px' }}>#</th>
                                    <th style={{ padding: '10px' }}>Item</th>
                                    <th style={{ padding: '10px' }}>Quantity</th>
                                    <th style={{ padding: '10px' }}>Unit Price</th>
                                    <th style={{ padding: '10px' }}>Subtotal</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedReceipt.details.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '8px' }}>{index + 1}</td>
                                        <td>{item.inventoryName}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unitPrice?.toLocaleString()} đ</td>
                                        <td style={{ fontWeight: 'bold' }}>{item.itemTotal?.toLocaleString()} đ</td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>
                                    <td colSpan="4" style={{ padding: '10px', textAlign: 'right' }}>Total:</td>
                                    <td style={{ color: '#d9534f' }}>{selectedReceipt.totalReceiptAmount.toLocaleString()} đ</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '20px' }}>
                            <button
                                onClick={() => setShowReceiptDetailModal(false)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NHẬP KHO */}
            {showImportModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
                        <div className="modal-header">
                            <h3>Create Import Receipt - {branches.find(b => b.id === parseInt(selectedBranch))?.name}</h3>
                            <button className="close-btn" onClick={() => setShowImportModal(false)}>✖</button>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                            {importList.map((row, index) => (
                                <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <label style={{ cursor: 'pointer', fontWeight: row.isNew ? 'normal' : 'bold' }}>
                                                <input
                                                    type="radio" name={`type-report-${index}`} checked={!row.isNew}
                                                    onChange={() => handleImportChange(index, 'isNew', false)}
                                                /> Existing
                                            </label>
                                            <label style={{ cursor: 'pointer', fontWeight: row.isNew ? 'bold' : 'normal', color: '#007bff' }}>
                                                <input
                                                    type="radio" name={`type-report-${index}`} checked={row.isNew}
                                                    onChange={() => handleImportChange(index, 'isNew', true)}
                                                /> + New item
                                            </label>
                                        </div>
                                        <button
                                            onClick={() => removeImportRow(index)}
                                            style={{ color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            ✖ Remove
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {!row.isNew ? (
                                            <select
                                                className="stock-input"
                                                value={row.inventoryId || ''}
                                                onChange={(e) => handleImportChange(index, 'inventoryId', e.target.value)}
                                                style={{ flex: 1, padding: '8px' }}
                                            >
                                                <option value="">-- Select item --</option>
                                                {availableItems.map(i => (
                                                    <option key={i.inventoryId} value={i.inventoryId}>
                                                        {i.inventoryName} (Stock: {i.stock})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                                <input
                                                    type="text" className="stock-input" placeholder="Item name..."
                                                    value={row.inventoryName || ''}
                                                    onChange={(e) => handleImportChange(index, 'inventoryName', e.target.value)}
                                                    style={{ flex: 1, padding: '8px', border: '1px solid #007bff' }}
                                                />
                                                <input
                                                    type="number" className="stock-input" min="0" placeholder="Unit price"
                                                    value={row.price || ''}
                                                    onChange={(e) => handleImportChange(index, 'price', e.target.value)}
                                                    style={{ width: '110px', padding: '8px', border: '1px solid #007bff' }}
                                                />
                                            </div>
                                        )}

                                        <input
                                            type="number" min="1" className="stock-input" placeholder="Qty"
                                            value={row.quantity || ''}
                                            onChange={(e) => handleImportChange(index, 'quantity', e.target.value)}
                                            style={{ width: '70px', padding: '8px' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', marginTop: '10px', borderStyle: 'dashed' }}
                            onClick={() => setImportList([...importList, { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1 }])}
                        >
                            + Add another item row
                        </button>

                        <div style={{ marginTop: '20px', textAlign: 'right', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)} style={{ marginRight: '10px' }}>Cancel</button>
                            <button className="btn btn-success" onClick={submitImport}>Confirm Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT SẢN PHẨM (Mở từ bảng ngoài cùng) */}
            {showDetailModal && productDetail && (
                <div className="modal-overlay" style={{ zIndex: 1200 }}>
                    <div className="modal-content small">
                        <div className="modal-header">
                            <h3>Item Detail</h3>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>✖</button>
                        </div>
                        <div style={{ textAlign: 'left', lineHeight: '2' }}>
                            <p><strong>Item ID:</strong> {productDetail.inventoryId}</p>
                            <p><strong>Item name:</strong> {productDetail.inventoryName}</p>
                            <p><strong>Unit:</strong> {productDetail.unit || '---'}</p>
                            <p><strong>Current import price:</strong> {productDetail.price?.toLocaleString()} đ</p>
                            <p><strong>System stock:</strong> {productDetail.stock}</p>
                            <p><strong>Last updated:</strong> {productDetail.date ? new Date(productDetail.date).toLocaleDateString('vi-VN') : '---'}</p>
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryReport;