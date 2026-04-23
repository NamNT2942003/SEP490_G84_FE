import React, { useCallback, useEffect, useMemo, useState } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import BookingDetailModal from "../components/BookingDetailModal";
import CreateBookingByStaffModal from "../components/CreateBookingByStaffModal";
import CancelRequestsModal from "../components/CancelRequestsModal";
import CancelBookingModal from "../components/CancelBookingModal";
import "./BookingManagement.css";
import Buttons from "@/components/ui/Buttons";
import { COLORS } from "@/constants";
import Swal from "sweetalert2";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import { useRef } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
    CONFIRMED: { bg: "rgba(25,135,84,0.12)", text: "#198754", dot: "#198754" },
    PENDING:   { bg: "rgba(255,193,7,0.18)",  text: "#997404", dot: "#ffc107" },
    CANCELLED: { bg: "rgba(220,53,69,0.12)",  text: "#b02a37", dot: "#dc3545" },
    COMPLETED: { bg: "rgba(13,110,253,0.12)", text: "#0d6efd", dot: "#0d6efd" },
};

const STAT_CARDS = [
    { key: "total",     label: "Total",     icon: "bi-journals",     color: COLORS.PRIMARY,     bg: "rgba(92,111,78,0.10)" },
    { key: "confirmed", label: "Confirmed", icon: "bi-check2-circle",color: "#198754", bg: "rgba(25,135,84,0.10)" },
    { key: "pending",   label: "Pending",   icon: "bi-clock-history",color: "#997404", bg: "rgba(255,193,7,0.14)" },
    { key: "cancelled", label: "Cancelled", icon: "bi-x-circle",     color: "#b02a37", bg: "rgba(220,53,69,0.10)" },
    { key: "cancelRequested", label: "Cancel Requests", icon: "bi-bell-fill", color: "#b02a37", bg: "rgba(220,53,69,0.12)" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB");
};

const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const isInternalFrontendBooking = (source) => (source || "").trim().toUpperCase() === "FRONT_END";

const getSourceBadge = (source) => {
    const raw = (source || "").trim();
    const normalized = raw.toUpperCase();

    if (normalized === "FRONT_END") {
        return { label: "Internal", sub: "Can cancel", className: "source-badge source-badge-internal" };
    }

    if (!raw) {
        return { label: "Unknown", sub: "Cannot cancel", className: "source-badge source-badge-unknown" };
    }

    return { label: raw, sub: "Cannot cancel", className: "source-badge source-badge-external" };
};

// ─── Sub-components ────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { bg: "rgba(108,117,125,0.12)", text: "#495057", dot: "#6c757d" };
    return (
        <span className="status-badge" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
            {status}
        </span>
    );
};

const StatCard = ({ card, value, loading, isClickable, onClick }) => (
    <button
        type="button"
        className={`card stat-card h-100 text-start ${isClickable ? "stat-card-clickable" : ""}`}
        onClick={onClick}
        disabled={!isClickable}
    >
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
    </button>
);

// ─── Main Component ────────────────────────────────────────────────────────

export default function BookingManagement() {
    const currentUser = useCurrentUser();
    const isAdmin = !!currentUser?.permissions?.isAdmin;

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [inputVal, setInputVal] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [branches, setBranches] = useState([]);
    const [cancelRequests, setCancelRequests] = useState([]);
    const [showCancelRequests, setShowCancelRequests] = useState(false);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0, cancelRequested: 0 });

    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelBookingId, setCancelBookingId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const prevCancelRequestCountRef = useRef(null);

    const branchOptions = useMemo(
        () => [...branches].sort((a, b) => String(a.branchName || "").localeCompare(String(b.branchName || ""))),
        [branches],
    );

    const fetchBranches = useCallback(async () => {
        try {
            const data = await branchManagementApi.listBranches();
            setBranches(data || []);
        } catch (err) {
            console.warn("Failed to load branches for booking filters", err);
            setBranches([]);
        }
    }, []);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await bookingManagementApi.listBookings({
                page,
                size: PAGE_SIZE,
                search,
                status: statusFilter,
                branchId: branchFilter,
                sourceType: sourceFilter,
                fromDate,
                toDate,
            });

            setBookings(data.content || []);
            setTotalElements(data.totalElements || 0);
            setTotalPages(data.totalPages || 0);

            try {
                setStats(await bookingManagementApi.getBookingStatistics());
            } catch {
                const s = (data.content || []).reduce(
                    (acc, b) => {
                        if (b.status !== "NO_SHOW") acc.total++;
                        if (["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(b.status)) acc.confirmed++;
                        if (b.status === "PENDING_PAYMENT" || b.status === "PENDING") acc.pending++;
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
    }, [page, search, statusFilter, branchFilter, sourceFilter, fromDate, toDate]);

    const playNotificationSound = useCallback(() => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.0001;
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (err) {
            console.warn("Failed to play notification sound", err);
        }
    }, []);

    const fetchCancelRequests = useCallback(async () => {
        try {
            const data = await bookingManagementApi.getCancelRequests();
            setCancelRequests(data || []);

            const nextCount = (data || []).length;
            if (prevCancelRequestCountRef.current !== null && nextCount > prevCancelRequestCountRef.current) {
                playNotificationSound();
            }
            prevCancelRequestCountRef.current = nextCount;
            setStats((prev) => ({ ...prev, cancelRequested: nextCount }));
        } catch (err) {
            console.warn("Failed to load cancel requests", err);
            setCancelRequests([]);
        }
    }, [playNotificationSound]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    useEffect(() => {
        fetchCancelRequests();
        const timer = window.setInterval(() => {
            fetchBookings();
            fetchCancelRequests();
        }, 30000);
        return () => window.clearInterval(timer);
    }, [fetchBookings, fetchCancelRequests]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setSearch(inputVal.trim());
    };

    const clearFilters = () => {
        setInputVal("");
        setSearch("");
        setStatusFilter("");
        setBranchFilter("");
        setSourceFilter("");
        setFromDate("");
        setToDate("");
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

    const openCancelModal = (bookingId) => {
        setCancelBookingId(bookingId);
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setShowCancelModal(false);
        setCancelBookingId(null);
    };

    const handleCreateBooking = async (payload) => {
        return bookingManagementApi.createBookingByStaff(payload);
    };

    const handleCreatedSuccess = async (createdBooking) => {
        const prepaidAmount = Number(createdBooking?.prepaidAmount || 0);
        await Swal.fire({
            icon: "success",
            title: "Booking created",
            text:
                prepaidAmount > 0
                    ? `New booking was created. Amount collected now: ${formatVND(prepaidAmount)}.`
                    : "New booking was created successfully.",
            timer: 1600,
            showConfirmButton: false,
        });
        fetchBookings();
    };

    const handleDeleteBooking = async (booking) => {
        // Bước 1: hiển thị cảnh báo
        const { isConfirmed: step1 } = await Swal.fire({
            title: "Delete Booking?",
            html: `
                <div style="text-align:left;font-family:system-ui,sans-serif">
                    <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:flex-start;gap:10px">
                        <span style="font-size:22px;flex-shrink:0">🚨</span>
                        <div>
                            <div style="font-weight:800;color:#b91c1c;font-size:14px;margin-bottom:4px">This action cannot be undone!</div>
                            <div style="color:#7f1d1d;font-size:12px;line-height:1.6">
                                Deleting this booking will <strong>permanently remove</strong> all related data, including:<br/>
                                • Guest information<br/>
                                • Room details and pricing<br/>
                                • Payment and refund history<br/>
                                • Cancellation policy records
                            </div>
                        </div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:10px 14px">
                        <div style="font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;margin-bottom:6px">📋 Booking to delete</div>
                        <div style="font-weight:800;font-size:15px;color:#111827">${booking.bookingCode || booking.bookingId}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:2px">${booking.customerName} &bull; ${booking.branchName}</div>
                        <div style="font-size:12px;color:#6b7280">${formatVND(booking.totalAmount)} &bull; ${booking.status}</div>
                    </div>
                </div>
            `,
            icon: undefined,
            showCancelButton: true,
            confirmButtonText: "Continue to delete →",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
            width: 500,
        });

        if (!step1) return;

        // Bước 2: yêu cầu nhập mã booking để xác nhận
        const bookingCode = (booking.bookingCode || String(booking.bookingId)).trim();
        const { value: typedCode } = await Swal.fire({
            title: "Confirm Deletion",
            html: `
                <div style="font-family:system-ui,sans-serif">
                    <p style="color:#374151;margin-bottom:12px">
                        Enter booking code <strong style="color:#dc2626;font-family:monospace">${bookingCode}</strong> to confirm deletion:
                    </p>
                    <input
                        id="delete-confirm-input"
                        class="swal2-input"
                        placeholder="${bookingCode}"
                        style="font-family:monospace;font-weight:700;letter-spacing:1px"
                    />
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "🗑️ Delete permanently",
            cancelButtonText: "Go back",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
            focusConfirm: false,
            preConfirm: () => {
                const val = document.getElementById("delete-confirm-input")?.value?.trim();
                if (val !== bookingCode) {
                    Swal.showValidationMessage(`Code does not match — enter exactly "${bookingCode}"`);
                    return false;
                }
                return val;
            },
        });

        if (!typedCode) return;

        // Gọi API xóa
        try {
            await bookingManagementApi.deleteBooking(booking.bookingId);
            await Swal.fire({
                icon: "success",
                title: "Booking Deleted",
                text: `Booking ${bookingCode} and all related data have been removed from the system.`,
                timer: 2500,
                showConfirmButton: false,
            });
            fetchBookings();
        } catch (err) {
            const msg = err?.response?.data?.message || "Failed to delete booking. Please try again.";
            Swal.fire({ icon: "error", title: "Cannot delete", text: msg, confirmButtonColor: "#dc2626" });
        }
    };

    return (
        <div className="bm-page">
            {/* Breadcrumb + title */}
            <div className="bm-title-row">
                <div>
                    <h4 className="page-title">Booking Management</h4>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <Buttons
                        variant="outline"
                        className="btn-sm"
                        icon={<i className="bi bi-plus-lg" />}
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Booking
                    </Buttons>
                    <Buttons
                        variant="primary"
                        className="btn-sm"
                        icon={<i className="bi bi-arrow-clockwise" />}
                        onClick={fetchBookings}
                        isLoading={loading}
                    >
                        Refresh
                    </Buttons>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="bm-stats-row mb-4">
                {STAT_CARDS.map((card) => (
                    <StatCard
                        key={card.key}
                        card={card}
                        value={stats[card.key] || 0}
                        loading={loading}
                        isClickable={card.key === "cancelRequested"}
                        onClick={card.key === "cancelRequested" ? () => setShowCancelRequests(true) : undefined}
                    />
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
                            className="form-select bm-filter-select"
                            value={branchFilter}
                            onChange={(e) => {
                                setBranchFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">All branches</option>
                            {branchOptions.map((branch) => (
                                <option key={branch.branchId} value={branch.branchId}>
                                    {branch.branchName || `Branch #${branch.branchId}`}
                                </option>
                            ))}
                        </select>
                        <select
                            className="form-select bm-filter-select"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        >
                            <option value="">All statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <select
                            className="form-select bm-filter-select"
                            value={sourceFilter}
                            onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
                        >
                            <option value="">All sources</option>
                            <option value="internal">Internal (can cancel)</option>
                            <option value="external">External (cannot cancel)</option>
                        </select>
                        <input
                            type="date"
                            className="form-control bm-filter-date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(0);
                            }}
                            aria-label="From date"
                        />
                        <input
                            type="date"
                            className="form-control bm-filter-date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(0);
                            }}
                            aria-label="To date"
                        />
                        <div className="bm-btn-group">
                            <Buttons
                                variant="primary"
                                type="submit"
                                className="btn-sm"
                                icon={<i className="bi bi-search d-none d-sm-inline" />}
                            >
                                Search
                            </Buttons>
                            <Buttons variant="outline" className="btn-sm" onClick={clearFilters}>
                                Clear
                            </Buttons>
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
                                <th>Source</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                                        Loading bookings...
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox fs-3 d-block mb-2" />
                                        No bookings found
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => {
                                    const sourceBadge = getSourceBadge(booking.source);
                                    return (
                                    <tr
                                        key={booking.bookingId}
                                        className={`booking-row ${booking.cancelRequested ? "booking-row-cancel-requested" : ""}`}
                                    >
                                        <td className="ps-4">
                                            <div className="booking-code-line">
                                                <span className="fw-semibold" style={{ color: COLORS.PRIMARY }}>
                                                    {booking.bookingCode || "-"}
                                                </span>
                                                {booking.cancelRequested && (
                                                    <span className="cancel-request-chip">
                                                        Request cancel
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                {formatDate(booking.createdAt)}
                                            </div>
                                            {booking.cancelRequested && (
                                                <div className="cancel-request-note">Guest is waiting for cancellation review.</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="fw-semibold">{booking.customerName}</div>
                                            <div className="text-muted small">{booking.customerPhone || booking.customerEmail || "-"}</div>
                                        </td>
                                        <td>
                                            <div className="small">{booking.branchName || "-"}</div>
                                        </td>
                                        <td>
                                            <div className={sourceBadge.className}>{sourceBadge.label}</div>
                                        </td>
                                        <td className="small">{formatDate(booking.checkInDate)}</td>
                                        <td className="small">{formatDate(booking.checkOutDate)}</td>
                                        <td className="fw-semibold">{formatVND(booking.totalAmount)}</td>
                                        <td><StatusBadge status={booking.status} /></td>
                                        <td className="text-end pe-4">
                                            <button
                                                className="btn btn-sm btn-outline-secondary me-1"
                                                style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                                                title="View Details"
                                                onClick={() => openDetail(booking.bookingId)}
                                            >
                                                <i className="bi bi-eye me-1" />
                                                View
                                            </button>
                                            {booking.status !== "CANCELLED" && isInternalFrontendBooking(booking.source) && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger me-1"
                                                    style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                                                    title="Cancel Booking"
                                                    onClick={() => openCancelModal(booking.bookingId)}
                                                >
                                                    <i className="bi bi-x-circle me-1" />
                                                    Cancel
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                                                    title="Delete all booking data"
                                                    onClick={() => handleDeleteBooking(booking)}
                                                >
                                                    <i className="bi bi-trash3 me-1" />
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })
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
                onRequestCancel={(bookingId) => {
                    openCancelModal(bookingId);
                }}
            />

            <CancelBookingModal
                show={showCancelModal}
                bookingId={cancelBookingId}
                onHide={closeCancelModal}
                onCancelled={async () => {
                    await fetchBookings();
                    await fetchCancelRequests();
                }}
            />

            <CreateBookingByStaffModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateBooking}
                onSuccess={handleCreatedSuccess}
            />

            <CancelRequestsModal
                show={showCancelRequests}
                requests={cancelRequests}
                onClose={() => setShowCancelRequests(false)}
                onCancelBooking={(bookingId) => {
                    setShowCancelRequests(false);
                    openCancelModal(bookingId);
                }}
            />
        </div>
    );
}