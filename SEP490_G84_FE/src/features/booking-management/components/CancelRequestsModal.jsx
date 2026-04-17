import React from "react";
import Buttons from "@/components/ui/Buttons";

const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
};

const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

export default function CancelRequestsModal({ show, requests = [], onClose, onCancelBooking }) {
    if (!show) return null;

    return (
        <div className="bm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bm-modal" style={{ width: "min(980px, 96vw)" }}>
                <div className="bm-modal-header">
                    <div>
                        <h5 className="mb-0 fw-bold">Cancellation Requests</h5>
                        <div className="text-muted small">Bookings waiting for staff review</div>
                    </div>
                    <button type="button" className="btn-close" onClick={onClose} />
                </div>

                <div className="bm-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    {requests.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-3 d-block mb-2" />
                            No cancellation requests right now.
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {requests.map((booking) => (
                                <div
                                    key={booking.bookingId}
                                    className="border rounded-3 p-3"
                                    style={{ background: "rgba(220,53,69,0.10)", borderColor: "rgba(220,53,69,0.35)", borderLeftWidth: "5px" }}
                                >
                                    <div className="d-flex justify-content-between gap-3 flex-wrap align-items-start mb-2">
                                        <div>
                                            <div className="fw-bold" style={{ color: "#b02a37" }}>
                                                {booking.bookingCode || "-"}
                                            </div>
                                            <div className="small text-muted">
                                                {booking.customerName || "-"} · {booking.customerPhone || "-"}
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div className="small text-muted">Created at {formatDate(booking.createdAt)}</div>
                                            <div className="small text-muted">Amount {formatVND(booking.totalAmount)}</div>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        <span className="badge text-bg-light border">{booking.branchName || "Unknown branch"}</span>
                                        <span className="badge" style={{ background: "rgba(220,53,69,0.12)", color: "#b02a37" }}>
                                            Request cancel
                                        </span>
                                        {booking.status && (
                                            <span className="badge text-bg-light border">{booking.status}</span>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Buttons
                                            variant="danger"
                                            className="btn-sm"
                                            icon={<i className="bi bi-x-circle" />}
                                            onClick={() => onCancelBooking?.(booking.bookingId)}
                                        >
                                            Open cancel review
                                        </Buttons>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bm-modal-footer">
                    <Buttons variant="outline" className="btn-sm" onClick={onClose}>
                        Close
                    </Buttons>
                </div>
            </div>
        </div>
    );
}