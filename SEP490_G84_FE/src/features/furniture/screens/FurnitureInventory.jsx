import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { furnitureApi } from '@/features/furniture/api/furnitureApi';
import RoomDetailModal from '@/features/roomManagement/components/RoomDetailModal';
import apiClient from '@/services/apiClient';
import MainLayout from '@/components/layout/MainLayout';
import '../css/InventoryManagement.css';

const BRAND = '#5C6F4E';

const FurnitureInventory = () => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();

    useEffect(() => {
        if (!currentUser) { navigate('/login'); return; }
        if (!currentUser.permissions?.isAdmin && !currentUser.permissions?.isManager) navigate('/dashboard');
    }, [currentUser, navigate]);

    const [rows, setRows] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(currentUser?.defaultBranchId ? String(currentUser.defaultBranchId) : 'all');
    const [nameDraft, setNameDraft] = useState('');
    const [typeFilterDraft, setTypeFilterDraft] = useState('all');
    const [typeFilterApplied, setTypeFilterApplied] = useState('all');
    const [furnitureTypes, setFurnitureTypes] = useState([]);
    const [nameApplied, setNameApplied] = useState('');
    const [page, setPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [viewMode, setViewMode] = useState('list');
    const pageSize = viewMode === 'grid' ? 6 : 5;
    const [detailItem, setDetailItem] = useState(null);
    const [brokenDetailInfo, setBrokenDetailInfo] = useState(null);
    const [brokenActionQuantity, setBrokenActionQuantity] = useState(1);
    const [isProcessingBroken, setIsProcessingBroken] = useState(false);
    const [branches, setBranches] = useState([]);
    const [showWarehouseFailModal, setShowWarehouseFailModal] = useState(false);
    const [warehouseFailRoom, setWarehouseFailRoom] = useState(null);

    // Import states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importDate, setImportDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [availableItems, setAvailableItems] = useState([]);
    const [importList, setImportList] = useState([
        { isNew: false, furnitureId: '', furnitureName: '', price: '', quantity: 1, unit: '', type: '' }
    ]);

    // Import history states
    const [showImportHistory, setShowImportHistory] = useState(false);
    const [importHistory, setImportHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historySelectedReceipt, setHistorySelectedReceipt] = useState(null);
    const historyPageSize = 5;

    // Item-specific history panel (slide-in side panel from detail modal)
    const [showItemHistoryPanel, setShowItemHistoryPanel] = useState(false);
    const [itemHistoryData, setItemHistoryData] = useState([]);

    /* ─── Data Fetching ────────────────────────────────────────────── */

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await furnitureApi.listBranches();
                setBranches([
                    { value: 'all', label: 'All branches' },
                    ...(Array.isArray(data) ? data.map(b => ({ value: String(b.branchId), label: b.branchName })) : [])
                ]);
            } catch (err) { console.error('Failed to fetch branches:', err); }
        };
        fetchBranches();

        const fetchTypes = async () => {
            try {
                const typeData = await apiClient.get('/inventory/furniture/types');
                setFurnitureTypes(typeData.data || []);
            } catch (e) {
                console.error('Failed to fetch types:', e);
            }
        };
        fetchTypes();
    }, []);

    const fetchFurnitureData = useCallback(async (branchId, searchKeyword = '', typeId = 'all', pageNum = 1) => {
        if (branchId === 'all') { setRows([]); return; }
        try {
            let response;
            if (searchKeyword.trim()) {
                response = await furnitureApi.searchFurnitureInventoryByBranch(branchId, searchKeyword, pageNum - 1, pageSize, typeId === 'all' ? null : typeId);
            } else {
                response = await furnitureApi.listFurnitureInventoryByBranch(branchId, pageNum - 1, pageSize, typeId === 'all' ? null : typeId);
            }
            const data = response.content || response || [];
            setTotalElements(response.totalElements || data.length);
            setRows(Array.isArray(data) ? data.map(item => ({
                id: item.furnitureId, furnitureId: item.furnitureId,
                name: item.furnitorName,
                facility: `${branches.find(b => b.value === branchId)?.label || 'Branch'} - ${item.condition || 'Area'}`,
                branch: branches.find(b => b.value === branchId)?.label || 'Unknown',
                quantity: item.quantity || 0, price: item.price || 0,
                inUse: item.inUse || 0, inStock: item.inStock || 0,
                broken: item.broken || 0, brokenInUse: item.brokenInUse || 0,
                brokenInStock: item.brokenInStock || 0,
                roomsUsing: item.roomsUsing || [], roomsBroken: item.roomsBroken || [],
                type: item.type, code: item.furnitureCode,
            })) : []);
        } catch (err) { console.error('Failed to fetch furniture:', err); setRows([]); }
    }, [branches]);

    useEffect(() => { setPage(1); }, [selectedBranch, nameApplied, typeFilterApplied]);
    useEffect(() => { fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page); }, [page, fetchFurnitureData, selectedBranch, nameApplied, typeFilterApplied]);

    /* ─── Computed ────────────────────────────────────────────────── */

    const filteredRows = useMemo(() => rows, [rows]);
    const totalPages = useMemo(() => Math.max(1, Math.ceil((totalElements || 0) / pageSize)), [totalElements, pageSize]);
    const pagedRows = useMemo(() => filteredRows, [filteredRows]);

    const groupedHistory = useMemo(() => {
        return importHistory.reduce((acc, cur) => {
            const ex = acc.find(r => r.receiptId === cur.receiptId);
            const itemTotal = (cur.unitPrice || 0) * (cur.quantity || 0);
            if (ex) { ex.details.push({ ...cur, itemTotal }); ex.totalReceiptAmount += itemTotal; }
            else acc.push({ receiptId: cur.receiptId, importDate: cur.importDate, totalReceiptAmount: itemTotal, details: [{ ...cur, itemTotal }] });
            return acc;
        }, []);
    }, [importHistory]);

    const totalHistoryPages = useMemo(() => Math.max(1, Math.ceil((groupedHistory.length || 0) / historyPageSize)), [groupedHistory.length]);
    const pagedHistory = useMemo(() => { const s = (historyPage - 1) * historyPageSize; return groupedHistory.slice(s, s + historyPageSize); }, [groupedHistory, historyPage]);

    const formatVND = v => new Intl.NumberFormat('vi-VN').format(v) + ' d';
    const formatRoomList = (arr = []) => Array.isArray(arr) ? arr : [];

    /* ─── Handlers ────────────────────────────────────────────────── */

    const applyFilters = () => {
        setNameApplied(nameDraft.trim());
        setTypeFilterApplied(typeFilterDraft);
        setPage(1);
    };
    const onChangeBranch = v => { setSelectedBranch(v); setPage(1); };
    const onChangeName = v => setNameDraft(v);
    const changePage = next => setPage(Math.max(1, Math.min(totalPages, next)));
    const changeHistoryPage = next => setHistoryPage(Math.max(1, Math.min(totalHistoryPages, next)));

    const handleOpenWarehouseFail = async () => {
        try {
            const branchParam = selectedBranch !== 'all' ? selectedBranch : '';
            const data = await furnitureApi.listRooms('WAREHOUSE_FAIL', '', 0, 10, branchParam);
            const wf = data?.content?.find(r => r.roomName === 'WAREHOUSE_FAIL');
            if (wf) { setWarehouseFailRoom(wf); setShowWarehouseFailModal(true); }
            else alert('No Warehouse Fail room found.');
        } catch { alert('Cannot load Warehouse Fail room.'); }
    };

    const openImportModal = async () => {
        try {
            const res = await apiClient.get(`/inventory/furniture/branch/${selectedBranch}/list`);
            setAvailableItems(res.data);
            setImportDate(new Date().toISOString().split('T')[0]);
            setImportList([{ isNew: false, furnitureId: '', furnitureName: '', price: '', quantity: 1, unit: '', type: '' }]);
            setIsImportModalOpen(true);
        } catch { alert('Failed to load furniture list!'); }
    };

    const openImportHistory = async () => {
        try {
            const res = await apiClient.get(`/inventory/history`, { params: { branchId: parseInt(selectedBranch) } });
            setImportHistory(res.data.filter(item => item.furnitureId));
            setShowImportHistory(true);
            setHistoryPage(1);
            setHistorySelectedReceipt(null);
        } catch { alert('Failed to load import history!'); }
    };

    const openItemSpecificHistory = async () => {
        if (!detailItem) return;
        try {
            const res = await apiClient.get(`/inventory/history`, { params: { branchId: parseInt(selectedBranch) } });
            setItemHistoryData(res.data.filter(item => item.furnitureName === detailItem.name));
            setShowItemHistoryPanel(true);
        } catch { alert('Failed to load history!'); }
    };

    const handleImportChange = (index, field, value) => {
        const newList = [...importList];
        newList[index][field] = value;
        if (field === 'furnitureId' && !newList[index].isNew) {
            const sel = availableItems.find(i => i.furnitureId === parseInt(value));
            if (sel) { newList[index].furnitureName = sel.furnitorName || ''; newList[index].price = sel.price || ''; }
        }
        setImportList(newList);
    };

    const addImportRow = () => setImportList([...importList, { isNew: false, furnitureId: '', furnitureName: '', price: '', quantity: 1, unit: '', type: '' }]);
    const removeImportRow = idx => { if (importList.length > 1) setImportList(importList.filter((_, i) => i !== idx)); };

    const submitImport = async () => {
        const valid = importList.filter(item =>
            (item.isNew && item.furnitureName.trim() !== '' && Number(item.price) > 0 && item.quantity > 0) ||
            (!item.isNew && item.furnitureId !== '' && Number(item.price) > 0 && item.quantity > 0)
        );
        if (valid.length === 0) { alert('Please fill in Item, Unit Price (>0) and Quantity!'); return; }
        const payload = valid.map(item => ({
            furnitureId: item.isNew ? null : parseInt(item.furnitureId),
            furnitureName: item.isNew ? item.furnitureName.trim() : null,
            price: Number(item.price), quantity: parseInt(item.quantity),
            unit: item.unit || 'Piece', type: item.isNew ? (item.type === '__add_new_type__' ? item.customType || '' : item.type || '') : null
        }));
        try {
            await apiClient.post(`/inventory/furniture/import`, { branchId: parseInt(selectedBranch), importDate, items: payload });
            alert('Import successful!');
            setIsImportModalOpen(false);
            fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page);
        } catch (error) {
            alert(error?.response?.data?.message || 'Import failed! Please check your data.');
        }
    };

    const handleProcessBrokenItems = async (action) => {
        if (!brokenActionQuantity || brokenActionQuantity <= 0 || brokenActionQuantity > (brokenDetailInfo?.brokenInStock || 0)) {
            alert("Invalid quantity!"); return;
        }
        try {
            setIsProcessingBroken(true);
            const branchIdParam = selectedBranch === 'all' ? "" : selectedBranch;
            const data = await furnitureApi.listRooms('WAREHOUSE_FAIL', '', 0, 10, branchIdParam);
            const wf = data?.content?.find(r => r.roomName === 'WAREHOUSE_FAIL');
            if (!wf) { alert('No warehouse fail room found!'); return; }
            if (action === 'fix') await furnitureApi.fixWarehouseFailFurniture(wf.roomId, brokenDetailInfo.id, brokenActionQuantity);
            else await furnitureApi.discardWarehouseFailFurniture(wf.roomId, brokenDetailInfo.id, brokenActionQuantity);
            setBrokenDetailInfo(null); setBrokenActionQuantity(1);
            fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page);
        } catch (e) {
            alert(e?.response?.data?.message || 'Error during processing!');
        } finally { setIsProcessingBroken(false); }
    };

    /* ─── Pagination Renderer ─────────────────────────────────────── */

    const renderPagination = (cur, total, onChange) => {
        const safe = Math.max(1, total);
        const MAX = 6;
        let start = Math.max(1, cur - Math.floor(MAX / 2));
        let end = Math.min(safe, start + MAX - 1);
        if (end - start + 1 < MAX) start = Math.max(1, end - MAX + 1);
        const btn = (key, label, page, disabled, active) => (
            <button key={key} className={`btn-page${active ? ' active' : ''}${disabled ? '' : ''}`} disabled={disabled} onClick={() => onChange(page)}>
                {label}
            </button>
        );
        return (
            <div className="pagination-controls">
                {btn('prev', <i className="bi bi-chevron-left"></i>, cur - 1, cur <= 1)}
                {start > 1 && <><button className="btn-page" onClick={() => onChange(1)}>1</button>{start > 2 && <span className="page-dots">…</span>}</>}
                {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => btn(p, p, p, false, cur === p))}
                {end < safe && <>{end < safe - 1 && <span className="page-dots">…</span>}<button className="btn-page" onClick={() => onChange(safe)}>{safe}</button></>}
                {btn('next', <i className="bi bi-chevron-right"></i>, cur + 1, cur >= safe)}
            </div>
        );
    };

    /* ─── Receipt Summary Computed for Import History side panel ── */
    const historyReceiptStats = useMemo(() => {
        if (!historySelectedReceipt) return null;
        const totalQty = historySelectedReceipt.details.reduce((s, d) => s + (d.quantity || 0), 0);
        const avgPrice = historySelectedReceipt.details.length
            ? Math.round(historySelectedReceipt.totalReceiptAmount / historySelectedReceipt.details.reduce((s, d) => s + (d.quantity || 0), 0))
            : 0;
        return { totalQty, avgPrice };
    }, [historySelectedReceipt]);

    /* ─── Item History Summary ──────────────────────────────────── */
    const groupedItemHistory = useMemo(() => {
        return itemHistoryData.reduce((acc, cur) => {
            const ex = acc.find(r => r.receiptId === cur.receiptId);
            const itemTotal = (cur.unitPrice || 0) * (cur.quantity || 0);
            if (ex) { ex.details.push({ ...cur, itemTotal }); ex.totalAmount += itemTotal; ex.totalQty += (cur.quantity || 0); }
            else acc.push({ receiptId: cur.receiptId, importDate: cur.importDate, totalAmount: itemTotal, totalQty: cur.quantity || 0, details: [{ ...cur, itemTotal }] });
            return acc;
        }, []);
    }, [itemHistoryData]);

    const itemHistorySummary = useMemo(() => ({
        times: groupedItemHistory.length,
        totalQty: groupedItemHistory.reduce((s, r) => s + r.totalQty, 0),
        totalAmount: groupedItemHistory.reduce((s, r) => s + r.totalAmount, 0),
        avgPrice: groupedItemHistory.length
            ? Math.round(groupedItemHistory.reduce((s, r) => s + r.totalAmount, 0) / Math.max(1, groupedItemHistory.reduce((s, r) => s + r.totalQty, 0)))
            : 0,
    }), [groupedItemHistory]);

    /* ─── Render ──────────────────────────────────────────────────── */
    return (
        <div style={{ background: '#F2F3EE', minHeight: '100vh', paddingBottom: 40 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
                .fi-root * { font-family: 'DM Sans', sans-serif; }

                /* Hero */
                .fi-hero { background: linear-gradient(135deg, ${BRAND} 0%, #3d4a33 100%); padding: 32px 0 52px; position: relative; z-index: 10; margin-bottom: -24px; }
                .fi-hero::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 32px; background: #F2F3EE; border-radius: 20px 20px 0 0; z-index: -1; pointer-events: none; }

                /* Sidebar */
                .fi-filter-box { background: #fff; border-radius: 16px; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,.04); border: 1px solid #eee; position: sticky; top: 20px; }
                .fi-filter-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1rem; color: #222; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px dashed #eee; }
                .fi-filter-group { margin-bottom: 18px; }
                .fi-filter-label { display: block; font-size: .72rem; font-weight: 700; color: #888; margin-bottom: 7px; text-transform: uppercase; letter-spacing: .5px; }
                .fi-filter-input { width: 100%; border: 1.5px solid #e5e5e0; border-radius: 10px; padding: 9px 12px; font-size: .88rem; background: #FAFAF7; transition: all .2s; }
                .fi-filter-input:focus { outline: none; border-color: ${BRAND}; background: #fff; box-shadow: 0 0 0 3px rgba(92,111,78,.1); }

                /* Header bar */
                .fi-res-hdr { background: #fff; border-radius: 14px; padding: 14px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
                .fi-res-cnt { font-size: .9rem; font-weight: 700; color: #333; display: flex; align-items: center; }
                .fi-res-cnt span { color: ${BRAND}; font-weight: 800; margin: 0 4px; }

                /* Action buttons */
                .fi-btn-action { padding: 9px 16px; border-radius: 8px; font-weight: 600; font-size: .82rem; border: none; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; gap: 6px; }
                .fi-btn-import { background: #F0A500; color: #fff; }
                .fi-btn-import:hover:not(:disabled) { background: #d99200; }
                .fi-btn-history { background: #5a6268; color: #fff; }
                .fi-btn-history:hover:not(:disabled) { background: #4a5258; }
                .fi-btn-action:disabled { opacity: .45; cursor: not-allowed; }

                /* Table */
                .fi-table-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; overflow: hidden; }
                .fi-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
                .fi-table th { background: #F8F8F5; padding: 13px 16px; text-align: center; color: #666; font-weight: 700; border-bottom: 2px solid #eee; white-space: nowrap; font-size: .78rem; text-transform: uppercase; letter-spacing: .4px; }
                .fi-table td { padding: 13px 16px; border-bottom: 1px solid #f0f0ea; vertical-align: middle; }
                .fi-table tr:last-child td { border-bottom: none; }
                .fi-table tbody tr:hover { background: #FAFAF7; }

                /* Badges */
                .fi-badge { padding: 4px 10px; border-radius: 6px; font-size: .75rem; font-weight: 700; display: inline-block; text-align: center; min-width: 36px; }
                .fi-badge-stock { background: rgba(16,185,129,.1); color: #10b981; }
                .fi-badge-use { background: rgba(79,70,229,.1); color: #4f46e5; }
                .fi-badge-broken { background: rgba(239,68,68,.1); color: #ef4444; cursor: pointer; }
                .fi-badge-broken:hover { background: rgba(239,68,68,.18); }

                /* Detail button */
                .fi-btn-detail { background: #f0f2f5; color: #555; border: none; padding: 6px 12px; border-radius: 6px; font-size: .78rem; font-weight: 600; cursor: pointer; transition: all .2s; }
                .fi-btn-detail:hover:not(:disabled) { background: #e4e6e9; }
                .fi-btn-detail:disabled { opacity: .45; cursor: not-allowed; }

                /* Empty state */
                .fi-empty { background: #fff; border-radius: 16px; padding: 48px 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; }
                .fi-empty i { font-size: 3rem; color: #ddd; display: block; margin-bottom: 12px; }

                /* Pagination */
                .fi-pagination { display: flex; align-items: center; justify-content: center; padding: 18px; background: #fff; border-top: 1px solid #eee; }
                .pagination-controls { display: flex; gap: 6px; align-items: center; }
                .btn-page { background: #fff; border: 1px solid #eee; min-width: 34px; height: 34px; padding: 0 9px; border-radius: 8px; font-size: .88rem; font-weight: 500; color: ${BRAND}; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; }
                .btn-page:hover:not(:disabled) { background: #f0f4f0; }
                .btn-page.active { background: ${BRAND}; border-color: ${BRAND}; color: #fff; font-weight: 700; }
                .btn-page:disabled { opacity: .35; cursor: not-allowed; }
                .page-dots { color: #aaa; padding: 0 4px; font-weight: 600; }

                /* View toggle */
                .fi-view-toggle { display: flex; background: #f0f2f5; border-radius: 8px; padding: 4px; gap: 4px; }
                .fi-vt-btn { background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: #666; cursor: pointer; transition: all .2s; font-size: .82rem; }
                .fi-vt-btn.active { background: #fff; color: ${BRAND}; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,.06); }

                /* Grid */
                .fi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(285px, 1fr)); gap: 18px; padding: 20px; }
                .fi-card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.04); border: 1px solid #eee; transition: all .25s; }
                .fi-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.09); transform: translateY(-2px); }
                .fi-card-header { padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
                .fi-card-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; background: rgba(92,111,78,.1); color: ${BRAND}; }
                .fi-card-info { flex: 1; min-width: 0; }
                .fi-card-code { font-size: .7rem; color: #aaa; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: .5px; }
                .fi-card-name { font-weight: 700; font-size: .93rem; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .fi-card-branch { font-size: .78rem; color: #888; margin-top: 2px; }

                /* Grid footer stats — FIXED alignment */
                .fi-card-footer { border-top: 1px solid #F0F0EA; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); background: #FAFAF7; }
                .fi-card-stat { padding: 12px 8px; text-align: center; border-right: 1px solid #F0F0EA; display: flex; flex-direction: column; align-items: center; gap: 6px; }
                .fi-card-stat:last-child { border-right: none; }
                .fi-card-stat-lbl { color: #aaa; font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; }
                .fi-card-stat-val { font-size: .9rem; font-weight: 700; color: #333; line-height: 1; display: flex; align-items: center; justify-content: center; min-height: 24px; }

                /* Modals */
                .fi-overlay { position: fixed; inset: 0; background: rgba(15,20,40,.55); backdrop-filter: blur(2px); z-index: 1050; display: flex; align-items: center; justify-content: center; }

                /* Import Modal */
                .fi-import-modal { background: #fff; border-radius: 18px; width: min(680px, 95vw); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,.2); }
                .fi-import-modal-hdr { padding: 22px 28px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
                .fi-import-modal-body { padding: 24px 28px; overflow-y: auto; flex: 1; }
                .fi-import-modal-ftr { padding: 16px 28px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px; background: #FAFAF7; border-radius: 0 0 18px 18px; }
                .fi-form-label { display: block; font-size: .72rem; font-weight: 700; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px; }
                .fi-form-input { width: 100%; border: 1.5px solid #e5e5e0; border-radius: 9px; padding: 9px 12px; font-size: .88rem; background: #FAFAF7; transition: all .2s; }
                .fi-form-input:focus { outline: none; border-color: ${BRAND}; background: #fff; box-shadow: 0 0 0 3px rgba(92,111,78,.1); }
                .fi-form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
                .fi-item-row { background: #FAFAF7; border-radius: 10px; border: 1.5px solid #eee; padding: 14px 16px; margin-bottom: 10px; }
                .fi-item-row-new { border-color: rgba(92,111,78,.3); background: rgba(92,111,78,.03); }
                .fi-item-grid { display: grid; grid-template-columns: 2fr 80px 100px 70px 28px; gap: 8px; align-items: end; }
                .fi-add-row-btn { width: 100%; padding: 10px; background: transparent; border: 2px dashed #ccc; border-radius: 10px; color: #888; font-size: .85rem; font-weight: 600; cursor: pointer; margin-top: 6px; transition: all .2s; }
                .fi-add-row-btn:hover { border-color: ${BRAND}; color: ${BRAND}; background: rgba(92,111,78,.03); }

                /* Import History Modal - full page with side panel */
                .fi-history-modal { background: #fff; border-radius: 18px; width: min(960px, 96vw); height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,.2); }
                .fi-history-layout { display: flex; flex: 1; overflow: hidden; }
                .fi-history-main { flex: 1; overflow-y: auto; }
                .fi-history-panel { width: 320px; flex-shrink: 0; border-left: 1px solid #eee; background: #FAFAF7; overflow-y: auto; transition: all .3s; display: flex; flex-direction: column; }
                .fi-history-panel-hdr { padding: 20px; border-bottom: 1px solid #eee; background: #fff; }
                .fi-panel-stat { padding: 12px 20px; border-bottom: 1px solid #f0f0ea; }
                .fi-panel-stat-row { display: flex; justify-content: space-between; align-items: baseline; }
                .fi-receipt-row { padding: 12px 20px; border-bottom: 1px solid #f0f0ea; display: flex; align-items: flex-start; gap: 10px; cursor: pointer; transition: background .15s; }
                .fi-receipt-row:hover { background: rgba(92,111,78,.04); }
                .fi-receipt-dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; flex-shrink: 0; margin-top: 5px; }
                .fi-receipt-dot.active { background: ${BRAND}; }

                /* Side Panel (Broken + Item History) */
                .fi-side-panel { position: fixed; top: 0; right: 0; height: 100vh; width: 360px; background: #fff; box-shadow: -8px 0 32px rgba(0,0,0,.12); z-index: 1080; display: flex; flex-direction: column; animation: slideFromRight .25s ease; }
                @keyframes slideFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .fi-side-panel-hdr { padding: 22px 24px; border-bottom: 1px solid #eee; }
                .fi-side-panel-body { flex: 1; overflow-y: auto; padding: 0; }
                .fi-side-stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid #eee; }
                .fi-side-stat { padding: 16px 12px; text-align: center; border-right: 1px solid #eee; }
                .fi-side-stat:last-child { border-right: none; }
                .fi-side-stat-lbl { font-size: .65rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
                .fi-side-stat-val { font-size: 1.15rem; font-weight: 700; color: #111; }
                .fi-side-entry { padding: 14px 20px; border-bottom: 1px solid #f0f0ea; display: flex; gap: 10px; align-items: flex-start; }
                .fi-side-entry-dot { width: 8px; height: 8px; border-radius: 50%; background: ${BRAND}; flex-shrink: 0; margin-top: 5px; }
                .fi-side-entry-content { flex: 1; }

                /* Warehouse fail card */
                .fi-wf-card { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 12px rgba(0,0,0,.03); border: 1px solid #eee; border-left: 4px solid #dc3545; margin-top: 16px; }

                /* Broken modal */
                .fi-broken-modal { background: #fff; border-radius: 18px; width: min(480px, 92vw); box-shadow: 0 24px 64px rgba(0,0,0,.2); overflow: hidden; }
                .fi-broken-section { padding: 16px 20px; border-bottom: 1px solid #f0f0ea; }

                /* Buttons */
                .fi-btn-primary { background: ${BRAND}; color: #fff; border: none; border-radius: 10px; padding: 10px 22px; font-weight: 700; font-size: .88rem; cursor: pointer; transition: all .2s; }
                .fi-btn-primary:hover { opacity: .88; }
                .fi-btn-secondary { background: #f0f2f5; color: #555; border: none; border-radius: 10px; padding: 10px 22px; font-weight: 600; font-size: .88rem; cursor: pointer; transition: all .2s; }
                .fi-btn-secondary:hover { background: #e4e6e9; }
                .fi-btn-save { background: #F0A500; color: #fff; border: none; border-radius: 10px; padding: 10px 22px; font-weight: 700; font-size: .88rem; cursor: pointer; transition: all .2s; }
                .fi-btn-save:hover { background: #d99200; }
                .fi-close-btn { background: none; border: none; cursor: pointer; color: #aaa; font-size: 1.3rem; padding: 2px 6px; border-radius: 6px; transition: all .2s; line-height: 1; }
                .fi-close-btn:hover { background: #f0f2f5; color: #555; }

                /* Type toggle in import row */
                .fi-type-toggle { display: flex; gap: 6px; margin-bottom: 10px; }
                .fi-type-toggle-btn { padding: 5px 12px; border-radius: 20px; border: 1.5px solid #eee; font-size: .78rem; font-weight: 600; cursor: pointer; transition: all .2s; background: transparent; color: #888; }
                .fi-type-toggle-btn.active { border-color: ${BRAND}; color: ${BRAND}; background: rgba(92,111,78,.07); }
            `}</style>

            <div className="fi-root">
                {/* Hero */}
                <div className="container" style={{ paddingTop: '28px', paddingBottom: '16px' }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}><div><nav style={{ fontSize: "0.75rem", color: "#999", marginBottom: 8 }}><span>Admin Panel</span><span style={{ margin: "0 8px", color: "#ccc" }}>/</span><span style={{ color: BRAND, fontWeight: 600 }}>Furniture Inventory</span></nav><h1 style={{ fontSize: "1.65rem", fontWeight: 700, color: "#111", margin: 0, letterSpacing: "-0.5px" }}>Furniture Inventory</h1><div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}><p style={{ color: "#888", fontSize: "0.85rem", margin: 0 }}>Manage and track all furniture items efficiently.</p></div></div></div></div>

                <div className="container pb-5">
                    <div className="row g-4">
                        {/* Sidebar */}
                        <div className="col-lg-3 col-md-4">
                            <div className="fi-filter-box">
                                <div className="fi-filter-title"><i className="bi bi-funnel"></i><span>Filters</span></div>

                                <div className="fi-filter-group">
                                    <label className="fi-filter-label"><i className="bi bi-shop me-1"></i>Branch</label>
                                    <select className="fi-filter-input fi-form-select" value={selectedBranch} onChange={e => onChangeBranch(e.target.value)}>
                                        {branches.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                    </select>
                                </div>

                                <div className="fi-filter-group">
                                    <label className="fi-filter-label"><i className="bi bi-tag me-1"></i>Type</label>
                                    <select className="fi-filter-input fi-form-select" value={typeFilterDraft} onChange={e => setTypeFilterDraft(e.target.value)}>
                                        <option value="all">All Types</option>
                                        {furnitureTypes.map(t => <option key={t.typeId} value={t.typeId}>{t.typeName}</option>)}
                                    </select>
                                </div>

                                <div className="fi-filter-group">
                                    <label className="fi-filter-label"><i className="bi bi-search me-1"></i>By Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '.85rem', pointerEvents: 'none' }}></i>
                                        <form onSubmit={e => { e.preventDefault(); applyFilters(); }}>
                                            <input className="fi-filter-input" style={{ paddingLeft: 36 }} type="text" placeholder="Search by name..." value={nameDraft} onChange={e => onChangeName(e.target.value)} />
                                        </form>
                                    </div>
                                </div>

                                <button className="fi-btn-primary w-100" onClick={applyFilters} style={{ borderRadius: 10, padding: '10px' }}>
                                    <i className="bi bi-search me-2"></i>Search
                                </button>

                                {/* Warehouse Fail */}
                                <div className="fi-wf-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#dc3545', marginBottom: 6 }}>
                                        <i className="bi bi-exclamation-triangle-fill"></i> Warehouse Fail
                                    </div>
                                    <p style={{ color: '#888', fontSize: '.8rem', margin: '0 0 12px' }}>Manage faulty and broken equipment in warehouse.</p>
                                    <button onClick={handleOpenWarehouseFail} style={{ width: '100%', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>
                                        <i className="bi bi-tools me-2"></i>Warehouse Fail
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main */}
                        <div className="col-lg-9 col-md-8">
                            {/* Header */}
                            <div className="fi-res-hdr">
                                <div className="fi-res-cnt"><i className="bi bi-boxes me-2" style={{ fontSize: '1.1rem', color: BRAND }}></i>Found <span>{totalElements}</span> items</div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <div className="fi-view-toggle">
                                        <button className={`fi-vt-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><i className="bi bi-list-ul"></i></button>
                                        <button className={`fi-vt-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><i className="bi bi-grid-fill"></i></button>
                                    </div>
                                    <button onClick={openImportHistory} disabled={selectedBranch === 'all'} className="fi-btn-action fi-btn-history">
                                        <i className="bi bi-clock-history"></i> History
                                    </button>
                                    <button onClick={openImportModal} disabled={selectedBranch === 'all'} className="fi-btn-action fi-btn-import">
                                        <i className="bi bi-download"></i> Import
                                    </button>
                                </div>
                            </div>

                            {/* Data */}
                            {pagedRows.length === 0 ? (
                                <div className="fi-empty">
                                    <i className="bi bi-inboxes"></i>
                                    <h5 className="text-secondary">No furniture found</h5>
                                    <p className="text-muted mb-0" style={{ fontSize: '.88rem' }}>Try changing your filters or select a different branch.</p>
                                </div>
                            ) : (
                                <div className="fi-table-card">
                                    {viewMode === 'list' ? (
                                        <div className="table-responsive">
                                            <table className="fi-table">
                                                <thead>
                                                <tr>
                                                    <th style={{ width: 50 }}>ID</th>
                                                    <th style={{ textAlign: 'left' }}>Furniture</th>
                                                    <th>Branch</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                    <th>In Use</th>
                                                    <th>In Stock</th>
                                                    <th>Broken</th>
                                                    <th>Action</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {pagedRows.map(row => (
                                                    <tr key={row.id}>
                                                        <td style={{ textAlign: 'center', color: '#aaa', fontWeight: 700, fontFamily: 'monospace', fontSize: '.8rem' }}>#{row.id}</td>
                                                        <td>
                                                            <div style={{ fontWeight: 700, color: '#111', fontSize: '.88rem' }}>{row.name}</div>
                                                            {row.type && <div style={{ fontSize: '.75rem', color: '#aaa', marginTop: 2 }}>{row.type}</div>}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontSize: '.83rem', color: '#555' }}>{row.branch}</td>
                                                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.quantity}</td>
                                                        <td style={{ textAlign: 'center', color: '#dc3545', fontWeight: 700 }}>{formatVND(row.price)}</td>
                                                        <td style={{ textAlign: 'center' }}>{row.inUse > 0 ? <span className="fi-badge fi-badge-use">{row.inUse}</span> : <span style={{ color: '#ccc' }}>—</span>}</td>
                                                        <td style={{ textAlign: 'center' }}>{row.inStock > 0 ? <span className="fi-badge fi-badge-stock">{row.inStock}</span> : <span style={{ color: '#ccc' }}>—</span>}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {row.broken > 0 ? (
                                                                <span className="fi-badge fi-badge-broken" onClick={e => { e.stopPropagation(); setBrokenDetailInfo(row); }}>{row.broken}</span>
                                                            ) : <span style={{ color: '#ccc' }}>—</span>}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button className="fi-btn-detail" onClick={() => setDetailItem(row)} disabled={selectedBranch === 'all'}>Details</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="fi-grid">
                                            {pagedRows.map(row => (
                                                <div key={row.id} className="fi-card">
                                                    <div className="fi-card-header">
                                                        <div className="fi-card-icon"><i className="bi bi-box-seam"></i></div>
                                                        <div className="fi-card-info">
                                                            <div className="fi-card-code">#{row.id}</div>
                                                            <div className="fi-card-name">{row.name}{row.type && <span style={{ fontSize: '.73rem', color: '#aaa', fontWeight: 400 }}> ({row.type})</span>}</div>
                                                            <div className="fi-card-branch">{row.branch}</div>
                                                        </div>
                                                        <button className="fi-btn-detail" onClick={() => setDetailItem(row)} disabled={selectedBranch === 'all'}>Details</button>
                                                    </div>
                                                    <div className="fi-card-footer">
                                                        <div className="fi-card-stat">
                                                            <div className="fi-card-stat-lbl">Qty</div>
                                                            <div className="fi-card-stat-val" style={{ fontWeight: 700 }}>{row.quantity}</div>
                                                        </div>
                                                        <div className="fi-card-stat">
                                                            <div className="fi-card-stat-lbl">In Stock</div>
                                                            <div className="fi-card-stat-val">{row.inStock > 0 ? <span className="fi-badge fi-badge-stock">{row.inStock}</span> : <span style={{ color: '#ccc', fontSize: '1rem' }}>—</span>}</div>
                                                        </div>
                                                        <div className="fi-card-stat">
                                                            <div className="fi-card-stat-lbl">In Use</div>
                                                            <div className="fi-card-stat-val">{row.inUse > 0 ? <span className="fi-badge fi-badge-use">{row.inUse}</span> : <span style={{ color: '#ccc', fontSize: '1rem' }}>—</span>}</div>
                                                        </div>
                                                        <div className="fi-card-stat">
                                                            <div className="fi-card-stat-lbl">Broken</div>
                                                            <div className="fi-card-stat-val">{row.broken > 0 ? <span className="fi-badge fi-badge-broken" onClick={e => { e.stopPropagation(); setBrokenDetailInfo(row); }}>{row.broken}</span> : <span style={{ color: '#ccc', fontSize: '1rem' }}>—</span>}</div>
                                                        </div>
                                                        <div className="fi-card-stat">
                                                            <div className="fi-card-stat-lbl">Price</div>
                                                            <div className="fi-card-stat-val" style={{ fontSize: '.78rem', color: '#dc3545', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatVND(row.price)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="fi-pagination">{renderPagination(page, totalPages, changePage)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                DETAIL MODAL
            ═══════════════════════════════════════════════════════════ */}
            {detailItem && (
                <div className="fi-overlay" onClick={() => { setDetailItem(null); setShowItemHistoryPanel(false); }}>
                    <div style={{ width: 'min(900px, 95vw)', maxHeight: '92vh', background: '#fff', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,.22)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #3d4f32 100%)`, padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-box-seam" style={{ color: '#fff', fontSize: '1.2rem' }}></i>
                                </div>
                                <div>
                                    <h5 style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>{detailItem.name}</h5>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600 }}>#{detailItem.id}</span>
                                        <span style={{ background: 'rgba(25,135,84,.15)', color: '#a8ffcf', padding: '2px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600 }}>{detailItem.facility || detailItem.branch}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="fi-close-btn" style={{ color: 'rgba(255,255,255,.7)' }} onClick={() => { setDetailItem(null); setShowItemHistoryPanel(false); }}>✕</button>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '22px 28px', background: '#F8F9F5' }}>
                            {/* Stat cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                                {[
                                    { icon: 'bi-building', label: 'Branch', value: detailItem.branch, color: BRAND },
                                    { icon: 'bi-tags', label: 'Total Qty', value: `${detailItem.quantity}`, color: '#0d6efd' },
                                    { icon: 'bi-cash', label: 'Unit Price', value: formatVND(detailItem.price), color: '#dc3545' },
                                    { icon: 'bi-archive', label: 'In Stock', value: `${detailItem.inStock}`, color: '#198754' },
                                ].map(info => (
                                    <div key={info.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${info.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <i className={`bi ${info.icon}`} style={{ color: info.color, fontSize: '.9rem' }}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px' }}>{info.label}</div>
                                            <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#111' }}>{info.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Usage condition */}
                            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 16, overflow: 'hidden' }}>
                                <div style={{ padding: '13px 18px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <i className="bi bi-pie-chart" style={{ color: BRAND }}></i>
                                    <span style={{ fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px', color: '#333' }}>Usage Condition</span>
                                </div>
                                <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                    {[
                                        { label: 'Good / In Use', val: detailItem.inUse, color: '#0d6efd', icon: 'bi-check-circle-fill', clickable: false },
                                        { label: 'In Stock', val: detailItem.inStock, color: '#198754', icon: 'bi-box-seam', clickable: false },
                                        { label: 'Broken', val: detailItem.broken, color: '#dc3545', icon: 'bi-exclamation-triangle-fill', clickable: true },
                                    ].map((c, i) => {
                                        const pct = detailItem.quantity ? Math.round((c.val / detailItem.quantity) * 100) : 0;
                                        return (
                                            <div key={i}
                                                 onClick={c.clickable && c.val > 0 ? () => setBrokenDetailInfo(detailItem) : undefined}
                                                 style={{ cursor: c.clickable && c.val > 0 ? 'pointer' : 'default', borderRadius: 10, padding: c.clickable && c.val > 0 ? '8px 10px' : '0', background: c.clickable && c.val > 0 ? 'rgba(220,53,69,.04)' : 'transparent', border: c.clickable && c.val > 0 ? '1.5px dashed rgba(220,53,69,.25)' : '1.5px solid transparent', transition: 'all .2s' }}
                                                 title={c.clickable && c.val > 0 ? 'Click to view broken details' : undefined}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem', fontWeight: 700, color: c.color }}><i className={`bi ${c.icon}`} style={{ fontSize: '.7rem' }}></i>{c.label}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontWeight: 700, color: c.color, fontSize: '.88rem' }}>{c.val}</span>
                                                        {c.clickable && c.val > 0 && (
                                                            <span style={{ fontSize: '.62rem', fontWeight: 700, color: '#dc3545', background: 'rgba(220,53,69,.1)', padding: '1px 6px', borderRadius: 10 }}>
                                                                View →
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ height: 6, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: c.color, borderRadius: 6, transition: 'width .4s ease' }}></div>
                                                </div>
                                                <div style={{ fontSize: '.68rem', color: '#aaa', marginTop: 3 }}>{pct}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rooms */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {/* Rooms Using */}
                                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <i className="bi bi-door-open" style={{ color: BRAND }}></i>
                                        <span style={{ fontWeight: 700, fontSize: '.73rem', textTransform: 'uppercase', letterSpacing: '.5px', color: BRAND }}>Rooms Using This Item</span>
                                        <span style={{ marginLeft: 'auto', background: `${BRAND}18`, color: BRAND, padding: '2px 8px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700 }}>{detailItem.roomsUsing?.length || 0}</span>
                                    </div>
                                    <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {(detailItem.roomsUsing || []).length ? formatRoomList(detailItem.roomsUsing).map(r => (
                                            <span key={r} style={{ background: '#f0f2f5', color: '#444', padding: '4px 12px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600 }}>{r}</span>
                                        )) : <span style={{ color: '#ccc', fontSize: '.83rem' }}>None</span>}
                                    </div>
                                </div>

                                {/* Rooms With Broken — clickable to open broken panel */}
                                <div
                                    style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden', cursor: detailItem.broken > 0 ? 'pointer' : 'default', border: detailItem.broken > 0 ? '1.5px solid rgba(220,53,69,.2)' : '1px solid transparent', transition: 'all .2s' }}
                                    onClick={detailItem.broken > 0 ? () => setBrokenDetailInfo(detailItem) : undefined}
                                    title={detailItem.broken > 0 ? 'Click to manage broken items' : undefined}
                                >
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #fde8e8', display: 'flex', alignItems: 'center', gap: 8, background: detailItem.broken > 0 ? 'rgba(220,53,69,.03)' : '#fff' }}>
                                        <i className="bi bi-tools" style={{ color: '#dc3545' }}></i>
                                        <span style={{ fontWeight: 700, fontSize: '.73rem', textTransform: 'uppercase', letterSpacing: '.5px', color: '#dc3545' }}>Rooms With Broken Items</span>
                                        <span style={{ marginLeft: 'auto', background: 'rgba(220,53,69,.1)', color: '#dc3545', padding: '2px 8px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700 }}>{detailItem.roomsBroken?.length || 0}</span>
                                        {detailItem.broken > 0 && (
                                            <span style={{ background: '#dc3545', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: '.65rem', fontWeight: 700 }}>
                                                {detailItem.broken} broken · Manage →
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {(detailItem.roomsBroken || []).length ? formatRoomList(detailItem.roomsBroken).map(r => (
                                            <span key={r} style={{ background: 'rgba(220,53,69,.1)', color: '#dc3545', padding: '4px 12px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600 }}>{r}</span>
                                        )) : <span style={{ color: '#ccc', fontSize: '.83rem' }}>None</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}

                        <div style={{ padding: '14px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', flexShrink: 0 }}>
                            <span style={{ color: '#bbb', fontSize: '.8rem' }}>Record #{detailItem.id}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="fi-btn-save" onClick={openItemSpecificHistory}><i className="bi bi-clock-history me-2"></i>Import History</button>
                                <button className="fi-btn-secondary" onClick={() => { setDetailItem(null); setShowItemHistoryPanel(false); }}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ITEM IMPORT HISTORY — SIDE PANEL (slides over detail modal)
            ═══════════════════════════════════════════════════════════ */}
            {showItemHistoryPanel && detailItem && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1075 }} onClick={() => setShowItemHistoryPanel(false)}></div>
                    <div className="fi-side-panel">
                        <div className="fi-side-panel-hdr">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>Import History — <span style={{ color: BRAND }}>{detailItem.name}</span></div>
                                    <div style={{ color: '#aaa', fontSize: '.78rem', marginTop: 3 }}>{itemHistorySummary.times} import records</div>
                                </div>
                                <button className="fi-close-btn" onClick={() => setShowItemHistoryPanel(false)}>✕</button>
                            </div>
                            {/* Summary stats */}
                            <div className="fi-side-stat-row" style={{ marginTop: 14, border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
                                <div className="fi-side-stat">
                                    <div className="fi-side-stat-lbl">Times</div>
                                    <div className="fi-side-stat-val">{itemHistorySummary.times}</div>
                                </div>
                                <div className="fi-side-stat">
                                    <div className="fi-side-stat-lbl">Total Qty</div>
                                    <div className="fi-side-stat-val">{itemHistorySummary.totalQty}</div>
                                </div>
                                <div className="fi-side-stat">
                                    <div className="fi-side-stat-lbl">Avg Price</div>
                                    <div className="fi-side-stat-val" style={{ fontSize: '.88rem', color: '#F0A500', fontWeight: 700 }}>{formatVND(itemHistorySummary.avgPrice)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="fi-side-panel-body">
                            {groupedItemHistory.length === 0 ? (
                                <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>
                                    <i className="bi bi-clock-history" style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }}></i>
                                    No import history found.
                                </div>
                            ) : groupedItemHistory.map(r => (
                                <div key={r.receiptId} className="fi-side-entry">
                                    <div className="fi-side-entry-dot" style={{ marginTop: 6 }}></div>
                                    <div className="fi-side-entry-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#111' }}>Receipt #{r.receiptId}</div>
                                                <div style={{ fontSize: '.75rem', color: '#aaa', marginTop: 2 }}>{new Date(r.importDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#F0A500' }}>+{r.totalQty} pcs</div>
                                                <div style={{ fontSize: '.72rem', color: '#aaa' }}>{formatVND(r.details[0]?.unitPrice || 0)}/pc</div>
                                                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#dc3545' }}>= {formatVND(r.totalAmount)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '.8rem', color: '#aaa' }}>Total cost: <strong style={{ color: '#dc3545' }}>{formatVND(itemHistorySummary.totalAmount)}</strong></span>
                            <button className="fi-btn-secondary" style={{ padding: '7px 16px', fontSize: '.82rem' }} onClick={() => setShowItemHistoryPanel(false)}>Close</button>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════
                BROKEN DETAIL — SIDE PANEL
            ═══════════════════════════════════════════════════════════ */}
            {brokenDetailInfo && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,40,.25)', zIndex: 1074 }} onClick={() => { setBrokenDetailInfo(null); setBrokenActionQuantity(1); }}></div>
                    <div className="fi-side-panel" style={{ zIndex: 1076 }}>
                        <div className="fi-side-panel-hdr" style={{ borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1rem', color: '#dc3545' }}>
                                        <i className="bi bi-exclamation-triangle-fill"></i> Broken Details
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#111', marginTop: 4 }}>{brokenDetailInfo.name}</div>
                                    <div style={{ fontSize: '.75rem', color: '#aaa' }}>#{brokenDetailInfo.id}</div>
                                </div>
                                <button className="fi-close-btn" onClick={() => { setBrokenDetailInfo(null); setBrokenActionQuantity(1); }}>✕</button>
                            </div>

                            {/* Summary stats */}
                            <div className="fi-side-stat-row" style={{ marginTop: 14, border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
                                <div className="fi-side-stat">
                                    <div className="fi-side-stat-lbl">Total Broken</div>
                                    <div className="fi-side-stat-val" style={{ color: '#dc3545' }}>{brokenDetailInfo.broken}</div>
                                </div>
                                <div className="fi-side-stat">
                                    <div className="fi-side-stat-lbl">In Warehouse</div>
                                    <div className="fi-side-stat-val" style={{ color: '#dc3545' }}>{brokenDetailInfo.brokenInStock}</div>
                                </div>
                                <div className="fi-side-stat">
                                    <div className="fi-side-stat-lbl">In Rooms</div>
                                    <div className="fi-side-stat-val" style={{ color: '#888' }}>{brokenDetailInfo.brokenInUse}</div>
                                </div>
                            </div>
                        </div>

                        <div className="fi-side-panel-body">
                            {/* Warehouse Fail section */}
                            <div className="fi-broken-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc3545' }}></div>
                                        <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#dc3545', textTransform: 'uppercase', letterSpacing: '.3px' }}>Warehouse Fail</span>
                                    </div>
                                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#dc3545' }}>{brokenDetailInfo.brokenInStock || 0} <span style={{ fontSize: '.82rem', color: '#aaa', fontWeight: 400 }}>pcs</span></span>
                                </div>
                                {(brokenDetailInfo.brokenInStock > 0) && (
                                    <div style={{ background: '#fff5f5', borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
                                        <div style={{ fontSize: '.78rem', color: '#dc3545', fontWeight: 700, marginBottom: 10 }}>Deal with broken items in stock:</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="number" min={1} max={brokenDetailInfo.brokenInStock}
                                                value={brokenActionQuantity}
                                                onChange={e => setBrokenActionQuantity(Number(e.target.value))}
                                                disabled={isProcessingBroken}
                                                style={{ width: 68, padding: '7px 10px', border: '1.5px solid #eee', borderRadius: 8, fontSize: '.88rem', fontWeight: 600 }}
                                            />
                                            <button onClick={() => handleProcessBrokenItems('fix')} disabled={isProcessingBroken}
                                                    style={{ flex: 1, padding: '7px 0', background: '#198754', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                                <i className="bi bi-tools me-1"></i>Fixed
                                            </button>
                                            <button onClick={() => handleProcessBrokenItems('discard')} disabled={isProcessingBroken}
                                                    style={{ flex: 1, padding: '7px 0', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                                <i className="bi bi-trash me-1"></i>Discard
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* In Room section */}
                            <div className="fi-broken-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c757d' }}></div>
                                        <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '.3px' }}>In Room</span>
                                    </div>
                                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#6c757d' }}>{brokenDetailInfo.brokenInUse || 0} <span style={{ fontSize: '.82rem', color: '#aaa', fontWeight: 400 }}>pcs</span></span>
                                </div>
                                {brokenDetailInfo.roomsBroken?.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                        {formatRoomList(brokenDetailInfo.roomsBroken).map(r => (
                                            <span key={r} style={{ background: 'rgba(108,117,125,.1)', color: '#555', padding: '4px 10px', borderRadius: 20, fontSize: '.78rem', fontWeight: 600 }}>{r}</span>
                                        ))}
                                    </div>
                                ) : <div style={{ fontSize: '.8rem', color: '#ccc', marginTop: 6 }}>No rooms</div>}
                            </div>
                        </div>

                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eee' }}>
                            <button className="fi-btn-secondary" style={{ width: '100%' }} onClick={() => { setBrokenDetailInfo(null); setBrokenActionQuantity(1); }}>Close</button>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════
                IMPORT MODAL — redesigned form
            ═══════════════════════════════════════════════════════════ */}
            {isImportModalOpen && (
                <div className="fi-overlay" onClick={() => setIsImportModalOpen(false)}>
                    <div className="fi-import-modal" onClick={e => e.stopPropagation()}>
                        <div className="fi-import-modal-hdr">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(92,111,78,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-box-seam" style={{ color: BRAND }}></i>
                                </div>
                                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Add Import Receipt</h5>
                            </div>
                            <button className="fi-close-btn" onClick={() => setIsImportModalOpen(false)}>✕</button>
                        </div>

                        <div className="fi-import-modal-body">
                            {/* Import Date */}
                            <div style={{ marginBottom: 22 }}>
                                <label className="fi-form-label">Import Date</label>
                                <input type="date" className="fi-form-input" value={importDate} onChange={e => setImportDate(e.target.value)} style={{ maxWidth: 200 }} />
                            </div>

                            {/* Item List */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <label className="fi-form-label" style={{ margin: 0 }}>Item List</label>
                                <button className="fi-btn-secondary" style={{ padding: '5px 14px', fontSize: '.78rem', borderRadius: 8 }} onClick={addImportRow}>+ Add Row</button>
                            </div>

                            {/* Column headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 70px 28px', gap: 8, padding: '0 0 6px', borderBottom: '1px solid #eee', marginBottom: 8 }}>
                                {['Item', 'Unit', 'Unit Price', 'Qty', ''].map((h, i) => (
                                    <div key={i} style={{ fontSize: '.68rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</div>
                                ))}
                            </div>

                            {importList.map((row, index) => (
                                <div key={index} className={`fi-item-row ${row.isNew ? 'fi-item-row-new' : ''}`}>
                                    {/* Type toggle */}
                                    <div className="fi-type-toggle" style={{ marginBottom: 8 }}>
                                        <button className={`fi-type-toggle-btn ${!row.isNew ? 'active' : ''}`} onClick={() => handleImportChange(index, 'isNew', false)}>Existing item</button>
                                        <button className={`fi-type-toggle-btn ${row.isNew ? 'active' : ''}`} onClick={() => handleImportChange(index, 'isNew', true)}>+ New item</button>
                                    </div>

                                    {/* Fields row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 70px 28px', gap: 8, alignItems: 'center' }}>
                                        {/* Item selector/input */}
                                        <div>
                                            {!row.isNew ? (
                                                <select className="fi-form-input fi-form-select" value={row.furnitureId} onChange={e => handleImportChange(index, 'furnitureId', e.target.value)}>
                                                    <option value="">-- Select item --</option>
                                                    {availableItems.map(i => <option key={i.furnitureId} value={i.furnitureId}>{i.furnitorName} ({i.type})</option>)}
                                                    
                                                </select>
                                            ) : (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <input className="fi-form-input" placeholder="Item name..." value={row.furnitureName} onChange={e => handleImportChange(index, 'furnitureName', e.target.value)} />
                                                    {row.type === '__add_new_type__' ? (
                                                        <div style={{ display: 'flex', gap: 4, width: 140, flexShrink: 0 }}>
                                                            <input className="fi-form-input" placeholder="Type name..." value={row.customType || ''} onChange={e => handleImportChange(index, 'customType', e.target.value)} style={{ flex: 1, padding: '4px 8px' }} />
                                                            <button title="Select existing type" onClick={() => handleImportChange(index, 'type', '')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0 4px' }}><i className="bi bi-x-circle"></i></button>
                                                        </div>
                                                    ) : (
                                                        <select className="fi-form-input fi-form-select" value={row.type || ''} onChange={e => handleImportChange(index, 'type', e.target.value)} style={{ width: 140, flexShrink: 0, padding: '4px 20px 4px 8px' }}>
                                                            <option value="" disabled hidden>Type</option>
                                                            {furnitureTypes.map(t => <option key={t.typeId} value={t.typeName}>{t.typeName}</option>)}
                                                            <option value="__add_new_type__" style={{ fontWeight: 'bold' }}>+ Add new type</option>
                                                        </select>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Unit */}
                                        <input className="fi-form-input" placeholder="Piece" value={row.unit} onChange={e => handleImportChange(index, 'unit', e.target.value)} />
                                        {/* Price */}
                                        <input className="fi-form-input" type="number" placeholder="Price" value={row.price} onChange={e => handleImportChange(index, 'price', e.target.value)} style={{ borderColor: '#28a745', fontWeight: 700 }} />
                                        {/* Qty */}
                                        <input className="fi-form-input" type="number" min="1" placeholder="1" value={row.quantity} onChange={e => handleImportChange(index, 'quantity', e.target.value)} />
                                        {/* Remove */}
                                        <button onClick={() => removeImportRow(index)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }} title="Remove">
                                            <i className="bi bi-x-circle-fill"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button className="fi-add-row-btn" onClick={addImportRow}>+ Add Row</button>
                        </div>

                        <div className="fi-import-modal-ftr">
                            <button className="fi-btn-secondary" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
                            <button className="fi-btn-primary" onClick={submitImport} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <i className="bi bi-floppy"></i> Save Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                IMPORT HISTORY MODAL — dashboard + side panel
            ═══════════════════════════════════════════════════════════ */}
            {showImportHistory && (
                <div className="fi-overlay" onClick={() => { setShowImportHistory(false); setHistorySelectedReceipt(null); }}>
                    <div className="fi-history-modal" onClick={e => e.stopPropagation()}>
                        {/* Modal header */}
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div>
                                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Import History — Furniture</h5>
                                <div style={{ fontSize: '.78rem', color: '#aaa', marginTop: 2 }}>{groupedHistory.length} receipt(s)</div>
                            </div>
                            <button className="fi-close-btn" onClick={() => { setShowImportHistory(false); setHistorySelectedReceipt(null); }}>✕</button>
                        </div>

                        <div className="fi-history-layout">
                            {/* Left: receipt list */}
                            <div className="fi-history-main">
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                                    <thead>
                                    <tr style={{ background: '#F8F8F5' }}>
                                        {['Receipt No.', 'Imported At', 'Total Amount', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '12px 18px', textAlign: 'center', color: '#888', fontWeight: 700, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.4px', borderBottom: '2px solid #eee' }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {pagedHistory.length > 0 ? pagedHistory.map(receipt => (
                                        <tr key={receipt.receiptId} style={{ borderBottom: '1px solid #f0f0ea', background: historySelectedReceipt?.receiptId === receipt.receiptId ? 'rgba(92,111,78,.04)' : '#fff' }}>
                                            <td style={{ padding: '13px 18px', textAlign: 'center', fontWeight: 700, color: '#111', fontFamily: 'monospace' }}>#{receipt.receiptId}</td>
                                            <td style={{ padding: '13px 18px', textAlign: 'center', color: '#888', fontSize: '.83rem' }}>{new Date(receipt.importDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td style={{ padding: '13px 18px', textAlign: 'center', fontWeight: 700, color: '#dc3545' }}>{receipt.totalReceiptAmount.toLocaleString()} d</td>
                                            <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                                                <button className="fi-btn-detail" onClick={() => setHistorySelectedReceipt(receipt)}>View details</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#ccc' }}>No import history found</td></tr>
                                    )}
                                    </tbody>
                                </table>
                                <div className="fi-pagination">{renderPagination(historyPage, totalHistoryPages, changeHistoryPage)}</div>
                            </div>

                            {/* Right: receipt detail side panel */}
                            {historySelectedReceipt ? (
                                <div className="fi-history-panel">
                                    <div className="fi-history-panel-hdr">
                                        <div style={{ fontWeight: 700, fontSize: '.92rem', color: '#111' }}>Receipt #{historySelectedReceipt.receiptId}</div>
                                        <div style={{ fontSize: '.75rem', color: '#aaa', marginTop: 2 }}>{new Date(historySelectedReceipt.importDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>

                                        {/* Summary stats */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginTop: 12, border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
                                            <div style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                                                <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>Imports</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>{historySelectedReceipt.details.length}</div>
                                            </div>
                                            <div style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                                                <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>Total Qty</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>{historyReceiptStats?.totalQty || 0}</div>
                                            </div>
                                            <div style={{ padding: '10px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 3 }}>Avg Price</div>
                                                <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#F0A500' }}>{formatVND(historyReceiptStats?.avgPrice || 0)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Receipt line items */}
                                    <div style={{ flex: 1, overflowY: 'auto' }}>
                                        {historySelectedReceipt.details.map((item, idx) => (
                                            <div key={idx} className="fi-receipt-row">
                                                <div className={`fi-receipt-dot ${idx === 0 ? 'active' : ''}`}></div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#111' }}>{item.furnitureName || item.inventoryName || 'N/A'}</div>
                                                    <div style={{ fontSize: '.72rem', color: '#aaa', marginTop: 2 }}>{new Date(historySelectedReceipt.importDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#198754' }}>+{item.quantity} pcs</div>
                                                    <div style={{ fontSize: '.72rem', color: '#aaa' }}>{(item.unitPrice || 0).toLocaleString()}d/pc</div>
                                                    <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#dc3545' }}>= {formatVND(item.itemTotal || 0)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total */}
                                    <div style={{ padding: '14px 20px', borderTop: '1px solid #eee', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '.8rem', color: '#888', fontWeight: 600 }}>Total import cost</span>
                                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#F0A500' }}>{formatVND(historySelectedReceipt.totalReceiptAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="fi-history-panel" style={{ alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '.85rem', textAlign: 'center', padding: 24 }}>
                                    <i className="bi bi-arrow-left" style={{ fontSize: '1.4rem', display: 'block', marginBottom: 8, color: '#ddd' }}></i>
                                    Select a receipt to view details
                                </div>
                            )}
                        </div>
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
                        fetchFurnitureData(selectedBranch, nameApplied, typeFilterApplied, page);
                    }}
                />
            )}
        </div>
    );
};

export default FurnitureInventory;

