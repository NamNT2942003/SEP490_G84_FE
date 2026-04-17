import React, { useState } from "react";

/* ─── Colours – light theme ─── */
const C = {
    white: "#ffffff",
    bg: "#fafafa",
    border: "#dde5de",
    primary: "#465c47",
    primaryLight: "#6b8c6c",
    primaryDim: "rgba(70,92,71,0.10)",
    text: "#1c2b1d",
    textMuted: "#6b7a6c",
    textSub: "#8fa090",
    green: "#2e7d4a",
    greenDim: "rgba(46,125,74,0.10)",
    blue: "#2563a8",
    blueDim: "rgba(37,99,168,0.10)",
    amber: "#b7791f",
    amberDim: "rgba(183,121,31,0.10)",
    grey: "#6b7280",
    greyDim: "rgba(107,114,128,0.10)",
    red: "#c0392b",
    redDim: "rgba(192,57,43,0.10)",
};

const STATUS_CONFIG = {
    PENDING:      { label: "Chờ xác nhận",  color: C.amber,       bg: C.amberDim },
    CONFIRMED:    { label: "Đã xác nhận",   color: C.primary,     bg: C.primaryDim },
    CHECKED_IN:   { label: "Đang lưu trú",  color: C.blue,        bg: C.blueDim },
    CHECKED_OUT:  { label: "Đã trả phòng",  color: C.grey,        bg: C.greyDim },
    CANCELLED:    { label: "Đã hủy",        color: C.red,         bg: C.redDim },
    NO_SHOW:      { label: "Không đến",     color: C.amber,       bg: C.amberDim },
};

function fmtDate(dt) {
    if (!dt) return "—";
    return new Date(dt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtCurrency(n) {
    if (n == null) return "—";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
function nightsBetween(a, b) {
    if (!a || !b) return 0;
    return Math.round((new Date(b) - new Date(a)) / 86400000);
}

const InfoCell = ({ label, children }) => (
    <div>
        <div style={S.infoLabel}>{label}</div>
        <div style={S.infoValue}>{children}</div>
    </div>
);

export default function BookingCard({ booking }) {
    const [showServices, setShowServices] = useState(false);

    const s = STATUS_CONFIG[booking.status] || { label: booking.status, color: C.grey, bg: C.greyDim };
    const nights = nightsBetween(booking.arrivalDate, booking.departureDate);
    const roomTypes = booking.roomTypes?.join(", ") || "—";
    const usedServices = booking.usedServices || [];

    const hasServiceFee = booking.status === "CHECKED_OUT" && booking.serviceFee > 0;
    const cancelRequested = Boolean(booking.cancelRequested);

    return (
        <div style={{ ...S.card, ...(cancelRequested ? S.cardRequested : null) }}>
            {/* Header row */}
            <div style={S.cardHead}>
                <div>
                    <div style={S.bookingCode}>{booking.bookingCode}</div>
                    {booking.guestName && <div style={S.guestName}>{booking.guestName}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {booking.branchName && (
                        <span style={S.branchTag}>
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-6h6v6"/>
                            </svg>
                            {booking.branchName}
                        </span>
                    )}
                    <span style={{ ...S.statusBadge, color: s.color, background: s.bg }}>
                        <span style={{ ...S.dot, background: s.color }} />
                        {s.label}
                    </span>
                    {cancelRequested && (
                        <span style={S.requestBadge}>
                            Request cancel
                        </span>
                    )}
                </div>
            </div>

            {/* Body grid */}
            <div style={S.cardBody}>
                <InfoCell label="Room Type">{roomTypes}</InfoCell>

                <InfoCell label="Check-in">
                    {fmtDate(booking.arrivalDate)}
                    {booking.actualCheckIn && <small style={S.smallText}>Actual: {fmtDate(booking.actualCheckIn)}</small>}
                </InfoCell>

                <InfoCell label="Check-out">
                    <span>{fmtDate(booking.departureDate)}</span>
                    {booking.actualCheckOut && <small style={S.smallText}>Actual: {fmtDate(booking.actualCheckOut)}</small>}
                </InfoCell>

                {hasServiceFee && (
                    <>
                        <InfoCell label="Tiền phòng">{fmtCurrency(booking.roomAmount)}</InfoCell>
                        <InfoCell label="Phí dịch vụ">
                            <span 
                                onClick={() => setShowServices(!showServices)}
                                style={S.clickableFee}
                                title="Nhấn để xem chi tiết dịch vụ"
                            >
                                {fmtCurrency(booking.serviceFee)}
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showServices ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </InfoCell>
                    </>
                )}

                <InfoCell label="Tổng chi tiêu">
                    <span style={S.totalAmt}>{fmtCurrency(booking.totalAmount)}</span>
                </InfoCell>
            </div>

            {/* EXPANDABLE SERVICES LIST */}
            {hasServiceFee && showServices && usedServices.length > 0 && (
                <div style={S.servicesBox}>
                    <div style={S.servicesHeader}>Services Used:</div>
                    <div style={S.servicesList}>
                        {usedServices.map((srv, idx) => (
                            <div key={idx} style={S.serviceRow}>
                                <span>• {srv.name} <small style={{ color: C.textSub }}>x{srv.quantity}</small></span>
                                <span>{fmtCurrency(srv.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Special request */}
            {booking.specialRequests && (
                <div style={S.specialReq}>
                    <strong style={S.specialLabel}>Special Requests</strong>
                    {booking.specialRequests}
                </div>
            )}

            {cancelRequested && (
                <div style={S.requestBanner}>
                    A cancellation request has been sent to staff.
                </div>
            )}
        </div>
    );
}

const S = {
    card: {
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    cardRequested: {
        borderColor: "rgba(220,53,69,0.45)",
        boxShadow: "0 0 0 1px rgba(220,53,69,0.10), 0 4px 14px rgba(220,53,69,0.08)",
        background: "linear-gradient(180deg, rgba(255,248,248,0.92) 0%, #ffffff 44%)",
    },
    cardHead: {
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: `1px solid ${C.border}`,
        flexWrap: "wrap", gap: "10px",
        background: C.bg,
    },
    bookingCode: {
        fontSize: "16px", fontWeight: 600,
        color: C.primary, marginBottom: "2px",
    },
    guestName: { fontSize: "14px", color: C.textMuted },
    branchTag: {
        display: "inline-flex", alignItems: "center", gap: "4px",
        fontSize: "12px", color: C.textMuted,
        padding: "2px 8px", borderRadius: "4px",
        background: C.white, border: `1px solid ${C.border}`,
    },
    statusBadge: {
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "4px 10px", borderRadius: "4px",
        fontSize: "12px", fontWeight: 500,
    },
    requestBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        color: C.red,
        background: C.redDim,
        border: `1px solid rgba(220,53,69,0.25)`,
    },
    dot: { width: 6, height: 6, borderRadius: "50%" },
    cardBody: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px",
        padding: "16px 20px",
    },
    infoLabel: {
        fontSize: "12px", color: C.textMuted,
        marginBottom: "4px", fontWeight: 500,
    },
    infoValue: {
        fontSize: "14px", color: C.text,
        display: "flex", flexDirection: "column", gap: "2px",
    },
    smallText: { fontSize: "12px", color: C.textSub },
    nightBadge: {
        display: "inline-block",
        background: C.bg, border: `1px solid ${C.border}`, color: C.text,
        fontSize: "12px", padding: "1px 6px", borderRadius: "4px",
        marginLeft: "6px",
    },
    totalAmt: { color: C.primary, fontWeight: 600, fontSize: "16px" },
    clickableFee: {
        color: C.primary, fontWeight: 600, fontSize: "16px",
        display: "inline-flex", alignItems: "center", gap: "4px",
        cursor: "pointer", userSelect: "none",
        borderBottom: `1px dashed ${C.primaryLight}`,
    },
    servicesBox: {
        margin: "0 20px 16px",
        padding: "16px",
        background: "#fdfdfd",
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
    },
    servicesHeader: {
        fontSize: "12px", color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "1px",
        fontWeight: 600, marginBottom: "12px",
    },
    servicesList: {
        display: "flex", flexDirection: "column", gap: "8px",
    },
    serviceRow: {
        display: "flex", justifyContent: "space-between",
        fontSize: "13px", color: C.text,
    },
    specialReq: {
        margin: "0 20px 16px",
        background: C.bg,
        borderLeft: `3px solid ${C.border}`,
        padding: "8px 12px",
        fontSize: "13px", color: C.text,
    },
    requestBanner: {
        margin: "0 20px 16px",
        padding: "10px 12px",
        borderRadius: "6px",
        background: "rgba(220,53,69,0.06)",
        border: `1px solid rgba(220,53,69,0.18)`,
        color: C.red,
        fontSize: "12px",
        fontWeight: 600,
    },
    specialLabel: {
        display: "block",
        fontSize: "12px", color: C.textMuted,
        marginBottom: "4px", fontWeight: 500,
    },
};
