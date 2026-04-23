import React, { useState, useCallback, useEffect } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import BookingAmendmentModal from "./BookingAmendmentModal";
import BookingAmendmentHistory from "./BookingAmendmentHistory";
import "./BookingDetailModal.css";
import Buttons from "@/components/ui/Buttons";

const STATUS_CONFIG = {
    CONFIRMED: { bg: "rgba(25,135,84,0.12)", text: "#198754", dot: "#198754" },
    PENDING: { bg: "rgba(255,193,7,0.18)", text: "#997404", dot: "#ffc107" },
    CANCELLED: { bg: "rgba(220,53,69,0.12)", text: "#b02a37", dot: "#dc3545" },
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
    const cfg = STATUS_CONFIG[status] || { bg: "rgba(108,117,125,0.12)", text: "#495057" };
    return (
        <span className="status-badge" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
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

export default function BookingDetailModal({ show, bookingId, onHide, onStatusChanged, onRequestCancel }) {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [showStatusPanel, setShowStatusPanel] = useState(false);
    const [showAmendment, setShowAmendment] = useState(false);

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
                                        <Buttons
                                            variant="primary"
                                            className="btn-sm"
                                            isLoading={actionLoading}
                                            disabled={newStatus === booking.status}
                                            onClick={handleUpdateStatus}
                                        >
                                            Save
                                        </Buttons>
                                        <Buttons
                                            variant="outline"
                                            className="btn-sm"
                                            disabled={actionLoading}
                                            onClick={() => { setShowStatusPanel(false); setNewStatus(booking.status); }}
                                        >
                                            Cancel
                                        </Buttons>
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
                                    <InfoItem label="Check-in" value={formatDate(booking.arrivalDate)} />
                                    <InfoItem label="Check-out" value={formatDate(booking.departureDate)} />
                                    <InfoItem label="Total Amount" value={<span className="fw-semibold text-success">{formatVND(booking.totalAmount)}</span>} />
                                    <InfoItem label="Invoice Status" value={booking.invoiceStatus} />
                                </div>
                                <div className="info-row mt-2">
                                    <InfoItem label="Total Paid" value={formatVND(booking.totalPaidAmount)} />
                                    <InfoItem label="Refund Amount" value={<span className="fw-semibold text-danger">{formatVND(booking.refundAmount)}</span>} />
                                    <InfoItem label="Retained Amount" value={formatVND(booking.retainedAmount)} />
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
                                                    <th className="text-end">Qty</th>
                                                    <th className="text-end">Price/Night</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {booking.details.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.roomTypeName || "-"}</td>
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

                            {/* Cancellation Policy */}
                            {(booking.cancellationPolicyName || booking.freeCancelDays != null || booking.snapshotRefundRate != null) && (() => {
                                const policyName = booking.cancellationPolicyName || "Default Policy";
                                const policyType = String(booking.cancellationPolicyType || "").trim().toUpperCase();
                                const prepaidRate = Number(booking.cancellationPolicyPrepaidRate ?? 0);
                                const refundRate = Number(booking.snapshotRefundRate ?? 0);
                                const freeCancelDays = booking.freeCancelDays;

                                const total = Number(booking.totalAmount || 0);
                                const prepaidAmt = Number(booking.prepaidAmount || Math.round(total * prepaidRate / 100));
                                const refundAmt = Math.round(prepaidAmt * refundRate / 100);
                                const retainAmt = Math.max(0, prepaidAmt - refundAmt);

                                // Free cancel deadline from backend
                                let deadlineStr = null;
                                const isSameDayCancel = freeCancelDays === 0;
                                if (booking.freeCancelDeadline) {
                                    const dt = new Date(booking.freeCancelDeadline);
                                    if (!isNaN(dt.getTime())) {
                                        deadlineStr = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
                                    }
                                }

                                const typeCfg = {
                                    FREE_CANCEL: { label: "Free cancellation", dot: "#16a34a", bg: "#dcfce7", color: "#15803d" },
                                    PARTIAL_REFUND: { label: "Partial refund", dot: "#d97706", bg: "#fef3c7", color: "#92400e" },
                                    NON_REFUND: { label: "Non-refundable", dot: "#dc2626", bg: "#fee2e2", color: "#991b1b" },
                                    PAY_AT_HOTEL: { label: "Pay at hotel", dot: "#2563eb", bg: "#dbeafe", color: "#1e40af" },
                                }[policyType] || { label: policyType || "Standard policy", dot: "#6b7280", bg: "#f3f4f6", color: "#374151" };

                                return (
                                    <InfoSection icon="bi-shield-check" title="Cancellation Policy">
                                        {/* Badge + name */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: typeCfg.bg, color: typeCfg.color }}>
                                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: typeCfg.dot, display: "inline-block" }} />
                                                {typeCfg.label}
                                            </span>
                                            <span style={{ fontWeight: 700, fontSize: 13, color: "#1f2937" }}>{policyName}</span>
                                        </div>

                                        {/* 3 amount cards */}
                                        {total > 0 && (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: (deadlineStr || booking.isFreeCancel != null) ? 10 : 0 }}>
                                                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", borderLeft: "3px solid #465c47" }}>
                                                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Deposit</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{formatVND(prepaidAmt)}</div>
                                                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{prepaidRate}% of total</div>
                                                </div>
                                                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", borderLeft: `3px solid ${refundAmt > 0 ? "#16a34a" : "#e5e7eb"}` }}>
                                                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Refund if cancelled</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: refundAmt > 0 ? "#16a34a" : "#dc2626" }}>{formatVND(refundAmt)}</div>
                                                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{refundRate}% of deposit</div>
                                                </div>
                                                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", borderLeft: "3px solid #e5e7eb" }}>
                                                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Hotel retains</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: "#374151" }}>{formatVND(retainAmt)}</div>
                                                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{100 - refundRate}% of deposit</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Refund deadline */}
                                        {deadlineStr && (
                                            <div style={{ fontSize: 12, color: booking.isFreeCancel ? "#15803d" : "#b91c1c", background: booking.isFreeCancel ? "#f0fdf4" : "#fef2f2", border: `1px solid ${booking.isFreeCancel ? "#bbf7d0" : "#fecaca"}`, borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                                                <i className={`bi ${booking.isFreeCancel ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`} />
                                                {isSameDayCancel
                                                    ? <><strong>Free cancellation</strong> on or before <strong style={{ marginLeft: 3 }}>{deadlineStr}</strong> <span style={{ color: "#9aaa9b", marginLeft: 4 }}>(check-in day)</span></>
                                                    : <><strong>Free cancellation</strong> before <strong style={{ marginLeft: 3 }}>{deadlineStr}</strong> <span style={{ color: "#9aaa9b", marginLeft: 4 }}>({freeCancelDays} days before check-in)</span></>
                                                }
                                                {booking.isFreeCancel === true && <span style={{ marginLeft: "auto", fontWeight: 700, color: "#15803d" }}>✓ Eligible</span>}
                                                {booking.isFreeCancel === false && <span style={{ marginLeft: "auto", fontWeight: 700, color: "#b91c1c" }}>✗ Expired</span>}
                                            </div>
                                        )}
                                    </InfoSection>
                                );
                            })()}



                            {/* Meta */}
                            <InfoSection icon="bi-info-circle" title="Metadata">
                                <div className="info-row">
                                    <InfoItem label="Created At" value={formatDate(booking.createdAt)} />
                                    <InfoItem label="Transaction Code" value={booking.transactionCode} />
                                </div>
                            </InfoSection>
                        </>
                    )}

                    {/* Amendment History */}
                    {booking && (
                        <BookingAmendmentHistory bookingId={booking.bookingId} />
                    )}
                </div>

                {/* Footer */}
                <div className="bm-modal-footer">
                    {/* Nút Sửa Booking — chỉ hiển thị cho booking nội bộ chưa check-in */}
                    {booking &&
                        ["FRONT_END", "STAFF"].includes((booking.source || "").toUpperCase()) &&
                        !["CHECKED_IN", "CHECKED_OUT", "CANCELLED"].includes((booking.status || "").toUpperCase()) && (
                            <Buttons
                                variant="outline"
                                className="btn-sm me-auto"
                                style={{ borderColor: "#3d6b3d", color: "#3d6b3d" }}
                                onClick={() => setShowAmendment(true)}
                                disabled={actionLoading}
                            >
                                <i className="bi bi-pencil-square me-1" />
                                Amend Booking
                            </Buttons>
                        )}
                    <Buttons variant="outline" className="btn-sm" onClick={onHide} disabled={actionLoading}>
                        Close
                    </Buttons>
                </div>
            </div>

            {/* Amendment Modal */}
            {booking && (
                <BookingAmendmentModal
                    show={showAmendment}
                    booking={booking}
                    onHide={() => setShowAmendment(false)}
                    onSuccess={() => {
                        setShowAmendment(false);
                        fetchDetail();
                        onStatusChanged?.();
                    }}
                    onRequestCancel={(bookingId) => {
                        setShowAmendment(false);
                        onHide();
                        onRequestCancel?.(bookingId);
                    }}
                />
            )}
        </div>
    );
}
