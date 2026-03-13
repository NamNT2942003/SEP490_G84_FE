import React, { useCallback, useEffect, useMemo, useState } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import BookingDetailModal from "../components/BookingDetailModal";

const BRAND = "#5C6F4E";
const PAGE_SIZE = 10;

const STATUS_COLORS = {
    CONFIRMED: { bg: "rgba(25,135,84,0.12)", text: "#198754" },
    PENDING: { bg: "rgba(255,193,7,0.18)", text: "#997404" },
    CANCELLED: { bg: "rgba(220,53,69,0.12)", text: "#b02a37" },
    COMPLETED: { bg: "rgba(13,110,253,0.12)", text: "#0d6efd" },
};

const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const StatusBadge = ({ status }) => {
    const mapped = STATUS_COLORS[status] || { bg: "rgba(108,117,125,0.12)", text: "#495057" };

    return (
        <span
            className="d-inline-flex align-items-center px-2 py-1 rounded-pill fw-semibold"
            style={{ backgroundColor: mapped.bg, color: mapped.text, fontSize: "0.72rem" }}
        >
      {status}
    </span>
    );
};

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

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);

    const statCards = useMemo(
        () => [
            { key: "total", label: "Total Bookings", icon: "bi-journals", color: BRAND, bg: "rgba(92,111,78,0.08)" },
            {
                key: "confirmed",
                label: "Confirmed",
                icon: "bi-check2-circle",
                color: "#198754",
                bg: "rgba(25,135,84,0.08)",
            },
            {
                key: "pending",
                label: "Pending",
                icon: "bi-clock-history",
                color: "#997404",
                bg: "rgba(255,193,7,0.12)",
            },
            {
                key: "cancelled",
                label: "Cancelled",
                icon: "bi-x-circle",
                color: "#b02a37",
                bg: "rgba(220,53,69,0.08)",
            },
        ],
        []
    );

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await bookingManagementApi.listBookings({
                page,
                size: PAGE_SIZE,
                search,
                status: statusFilter,
            });

            setBookings(data.content || []);
            setTotalElements(data.totalElements || 0);
            setTotalPages(data.totalPages || 0);

            try {
                const statistics = await bookingManagementApi.getBookingStatistics();
                setStats(statistics);
            } catch {
                // Fallback to current page aggregates when backend has no statistics endpoint.
                const localStats = (data.content || []).reduce(
                    (acc, booking) => {
                        acc.total += 1;
                        if (booking.status === "CONFIRMED") acc.confirmed += 1;
                        if (booking.status === "PENDING") acc.pending += 1;
                        if (booking.status === "CANCELLED") acc.cancelled += 1;
                        return acc;
                    },
                    { total: 0, confirmed: 0, pending: 0, cancelled: 0 }
                );
                setStats(localStats);
            }
        } catch (err) {
            setBookings([]);
            setTotalElements(0);
            setTotalPages(0);
            setError(err?.friendlyMessage || err?.response?.data?.message || "Failed to load booking data.");
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(0);
        setSearch(inputVal.trim());
    };

    const clearFilters = () => {
        setInputVal("");
        setSearch("");
        setStatusFilter("");
        setPage(0);
    };

    const handleShowDetail = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowDetailModal(true);
    };

    const handleDetailClose = () => {
        setShowDetailModal(false);
        setSelectedBookingId(null);
    };

    const handleStatusChanged = (updated) => {
        // Refresh list to update status in table
        fetchBookings();
    };

    const handleBookingCancelled = (updated) => {
        // Refresh list after cancellation
        fetchBookings();
    };

    return (
        <div className="container-fluid py-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <p className="text-muted small mb-1">
                        <i className="bi bi-house me-1"></i>Admin
                        <i className="bi bi-chevron-right mx-1" style={{ fontSize: "0.65rem" }}></i>
                        Booking Management
                    </p>
                    <h4 className="fw-bold mb-0">Booking Management</h4>
                </div>
                <button className="btn" style={{ backgroundColor: BRAND, color: "white" }} onClick={fetchBookings}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                </button>
            </div>

            <div className="row g-3 mb-4">
                {statCards.map((card) => (
                    <div className="col-6 col-lg-3" key={card.key}>
                        <div className="card border-0 h-100" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderRadius: 12 }}>
                            <div className="card-body d-flex align-items-center gap-3 py-3 px-4">
                                <div
                                    className="d-flex align-items-center justify-content-center rounded-3"
                                    style={{ width: 48, height: 48, backgroundColor: card.bg }}
                                >
                                    <i className={`bi ${card.icon} fs-5`} style={{ color: card.color }}></i>
                                </div>
                                <div>
                                    <div className="fw-bold fs-4 lh-1 mb-1" style={{ color: card.color }}>
                                        {loading ? "..." : stats[card.key] || 0}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                                        {card.label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card border-0" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderRadius: 12 }}>
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between gap-3 flex-wrap">
                    <form className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 560 }} onSubmit={handleSearch}>
                        <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search by booking id, guest name..."
                                value={inputVal}
                                onChange={(event) => setInputVal(event.target.value)}
                            />
                        </div>
                        <select
                            className="form-select"
                            style={{ maxWidth: 180 }}
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">All statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                        <button type="submit" className="btn" style={{ backgroundColor: BRAND, color: "white" }}>
                            Search
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                            Clear
                        </button>
                    </form>

                    <span className="text-muted small">{loading ? "Loading..." : `${totalElements} booking(s)`}</span>
                </div>

                {error && (
                    <div className="alert alert-danger border-0 rounded-0 mb-0" role="alert">
                        <i className="bi bi-exclamation-circle me-2"></i>
                        {error}
                    </div>
                )}

                <div className="table-responsive">
                    <table className="table align-middle mb-0">
                        <thead>
                        <tr style={{ backgroundColor: "#f8f9fb" }}>
                            <th className="ps-4 text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                Booking ID
                            </th>
                            <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                Guest
                            </th>
                            <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                Stay Date
                            </th>
                            <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                Rooms
                            </th>
                            <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                Amount
                            </th>
                            <th className="text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                Status
                            </th>
                            <th className="text-end pe-4 text-muted fw-semibold border-0" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-5 text-muted">
                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                    Loading bookings...
                                </td>
                            </tr>
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-5 text-muted">
                                    No booking data found.
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking.bookingId}>
                                    <td className="ps-4 fw-semibold">#{booking.bookingId}</td>
                                    <td>
                                        <div className="fw-semibold">{booking.customerName}</div>
                                        <div className="text-muted small">{booking.customerPhone || booking.customerEmail || "-"}</div>
                                    </td>
                                    <td>
                                        <div>{formatDate(booking.checkInDate)}</div>
                                        <div className="text-muted small">to {formatDate(booking.checkOutDate)}</div>
                                    </td>
                                    <td>{booking.roomCount}</td>
                                    <td className="fw-semibold">{formatCurrency(booking.totalAmount)}</td>
                                    <td>
                                        <StatusBadge status={booking.status} />
                                    </td>
                                    <td className="text-end pe-4">
                                        <button
                                            className="btn btn-sm me-1"
                                            title="View Details"
                                            style={{
                                                width: 30,
                                                height: 30,
                                                padding: 0,
                                                backgroundColor: "rgba(13,110,253,0.08)",
                                                color: "#0d6efd",
                                                border: "none",
                                                borderRadius: 6,
                                            }}
                                            onClick={() => handleShowDetail(booking.bookingId)}
                                        >
                                            <i className="bi bi-eye" style={{ fontSize: "0.75rem" }}></i>
                                        </button>
                                        {booking.status !== "CANCELLED" && (
                                            <button
                                                className="btn btn-sm"
                                                title="Cancel Booking"
                                                style={{
                                                    width: 30,
                                                    height: 30,
                                                    padding: 0,
                                                    backgroundColor: "rgba(220,53,69,0.08)",
                                                    color: "#dc3545",
                                                    border: "none",
                                                    borderRadius: 6,
                                                }}
                                                onClick={() => {
                                                    if (window.confirm("Cancel this booking?")) {
                                                        handleShowDetail(booking.bookingId);
                                                    }
                                                }}
                                            >
                                                <i className="bi bi-x-circle" style={{ fontSize: "0.75rem" }}></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3 px-4">
          <span className="text-muted small">
            Page {totalPages > 0 ? page + 1 : 0} / {totalPages}
          </span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" disabled={page === 0 || loading} onClick={() => setPage((prev) => prev - 1)}>
                            Previous
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            disabled={loading || totalPages === 0 || page >= totalPages - 1}
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <BookingDetailModal
                show={showDetailModal}
                bookingId={selectedBookingId}
                onHide={handleDetailClose}
                onStatusChanged={handleStatusChanged}
                onBookingCancelled={handleBookingCancelled}
            />
        </div>
    );
}
