import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { furnitureApi } from '@/features/furniture/api/furnitureApi';
import RoomDetailModal from '@/features/roomManagement/components/RoomDetailModal';
import apiClient from '@/services/apiClient';
import MainLayout from '@/components/layout/MainLayout';
import '../css/InventoryManagement.css';

const FurnitureInventory = () => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();

    // Permission Check
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        // Only ADMIN and MANAGER can access furniture inventory
        if (!currentUser.permissions?.isAdmin && !currentUser.permissions?.isManager) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const [rows, setRows] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(currentUser?.defaultBranchId ? String(currentUser.defaultBranchId) : 'all');
    const [nameDraft, setNameDraft] = useState('');
    const [typeFilterDraft, setTypeFilterDraft] = useState('all');
    const [typeFilterApplied, setTypeFilterApplied] = useState('all');
    const [furnitureTypes, setFurnitureTypes] = useState([]);
    const [nameApplied, setNameApplied] = useState('');
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
    const pageSize = viewMode === 'grid' ? 6 : 5; // Adjust page size for grid if desired
    const [detailItem, setDetailItem] = useState(null);
    const [brokenDetailInfo, setBrokenDetailInfo] = useState(null);
    const [brokenActionQuantity, setBrokenActionQuantity] = useState(1);
    const [isProcessingBroken, setIsProcessingBroken] = useState(false);
    const [branches, setBranches] = useState([]);

    // ========== WAREHOUSE FAIL STATES ==========
    const [showWarehouseFailModal, setShowWarehouseFailModal] = useState(false);
    const [warehouseFailRoom, setWarehouseFailRoom] = useState(null);

    // ========== IMPORT STATES ==========
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([
        { isNew: false, furnitureId: '', furnitureName: '', price: '', quantity: 1, unit: '', type: '' }
    ]);

    // ========== IMPORT HISTORY STATES ==========
    const [showImportHistory, setShowImportHistory] = useState(false);
    const [importHistory, setImportHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageInput, setHistoryPageInput] = useState('1');
    const [historySelectedReceipt, setHistorySelectedReceipt] = useState(null);
    const historyPageSize = 5;

    // ========== ITEM HISTORY STATES ==========
    const [showItemHistoryModal, setShowItemHistoryModal] = useState(false);
    const [itemHistoryData, setItemHistoryData] = useState([]);

    // Fetch branches
        useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await furnitureApi.listBranches();
                const branchOptions = [
                    { value: 'all', label: 'All branches' },
                    ...(Array.isArray(data) ? data.map(b => ({
                        value: String(b.branchId),
                        label: b.branchName
                    })) : [])
                ];
                setBranches(branchOptions);
            } catch (err) {
                console.error('Failed to fetch branches:', err);
            }
        };
        fetchBranches();

        const fetchTypes = async () => {
            try {
                const typeData = await apiClient.get('/furniture/types');
                setFurnitureTypes(typeData.data || []);
            } catch (e) {
                console.error('Failed to fetch types:', e);
            }
        };
        fetchTypes();
    }, []);

    // Fetch furniture inventory data
    const fetchFurnitureData = useCallback(async (branchId, searchKeyword = '', typeId = 'all', pageNum = 1) => {
        if (branchId === 'all') {
            setRows([]);
            return;
        }

        try {
            let response;
            if (searchKeyword.trim()) {
                response = await furnitureApi.searchFurnitureInventoryByBranch(
                    branchId,
                    searchKeyword,
                    pageNum - 1,
                    pageSize,
                    typeId === 'all' ? null : typeId
                );
            } else {
                response = await furnitureApi.listFurnitureInventoryByBranch(
                    branchId,
                    pageNum - 1,
                    pageSize,
                    typeId === 'all' ? null : typeId
                );
            }

            // Transform API response to table format
            const data = response.content || response || [];
            const transformedData = Array.isArray(data) ? data.map((item) => ({
                id: item.furnitureId,
                furnitureId: item.furnitureId,
                name: item.furnitorName,
                facility: `${branches.find(b => b.value === branchId)?.label || 'Branch'} - ${item.condition || 'Area'}`,
                branch: branches.find(b => b.value === branchId)?.label || 'Unknown',
                quantity: item.quantity || 0,
                price: item.price || 0,
                inUse: item.inUse || 0,
                inStock: item.inStock || 0,
                broken: item.broken || 0,
                brokenInUse: item.brokenInUse || 0,
                brokenInStock: item.brokenInStock || 0,
                roomsUsing: item.roomsUsing || [],
                roomsBroken: item.roomsBroken || [],
                type: item.type,
                code: item.furnitureCode,
            })) : [];
            
            setRows(transformedData);
        } catch (err) {
            console.error('Failed to fetch furniture inventory:', err);
            setRows([]);
        }
    }, [branches]);

    // Load data when branch or search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        // Reset to page 1 and fetch when branch/search changes
        setPage(1);
    }, [selectedBranch, nameApplied]);

    // Fetch data when page changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page);
    }, [page, fetchFurnitureData, selectedBranch, nameApplied, typeFilterApplied]);

    const formatVND = (value) =>
        new Intl.NumberFormat('vi-VN').format(value) + ' d';

    const filteredRows = useMemo(() => {
        return rows; // Already filtered by API
    }, [rows]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil((filteredRows.length || 0) / pageSize));
    }, [filteredRows.length]);

    const pagedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page]);

    // Import history grouping and pagination
    const groupedHistory = useMemo(() => {
        return importHistory.reduce((acc, current) => {
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
    }, [importHistory]);

    const totalHistoryPages = useMemo(() => {
        return Math.max(1, Math.ceil((groupedHistory.length || 0) / historyPageSize));
    }, [groupedHistory.length]);

    const pagedHistory = useMemo(() => {
        const start = (historyPage - 1) * historyPageSize;
        return groupedHistory.slice(start, start + historyPageSize);
    }, [groupedHistory, historyPage]);

    const onChangeBranch = (val) => {
        setSelectedBranch(val);
        setPage(1);
        setPageInput('1');
    };

    const onChangeName = (val) => {
        setNameDraft(val);
        setPage(1);
        setPageInput('1');
    };

    const applyFilters = () => {
        setNameApplied(nameDraft.trim());
        setPage(1);
        setPageInput('1');
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

    const changeHistoryPage = (nextPage) => {
        const target = Math.max(1, Math.min(totalHistoryPages, nextPage));
        setHistoryPage(target);
        setHistoryPageInput(String(target));
    };

    const commitHistoryPageInput = () => {
        const raw = historyPageInput?.trim?.() ?? '';
        if (!raw) return setHistoryPageInput(String(historyPage));
        const parsed = parseInt(raw, 10);
        if (!Number.isFinite(parsed)) return setHistoryPageInput(String(historyPage));
        changeHistoryPage(parsed);
    };

    // ========== WAREHOUSE FAIL HANDLERS ==========
    const handleOpenWarehouseFail = async () => {
        try {
            const branchParam = selectedBranch !== 'all' ? selectedBranch : '';
            const data = await furnitureApi.listRooms('WAREHOUSE_FAIL', '', 0, 10, branchParam);
            
            if (data && data.content && data.content.length > 0) {
                const warehouseFail = data.content.find(r => r.roomName === 'WAREHOUSE_FAIL');
                if (warehouseFail) {
                    setWarehouseFailRoom(warehouseFail);
                    setShowWarehouseFailModal(true);
                } else {
                    alert('No Warehouse Fail room found.');
                }
            } else {
                alert('No Warehouse Fail found for this branch.');
            }
        } catch (error) {
            console.error('Failed to load Warehouse Fail room:', error);
            alert('Cannot load Warehouse Fail room.');
        }
    };

    // ========== IMPORT HANDLERS ==========
    const openImportModal = async () => {
        try {
            // Load furniture list from Furniture table
            const res = await apiClient.get(`/inventory/furniture/branch/${selectedBranch}/list`);
            setAvailableItems(res.data);
            setImportList([{ isNew: false, furnitureId: '', furnitureName: '', price: '', quantity: 1, unit: '', type: '' }]);
            setIsImportModalOpen(true);
        } catch (error) {
            console.error('Failed to load available furniture:', error);
            alert('Failed to load furniture list!');
        }
    };

    const openImportHistory = async () => {
        try {
            const res = await apiClient.get(`/inventory/history`, {
                params: { branchId: parseInt(selectedBranch) }
            });
            // Filter for furniture imports only (those with furnitureId)
            const furnitureImports = res.data.filter(item => item.furnitureId);
            setImportHistory(furnitureImports);
            setShowImportHistory(true);
            setHistoryPage(1);
            setHistoryPageInput('1');
        } catch (error) {
            console.error('Failed to load import history:', error);
            alert('Failed to load import history!');
        }
    };

    const openItemSpecificHistory = async () => {
        if (!detailItem) return;
        try {
            const res = await apiClient.get(`/inventory/history`, {
                params: { branchId: parseInt(selectedBranch) }
            });
            const specificItemHistory = res.data.filter(item => item.furnitureName === detailItem.name);
            setItemHistoryData(specificItemHistory);
            setShowItemHistoryModal(true);
        } catch (error) {
            console.error('Failed to load item specific history:', error);
            alert('Failed to load history!');
        }
    };

    const handleImportChange = (index, field, value) => {
        const newList = [...importList];
        newList[index][field] = value;

        // Auto-fill price & unit when selecting existing furniture
        if (field === 'furnitureId' && !newList[index].isNew) {
            const selected = availableItems.find(i => i.furnitureId === parseInt(value));
            if (selected) {
                newList[index].furnitureName = selected.furnitorName || '';
                newList[index].price = selected.price || '';
            }
        }
        setImportList(newList);
    };

    const addImportRow = () => {
        setImportList([
            ...importList,
            { isNew: false, furnitureId: '', furnitureName: '', price: '', quantity: 1, unit: '', type: '' }
        ]);
    };

    const removeImportRow = (index) => {
        if (importList.length === 1) return;
        setImportList(importList.filter((_, i) => i !== index));
    };

    const submitImport = async () => {
        // Validate items
        const validItems = importList.filter(item =>
            (item.isNew && item.furnitureName.trim() !== '' && Number(item.price) > 0 && item.quantity > 0) ||
            (!item.isNew && item.furnitureId !== '' && Number(item.price) > 0 && item.quantity > 0)
        );

        if (validItems.length === 0) {
            alert('Please fill in Item Name, Unit Price (>0) and Quantity!');
            return;
        }

        // Normalize payload
        const payloadItems = validItems.map(item => {
            const unitPrice = Number(item.price);
            return {
                furnitureId: item.isNew ? null : parseInt(item.furnitureId),
                furnitureName: item.isNew ? item.furnitureName.trim() : null,
                price: unitPrice,
                quantity: parseInt(item.quantity),
                unit: item.unit || 'Piece',
                type: item.isNew ? item.type || '' : null  // For existing furniture
            };
        });

        console.log('Furniture import payload:', { branchId: parseInt(selectedBranch), items: payloadItems });

        try {
            await apiClient.post(`/inventory/furniture/import`, {
                branchId: parseInt(selectedBranch),
                items: payloadItems
            });
            alert('Import successfully! Furniture imported to stock.');
            setIsImportModalOpen(false);
            // Refresh furniture data
            fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page);
        } catch (error) {
            console.error('Furniture import error:', error);
            const msg = error?.response?.data?.message || 'Import failed! Please check your data.';
            alert(msg);
        }
    };

    // Format room ID list to display
    const formatRoomList = (roomNames = []) => {
        if (!Array.isArray(roomNames) || roomNames.length === 0) {
            return [];
        }
        return roomNames;
    };

    const handleProcessBrokenItems = async (action) => {
        try {
            if (!brokenActionQuantity || brokenActionQuantity <= 0 || brokenActionQuantity > (brokenDetailInfo?.brokenInStock || 0)) {
                alert("Invalid quantity!");
                return;
            }
            setIsProcessingBroken(true);
            
            const branchIdParam = selectedBranch === 'all' ? "" : selectedBranch;
            const data = await furnitureApi.listRooms('WAREHOUSE_FAIL', '', 0, 10, branchIdParam);
            const warehouseFail = data?.content?.find(r => r.roomName === 'WAREHOUSE_FAIL');
            
            if (!warehouseFail) {
                alert('No warehouse fail room found for this branch!');
                return;
            }

            if (action === 'fix') {
                await furnitureApi.fixWarehouseFailFurniture(warehouseFail.roomId, brokenDetailInfo.id, brokenActionQuantity);
                alert("Successfully moved items from warehouse fail to normal warehouse!");
            } else if (action === 'discard') {
                await furnitureApi.discardWarehouseFailFurniture(warehouseFail.roomId, brokenDetailInfo.id, brokenActionQuantity);
                alert("Successfully discarded broken items!");
            }
            
            setBrokenDetailInfo(null);
            setBrokenActionQuantity(1);
            fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page);
            
        } catch (e) {
            console.error(e);
            const msg = e?.response?.data?.message || 'Error occurred during processing!';
            alert(msg);
        } finally {
            setIsProcessingBroken(false);
        }
    };

    const renderPagination = (currentPage, total, onPageChange) => {
        const safeTotal = Math.max(1, total);
        const nodes = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = startPage + maxVisible - 1;

        if (endPage > safeTotal) {
            endPage = safeTotal;
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        nodes.push(
            <button
                key="prev"
                className="btn-page nav-btn"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <i className="bi bi-chevron-left"></i>
            </button>
        );

        if (startPage > 1) {
            nodes.push(<button key={1} className={`btn-page ${currentPage === 1 ? 'active' : ''}`} onClick={() => onPageChange(1)}>1</button>);
            if (startPage > 2) nodes.push(<span key="dots1" className="page-dots">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            nodes.push(
                <button
                    key={i}
                    className={`btn-page ${currentPage === i ? 'active' : ''}`}
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </button>
            );
        }

        if (endPage < safeTotal) {
            if (endPage < safeTotal - 1) nodes.push(<span key="dots2" className="page-dots">...</span>);
            nodes.push(<button key={safeTotal} className={`btn-page ${currentPage === safeTotal ? 'active' : ''}`} onClick={() => onPageChange(safeTotal)}>{safeTotal}</button>);
        }

        nodes.push(
            <button
                key="next"
                className="btn-page nav-btn"
                disabled={currentPage >= safeTotal}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <i className="bi bi-chevron-right"></i>
            </button>
        );

        return <div className="pagination-controls">{nodes}</div>;
    };

    return (

        <div style={{ background: '#f5f6f8', minHeight: '100vh', paddingBottom: '40px' }}>
            <style>{`
                .hero { background: linear-gradient(135deg, #5C6F4E 0%, #3d4a33 100%); padding: 36px 0 48px; position: relative; z-index: 10; margin-bottom: -22px; }
                .hero::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 36px; background: #f5f6f8; border-radius: 20px 20px 0 0; z-index: -1; pointer-events: none; }
                .hero-txt { text-align: center; color: #fff; margin-bottom: 20px; }
                .hero-txt h2 { font-weight: 800; font-size: 1.5rem; margin-bottom: 4px; }
                .hero-txt p { color: rgba(255, 255, 255, .7); font-size: .9rem; margin: 0; }
                
                .filter-box { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.03); border: 1px solid #eee; position: sticky; top: 20px; }
                .filter-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.1rem; color: #222; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #eee; }
                .filter-group { margin-bottom: 20px; }
                .filter-label { display: block; font-size: .8rem; font-weight: 700; color: #777; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; }
                .filter-input-group { position: relative; display: flex; align-items: center; }
                .filter-input-group input, .filter-input-group select { width: 100%; border: 1.5px solid #e8e8e8; border-radius: 10px; padding: 10px 14px; font-size: .9rem; background: #fafbfc; transition: all .2s; }
                .filter-input-group input { padding-left: 38px; }
                .filter-input-group input:focus, .filter-input-group select:focus { outline: none; border-color: #5C6F4E; background: #fff; box-shadow: 0 0 0 3px rgba(92,111,78,.1); }
                .filter-icon { position: absolute; left: 14px; color: #aaa; font-size: 1rem; pointer-events: none; }
                .filter-actions { display: flex; gap: 10px; margin-top: 24px; }
                .filter-btn { flex: 1; padding: 10px; border-radius: 10px; font-size: .9rem; font-weight: 600; cursor: pointer; transition: all .2s; border: none; display: flex; align-items: center; justify-content: center; gap: 6px; }
                .filter-btn-search { background: #5C6F4E; color: #fff; box-shadow: 0 4px 12px rgba(92,111,78,.2); }
                .filter-btn-search:hover { background: #4a5d4e; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(92,111,78,.25); }
                
                .res-hdr { background: #fff; border-radius: 14px; padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
                .res-cnt { font-size: .95rem; font-weight: 700; color: #333; display: flex; align-items: center; }
                .res-cnt span { color: #5C6F4E; font-weight: 800; margin: 0 4px; }
                
                .btn-action { padding: 9px 16px; border-radius: 8px; font-weight: 600; font-size: .85rem; border: none; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; gap: 6px; }
                .btn-import { background: #FFA500; color: #fff; box-shadow: 0 2px 8px rgba(255, 165, 0, 0.2); }
                .btn-import:hover:not(:disabled) { background: #e69500; transform: translateY(-1px); }
                .btn-history { background: #6c757d; color: #fff; box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2); }
                .btn-history:hover:not(:disabled) { background: #5a6268; transform: translateY(-1px); }
                .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

                .table-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; overflow: hidden; }
                .custom-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
                .custom-table th { background: #f8f9fa; padding: 14px 16px; text-align: center; color: #555; font-weight: 700; border-bottom: 2px solid #eee; white-space: nowrap; }
                .custom-table td { padding: 14px 16px; border-bottom: 1px solid #eee; vertical-align: middle; }
                .custom-table tr:last-child td { border-bottom: none; }
                .custom-table tbody tr:hover { background: #fafbfc; }
                
                .badge-status { padding: 4px 10px; border-radius: 6px; font-size: .75rem; font-weight: 700; display: inline-block; text-align: center; min-width: 40px; }
                .badge-stock { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .badge-use { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
                .badge-broken { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                
                .btn-detail-table { background: #f0f2f5; color: #555; border: none; padding: 6px 12px; border-radius: 6px; font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .2s; }
                .btn-detail-table:hover:not(:disabled) { background: #e4e6e9; color: #333; }
                .btn-detail-table:disabled { opacity: 0.5; cursor: not-allowed; }

                .empty-st { background: #fff; border-radius: 16px; padding: 50px 30px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; }
                .empty-st i { font-size: 3.5rem; color: #ddd; margin-bottom: 12px; }

                .pagination-box { display: flex; align-items: center; justify-content: center; padding: 20px; background: #fff; border-top: 1px solid #eee; }
                .pagination-controls { display: flex; gap: 8px; align-items: center; }
                .btn-page { background: #fff; border: 1px solid #eee; min-width: 36px; height: 36px; padding: 0 10px; border-radius: 8px; font-size: .95rem; font-weight: 500; color: #4a90e2; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; }
                .btn-page:hover:not(:disabled) { background: #f0f7ff; border-color: #d0e3f7; }
                .btn-page.active { background: #4a90e2; border-color: #4a90e2; color: #fff; box-shadow: 0 2px 6px rgba(74, 144, 226, 0.3); }
                .btn-page.nav-btn { color: #888; }
                .btn-page:disabled { opacity: 0.4; cursor: not-allowed; background: #fafafa; }
                .page-dots { color: #888; padding: 0 4px; font-weight: 600; letter-spacing: 1px; }

                /* View Toggle */
                .view-toggle { display: flex; background: #f0f2f5; border-radius: 8px; padding: 4px; gap: 4px; }
                .vt-btn { background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: #666; cursor: pointer; transition: all .2s; }
                .vt-btn.active { background: #fff; color: #5C6F4E; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,.05); }

                /* Grid Layout */
                .furn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                .fc { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; transition: all .25s; }
                .fc:hover { box-shadow: 0 6px 16px rgba(0,0,0,.08); transform: translateY(-2px); border-color: #e0e0e0; }
                .fc-body { padding: 16px; display: flex; align-items: center; gap: 16px; }
                .fc-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; background: rgba(108,117,125,0.1); color: #6c757d; }
                .fc-info { flex: 1; min-width: 0; }
                .fc-code { font-size: .75rem; color: #999; font-weight: 600; text-transform: uppercase; margin-bottom: 2px; }
                .fc-name { font-weight: 700; font-size: .95rem; color: #222; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .fc-branch { font-size: .8rem; color: #666; }
                .fc-actions { flex-shrink: 0; }
                .fc-btn { background: #f0f2f5; color: #555; border: none; padding: 6px 12px; border-radius: 6px; font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .2s; }
                .fc-btn:hover:not(:disabled) { background: #e4e6e9; color: #333; }
                .fc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .fc-footer { border-top: 1px dashed #eee; padding: 12px 16px; display: flex; justify-content: space-between; font-size: 0.85rem; background: #fafbfc; }
                .fc-stat { text-align: center; }
                .fc-stat-lbl { color: #888; margin-bottom: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
            `}</style>

            <div className="hero">
                <div className="container position-relative" style={{ zIndex: 2 }}>
                    <div className="hero-txt">
                        <h2><i className="bi bi-box-seam me-2" style={{ fontSize: '1.2rem' }}></i>Furniture Inventory</h2>
                        <p>Manage and track all furniture items efficiently</p>
                    </div>
                </div>
            </div>

            <div className="container pb-5">
                <div className="row g-4">
                    {/* Left Sidebar Filters */}
                    <div className="col-lg-3 col-md-4">
                        <div className="filter-box">
                            <div className="filter-title">
                                <i className="bi bi-funnel"></i>
                                <span>Filters</span>
                            </div>
                            
                            <div className="filter-group">
                                <label className="filter-label">
                                    <i className="bi bi-shop me-1"></i>Branch
                                </label>
                                <div className="filter-input-group">
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => onChangeBranch(e.target.value)}
                                        style={{ paddingLeft: '14px' }}
                                    >
                                        {branches.map((b) => (
                                            <option key={b.value} value={b.value}>{b.label}</option>
                                        ))}
                                    </select>
                                </div>
                                                        </div>

                            <div className="filter-group">
                                <label className="filter-label">
                                    <i className="bi bi-tag me-1"></i>Type
                                </label>
                                <div className="filter-input-group">
                                    <select
                                        value={typeFilterDraft}
                                        onChange={(e) => setTypeFilterDraft(e.target.value)}
                                        style={{ paddingLeft: "14px", appearance: 'auto', width: '100%' }}
                                    >
                                        <option value="all">All Types</option>
                                        {furnitureTypes.map(t => (
                                            <option key={t.typeId} value={t.typeId}>{t.typeName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">
                                    <i className="bi bi-search me-1"></i>By Name
                                </label>
                                <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="filter-input-group">
                                    <i className="filter-icon bi bi-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={nameDraft}
                                        onChange={(e) => onChangeName(e.target.value)}
                                    />
                                </form>
                            </div>

                            <div className="filter-actions">
                                <button
                                    type="button"
                                    className="filter-btn filter-btn-search"
                                    onClick={applyFilters}
                                >
                                    <i className="bi bi-search"></i> Search
                                </button>
                            </div>
                        </div>

                        {/* Action Box for Warehouse Fail */}
                        <div className="filter-box mt-4" style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.03)', border: '1px solid #eee', borderLeft: '4px solid #dc3545' }}>
                            <div className="filter-title" style={{ color: '#dc3545', borderBottom: 'none', marginBottom: '0', paddingBottom: '0' }}>
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Warehouse Fail</span>
                            </div>
                            <p className="text-muted small mt-2 mb-3">
                                Manage faulty and broken equipment in warehouse.
                            </p>
                            <button 
                                className="filter-btn w-100" 
                                style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold' }}
                                onClick={handleOpenWarehouseFail}
                            >
                                <i className="bi bi-tools me-2"></i> Warehouse Fail
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-lg-9 col-md-8">
                        {/* Header Bar */}
                        <div className="res-hdr">
                            <div className="res-cnt">
                                <i className="bi bi-boxes me-2" style={{ fontSize: '1.2rem', color: '#5C6F4E' }}></i>
                                Found <span>{filteredRows.length}</span> items
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div className="view-toggle">
                                    <button className={`vt-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List View"><i className="bi bi-list-ul"></i></button>
                                    <button className={`vt-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View"><i className="bi bi-grid-fill"></i></button>
                                </div>
                                <button
                                    onClick={openImportHistory}
                                    disabled={selectedBranch === 'all'}
                                    className="btn-action btn-history"
                                    title={selectedBranch === 'all' ? 'Please select a branch first' : 'View import history'}
                                >
                                    <i className="bi bi-clock-history"></i> History
                                </button>
                                <button
                                    onClick={openImportModal}
                                    disabled={selectedBranch === 'all'}
                                    className="btn-action btn-import"
                                    title={selectedBranch === 'all' ? 'Please select a branch first' : 'Import furniture'}
                                >
                                    <i className="bi bi-download"></i> Import
                                </button>
                            </div>
                        </div>

                        {/* Data Area */}
                        {pagedRows.length === 0 ? (
                            <div className="empty-st">
                                <i className="bi bi-inboxes d-block"></i>
                                <h4 className="mt-3 text-secondary">No furniture found</h4>
                                <p className="text-muted mb-0">Try changing your filters or select a different branch.</p>
                            </div>
                        ) : (
                            <div className="table-card">
                                {viewMode === 'list' ? (
                                    <div className="table-responsive">
                                        <table className="custom-table">
                                            <thead>
                                            <tr>
                                                <th style={{ width: '50px' }}>ID</th>
                                                <th style={{ textAlign: 'left' }}>Furniture</th>
                                                <th>Branch</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>In use</th>
                                                <th>In stock</th>
                                                <th>Broken</th>
                                                <th>Action</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {pagedRows.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="text-center text-muted fw-bold">#{row.id}</td>
                                                    <td className="fw-bold">{row.name} {row.type && <span style={{fontSize:"0.8rem", color:"#6c757d", fontWeight:"normal", display:"block", marginTop:"2px"}}>{row.type}</span>}</td>
                                                    <td className="text-center">{row.branch}</td>
                                                    <td className="text-center fw-bold">{row.quantity}</td>
                                                    <td className="text-center text-danger fw-bold">{formatVND(row.price)}</td>
                                                    <td className="text-center">
                                                        {row.inUse > 0 ? <span className="badge-status badge-use">{row.inUse}</span> : <span className="text-muted">-</span>}
                                                    </td>
                                                    <td className="text-center">
                                                        {row.inStock > 0 ? <span className="badge-status badge-stock">{row.inStock}</span> : <span className="text-muted">-</span>}
                                                    </td>
                                                    <td className="text-center">
                                                        {row.broken > 0 ? (
                                                            <span 
                                                                className="badge-status badge-broken"
                                                                title={`Rooms: ${row.brokenInUse || 0} | Warehouse Fail: ${row.brokenInStock || 0}`}
                                                                style={{ cursor: "pointer" }}
                                                                onClick={(e) => { e.stopPropagation(); setBrokenDetailInfo(row); }}
                                                            >
                                                                {row.broken}
                                                            </span>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            className="btn-detail-table"
                                                            onClick={() => setDetailItem(row)}
                                                            disabled={selectedBranch === 'all'}
                                                        >
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="furn-grid" style={{ padding: '20px', background: '#f5f6f8' }}>
                                        {pagedRows.map((row) => (
                                            <div key={row.id} className="fc">
                                                <div className="fc-body">
                                                    <div className="fc-icon">
                                                        <i className="bi bi-box-seam"></i>
                                                    </div>
                                                    <div className="fc-info">
                                                        <div className="fc-code">#{row.id}</div>
                                                        <div className="fc-name">{row.name} {row.type && <span style={{fontSize:"0.75rem", color:"#6c757d", fontWeight:"normal"}}>({row.type})</span>}</div>
                                                        <div className="fc-branch">{row.branch}</div>
                                                    </div>
                                                    <div className="fc-actions">
                                                        <button
                                                            className="fc-btn"
                                                            onClick={() => setDetailItem(row)}
                                                            disabled={selectedBranch === 'all'}
                                                            title="Details"
                                                        >
                                                            Details
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="fc-footer">
                                                    <div className="fc-stat">
                                                        <div className="fc-stat-lbl">Quantity</div>
                                                        <div style={{ fontWeight: 'bold' }}>{row.quantity}</div>
                                                    </div>
                                                    <div className="fc-stat">
                                                        <div className="fc-stat-lbl">In Stock</div>
                                                        <div>{row.inStock > 0 ? <span className="badge-status badge-stock">{row.inStock}</span> : '-'}</div>
                                                    </div>
                                                    <div className="fc-stat">
                                                        <div className="fc-stat-lbl">In Use</div>
                                                        <div>{row.inUse > 0 ? <span className="badge-status badge-use">{row.inUse}</span> : '-'}</div>
                                                    </div>
                                                    <div className="fc-stat">
                                                        <div className="fc-stat-lbl">Broken</div>
                                                        <div>{row.broken > 0 ? (
                                                            <span 
                                                                className="badge-status badge-broken"
                                                                title={`Rooms: ${row.brokenInUse || 0} | Warehouse Fail: ${row.brokenInStock || 0}`}
                                                                style={{ cursor: "pointer" }}
                                                                onClick={(e) => { e.stopPropagation(); setBrokenDetailInfo(row); }}
                                                            >
                                                                {row.broken}
                                                            </span>
                                                        ) : '-'}</div>
                                                    </div>
                                                    <div className="fc-stat">
                                                        <div className="fc-stat-lbl">Price</div>
                                                        <div style={{ fontWeight: 'bold', color: '#dc3545' }}>{formatVND(row.price)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Pagination */}
                                <div className="pagination-box">
                                    {renderPagination(page, totalPages, changePage)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {detailItem && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ zIndex: 1055, backgroundColor: "rgba(15,20,40,0.55)", backdropFilter: "blur(2px)" }}
                    onClick={() => setDetailItem(null)}
                >
                    <div
                        className="d-flex flex-column"
                        style={{
                            width: "min(900px, 95vw)",
                            maxHeight: "92vh",
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
                            overflow: "hidden",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="d-flex justify-content-between align-items-start px-5 py-4 flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, #5C6F4E 0%, #3d4f32 100%)`, color: "#fff" }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                    style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                                >
                                    <i className="bi bi-box-seam fs-4"></i>
                                </div>
                                <div>
                                    <h5 className="mb-1 fw-bold" style={{ letterSpacing: "-0.3px" }}>
                                        {detailItem.name}
                                    </h5>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0 rounded small" style={{ backgroundColor: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>
                                            #{detailItem.id}
                                        </span>
                                        <span className="d-inline-flex align-items-center gap-1 px-2 py-0 rounded-pill small fw-semibold" style={{ backgroundColor: "rgba(25,135,84,0.1)", color: "#198754", fontSize: "0.72rem" }}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#198754", display: "inline-block" }} />
                                            {detailItem.facility || detailItem.branch}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button className="btn-close btn-close-white mt-1" onClick={() => setDetailItem(null)} aria-label="Close" />
                        </div>

                        {/* Body */}
                        <div className="overflow-auto flex-grow-1 p-4" style={{ backgroundColor: "#f8f9fb" }}>
                            
                            {/* Stat Cards Row */}
                            <div className="row g-3 mb-4">
                                {[
                                    { icon: "bi-building", label: "Branch / Area", value: detailItem.facility || detailItem.branch || "�", color: "#5C6F4E" },
                                    { icon: "bi-tags", label: "Total Quantity", value: `${detailItem.quantity} items`, color: "#0d6efd" },
                                    { icon: "bi-cash", label: "Unit Price", value: formatVND(detailItem.price), color: "#dc3545" },
                                    { icon: "bi-archive", label: "In Stock", value: `${detailItem.inStock} items`, color: "#198754" }
                                ].map((info) => (
                                    <div className="col-6 col-md-3" key={info.label}>
                                        <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                            <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                                    style={{ width: 38, height: 38, backgroundColor: "rgba(92,111,78,0.08)" }}>
                                                    <i className={`bi ${info.icon}`} style={{ color: "#5C6F4E", fontSize: "0.95rem" }}></i>
                                                </div>
                                                <div>
                                                    <div className="text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{info.label}</div>
                                                    <div className="fw-semibold" style={{ fontSize: "0.88rem", color: "#1a1a2e" }}>{info.value}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Usage summary */}
                            <div className="card border-0 mb-4" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                <div className="card-header bg-white border-bottom py-3 px-4" style={{ borderRadius: "12px 12px 0 0" }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-pie-chart" style={{ color: "#5C6F4E" }}></i>
                                        <span className="fw-semibold small" style={{ color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>Usage Condition</span>
                                    </div>
                                </div>
                                <div className="card-body px-4 py-3">
                                    <div className="row g-3">
                                        {[
                                            { label: "Good / In Use", val: detailItem.inUse, color: "#0d6efd", icon: "bi-check-circle-fill" },
                                            { label: "In Stock", val: detailItem.inStock, color: "#198754", icon: "bi-box-seam" },
                                            { label: "Broken", val: detailItem.broken, color: "#dc3545", icon: "bi-exclamation-triangle-fill" },
                                        ].map((c, i) => {
                                            const pct = detailItem.quantity ? Math.round((c.val / detailItem.quantity) * 100) : 0;
                                            return (
                                                <div className="col-4" key={i}>
                                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                                        <span className="d-flex align-items-center gap-1 small fw-semibold" style={{ color: c.color, fontSize: "0.78rem" }}>
                                                            <i className={`bi ${c.icon}`} style={{ fontSize: "0.7rem" }}></i> {c.label}
                                                        </span>
                                                        <span className="fw-bold" style={{ color: c.color, fontSize: "0.88rem" }}>{c.val}</span>
                                                    </div>
                                                    <div className="rounded-pill overflow-hidden" style={{ height: 6, backgroundColor: "#eee" }}>
                                                        <div className="h-100 rounded-pill" style={{ width: `${pct}%`, backgroundColor: c.color, transition: "width 0.4s ease" }} />
                                                    </div>
                                                    <div className="text-muted mt-1" style={{ fontSize: "0.68rem" }}>{pct}%</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Rooms Using This Item */}
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                        <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2" style={{ borderRadius: "12px 12px 0 0" }}>
                                            <i className="bi bi-door-open" style={{ color: "#5C6F4E" }}></i>
                                            <span className="fw-semibold small" style={{ color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>Rooms using this item</span>
                                            <span className="badge rounded-pill px-2" style={{ backgroundColor: "rgba(92,111,78,0.12)", color: "#5C6F4E", fontWeight: 600 }}>
                                            {detailItem.roomsUsing?.length || 0}
                                            </span>
                                        </div>
                                        <div className="card-body px-4 py-3">
                                            <div className="d-flex flex-wrap gap-2">
                                                {(detailItem.roomsUsing || []).length ? (
                                                    formatRoomList(detailItem.roomsUsing).map((roomName) => (
                                                        <div key={roomName} className="px-3 py-1 rounded-pill small fw-semibold" style={{ backgroundColor: "#f0f2f5", color: "#444" }}>
                                                            {roomName}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted small">No rooms</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card border-0 h-100" style={{ borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                        <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2" style={{ borderRadius: "12px 12px 0 0" }}>
                                            <i className="bi bi-tools" style={{ color: "#dc3545" }}></i>
                                            <span className="fw-semibold small" style={{ color: "#dc3545", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>Rooms with broken items</span>
                                            <span className="badge rounded-pill px-2" style={{ backgroundColor: "rgba(220,53,69,0.12)", color: "#dc3545", fontWeight: 600 }}>
                                            {detailItem.roomsBroken?.length || 0}
                                            </span>
                                        </div>
                                        <div className="card-body px-4 py-3">
                                            {(detailItem.brokenInStock && detailItem.brokenInStock > 0) ? (
                                                <div className="mb-3">
                                                    <span className="badge rounded-pill" style={{ backgroundColor: "#dc3545", color: "#fff", padding: "6px 12px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                        <i className="bi bi-box-seam"></i> Warehouse Fail: {detailItem.brokenInStock} items
                                                    </span>
                                                </div>
                                            ) : null}
                                            <div className="d-flex flex-wrap gap-2">
                                                {(detailItem.roomsBroken || []).length ? (
                                                    formatRoomList(detailItem.roomsBroken).map((roomName) => (
                                                        <div key={roomName} className="px-3 py-1 rounded-pill small fw-semibold" style={{ backgroundColor: "rgba(220,53,69,0.1)", color: "#dc3545" }}>
                                                            {roomName}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted small">No broken rooms</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Action Bar (Footer) */}
                        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-white" style={{ borderRadius: "0 0 16px 16px" }}>
                            <span className="text-muted small">System Record #{detailItem.id}</span>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn px-4 fw-semibold"
                                    style={{ backgroundColor: "#8eb64b", color: "white" }}
                                    onClick={openItemSpecificHistory}
                                >
                                    Import History
                                </button>
                                <button className="btn btn-secondary px-4 fw-semibold" onClick={() => setDetailItem(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ITEM SPECIFIC HISTORY MODAL */}
            {showItemHistoryModal && (
                <div className="modal-overlay" style={{ zIndex: 1060, backgroundColor: 'rgba(15,20,40,0.55)' }} onClick={() => setShowItemHistoryModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '700px', width: '95%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header d-flex justify-content-between align-items-center py-3 px-4" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                            <h5 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                Import History: <span style={{ color: '#5C6F4E' }}>{detailItem?.name}</span>
                            </h5>
                            <button className="btn-close" onClick={() => setShowItemHistoryModal(false)}></button>
                        </div>
                        <div className="modal-body p-0">
                            {itemHistoryData.length > 0 ? (
                                <div className="table-responsive m-0">
                                    <table className="table table-hover mb-0" style={{ fontSize: '0.9rem' }}>
                                        <thead className="table-light">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Receipt No.</th>
                                                <th className="px-4 py-3 text-end">Quantity</th>
                                                <th className="px-4 py-3 text-end">Unit Price</th>
                                                <th className="px-4 py-3 text-end">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemHistoryData.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-muted">{new Date(item.importDate).toLocaleString('vi-VN')}</td>
                                                    <td className="px-4 py-3 fw-semibold">#{item.receiptId}</td>
                                                    <td className="px-4 py-3 text-end fw-bold">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-end">{(item.unitPrice || 0).toLocaleString()} VND</td>
                                                    <td className="px-4 py-3 text-end fw-bold text-danger">{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()} VND</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-clock-history fs-1 mb-3 d-block text-secondary opacity-50"></i>
                                    <h5>No Import History found</h5>
                                    <p className="mb-0">This item has not been imported yet.</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer px-4 py-3 bg-light border-top">
                            <h6 className="mb-0 me-auto">Total Imports: <strong>{itemHistoryData.reduce((acc, curr) => acc + curr.quantity, 0)}</strong></h6>
                            <button className="btn btn-secondary px-4" onClick={() => setShowItemHistoryModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* IMPORT FURNITURE MODAL */}
            {isImportModalOpen && (
                <div className="modal-overlay" style={{ zIndex: 1050, backgroundColor: 'rgba(15,20,40,0.55)' }}>
                    <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Import Furniture</h3>
                            <button 
                                className="close-btn" 
                                onClick={() => setIsImportModalOpen(false)}
                                style={{ cursor: 'pointer', fontSize: '20px' }}
                            >
                                ?
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            {importList.map((row, index) => (
                                <div 
                                    key={index} 
                                    style={{ 
                                        marginBottom: '15px', 
                                        padding: '15px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '8px', 
                                        backgroundColor: '#f9f9f9' 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input 
                                                    type="radio" 
                                                    checked={!row.isNew} 
                                                    onChange={() => handleImportChange(index, 'isNew', false)} 
                                                />
                                                Existing item
                                            </label>
                                            <label style={{ color: '#007bff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input 
                                                    type="radio" 
                                                    checked={row.isNew} 
                                                    onChange={() => handleImportChange(index, 'isNew', true)} 
                                                />
                                                + New item
                                            </label>
                                        </div>
                                        <button 
                                            onClick={() => removeImportRow(index)} 
                                            style={{ 
                                                color: '#d9534f', 
                                                border: 'none', 
                                                background: 'none', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {!row.isNew ? (
                                            <select
                                                value={row.furnitureId}
                                                onChange={(e) => handleImportChange(index, 'furnitureId', e.target.value)}
                                                style={{ 
                                                    flex: '1', 
                                                    minWidth: '200px',
                                                    padding: '10px', 
                                                    borderRadius: '4px',
                                                    border: '1px solid #ccc'
                                                }}
                                            >
                                                <option value="">-- Select furniture --</option>
                                                {availableItems.map(i => (
                                                    <option key={i.furnitureId} value={i.furnitureId}>
                                                        {i.furnitorName} ({i.type})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (<div style={{ display: 'flex', gap: '10px', flex: 1 }}><input
                                                type="text"
                                                placeholder="Furniture name..."
                                                value={row.furnitureName}
                                                onChange={(e) => handleImportChange(index, 'furnitureName', e.target.value)}
                                                style={{ 
                                                    flex: '1',
                                                    minWidth: '200px',
                                                    padding: '10px', 
                                                    borderRadius: '4px', 
                                                    border: '1px solid #007bff'
                                                }}
                                            />
                                              <input
                                                  type="text"
                                                  placeholder="Type (e.g. Lighting equipment...)"
                                                  value={row.type || ""}
                                                  onChange={(e) => handleImportChange(index, 'type', e.target.value)}
                                                  style={{
                                                      flex: '1',
                                                      minWidth: '200px',
                                                      padding: '10px',
                                                      borderRadius: '4px',
                                                      border: '1px solid #007bff'
                                                  }}
                                              /></div>
                                        )}

                                        <input
                                            type="text" 
                                            placeholder="Unit (Piece, Kg...)"
                                            value={row.unit}
                                            onChange={(e) => handleImportChange(index, 'unit', e.target.value)}
                                            style={{ 
                                                width: '100px', 
                                                padding: '10px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ccc' 
                                            }}
                                        />

                                        <input
                                            type="number" 
                                            placeholder="Unit price"
                                            value={row.price}
                                            onChange={(e) => handleImportChange(index, 'price', e.target.value)}
                                            style={{ 
                                                width: '130px', 
                                                padding: '10px', 
                                                border: '2px solid #28a745', 
                                                borderRadius: '4px', 
                                                fontWeight: 'bold'
                                            }}
                                        />

                                        <input
                                            type="number" 
                                            placeholder="Qty"
                                            min="1"
                                            value={row.quantity}
                                            onChange={(e) => handleImportChange(index, 'quantity', e.target.value)}
                                            style={{ 
                                                width: '80px', 
                                                padding: '10px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ccc'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addImportRow}
                                style={{
                                    width: '100%',
                                    marginTop: '10px',
                                    padding: '10px',
                                    backgroundColor: '#f0f0f0',
                                    border: '2px dashed #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    color: '#666'
                                }}
                            >
                                + Add another item
                            </button>

                            <div style={{ 
                                textAlign: 'right', 
                                gap: '10px', 
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                borderTop: '1px solid #eee', 
                                paddingTop: '15px',
                                marginTop: '15px'
                            }}>
                                <button 
                                    onClick={() => setIsImportModalOpen(false)} 
                                    className="btn btn-secondary"
                                    style={{ marginRight: '10px' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={submitImport} 
                                    className="btn btn-success"
                                    style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Confirm Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* IMPORT HISTORY MODAL */}
            {showImportHistory && (
                <div className="modal-overlay" style={{ zIndex: 1100, backgroundColor: 'rgba(15,20,40,0.55)' }}>
                    <div className="modal-content" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Import History - Furniture</h3>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowImportHistory(false)}
                                style={{ cursor: 'pointer', fontSize: '20px' }}
                            >
                                ?
                            </button>
                        </div>

                        <div className="table-responsive" style={{ padding: '20px' }}>
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
                                    {pagedHistory.length > 0 ? pagedHistory.map(receipt => (
                                        <tr key={receipt.receiptId}>
                                            <td className="font-semibold text-center">#{receipt.receiptId}</td>
                                            <td className="date-text text-center">
                                                {new Date(receipt.importDate).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="text-center font-semibold" style={{ color: '#d9534f' }}>
                                                {receipt.totalReceiptAmount.toLocaleString()} d
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => setHistorySelectedReceipt(receipt)}
                                                    className="btn-detail"
                                                >
                                                    View details
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="text-center" style={{ padding: '20px', color: '#999' }}>
                                                No import history found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* History Pagination */}
                        <div className="pagination-box" style={{ padding: '15px 20px', borderTop: 'none', background: 'transparent' }}>
                            {renderPagination(historyPage, totalHistoryPages, changeHistoryPage)}
                            <button
                                onClick={() => setShowImportHistory(false)}
                                className="btn btn-secondary"
                                style={{ marginLeft: '20px' }}
                            >
                                Close
                            </button>
                        </div>

                        {/* Receipt Detail Modal Inside History Modal */}
                        {historySelectedReceipt && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1101
                            }}>
                                <div style={{
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    padding: '30px',
                                    maxWidth: '600px',
                                    maxHeight: '80vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h4 style={{ margin: 0 }}>Receipt #{historySelectedReceipt.receiptId} Details</h4>
                                        <button 
                                            onClick={() => setHistorySelectedReceipt(null)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: '#666'
                                            }}
                                        >
                                            ?
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                                        <p><strong>Import Date:</strong> {new Date(historySelectedReceipt.importDate).toLocaleString('vi-VN')}</p>
                                        <p><strong>Total Amount:</strong> <span style={{ color: '#d9534f', fontWeight: 'bold' }}>{historySelectedReceipt.totalReceiptAmount.toLocaleString()} d</span></p>
                                    </div>

                                    <div>
                                        <h5 style={{ marginTop: 0, marginBottom: '15px' }}>Items:</h5>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Furniture</th>
                                                    <th style={{ padding: '8px', textAlign: 'center' }}>Quantity</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(historySelectedReceipt.details || []).map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: '8px' }}>{item.furnitureName || item.inventoryName || 'N/A'}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                                                        <td style={{ padding: '8px', textAlign: 'right' }}>{(item.unitPrice || 0).toLocaleString()} d</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(item.itemTotal || 0).toLocaleString()} d</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => setHistorySelectedReceipt(null)}
                                            className="btn btn-secondary"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* WAREHOUSE FAIL MODAL */}
            {showWarehouseFailModal && warehouseFailRoom && (
                <RoomDetailModal
                    show={showWarehouseFailModal}
                    room={warehouseFailRoom}
                    onHide={() => {
                        setShowWarehouseFailModal(false);
                        setWarehouseFailRoom(null);
                        // Refresh inventory data optionally to update stock
                        fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page);
                    }}
                />
            )}

            {/* BROKEN DETAIL MODAL */}
            {brokenDetailInfo && (
                <div className="modal-overlay" style={{ zIndex: 1070, backgroundColor: 'rgba(15,20,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setBrokenDetailInfo(null); setBrokenActionQuantity(1); }}>
                    <div className="modal-content" style={{ maxWidth: '400px', width: '90%', borderRadius: '16px', padding: '24px', position: 'relative', background: '#fff' }} onClick={e => e.stopPropagation()}>
                        <button className="btn-close" style={{ position: 'absolute', top: '15px', right: '15px' }} onClick={() => { setBrokenDetailInfo(null); setBrokenActionQuantity(1); }}></button>
                        <h4 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            Furniture Broken Details
                        </h4>
                        <div style={{ marginBottom: '20px', color: '#6c757d', fontSize: '0.9rem' }}>
                            <strong>{brokenDetailInfo.name}</strong> � #{brokenDetailInfo.id}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ padding: '16px', background: '#fff5f5', borderRadius: '12px', borderLeft: '4px solid #dc3545', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div style={{ fontSize: '0.85rem', color: '#dc3545', fontWeight: 'bold' }}>Warehouse Fail</div>
                                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                                          {brokenDetailInfo.brokenInStock || 0} <span style={{fontSize: '0.85rem', fontWeight: 'normal'}}>Pieces</span>
                                      </div>
                                  </div>
                                  {(brokenDetailInfo.brokenInStock > 0) && (
                                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ffdcdc' }}>
                                          <div className="mb-2" style={{ fontSize: '0.85rem', color: '#dc3545' }}><strong>Deal error furniture in stock</strong></div>
                                          <div className="d-flex align-items-center gap-2">
                                              <input
                                                  type="number"
                                                  className="form-control form-control-sm"
                                                  style={{ width: '80px' }}
                                                  value={brokenActionQuantity}
                                                  onChange={(e) => setBrokenActionQuantity(Number(e.target.value))}
                                                  min={1}
                                                  max={brokenDetailInfo.brokenInStock}
                                                  disabled={isProcessingBroken}
                                              />
                                              <button 
                                                  className="btn btn-sm btn-success text-white px-3"
                                                  onClick={() => handleProcessBrokenItems('fix')}
                                                  disabled={isProcessingBroken}
                                                  title="�� Fixed. Will be available in inventory again."
                                              ><i className="bi bi-tools me-1"></i>Fixed</button>
                                              <button 
                                                  className="btn btn-sm btn-danger px-3 text-white"
                                                  onClick={() => handleProcessBrokenItems('discard')}
                                                  disabled={isProcessingBroken}
                                                  title="Beyond Fixed --> Permanently remove from inventory"
                                              ><i className="bi bi-trash me-1"></i>Beyond Fixed</button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '12px', borderLeft: '4px solid #6c757d', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#495057', fontWeight: 'bold' }}>IN ROOM</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#495057' }}>
                                        {brokenDetailInfo.brokenInUse || 0} <span style={{fontSize: '0.85rem', fontWeight: 'normal'}}>Piece</span>
                                    </div>
                                </div>
                                {brokenDetailInfo.roomsBroken && brokenDetailInfo.roomsBroken.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '4px', borderTop: '1px solid #e9ecef', paddingTop: '8px' }}>
                                        <strong>In Room:</strong> {formatRoomList(brokenDetailInfo.roomsBroken).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '24px', textAlign: 'right' }}>
                            <button className="btn btn-secondary px-4 fw-semibold" style={{ borderRadius: '8px' }} onClick={() => { setBrokenDetailInfo(null); setBrokenActionQuantity(1); }}>��ng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default FurnitureInventory;
















