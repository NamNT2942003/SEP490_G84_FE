import React, { useEffect, useState } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import { format } from "date-fns";

const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch {
        return dateString;
    }
};

const TimelineItem = ({ title, date, user, badgeColor, children }) => (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
                width: "12px", height: "12px", borderRadius: "50%",
                backgroundColor: badgeColor || "#0d6efd", marginTop: "6px"
            }}></div>
            <div style={{ flex: 1, width: "2px", backgroundColor: "#e9ecef", margin: "4px 0" }}></div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #dee2e6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <strong style={{ fontSize: "0.95rem" }}>{title}</strong>
                <span style={{ fontSize: "0.85rem", color: "#6c757d" }}>{formatDate(date)}</span>
            </div>
            {user && (
                <div style={{ fontSize: "0.85rem", color: "#6c757d", marginBottom: "0.5rem" }}>
                    Bởi: {user}
                </div>
            )}
            <div style={{ fontSize: "0.9rem" }}>
                {children}
            </div>
        </div>
    </div>
);

export default function BookingAmendmentHistory({ bookingId }) {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!bookingId) return;
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const data = await bookingManagementApi.getAmendmentHistory(bookingId);
                setHistory(data);
            } catch (err) {
                setError(err?.response?.data?.error || "Lỗi tải lịch sử");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [bookingId]);

    if (loading) {
        return <div className="text-center p-3"><span className="spinner-border spinner-border-sm me-2"/>Đang tải...</div>;
    }

    if (error) {
        return <div className="alert alert-danger p-2 m-0 text-sm"><i className="bi bi-exclamation-triangle me-2"/>{error}</div>;
    }

    if (!history || (!history.primalSnapshot && (!history.amendments || history.amendments.length === 0))) {
        return <div className="text-center text-muted p-3">Chưa có lịch sử sửa đổi.</div>;
    }

    return (
        <div className="amendment-history-container mt-3 pt-3 border-top">
            <h6 className="fw-bold mb-3">Lịch Sử Thay Đổi:</h6>
            
            <div className="timeline">
                {/* 1. Trạng thái gốc */}
                {history.primalSnapshot && (
                    <TimelineItem
                        title="Trạng thái Booking Gốc"
                        date={history.primalSnapshot.createdAt}
                        badgeColor="#6c757d"
                    >
                        <div>
                            Tổng tiền: <strong>{formatVND(history.primalSnapshot.totalAmount)}</strong>
                        </div>
                        <ul className="mb-0 mt-1 pl-3" style={{ paddingLeft: "20px" }}>
                            {history.primalSnapshot.details?.map((d, i) => (
                                <li key={i}>{d.quantity}x {d.roomTypeName} ({formatVND(d.priceAtBooking)}/đêm)</li>
                            ))}
                        </ul>
                    </TimelineItem>
                )}

                {/* 2. Các lần sửa đổi */}
                {history.amendments?.map((amend, index) => (
                    <TimelineItem
                        key={amend.modifierBookingId}
                        title={`Sửa đổi #${index + 1}`}
                        date={amend.createdAt}
                        user={amend.amendedBy || "System"}
                        badgeColor={amend.deltaTotalAmount > 0 ? "#198754" : (amend.deltaTotalAmount < 0 ? "#dc3545" : "#0d6efd")}
                    >
                        {amend.note && (
                            <div className="mb-2 fst-italic text-muted">Ghi chú: {amend.note}</div>
                        )}
                        <div className="mb-2">
                            Mức chênh lệch: <strong className={amend.deltaTotalAmount >= 0 ? "text-success" : "text-danger"}>
                                {amend.deltaTotalAmount > 0 ? "+" : ""}{formatVND(amend.deltaTotalAmount)}
                            </strong>
                        </div>
                        {amend.grossReductionAmount > 0 && (
                            <div className="p-2 mb-2 bg-light border rounded">
                                <small>
                                    <div><strong>Chi tiết hoàn/phạt ({amend.refundWindow}):</strong></div>
                                    <div className="text-success">Được hoàn: {formatVND(amend.refundableAmount)}</div>
                                    <div className="text-danger">Phí phạt (KS giữ): {formatVND(amend.nonRefundableAmount)}</div>
                                </small>
                            </div>
                        )}
                        <ul className="mb-0 pl-3" style={{ paddingLeft: "20px", fontSize: "0.85rem" }}>
                            {amend.details?.map((d, idx) => (
                                <li key={idx}>
                                    {d.deltaQuantity > 0 ? "Thêm" : "Bớt"} <strong>{Math.abs(d.deltaQuantity)}</strong> {d.roomTypeName} 
                                    ({formatVND(d.priceAtAmendment)}/đêm)
                                </li>
                            ))}
                        </ul>
                    </TimelineItem>
                ))}
            </div>
        </div>
    );
}
