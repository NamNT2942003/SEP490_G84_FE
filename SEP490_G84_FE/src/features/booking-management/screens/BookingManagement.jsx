import React, { useCallback, useEffect, useState } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import BookingDetailModal from "../components/BookingDetailModal";
import "./BookingManagement.css";

const BRAND = "#5C6F4E";
const PAGE_SIZE = 10;

const STATUS_CONFIG = {
    CONFIRMED: { bg: "rgba(25,135,84,0.12)", text: "#198754", dot: "#198754" },
    PENDING:   { bg: "rgba(255,193,7,0.18)",  text: "#997404", dot: "#ffc107" },
    CANCELLED: { bg: "rgba(220,53,69,0.12)",  text: "#b02a37", dot: "#dc3545" },
    COMPLETED: { bg: "rgba(13,110,253,0.12)", text: "#0d6efd", dot: "#0d6efd" },
};

const STAT_CARDS = [
    { key: "total",     label: "Total",     icon: "bi-journals",     color: BRAND,     bg: "rgba(92,111,78,0.10)" },
    { key: "confirmed", label: "Confirmed", icon: "bi-check2-circle",color: "#198754", bg: "rgba(25,135,84,0.10)" },
    { key: "pending",   label: "Pending",   icon: "bi-clock-history",color: "#997404", bg: "rgba(255,193,7,0.14)" },
    { key: "cancelled", label: "Cancelled", icon: "bi-x-circle",     color: "#b02a37", bg: "rgba(220,53,69,0.10)" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("vi-VN");
};

const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

// ─── Sub-components ────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { bg: "rgba(108,117,125,0.12)", text: "#495057", dot: "#6c757d" };
    return (
        <span className="status-badge" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.dot, display: "inline-block" }} />
            {status}
        </span>
    );
};

const StatCard = ({ card, value, loading }) => (
    <div className="col-6 col-md-3">
        <div className="card stat-card h-100">
            <div className="card-body d-flex align-items-center gap-3 py-3 px-3 px-md-4">
                <div className="stat-icon" style={{ backgroundColor: card.bg }}>
                    <i className={`bi ${card.icon}`} style={{ color: card.color }} />
                </div>
                <div>
                    <div className="fw-bold fs-4 lh-1 mb-1" style={{ color: card.color }}>
                        {loading ? <span className="placeholder col-4" /> : value}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.78rem" }}>{card.label}</div>
                </div>
            </div>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────

export default function BookingManagement() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [inputVal, setInputVal] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });

    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await bookingManagementApi.listBookings({ page, size: PAGE_SIZE, search, status: statusFilter });

            setBookings(data.content || []);
            setTotalElements(data.totalElements || 0);
            setTotalPages(data.totalPages || 0);

            try {
                setStats(await bookingManagementApi.getBookingStatistics());
            } catch {
                const s = (data.content || []).reduce(
                    (acc, b) => {
                        acc.total++;
                        if (b.status === "CONFIRMED") acc.confirmed++;
                        if (b.status === "PENDING")   acc.pending++;
                        if (b.status === "CANCELLED") acc.cancelled++;
                        return acc;
                    },
                    { total: 0, confirmed: 0, pending: 0, cancelled: 0 }
                );
                setStats(s);
            }
        } catch (err) {
            setBookings([]);
            setTotalElements(0);
            setTotalPages(0);
            setError(err?.response?.data?.message || "Failed to load booking data.");
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setSearch(inputVal.trim());
    };

    const clearFilters = () => {
        setInputVal("");
        setSearch("");
        setStatusFilter("");
        setPage(0);
    };

    const openDetail = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowDetail(true);
    };

    const closeDetail = () => {
        setShowDetail(false);
        setSelectedBookingId(null);
    };

    return (
        <div className="bm-page">
            {/* Breadcrumb + title */}
            <div className="bm-title-row">
                <div>
                    <p className="text-muted small mb-1">
                        <i className="bi bi-house me-1" />
                        Admin
                        <i className="bi bi-chevron-right mx-1" style={{ fontSize: "0.65rem" }} />
                        Booking Management
                    </p>
                    <h4 className="fw-bold mb-0">Booking Management</h4>
                </div>
                <button
                    className="btn btn-sm"
                    style={{ backgroundColor: BRAND, color: "white" }}
                    onClick={fetchBookings}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-2" />
                    Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="row g-3 mb-4">
                {STAT_CARDS.map((card) => (
                    <StatCard key={card.key} card={card} value={stats[card.key] || 0} loading={loading} />
                ))}
            </div>

            {/* Table Card */}
            <div className="booking-table-card card">
                {/* Toolbar */}
                <div className="bm-toolbar">
                    <form className="bm-toolbar-form" onSubmit={handleSearch}>
                        <div className="input-group search-input-group">
                            <span className="input-group-text">
                                <i className="bi bi-search" />
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by ID, guest name, email..."
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                            />
                        </div>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        >
                            <option value="">All statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <div className="bm-btn-group">
                            <button type="submit" className="btn btn-sm" style={{ backgroundColor: BRAND, color: "white" }}>
                                <i className="bi bi-search me-1 d-none d-sm-inline" />
                                Search
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                                Clear
                            </button>
                        </div>
                    </form>
                    <span className="text-muted small flex-shrink-0">
                        {loading ? "Loading..." : `${totalElements} booking(s)`}
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-danger border-0 rounded-0 mb-0 py-2 px-4" role="alert">
                        <i className="bi bi-exclamation-circle me-2" />
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="table-responsive">
                    <table className="table booking-table align-middle mb-0">
                        <thead>
                            <tr>
                                <th className="ps-4">Booking</th>
                                <th>Guest</th>
                                <th>Branch</th>
                                <th>Stay</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                                        Loading bookings...
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox fs-3 d-block mb-2" />
                                        No bookings found
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.bookingId}>
                                        <td className="ps-4">
                                            <div className="fw-semibold" style={{ color: BRAND }}>#{booking.bookingId}</div>
                                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                {formatDate(booking.createdAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-semibold">{booking.customerName}</div>
                                            <div className="text-muted small">{booking.customerPhone || booking.customerEmail || "-"}</div>
                                        </td>
                                        <td>
                                            <div className="small">{booking.branchName || "-"}</div>
                                        </td>
                                        <td>
                                            <div className="small">{formatDate(booking.checkInDate)}</div>
                                            <div className="text-muted small">→ {formatDate(booking.checkOutDate)}</div>
                                        </td>
                                        <td className="fw-semibold">{formatVND(booking.totalAmount)}</td>
                                        <td><StatusBadge status={booking.status} /></td>
                                        <td className="text-end pe-4">
                                            <button
                                                className="action-btn me-1"
                                                style={{ backgroundColor: "rgba(13,110,253,0.08)", color: "#0d6efd" }}
                                                title="View Details"
                                                onClick={() => openDetail(booking.bookingId)}
                                            >
                                                <i className="bi bi-eye" />
                                            </button>
                                            {booking.status !== "CANCELLED" && (
                                                <button
                                                    className="action-btn"
                                                    style={{ backgroundColor: "rgba(220,53,69,0.08)", color: "#dc3545" }}
                                                    title="Cancel Booking"
                                                    onClick={() => openDetail(booking.bookingId)}
                                                >
                                                    <i className="bi bi-x-circle" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bm-footer border-top">
                    <span className="text-muted small">
                        Page {totalPages > 0 ? page + 1 : 0} of {totalPages}
                        {totalElements > 0 && ` · ${totalElements} total`}
                    </span>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-sm btn-outline-secondary pagination-btn"
                            disabled={page === 0 || loading}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            <i className="bi bi-chevron-left me-1" />
                            Prev
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary pagination-btn"
                            disabled={loading || page >= totalPages - 1}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                            <i className="bi bi-chevron-right ms-1" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <BookingDetailModal
                show={showDetail}
                bookingId={selectedBookingId}
                onHide={closeDetail}
                onStatusChanged={fetchBookings}
                onBookingCancelled={fetchBookings}
            />
        </div>
    );
}
