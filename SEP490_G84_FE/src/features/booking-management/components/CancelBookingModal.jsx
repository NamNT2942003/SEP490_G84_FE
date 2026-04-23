import React, { useCallback, useEffect, useState } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import Buttons from "@/components/ui/Buttons";
import Swal from "sweetalert2";
import { COLORS } from "@/constants";
import "./CancelBookingModal.css";

const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatVND = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "VND" }).format(amount || 0);

const isInternalFrontendBooking = (source) => (source || "").trim().toUpperCase() === "FRONT_END";

export default function CancelBookingModal({ show, bookingId, onHide, onCancelled }) {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchDetail = useCallback(async () => {
        if (!bookingId) return;
        try {
            setLoading(true);
            setError("");
            const data = await bookingManagementApi.getBookingDetail(bookingId);
            setBooking(data);
        } catch (err) {
            setBooking(null);
            setError(err?.response?.data?.message || "Failed to load booking detail.");
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        if (show && bookingId) {
            fetchDetail();
        }
    }, [show, bookingId, fetchDetail]);

    const handleCancelBooking = async () => {
        if (!booking) return;

        if (!isInternalFrontendBooking(booking.source)) {
            await Swal.fire({
                icon: "warning",
                title: "Not allowed",
                text: "Only internal FRONT_END bookings can be cancelled.",
            });
            return;
        }

        const refundAmount = Number(booking?.refundAmount || 0);
        const retainedAmount = Number(booking?.retainedAmount || 0);
        const result = await Swal.fire({
            title: "Cancel booking?",
            html:
                `This action cannot be undone.<br/>` +
                `Amount to refund customer: <b>${formatVND(refundAmount)}</b><br/>` +
                `Amount retained by hotel: <b>${formatVND(retainedAmount)}</b>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: COLORS.PRIMARY,
            confirmButtonText: "Yes, cancel",
            cancelButtonText: "Go back",
        });
        if (!result.isConfirmed) return;

        try {
            setActionLoading(true);
            setError("");
            await bookingManagementApi.cancelBooking(booking.bookingId);
            await onCancelled?.();
            await Swal.fire({
                icon: "success",
                title: "Booking cancelled",
                timer: 1200,
                showConfirmButton: false,
            });
            onHide?.();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to cancel booking.");
        } finally {
            setActionLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="bm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onHide?.()}>
            <div className="bm-modal cancel-modal-shell">
                <div className="bm-modal-header cancel-modal-header">
                    <div>
                        <h5 className="mb-0 fw-bold">Cancel Booking</h5>
                        <div className="booking-code">Review cancellation before confirm</div>
                    </div>
                    <button type="button" className="btn-close" onClick={onHide} disabled={actionLoading} />
                </div>

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
                        <div className="text-center py-5 text-muted">No booking data</div>
                    ) : (
                        <>
                            <div className="cancel-headline">
                                <div>
                                    <div className="cancel-code">{booking.bookingCode || `#${booking.bookingId}`}</div>
                                    <div className="cancel-sub">
                                        {booking.customerName || "Unknown guest"} · {booking.branchName || "-"}
                                    </div>
                                </div>
                                <span className="cancel-status-tag">{booking.status || "-"}</span>
                            </div>

                            <div className="cancel-stats">
                                <div className="cancel-stat-card">
                                    <label>Deposit</label>
                                    <strong>{formatVND(booking.totalPaidAmount)}</strong>
                                </div>
                                <div className="cancel-stat-card refund">
                                    <label>Refund</label>
                                    <strong>{formatVND(booking.refundAmount)}</strong>
                                </div>
                                <div className="cancel-stat-card retain">
                                    <label>Hotel retains</label>
                                    <strong>{formatVND(booking.retainedAmount)}</strong>
                                </div>
                            </div>

                            {/* Policy rules - structured description */}
                            {(() => {
                                const refundRate = Number(booking.snapshotRefundRate ?? 0);
                                const prepaidAmt = Number(booking.totalPaidAmount || 0);
                                const refundAmt = Number(booking.refundAmount || 0);
                                const retainAmt = Number(booking.retainedAmount || 0);
                                let deadlineStr = null;
                                const isSameDayCancel = booking.freeCancelDays === 0;
                                if (booking.freeCancelDeadline) {
                                    const dt = new Date(booking.freeCancelDeadline);
                                    if (!isNaN(dt.getTime())) {
                                        deadlineStr = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
                                    }
                                }
                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, marginBottom: 12 }}>
                                        {/* Rule 1: Free cancel before deadline */}
                                        {deadlineStr && (
                                            <div style={{
                                                fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                                background: booking.isFreeCancel ? "#f0fdf4" : "#f8fafc",
                                                border: `1px solid ${booking.isFreeCancel ? "#bbf7d0" : "#e5e7eb"}`,
                                                borderRadius: 7, padding: "8px 12px", color: booking.isFreeCancel ? "#15803d" : "#374151",
                                            }}>
                                                <i className="bi bi-check-circle-fill" style={{ marginTop: 1, flexShrink: 0, color: "#16a34a" }} />
                                                <span style={{ flex: 1 }}>
                                                    Cancel before 23:59, <strong>{deadlineStr}</strong>{isSameDayCancel ? " (check-in day)" : ""}: Get back <strong>{formatVND(prepaidAmt)}</strong> (100% refund).
                                                </span>
                                                {booking.isFreeCancel === true && <span style={{ flexShrink: 0, fontWeight: 700, color: "#15803d" }}>✓ Eligible</span>}
                                            </div>
                                        )}

                                        {/* Rule 2: Cancel after deadline → partial refund */}
                                        {deadlineStr && refundRate > 0 && refundRate < 100 && (
                                            <div style={{
                                                fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                                background: booking.isFreeCancel === false ? "#fffbeb" : "#f8fafc",
                                                border: `1px solid ${booking.isFreeCancel === false ? "#fcd34d" : "#e5e7eb"}`,
                                                borderRadius: 7, padding: "8px 12px", color: booking.isFreeCancel === false ? "#92400e" : "#374151",
                                            }}>
                                                <i className="bi bi-exclamation-triangle-fill" style={{ marginTop: 1, flexShrink: 0, color: "#d97706" }} />
                                                <span style={{ flex: 1 }}>
                                                    Cancel from <strong>{(() => { const d = new Date(booking.freeCancelDeadline); d.setDate(d.getDate() + 1); return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }); })()}</strong>: Get back <strong>{formatVND(refundAmt)}</strong> ({refundRate}% refund). Cancellation fee is <strong>{formatVND(retainAmt)}</strong>.
                                                </span>
                                                {booking.isFreeCancel === false && <span style={{ flexShrink: 0, fontWeight: 700, color: "#b91c1c" }}>✗ Expired</span>}
                                            </div>
                                        )}

                                        {/* Rule 2 alt: Cancel after deadline → no refund */}
                                        {deadlineStr && refundRate === 0 && (
                                            <div style={{
                                                fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                                background: booking.isFreeCancel === false ? "#fef2f2" : "#f8fafc",
                                                border: `1px solid ${booking.isFreeCancel === false ? "#fecaca" : "#e5e7eb"}`,
                                                borderRadius: 7, padding: "8px 12px", color: booking.isFreeCancel === false ? "#991b1b" : "#374151",
                                            }}>
                                                <i className="bi bi-x-circle-fill" style={{ marginTop: 1, flexShrink: 0, color: "#dc2626" }} />
                                                <span style={{ flex: 1 }}>
                                                    Cancel from <strong>{(() => { const d = new Date(booking.freeCancelDeadline); d.setDate(d.getDate() + 1); return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }); })()}</strong>: No refund. Hotel retains the full <strong>{formatVND(prepaidAmt)}</strong> deposit.
                                                </span>
                                                {booking.isFreeCancel === false && <span style={{ flexShrink: 0, fontWeight: 700, color: "#b91c1c" }}>✗ Expired</span>}
                                            </div>
                                        )}

                                        {/* Non-refundable (no free cancel window at all) */}
                                        {!deadlineStr && refundRate === 0 && (
                                            <div style={{
                                                fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                                background: "#fef2f2", border: "1px solid #fecaca",
                                                borderRadius: 7, padding: "8px 12px", color: "#991b1b",
                                            }}>
                                                <i className="bi bi-x-circle-fill" style={{ marginTop: 1, flexShrink: 0 }} />
                                                <span>
                                                    No refund supported. Hotel retains the full <strong>{formatVND(prepaidAmt)}</strong> deposit.
                                                </span>
                                            </div>
                                        )}

                                        {/* No free cancel window but partial refund available */}
                                        {!deadlineStr && refundRate > 0 && (
                                            <div style={{
                                                fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                                background: "#fffbeb", border: "1px solid #fcd34d",
                                                borderRadius: 7, padding: "8px 12px", color: "#92400e",
                                            }}>
                                                <i className="bi bi-exclamation-triangle-fill" style={{ marginTop: 1, flexShrink: 0 }} />
                                                <span>
                                                    If cancelled: Get back <strong>{formatVND(refundAmt)}</strong> ({refundRate}% refund). Cancellation fee is <strong>{formatVND(retainAmt)}</strong>.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="cancel-meta">
                                <span><i className="bi bi-calendar-check" /> Check-in: {formatDate(booking.arrivalDate)}</span>
                                <span><i className="bi bi-calendar-x" /> Check-out: {formatDate(booking.departureDate)}</span>
                                <span><i className="bi bi-wallet2" /> Booking Total: {formatVND(booking.totalAmount)}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="bm-modal-footer">
                    <Buttons
                        variant="danger"
                        className="btn-sm"
                        icon={<i className="bi bi-x-circle" />}
                        isLoading={actionLoading}
                        disabled={loading || !booking}
                        onClick={handleCancelBooking}
                    >
                        Confirm Cancel
                    </Buttons>
                    <Buttons variant="outline" className="btn-sm" onClick={onHide} disabled={actionLoading}>
                        Close
                    </Buttons>
                </div>
            </div>
        </div>
    );
}
