import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { guest } from "../api/guestService.js";
import BookingCard from "../components/BookingCard.jsx";
import { COLORS } from "../../../constants";

/* ─── Colours – light theme ─── */
const C = {
    bg: COLORS.SECONDARY,
    white: COLORS.TEXT_LIGHT,
    border: "#dde5de",
    primary: COLORS.PRIMARY,
    primaryLight: "#6b8c6c",
    primaryDim: "rgba(70,92,71,0.10)",
    text: COLORS.TEXT_DARK,
    textMuted: "#6b7a6c",
    textSub: "#8fa090",
    red: COLORS.ERROR,
    redBg: "rgba(220,53,69,0.07)",
    amber: "#b7791f",
    amberDim: "rgba(183,121,31,0.10)",
};

const CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .tab-btn-hotel { transition: color .2s, border-color .2s; }
  .tab-btn-hotel:hover { color: ${C.primary} !important; }
`;

const STATUS_TABS = [
    { key: "all",         label: "All" },
    { key: "CONFIRMED",   label: "Confirmed" },
    { key: "CHECKED_IN",  label: "Checked In" },
    { key: "CHECKED_OUT", label: "Checked Out" },
    { key: "CANCELLED",   label: "Cancelled" },
];

function formatCurrency(n) {
    if (n == null) return "—";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
function nightsBetween(a, b) {
    if (!a || !b) return 0;
    return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/* ─── Summary bar ─── */
function SummaryBar({ bookings }) {
    const valid = bookings.filter(b => b.status !== "CANCELLED");
    const totalNights = valid.reduce((s, b) => s + nightsBetween(b.arrivalDate, b.departureDate), 0);
    const totalSpent  = valid.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const checkedOut  = bookings.filter(b => b.status === "CHECKED_OUT").length;

    const items = [
        { num: bookings.length, label: "Total Bookings" },
        { num: totalNights,     label: "Nights" },
        { num: checkedOut,      label: "Past Stays" },
        { num: formatCurrency(totalSpent), label: "Total Spent", small: true },
    ];
    return (
        <div style={S.summaryBar}>
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <div style={S.summaryDiv} />}
                    <div style={S.summaryItem}>
                        <div style={{ ...S.summaryNum, fontSize: item.small ? "18px" : "28px" }}>{item.num}</div>
                        <div style={S.summaryLabel}>{item.label}</div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

/* ─── State screens ─── */
function StateScreen({ icon, title, msg, link, linkLabel }) {
    return (
        <div style={S.stateBox}>
            <div style={S.stateIcon}>{icon}</div>
            <h3 style={S.stateTitle}>{title}</h3>
            {msg && <p style={S.stateMsg}>{msg}</p>}
            {link && (
                <a href={link} style={S.stateBtn}>{linkLabel}</a>
            )}
        </div>
    );
}

/* ─── Main page ─── */
export default function GuestBookingHistoryPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [pageStatus, setPageStatus] = useState("loading");
    const [bookings, setBookings]     = useState([]);
    const [errorMsg, setErrorMsg]     = useState("");
    const [activeTab, setActiveTab]   = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!token) { setPageStatus("invalid"); return; }
        guest.getBookingsByToken(token)
            .then(data => {
                setBookings(data);
                setPageStatus(data.length === 0 ? "empty" : "success");
            })
            .catch(err => {
                const code = err.response?.status;
                if (code === 410) setPageStatus("expired");
                else {
                    setErrorMsg(err.response?.data || "Invalid link.");
                    setPageStatus("invalid");
                }
            });
    }, [token]);

    const filtered = activeTab === "all" ? bookings : bookings.filter(b => b.status === activeTab);
    const countOf  = (key) => key === "all" ? bookings.length : bookings.filter(b => b.status === key).length;

    // Pagination logic
    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedBookings = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset page on tab change
    useEffect(() => { setCurrentPage(1); }, [activeTab]);

    return (
        <>
            <style>{CSS}</style>
            <div style={S.page}>
                <div style={S.container}>

                    {/* LOADING */}
                    {pageStatus === "loading" && (
                        <StateScreen
                            icon={<div style={S.spinner} />}
                            title="Loading..."
                            msg="Please wait a moment"
                        />
                    )}

                    {/* EXPIRED */}
                    {pageStatus === "expired" && (
                        <StateScreen
                            icon={<svg width="36" height="36" fill="none" stroke={C.textMuted} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}
                            title="Session Expired"
                            msg="Your verification code has expired. Please verify again to continue."
                            link="/guest-access"
                            linkLabel="Verify Again"
                        />
                    )}

                    {/* INVALID */}
                    {pageStatus === "invalid" && (
                        <StateScreen
                            icon={<svg width="36" height="36" fill="none" stroke={C.red} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>}
                            title="Invalid Link"
                            msg={errorMsg || "This link is invalid or has expired."}
                            link="/guest-access"
                            linkLabel="Verify Again"
                        />
                    )}

                    {/* EMPTY */}
                    {pageStatus === "empty" && (
                        <StateScreen
                            icon={<svg width="36" height="36" fill="none" stroke={C.textMuted} strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
                            title="No Bookings Found"
                            msg="No booking history found associated with this email."
                        />
                    )}

                    {/* SUCCESS */}
                    {pageStatus === "success" && (
                        <div style={{ animation: "fadeUp .4s ease both" }}>
                            {/* Header */}
                            <div style={S.pageHeader}>
                                <div>
                                    <h1 style={S.pageTitle}>
                                        Booking <em style={{ fontStyle: "italic", color: C.primary }}>History</em>
                                    </h1>
                                    <p style={{ fontSize: "14px", color: C.textMuted, marginTop: "6px" }}>
                                        Found <strong style={{ color: C.text }}>{bookings.length}</strong> bookings
                                    </p>
                                </div>
                                <a href="/guest-access" style={S.newSearchBtn}>+ New Search</a>
                            </div>

                            {/* Summary */}
                            <SummaryBar bookings={bookings} />

                            {/* Tabs */}
                            <div style={S.tabs}>
                                {STATUS_TABS.map(tab => {
                                    const active = activeTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            className="tab-btn-hotel"
                                            onClick={() => setActiveTab(tab.key)}
                                            style={{
                                                ...S.tabBtn,
                                                color: active ? C.primary : C.textMuted,
                                                borderBottom: `2px solid ${active ? C.primary : "transparent"}`,
                                                fontWeight: active ? 600 : 400,
                                            }}
                                        >
                                            {tab.label}
                                            <span style={{
                                                ...S.tabCount,
                                                background: active ? C.primaryDim : "transparent",
                                                color: active ? C.primary : C.textSub,
                                            }}>
                                                {countOf(tab.key)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* List */}
                            {filtered.length === 0 ? (
                                <div style={S.emptyList}>
                                    <p style={{ color: C.textMuted, fontSize: "14px" }}>No bookings found in this status</p>
                                </div>
                            ) : (
                                <>
                                    <div style={S.list}>
                                        {paginatedBookings.map((b, i) => (
                                            <div key={b.bookingCode} style={{ animation: `fadeUp .4s ${i * 0.06}s ease both`, opacity: 0 }}>
                                                <BookingCard booking={b} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div style={S.pagination}>
                                            <button 
                                                style={S.pageBtn} 
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            >
                                                {"<"} Newer
                                            </button>
                                            <span style={S.pageInfo}>Page {currentPage} / {totalPages}</span>
                                            <button 
                                                style={S.pageBtn} 
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            >
                                                Older {">"}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const S = {
    page: {
        minHeight: "calc(100vh - 140px)",
        background: C.bg,
        fontFamily: "'Segoe UI', 'Inter', sans-serif",
        padding: "0 0 60px",
    },
    container: {
        maxWidth: "1140px",
        margin: "0 auto",
        padding: "48px 24px 0",
    },

    /* State screens */
    stateBox: {
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        padding: "100px 24px",
        gap: "16px",
    },
    stateIcon: {
        width: "72px", height: "72px", borderRadius: "50%",
        background: C.white,
        border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "8px",
        boxShadow: "0 2px 12px rgba(70,92,71,0.08)",
    },
    stateTitle: {
        fontSize: "22px", fontWeight: 300,
        fontFamily: "Georgia, serif",
        color: C.text,
    },
    stateMsg: { fontSize: "14px", color: C.textMuted, maxWidth: "360px", lineHeight: 1.7 },
    stateBtn: {
        marginTop: "8px",
        display: "inline-block",
        background: C.primary, color: "#fff",
        padding: "11px 28px", borderRadius: "8px",
        textDecoration: "none",
        fontSize: "12px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase",
    },
    spinner: {
        width: "30px", height: "30px",
        border: `2px solid ${C.border}`,
        borderTopColor: C.primary,
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
    },

    /* Page header */
    pageHeader: {
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "28px", flexWrap: "wrap", gap: "16px",
    },
    pageTitle: {
        fontSize: "clamp(24px,3vw,36px)",
        fontWeight: 300, color: C.text,
        fontFamily: "Georgia, serif",
    },
    newSearchBtn: {
        border: `1px solid ${C.border}`,
        background: C.white,
        color: C.primary,
        padding: "8px 16px", borderRadius: "8px",
        textDecoration: "none",
        fontSize: "13px", fontWeight: 600,
    },

    /* Summary bar */
    summaryBar: {
        display: "flex", gap: "24px", flexWrap: "wrap",
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "20px 24px",
        marginBottom: "28px",
        alignItems: "center",
    },
    summaryDiv: { width: "1px", height: "40px", background: C.border },
    summaryItem: {},
    summaryNum: {
        fontWeight: 600,
        color: C.primary, lineHeight: 1,
    },
    summaryLabel: {
        fontSize: "12px", 
        color: C.textMuted, marginTop: "5px",
    },

    /* Tabs */
    tabs: {
        display: "flex",
        borderBottom: `1px solid ${C.border}`,
        marginBottom: "24px",
        overflowX: "auto",
        gap: 0,
    },
    tabBtn: {
        background: "none", border: "none",
        padding: "10px 16px 12px",
        fontSize: "12px", letterSpacing: "0.8px",
        textTransform: "uppercase",
        cursor: "pointer",
        marginBottom: "-1px",
        display: "flex", alignItems: "center", gap: "6px",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
    },
    tabCount: {
        fontSize: "12px", padding: "2px 6px", borderRadius: "12px",
        fontWeight: 500,
    },

    /* List */
    list: { display: "flex", flexDirection: "column", gap: "12px" },
    emptyList: { textAlign: "center", padding: "60px 24px", color: C.textMuted },

    /* Pagination */
    pagination: {
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: "16px", marginTop: "32px",
    },
    pageBtn: {
        padding: "8px 16px", borderRadius: "6px",
        border: `1px solid ${C.border}`, background: C.white,
        color: C.text, cursor: "pointer", fontSize: "14px",
    },
    pageInfo: { fontSize: "14px", color: C.textMuted },
};
