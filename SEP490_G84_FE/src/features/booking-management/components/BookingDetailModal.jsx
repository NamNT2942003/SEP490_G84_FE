import React, { useState, useCallback, useEffect } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import "./BookingDetailModal.css";

const BRAND = "#5C6F4E";

const STATUS_CONFIG = {
    CONFIRMED: { bg: "rgba(25,135,84,0.12)", text: "#198754", dot: "#198754" },
    PENDING:   { bg: "rgba(255,193,7,0.18)",  text: "#997404", dot: "#ffc107" },
    CANCELLED: { bg: "rgba(220,53,69,0.12)",  text: "#b02a37", dot: "#dc3545" },
    COMPLETED: { bg: "rgba(13,110,253,0.12)", text: "#0d6efd", dot: "#0d6efd" },
};

const UPDATABLE_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED"];

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

const InfoSection = ({ icon, title, children }) => (
    <div className="info-section">
        <div className="info-section-header">
            <i className={`bi ${icon}`} />
            {title}
        </div>
        <div className="info-section-body">{children}</div>
    </div>
);

const InfoItem = ({ label, value, wide }) => (
    <div className={`info-item${wide ? " col-span-2" : ""}`}>
        <label>{label}</label>
        <span>{value || "-"}</span>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────

export default function BookingDetailModal({ show, bookingId, onHide, onStatusChanged, onBookingCancelled }) {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [showStatusPanel, setShowStatusPanel] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await bookingManagementApi.getBookingDetail(bookingId);
            setBooking(data);
            setNewStatus(data.status || "");
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load booking detail.");
            setBooking(null);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        if (show && bookingId) {
            setShowStatusPanel(false);
            fetchDetail();
        }
    }, [show, bookingId, fetchDetail]);

    const handleUpdateStatus = async () => {
        if (!newStatus || newStatus === booking.status) {
            setShowStatusPanel(false);
            return;
        }
        try {
            setActionLoading(true);
            setError("");
            const updated = await bookingManagementApi.updateBookingStatus(bookingId, newStatus);
            setBooking(updated);
            setShowStatusPanel(false);
            onStatusChanged?.(updated);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update status.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            setActionLoading(true);
            setError("");
            const updated = await bookingManagementApi.cancelBooking(bookingId);
            setBooking(updated);
            onBookingCancelled?.(updated);
            setTimeout(onHide, 1200);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to cancel booking.");
        } finally {
            setActionLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="bm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onHide()}>
            <div className="bm-modal">
                {/* Header */}
                <div className="bm-modal-header">
                    <div>
                        <h5 className="mb-0 fw-bold">Booking Detail</h5>
                        {booking && (
                            <div className="booking-code">
                                #{booking.bookingCode || booking.bookingId}
                                {booking.source && (
                                    <span className="ms-2 badge bg-secondary" style={{ fontSize: "0.68rem" }}>
                                        {booking.source}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <button type="button" className="btn-close" onClick={onHide} disabled={actionLoading} />
                </div>

                {/* Body */}
                <div className="bm-modal-body">
                    {error && (
                        <div className="alert alert-danger py-2 mb-3" role="alert">
                            <i className="bi bi-exclamation-circle me-2" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-5 text-muted">
                            <div className="spinner-border spinner-border-sm me-2" role="status" />
                            Loading...
                        </div>
                    ) : !booking ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-3 d-block mb-2" />
                            No booking data
                        </div>
                    ) : (
                        <>
                            {/* Status */}
                            <InfoSection icon="bi-tag" title="Status">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <StatusBadge status={booking.status} />
                                    {booking.status !== "CANCELLED" && (
                                        <button
                                            className="btn btn-sm btn-outline-secondary py-0 px-2"
                                            style={{ fontSize: "0.75rem" }}
                                            onClick={() => setShowStatusPanel(!showStatusPanel)}
                                            disabled={actionLoading}
                                        >
                                            <i className="bi bi-pencil me-1" />
                                            Change
                                        </button>
                                    )}
                                </div>

                                {showStatusPanel && (
                                    <div className="status-change-panel">
                                        <div className="flex-grow-1">
                                            <label className="form-label small mb-1 fw-semibold">New Status</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                disabled={actionLoading}
                                            >
                                                {UPDATABLE_STATUSES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            className="btn btn-sm"
                                            style={{ backgroundColor: BRAND, color: "white" }}
                                            onClick={handleUpdateStatus}
                                            disabled={actionLoading || newStatus === booking.status}
                                        >
                                            {actionLoading ? <span className="spinner-border spinner-border-sm" /> : "Save"}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => { setShowStatusPanel(false); setNewStatus(booking.status); }}
                                            disabled={actionLoading}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </InfoSection>

                            {/* Customer */}
                            <InfoSection icon="bi-person" title="Customer">
                                <div className="info-row single">
                                    <InfoItem label="Full Name" value={booking.customerName} />
                                </div>
                                <div className="info-row mt-2">
                                    <InfoItem label="Email" value={booking.customerEmail} />
                                    <InfoItem label="Phone" value={booking.customerPhone} />
                                </div>
                            </InfoSection>

                            {/* Branch */}
                            <InfoSection icon="bi-building" title="Property">
                                <div className="info-row single">
                                    <InfoItem label="Branch" value={booking.branchName} />
                                </div>
                                {booking.branchAddress && (
                                    <div className="info-row single mt-2">
                                        <InfoItem label="Address" value={booking.branchAddress} />
                                    </div>
                                )}
                            </InfoSection>

                            {/* Stay */}
                            <InfoSection icon="bi-calendar-range" title="Booking Details">
                                <div className="info-row">
                                    <InfoItem label="Check-in"  value={formatDate(booking.arrivalDate)} />
                                    <InfoItem label="Check-out" value={formatDate(booking.departureDate)} />
                                    <InfoItem label="Total Amount" value={<span className="fw-semibold text-success">{formatVND(booking.totalAmount)}</span>} />
                                    <InfoItem label="Invoice Status" value={booking.invoiceStatus} />
                                </div>

                                {/* Room Details table */}
                                {booking.details?.length > 0 && (
                                    <div className="mt-3 pt-2 border-top">
                                        <label className="info-item" style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#adb5bd" }}>
                                            Rooms
                                        </label>
                                        <table className="room-detail-table">
                                            <thead>
                                                <tr>
                                                    <th>Room Type</th>
                                                    <th>Rate Plan</th>
                                                    <th className="text-end">Qty</th>
                                                    <th className="text-end">Price/Night</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {booking.details.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.roomTypeName || "-"}</td>
                                                        <td>{item.ratePlanName || "-"}</td>
                                                        <td className="text-end">{item.quantity}</td>
                                                        <td className="text-end">{formatVND(item.priceAtBooking)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Special Requests */}
                                {booking.specialRequests && (
                                    <div className="mt-3 pt-2 border-top">
                                        <label className="info-item" style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#adb5bd" }}>
                                            Special Requests
                                        </label>
                                        <p className="small mb-0 mt-1">{booking.specialRequests}</p>
                                    </div>
                                )}
                            </InfoSection>

                            {/* Meta */}
                            <InfoSection icon="bi-info-circle" title="Metadata">
                                <div className="info-row">
                                    <InfoItem label="Created At"       value={formatDate(booking.createdAt)} />
                                    <InfoItem label="Transaction Code" value={booking.transactionCode} />
                                </div>
                            </InfoSection>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bm-modal-footer">
                    {booking?.status !== "CANCELLED" && (
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={handleCancel}
                            disabled={actionLoading || loading}
                        >
                            {actionLoading ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                            ) : (
                                <i className="bi bi-x-circle me-2" />
                            )}
                            Cancel Booking
                        </button>
                    )}
                    <button className="btn btn-sm btn-outline-secondary" onClick={onHide} disabled={actionLoading}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
