import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { roomManagementApi } from '@/features/roomManagement/api/roomManagementApi';
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
    const [nameApplied, setNameApplied] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [detailItem, setDetailItem] = useState(null);
    const [branches, setBranches] = useState([]);

    // Fetch branches
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await roomManagementApi.listBranches();
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
    }, []);

    // Fetch furniture inventory data
    const fetchFurnitureData = useCallback(async (branchId, searchKeyword = '', pageNum = 1) => {
        if (branchId === 'all') {
            setRows([]);
            return;
        }

        try {
            let response;
            if (searchKeyword.trim()) {
                response = await roomManagementApi.searchFurnitureInventoryByBranch(
                    branchId,
                    searchKeyword,
                    pageNum - 1,
                    pageSize
                );
            } else {
                response = await roomManagementApi.listFurnitureInventoryByBranch(
                    branchId,
                    pageNum - 1,
                    pageSize
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
        fetchFurnitureData(selectedBranch, nameApplied, page);
    }, [page, fetchFurnitureData, selectedBranch, nameApplied]);

    const formatVND = (value) =>
        new Intl.NumberFormat('vi-VN').format(value) + ' đ';

    const filteredRows = useMemo(() => {
        return rows; // Already filtered by API
    }, [rows]);

    const totalPages = Math.max(1, Math.ceil((filteredRows.length || 0) / pageSize));
    const pagedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page]);

    const onChangeBranch = (val) => {
        setSelectedBranch(val);
        setPage(1);
    };

    const onChangeName = (val) => {
        setNameDraft(val);
        setPage(1);
    };

    const applyNameSearch = () => {
        setNameApplied(nameDraft.trim());
        setPage(1);
    };

    // Format room ID list to display
    const formatRoomList = (roomIds = []) => {
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return [];
        }
        return roomIds.map(id => `Room ${id}`);
    };

    return (
        <div className="inventory-wrapper">
            <div className="inventory-container">
                <div className="inventory-header">
                    <h1>Furniture Inventory</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <select
                            className="search-input"
                            style={{ width: 190 }}
                            value={selectedBranch}
                            onChange={(e) => onChangeBranch(e.target.value)}
                        >
                            {branches.map((b) => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                        </select>

                        <div style={{ position: 'relative', width: 280 }}>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by name..."
                                value={nameDraft}
                                onChange={(e) => onChangeName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') applyNameSearch();
                                }}
                                style={{ width: '100%', paddingRight: 40 }}
                            />
                            <button
                                type="button"
                                aria-label="Search by name"
                                onClick={applyNameSearch}
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#6b7280',
                                    zIndex: 2,
                                    width: 26,
                                    height: 26,
                                    borderRadius: 6,
                                    background: 'transparent',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="inventory-table">
                        <thead>
                        <tr>
                            <th className="text-center" style={{ width: 50 }}>ID</th>
                            <th>Furniture</th>
                            <th className="text-center">Branch</th>
                            <th className="text-center">Quantity</th>
                            <th className="text-center">Price</th>
                            <th className="text-center">In use</th>
                            <th className="text-center">In stock</th>
                            <th className="text-center">Broken</th>
                            <th className="text-center">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pagedRows.map((row) => (
                            <tr key={row.id}>
                                <td className="text-center">{row.id}</td>
                                <td>{row.name}</td>
                                <td className="text-center">{row.branch}</td>
                                <td className="text-center">{row.quantity}</td>
                                <td className="text-center">{formatVND(row.price)}</td>
                                <td className="text-center">{row.inUse}</td>
                                <td className="text-center">{row.inStock}</td>
                                <td className="text-center">{row.broken}</td>
                                <td className="text-center">
                                    <button
                                        className="btn-detail"
                                        onClick={() => setDetailItem(row)}
                                        disabled={selectedBranch === 'all'}
                                        title={selectedBranch === 'all' ? 'Please select a branch first' : 'View detail'}
                                        style={{
                                            opacity: selectedBranch === 'all' ? 0.5 : 1,
                                            cursor: selectedBranch === 'all' ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        View detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-container">
                    <button
                        className="btn-page"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        type="button"
                    >
                        Previous
                    </button>
                    <span className="page-info">Page {page} / {totalPages}</span>
                    <button
                        className="btn-page"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        type="button"
                    >
                        Next
                    </button>
                </div>
            </div>

            {detailItem && (
                <div className="furniture-modal-overlay">
                    <div className="modal-content furniture-modal">
                        <div className="modal-header">
                            <h3>Furniture detail</h3>
                            <button className="close-btn" onClick={() => setDetailItem(null)}>✖</button>
                        </div>
                        <div className="furniture-detail-body">
                            <div className="furniture-detail-grid">
                                <div><strong>ID:</strong> {detailItem.id}</div>
                                <div><strong>Branch / Area:</strong> {detailItem.facility}</div>
                                <div><strong>Name:</strong> {detailItem.name}</div>
                                <div><strong>Quantity:</strong> {detailItem.quantity}</div>
                                <div><strong>Price:</strong> {formatVND(detailItem.price)}</div>
                                <div><strong>In use:</strong> {detailItem.inUse}</div>
                                <div><strong>In stock:</strong> {detailItem.inStock}</div>
                                <div><strong>Broken:</strong> {detailItem.broken}</div>
                            </div>

                            <div className="furniture-detail-section">
                                <div className="furniture-detail-section-title">Rooms using this item</div>
                                <div className="furniture-detail-list">
                                    {(detailItem.roomsUsing || []).length ? (
                                        formatRoomList(detailItem.roomsUsing).map((roomName) => (
                                            <div key={roomName} className="chip">
                                                {roomName}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="muted">No rooms</div>
                                    )}
                                </div>
                            </div>

                            <div className="furniture-detail-section">
                                <div className="furniture-detail-section-title furniture-detail-section-title--danger">
                                    Rooms with broken items
                                </div>
                                <div className="furniture-detail-list">
                                    {(detailItem.roomsBroken || []).length ? (
                                        formatRoomList(detailItem.roomsBroken).map((roomName) => (
                                            <div key={roomName} className="chip chip--danger">
                                                {roomName}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="muted">No broken rooms</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="furniture-modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDetailItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FurnitureInventory;

