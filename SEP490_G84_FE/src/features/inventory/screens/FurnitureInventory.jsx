import React, { useState } from 'react';
import '../css/InventoryManagement.css';

const initialData = [
    {
        id: 1,
        facility: 'Branch 1 - Floor 1',
        name: 'King Bed',
        quantity: 50,
        price: 5000000,
        inUse: 42,
        inStock: 8,
        broken: 1,
    },
    {
        id: 2,
        facility: 'Branch 1 - Floor 2',
        name: 'Working Desk',
        quantity: 30,
        price: 1500000,
        inUse: 24,
        inStock: 6,
        broken: 0,
    },
    {
        id: 3,
        facility: 'Branch 2 - Lobby',
        name: 'Sofa Set',
        quantity: 10,
        price: 8000000,
        inUse: 6,
        inStock: 4,
        broken: 0,
    },
    {
        id: 4,
        facility: 'Branch 2 - Room',
        name: 'Wardrobe',
        quantity: 40,
        price: 2000000,
        inUse: 35,
        inStock: 5,
        broken: 2,
    },
];

const FurnitureInventory = () => {
    const [rows] = useState(initialData);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [detailItem, setDetailItem] = useState(null);

    const formatVND = (value) =>
        new Intl.NumberFormat('vi-VN').format(value) + ' đ';

    const branches = [
        { value: 'all', label: 'All branches' },
        { value: 'Branch 1', label: 'Branch 1' },
        { value: 'Branch 2', label: 'Branch 2' },
    ];

    const filteredRows = rows.filter((r) =>
        selectedBranch === 'all' ? true : r.facility.startsWith(selectedBranch)
    );

    return (
        <div className="inventory-wrapper">
            <div className="inventory-container">
                <div className="inventory-header">
                    <h1>Furniture Inventory</h1>
                    <select
                        className="search-input"
                        style={{ width: '220px' }}
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                        {branches.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                    </select>
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
                        {filteredRows.map((row) => (
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
                                        style={{ marginRight: '6px' }}
                                    >
                                        Add quantity
                                    </button>
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
            </div>

            {detailItem && (
                <div className="modal-overlay">
                    <div className="modal-content small">
                        <div className="modal-header">
                            <h3>Furniture detail</h3>
                            <button className="close-btn" onClick={() => setDetailItem(null)}>✖</button>
                        </div>
                        <div style={{ textAlign: 'left', lineHeight: 2 }}>
                            <p><strong>ID:</strong> {detailItem.id}</p>
                            <p><strong>Branch / Area:</strong> {detailItem.facility}</p>
                            <p><strong>Name:</strong> {detailItem.name}</p>
                            <p><strong>Quantity:</strong> {detailItem.quantity}</p>
                            <p><strong>Price:</strong> {formatVND(detailItem.price)}</p>
                            <p><strong>In use:</strong> {detailItem.inUse}</p>
                            <p><strong>In stock:</strong> {detailItem.inStock}</p>
                            <p><strong>Broken:</strong> {detailItem.broken}</p>
                        </div>
                        <div style={{ marginTop: '16px', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setDetailItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FurnitureInventory;

