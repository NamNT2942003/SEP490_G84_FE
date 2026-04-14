import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';

const RoomRevenueExcelRowTable = ({ branchId, month, year }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (branchId && month && year) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const result = await reportApi.getDetailedRoomRevenue(branchId, month, year);
                    setData(result || []);
                } catch (error) {
                    console.error("Failed to load detailed room revenue:", error);
                    setData([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [branchId, month, year]);

    const formatDateTime = (isoStr) => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const fmt = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(val || 0);

    // Tính tổng tất cả bookings
    const totalSystemRev = data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);

    return (
        <div className="card shadow-sm border-0 rounded-3">
            <div className="card-body p-0">
                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <div className="mt-2 text-muted">Loading detailed data...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                        <i className="bi bi-inbox fs-2 d-block mb-3"></i>
                        Empty! No room revenue data found for this month.
                    </div>
                ) : (
                    <div className="p-3 bg-light border-bottom">
                        <div className="d-flex align-items-center mb-2">
                            <span className="badge bg-primary me-2 px-3 py-2 rounded-pill">Total Booking: {data.length}</span>
                            <span className="badge bg-success px-3 py-2 rounded-pill">TOTAL REVENUE: {fmt(totalSystemRev)}</span>
                        </div>
                    </div>
                )}

                {data.length > 0 && !loading && (
                    <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        <table className="table table-hover table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                            <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                <tr>
                                    <th className="text-start text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Guest</th>
                                    <th className="text-center text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Check In</th>
                                    <th className="text-center text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Check Out</th>
                                    <th className="text-center text-secondary py-2" style={{ whiteSpace: 'nowrap', maxWidth: '100px' }}>Room No.</th>
                                    <th className="text-center text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Room Type</th>
                                    <th className="text-center text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Source</th>
                                    <th className="text-end text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Price/Night</th>
                                    <th className="text-center text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Total Nights</th>
                                    <th className="text-end text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Total Amount</th>
                                    <th className="text-end text-secondary py-2" style={{ whiteSpace: 'nowrap' }}>Commission</th>
                                    <th className="text-start text-secondary py-2" style={{ width: '200px' }}>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r, i) => (
                                    <tr key={i}>
                                        <td className="text-start fw-semibold text-primary" style={{ whiteSpace: 'nowrap' }}>{r.customerName}</td>
                                        <td className="text-center text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.checkIn)}</td>
                                        <td className="text-center text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.checkOut)}</td>
                                        <td className="text-center fw-bold" style={{ wordWrap: 'break-word', maxWidth: '100px' }}>{r.roomNames}</td>
                                        <td className="text-center"><span className="badge bg-secondary">{r.roomTypes}</span></td>
                                        <td className="text-center">{r.source === 'FRONT_END' || r.source === 'FRONT_DESK' ? 'Direct' : r.source}</td>
                                        <td className="text-end text-dark">{fmt(r.pricePerNight)}</td>
                                        <td className="text-center fw-medium">{r.totalNights}</td>
                                        <td className="text-end text-danger fw-bold">{fmt(r.totalRevenue)}</td>
                                        <td className="text-end text-muted">{r.commission > 0 ? fmt(r.commission) : '0'}</td>
                                        <td className="text-start text-muted text-truncate" style={{ maxWidth: '200px' }} title={r.note}>{r.note || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="sticky-bottom" style={{ borderTop: '2px solid #ef4444', backgroundColor: '#fef2f2' }}>
                                <tr>
                                    <td colSpan={8} className="text-end py-3 text-danger fw-bold">SYSTEM TOTAL:</td>
                                    <td className="text-end py-3 text-danger fs-6 fw-bold">{fmt(totalSystemRev)}</td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomRevenueExcelRowTable;
