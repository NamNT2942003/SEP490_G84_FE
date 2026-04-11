import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';

// Brand colors ưu tiên cho các kênh OTA nổi tiếng (key là substring lowercase).
// Nếu tên kênh chứa keyword này thì dùng màu thương hiệu, còn lại tự sinh màu.
const OTA_BRAND_MAP = [
    { keyword: 'booking',     bg: '#003580', text: '#fff' },
    { keyword: 'airbnb',      bg: '#FF5A5F', text: '#fff' },
    { keyword: 'expedia',     bg: '#FFC72C', text: '#333' },
    { keyword: 'agoda',       bg: '#5392FF', text: '#fff' },
    { keyword: 'traveloka',   bg: '#0064D2', text: '#fff' },
    { keyword: 'tripadvisor', bg: '#34E0A1', text: '#333' },
    { keyword: 'hotels.com',  bg: '#B0006E', text: '#fff' },
    { keyword: 'vrbo',        bg: '#1A3AFF', text: '#fff' },
];

// Hàm sinh màu hex ổn định từ bất kỳ chuỗi nào (djb2 hash).
// Cùng 1 chuỗi => luôn ra cùng 1 màu => không nhảy loạn khi refresh.
const hashStringToColor = (str = '') => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit int
    }
    // Lấy 3 byte cuối ra làm R, G, B
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b =  hash & 0x0000FF;
    // Tính độ sáng để chọn text màu tối hay sáng
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const bg  = `rgb(${Math.abs(r) % 200 + 30}, ${Math.abs(g) % 200 + 30}, ${Math.abs(b) % 200 + 30})`;
    const text = luminance > 0.55 ? '#333' : '#fff';
    return { bg, text };
};

// Hàm chính: ưu tiên brand map, fallback về hash color.
const getSourceMeta = (source = '') => {
    const lower = source.toLowerCase();
    // Tìm brand match
    const brand = OTA_BRAND_MAP.find(b => lower.includes(b.keyword));
    if (brand) return { bg: brand.bg, text: brand.text, label: source };
    // Fallback: sinh màu từ hash
    const { bg, text } = hashStringToColor(lower);
    return { bg, text, label: source };
};

const formatCurrency = (v) => new Intl.NumberFormat('en-US').format(v || 0);

/**
 * OtaBreakdownModal
 * Props:
 *  - show: boolean
 *  - onClose: () => void
 *  - branchId: number
 *  - mode: 'monthly' | 'yearly'
 *  - month: number (chỉ cần khi mode = 'monthly')
 *  - year: number
 */
const OtaBreakdownModal = ({ show, onClose, branchId, mode, month, year }) => {
    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    useEffect(() => {
        if (!show || !branchId) return;
        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = mode === 'monthly'
                    ? await reportApi.getOtaBreakdownMonthly(branchId, month, year)
                    : await reportApi.getOtaBreakdownYearly(branchId, year);
                setData(result);
            } catch {
                setError('Failed to load OTA breakdown data.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [show, branchId, mode, month, year]);

    if (!show) return null;

    const totalRevenue = data.reduce((sum, r) => sum + (r.revenue || 0), 0);
    const totalBookings = data.reduce((sum, r) => sum + (r.bookingCount || 0), 0);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                    zIndex: 1050, backdropFilter: 'blur(2px)'
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1055, width: '520px', maxWidth: '95vw',
                backgroundColor: '#fff', borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #e07b39 0%, #f39c12 100%)',
                    padding: '20px 24px', color: '#fff'
                }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="fw-bold mb-1" style={{ fontSize: '1rem' }}>
                                <i className="bi bi-diagram-3-fill me-2" />
                                OTA Revenue Breakdown
                            </h6>
                            <p className="mb-0" style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                                {mode === 'monthly' ? `Month ${month}/${year}` : `Full Year ${year}`}
                                &nbsp;·&nbsp;{totalBookings} bookings across {data.length} channel(s)
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-sm"
                            style={{ color: '#fff', fontSize: '1.2rem', lineHeight: 1 }}
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px' }}>

                    {/* Disclaimer */}
                    <div className="alert mb-3 py-2 px-3" style={{
                        backgroundColor: '#fff8f0', border: '1px solid #fde9c7',
                        borderRadius: '10px', fontSize: '0.75rem', color: '#856404'
                    }}>
                        <i className="bi bi-info-circle-fill me-2" />
                        <strong>Note:</strong> Figures below are <em>estimated pre-commission revenue</em>.
                        Actual net revenue depends on each OTA's commission rate.
                        These bookings are settled periodically through the OTA reconciliation process.
                    </div>

                    {loading && (
                        <div className="text-center py-4">
                            <div className="spinner-border" style={{ color: '#e07b39' }} />
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger py-2 px-3" style={{ fontSize: '0.8rem' }}>
                            <i className="bi bi-exclamation-triangle-fill me-2" />{error}
                        </div>
                    )}

                    {!loading && !error && data.length === 0 && (
                        <div className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>
                            <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }} />
                            No OTA bookings found for this period.
                        </div>
                    )}

                    {!loading && data.length > 0 && (
                        <>
                            {/* Source List */}
                            <div className="d-flex flex-column gap-2 mb-3">
                                {data.map((item, idx) => {
                                    const meta = getSourceMeta(item.source);
                                    const pct = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={idx} style={{
                                            border: '1px solid #f0f0f0', borderRadius: '10px',
                                            padding: '12px 14px', backgroundColor: '#fafafa'
                                        }}>
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{
                                                        backgroundColor: meta.bg, color: meta.text,
                                                        padding: '2px 10px', borderRadius: '20px',
                                                        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px'
                                                    }}>
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                        {item.bookingCount} booking{item.bookingCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span className="fw-bold" style={{ fontSize: '0.9rem', color: '#e07b39' }}>
                                                        {formatCurrency(item.revenue)}
                                                    </span>
                                                    <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>VND</span>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div style={{ height: '5px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${pct}%`, height: '100%',
                                                    backgroundColor: meta.bg, borderRadius: '4px',
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                            <div className="text-end mt-1" style={{ fontSize: '0.68rem', color: '#aaa' }}>{pct}% of OTA total</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total Row */}
                            <div style={{
                                borderTop: '2px solid #f0f0f0', paddingTop: '12px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span className="fw-bold text-secondary" style={{ fontSize: '0.82rem' }}>
                                    TOTAL OTA ESTIMATED REVENUE
                                </span>
                                <span className="fw-bold" style={{ color: '#e07b39', fontSize: '1rem' }}>
                                    {formatCurrency(totalRevenue)} VND
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default OtaBreakdownModal;
