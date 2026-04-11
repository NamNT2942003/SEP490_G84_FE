import React from 'react';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(value);
};

const RevenueTable = ({ roomData, summary }) => {
    if (!roomData || roomData.length === 0) return <div className="text-center p-5">No data</div>;

    return (
        <div className="table-responsive">
            <table className="table table-bordered table-hover mb-0 text-center align-middle">
                <thead className="table-warning">
                    <tr>
                        <th colSpan={roomData.length}>ROOM REVENUE</th>
                        <th rowSpan="2" className="align-middle">MoM Growth</th>
                        <th rowSpan="2" className="align-middle">Occupancy Rate (%)</th>
                        <th rowSpan="2" className="align-middle">Average Daily Rate (ADR)</th>
                        <th rowSpan="2" className="align-middle">Total Guests (Standard)</th>
                    </tr>
                    <tr>
                        {roomData.map((room, idx) => (
                            <th key={idx} className="bg-light">{room.roomTypeName}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {roomData.map((room, idx) => (
                            <td key={idx}>
                                <div><span style={{ color: '#198754', fontWeight: 600 }}>{formatCurrency(room.directRevenue || 0)}</span></div>
                                {(room.otaRevenue > 0) && (
                                    <div className="mt-1">
                                        <span style={{ color: '#e07b39', fontWeight: 600 }}>
                                            {formatCurrency(room.otaRevenue)} <i className="bi bi-exclamation-triangle-fill text-muted" style={{ fontSize: '0.65rem' }}></i>
                                        </span>
                                    </div>
                                )}
                            </td>
                        ))}
                        <td className={`fw-bold ${summary.momGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                            {summary.momGrowth > 0 ? '+' : ''}{summary.momGrowth}%
                        </td>
                        <td className="fw-bold">{summary.occupancyRate}%</td>
                        <td className="fw-bold">{formatCurrency(summary.adr)}</td>
                        <td className="fw-bold">{summary.totalStandardGuests}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default RevenueTable;