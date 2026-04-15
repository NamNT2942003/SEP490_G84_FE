import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';
import { COLORS } from '@/constants';
import Swal from 'sweetalert2';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const ServiceRevenueExcelRowTable = ({ branchId, month, year }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await reportApi.getDetailedServiceRevenue(branchId, month, year);
                setData(res || []);
            } catch (error) {
                console.error("Lỗi khi tải chi tiết bill dịch vụ:", error);
                Swal.fire('Lỗi', 'Không thể lấy dữ liệu chi tiết dịch vụ', 'error');
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [branchId, month, year]);

    // Nhóm theo category
    const grouped = {};
    data.forEach(row => {
        const cat = row.category || 'Other';
        if (!grouped[cat]) grouped[cat] = { rows: [], totalRev: 0, totalCost: 0, totalNet: 0 };
        grouped[cat].rows.push(row);
        grouped[cat].totalRev += (row.totalRevenue || 0);
        grouped[cat].totalCost += (row.totalCost || 0);
        grouped[cat].totalNet += (row.netRevenue || 0);
    });

    const formatDateTime = (dtStr) => {
        if (!dtStr) return '';
        const d = new Date(dtStr);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };

    if (loading) {
        return (
            <div className="text-center p-5 animate__animated animate__fadeIn">
                <div className="spinner-border" style={{ color: COLORS.PRIMARY }} role="status"></div>
                <div className="mt-2 text-muted">Loading detailed data...</div>
            </div>
        );
    }

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Header */}
            <div className="d-flex align-items-center mb-4 gap-3">
                <div className="badge px-3 py-2 fw-medium" style={{ backgroundColor: '#fff', color: COLORS.PRIMARY, border: `1px solid ${COLORS.PRIMARY}`}}>
                    DETAILED SERVICE LEDGER - MONTH {month}/{year}
                </div>
            </div>

            {Object.keys(grouped).length === 0 ? (
                <div className="card shadow-sm border-0 p-5 text-center text-muted">
                    <i className="bi bi-folder-x mb-3" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                    No paid service transactions occurred this month.
                </div>
            ) : (
                <div className="row g-4">
                    {Object.keys(grouped).map(category => {
                        const grp = grouped[category];
                        return (
                            <div className="col-12 col-xl-6" key={category}>
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header border-0 py-3 text-center" style={{ backgroundColor: '#86efac', color: '#166534' }}>
                                        <h6 className="fw-bold m-0 text-uppercase" style={{ letterSpacing: '1px' }}>{category}</h6>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <table className="table table-hover table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                                <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                                    <tr>
                                                        <th className="text-center text-secondary py-2" style={{ width: '12%'}}>Date</th>
                                                        <th className="text-center text-secondary py-2" style={{ width: '15%'}}>Room/BK Code</th>
                                                        <th className="text-start text-secondary py-2">Description</th>
                                                        <th className="text-end text-secondary py-2" style={{ width: '15%'}}>Gross Rev</th>
                                                        <th className="text-end text-secondary py-2" style={{ width: '15%'}}>Cost</th>
                                                        <th className="text-end text-secondary py-2 pe-3" style={{ width: '15%'}}>Net Rev</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {grp.rows.map((r, i) => (
                                                        <tr key={i}>
                                                            <td className="text-center">{formatDateTime(r.orderDate)}</td>
                                                            <td className="text-center fw-medium">{r.roomName}</td>
                                                            <td className="text-start text-muted" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.description}>
                                                                {r.description || '-'}
                                                            </td>
                                                            <td className="text-end">{fmt(r.totalRevenue)}</td>
                                                            <td className="text-end">{fmt(r.totalCost)}</td>
                                                            <td className="text-end pe-3 text-success fw-semibold">{fmt(r.netRevenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="sticky-bottom" style={{ borderTop: '2px solid #ef4444', backgroundColor: '#fef2f2' }}>
                                                    <tr>
                                                        <td colSpan={3} className="text-end py-2 text-danger fw-bold">TOTAL:</td>
                                                        <td className="text-end py-2 text-danger fw-bold">{fmt(grp.totalRev)}</td>
                                                        <td className="text-end py-2 text-danger fw-bold">{fmt(grp.totalCost)}</td>
                                                        <td className="text-end py-2 pe-3 text-danger fw-bold">{fmt(grp.totalNet)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ServiceRevenueExcelRowTable;
