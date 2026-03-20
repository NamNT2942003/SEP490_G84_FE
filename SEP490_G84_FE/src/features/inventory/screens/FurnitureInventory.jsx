import React, { useMemo, useState } from 'react';
import '../css/InventoryManagement.css';

const initialData = [
    {
        id: 1,
        facility: 'Branch 1 - Floor 1',
        branch: 'Branch 1',
        name: 'King Bed',
        quantity: 50,
        price: 5000000,
        inUse: 42,
        inStock: 8,
        broken: 1,
        roomsUsing: ['Room 101', 'Room 102', 'Room 103'],
        roomsBroken: ['Room 102'],
    },
    {
        id: 2,
        facility: 'Branch 1 - Floor 2',
        branch: 'Branch 1',
        name: 'Working Desk',
        quantity: 30,
        price: 1500000,
        inUse: 24,
        inStock: 6,
        broken: 0,
        roomsUsing: ['Room 201', 'Room 202'],
        roomsBroken: [],
    },
    {
        id: 3,
        facility: 'Branch 2 - Lobby',
        branch: 'Branch 2',
        name: 'Sofa Set',
        quantity: 10,
        price: 8000000,
        inUse: 6,
        inStock: 4,
        broken: 0,
        roomsUsing: ['Lobby Hall'],
        roomsBroken: [],
    },
    {
        id: 4,
        facility: 'Branch 2 - Room',
        branch: 'Branch 2',
        name: 'Wardrobe',
        quantity: 40,
        price: 2000000,
        inUse: 35,
        inStock: 5,
        broken: 2,
        roomsUsing: ['Room 301', 'Room 302', 'Room 303'],
        roomsBroken: ['Room 301', 'Room 303'],
    },
];

const FurnitureInventory = () => {
    const [rows] = useState(initialData);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [nameDraft, setNameDraft] = useState('');
    const [nameApplied, setNameApplied] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [detailItem, setDetailItem] = useState(null);

    const formatVND = (value) =>
        new Intl.NumberFormat('vi-VN').format(value) + ' đ';

    const branches = [
        { value: 'all', label: 'All branches' },
        { value: 'Branch 1', label: 'Branch 1' },
        { value: 'Branch 2', label: 'Branch 2' },
    ];

    const filteredRows = useMemo(() => {
        const q = nameApplied.trim().toLowerCase();
        return rows.filter((r) => {
            const matchBranch = selectedBranch === 'all' ? true : r.branch === selectedBranch;
            const matchName = q ? (r.name || '').toLowerCase().includes(q) : true;
            return matchBranch && matchName;
        });
    }, [rows, selectedBranch, nameApplied]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
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
                                <td className="text-center">{row.quantity}</td>
                                <td className="text-center">{formatVND(row.price)}</td>
                                <td className="text-center">{row.inUse}</td>
                                <td className="text-center">{row.inStock}</td>
                                <td className="text-center">{row.broken}</td>
                                <td className="text-center">
                                    <button
                                        className="btn-detail"
                                        onClick={() => setDetailItem(row)}
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
                                        (detailItem.roomsUsing || []).map((name) => (
                                            <div key={name} className="chip">
                                                {name}
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
                                        (detailItem.roomsBroken || []).map((name) => (
                                            <div key={name} className="chip chip--danger">
                                                {name}
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

