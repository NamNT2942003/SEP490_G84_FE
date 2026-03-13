import React, { useState, useCallback, useEffect } from "react";
import bookingManagementApi from "../api/bookingManagementApi";

const BRAND = "#5C6F4E";

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
    return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
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

export default function BookingDetailModal({
                                               show,
                                               bookingId,
                                               onHide,
                                               onStatusChanged,
                                               onBookingCancelled,
                                           }) {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [showStatusSelect, setShowStatusSelect] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await bookingManagementApi.getBookingDetail(bookingId);
            setBooking(data);
            setNewStatus(data.status || "");
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load booking detail");
            setBooking(null);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        if (show && bookingId) {
            fetchDetail();
        }
    }, [show, bookingId, fetchDetail]);

    const handleStatusChange = async () => {
        if (!newStatus || newStatus === booking.status) {
            setShowStatusSelect(false);
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            const updated = await bookingManagementApi.updateBookingStatus(bookingId, newStatus);
            setBooking(updated);
            setShowStatusSelect(false);
            if (onStatusChanged) {
                onStatusChanged(updated);
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            const updated = await bookingManagementApi.cancelBooking(bookingId);
            setBooking(updated);
            if (onBookingCancelled) {
                onBookingCancelled(updated);
            }
            setTimeout(() => onHide(), 1500);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to cancel booking");
        } finally {
            setActionLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div
            className="modal"
            style={{
                display: show ? "block" : "none",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
        >
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header bg-light border-bottom">
                        <div>
                            <h5 className="modal-title mb-0">Booking Detail</h5>
                            {booking && (
                                <small className="text-muted">#{booking.bookingCode || booking.bookingId}</small>
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onHide}
                            disabled={actionLoading}
                        ></button>
                    </div>

                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger mb-3" role="alert">
                                <i className="bi bi-exclamation-circle me-2"></i>
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                Loading...
                            </div>
                        ) : !booking ? (
                            <div className="text-center py-5 text-muted">No booking data found</div>
                        ) : (
                            <div>
                                {/* Status & Basic Info */}
                                <div
                                    className="card border-0 mb-3"
                                    style={{ backgroundColor: "#f8f9fb", borderRadius: 8 }}
                                >
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">Status</label>
                                                <div className="d-flex align-items-center gap-2">
                                                    <StatusBadge status={booking.status} />
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => setShowStatusSelect(!showStatusSelect)}
                                                        disabled={actionLoading || booking.status === "CANCELLED"}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">Source</label>
                                                <span className="fw-semibold">{booking.source || "-"}</span>
                                            </div>
                                        </div>

                                        {showStatusSelect && booking.status !== "CANCELLED" && (
                                            <div className="mt-3 pt-3 border-top">
                                                <div className="d-flex gap-2 align-items-end">
                                                    <div className="flex-grow-1">
                                                        <label className="form-label small mb-1">Change Status To</label>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={newStatus}
                                                            onChange={(e) => setNewStatus(e.target.value)}
                                                            disabled={actionLoading}
                                                        >
                                                            <option value={booking.status}>{booking.status}</option>
                                                            <option value="PENDING">Pending</option>
                                                            <option value="CONFIRMED">Confirmed</option>
                                                            <option value="COMPLETED">Completed</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ backgroundColor: BRAND, color: "white" }}
                                                        onClick={handleStatusChange}
                                                        disabled={actionLoading || newStatus === booking.status}
                                                    >
                                                        {actionLoading ? "..." : "Update"}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => {
                                                            setShowStatusSelect(false);
                                                            setNewStatus(booking.status);
                                                        }}
                                                        disabled={actionLoading}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="card border-0 mb-3" style={{ borderRadius: 8 }}>
                                    <div className="card-header bg-light border-bottom py-2 px-3">
                                        <h6 className="mb-0 fw-semibold">Customer Information</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="text-muted small fw-semibold d-block mb-1">Name</label>
                                                <span className="fw-semibold">{booking.customerName || "-"}</span>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">Email</label>
                                                <span className="text-break">{booking.customerEmail || "-"}</span>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">Phone</label>
                                                <span>{booking.customerPhone || "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Property Info */}
                                <div className="card border-0 mb-3" style={{ borderRadius: 8 }}>
                                    <div className="card-header bg-light border-bottom py-2 px-3">
                                        <h6 className="mb-0 fw-semibold">Property Information</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="text-muted small fw-semibold d-block mb-1">Branch</label>
                                                <span className="fw-semibold">{booking.branchName || "-"}</span>
                                            </div>
                                            <div className="col-12">
                                                <label className="text-muted small fw-semibold d-block mb-1">Address</label>
                                                <span>{booking.branchAddress || "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="card border-0 mb-3" style={{ borderRadius: 8 }}>
                                    <div className="card-header bg-light border-bottom py-2 px-3">
                                        <h6 className="mb-0 fw-semibold">Booking Details</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">
                                                    Check-in
                                                </label>
                                                <span>{formatDate(booking.arrivalDate)}</span>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">
                                                    Check-out
                                                </label>
                                                <span>{formatDate(booking.departureDate)}</span>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">
                                                    Total Amount
                                                </label>
                                                <span className="fw-semibold text-success">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">
                                                    Invoice Status
                                                </label>
                                                <span>{booking.invoiceStatus || "-"}</span>
                                            </div>
                                        </div>

                                        {booking.details && booking.details.length > 0 && (
                                            <div className="mt-3 pt-3 border-top">
                                                <label className="text-muted small fw-semibold d-block mb-2">
                                                    Room Details
                                                </label>
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-borderless">
                                                        <thead style={{ backgroundColor: "#f0f0f0" }}>
                                                        <tr>
                                                            <th className="small fw-semibold py-2">Room Type</th>
                                                            <th className="small fw-semibold py-2 text-end">Qty</th>
                                                            <th className="small fw-semibold py-2 text-end">Price/Night</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {booking.details.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="small py-2">{item.roomTypeName || "-"}</td>
                                                                <td className="small py-2 text-end">{item.quantity}</td>
                                                                <td className="small py-2 text-end">
                                                                    {formatCurrency(item.priceAtBooking)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {booking.specialRequests && (
                                            <div className="mt-3 pt-3 border-top">
                                                <label className="text-muted small fw-semibold d-block mb-1">
                                                    Special Requests
                                                </label>
                                                <p className="small mb-0">{booking.specialRequests}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="card border-0" style={{ borderRadius: 8 }}>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">
                                                    Created At
                                                </label>
                                                <small>{formatDate(booking.createdAt)}</small>
                                            </div>
                                            <div className="col-6">
                                                <label className="text-muted small fw-semibold d-block mb-1">
                                                    Transaction Code
                                                </label>
                                                <small>{booking.transactionCode || "-"}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer bg-light border-top">
                        {booking && booking.status !== "CANCELLED" && (
                            <button
                                className="btn btn-danger"
                                onClick={handleCancelBooking}
                                disabled={actionLoading || loading}
                            >
                                {actionLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-x-circle me-2"></i>
                                        Cancel Booking
                                    </>
                                )}
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={onHide} disabled={actionLoading}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
