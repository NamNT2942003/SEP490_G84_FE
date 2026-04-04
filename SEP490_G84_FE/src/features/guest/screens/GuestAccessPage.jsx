import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { guest } from "../api/guestService.js";
import { COLORS } from "../../../constants";

/* ─── Colours – light theme aligned with hotel brand ─── */
const C = {
    bg: COLORS.SECONDARY,
    white: COLORS.TEXT_LIGHT,
    border: "#dde5de",
    borderFocus: COLORS.PRIMARY,
    primary: COLORS.PRIMARY,
    primaryHover: COLORS.PRIMARY_HOVER,
    primaryLight: "#6b8c6c",
    primaryDim: "rgba(70,92,71,0.10)",
    text: COLORS.TEXT_DARK,
    textMuted: "#6b7a6c",
    textSub: "#8fa090",
    red: COLORS.ERROR,
    redBg: "rgba(220,53,69,0.07)",
    redBorder: "rgba(220,53,69,0.3)",
    green: "#27ae60",
    greenBg: "rgba(39,174,96,0.08)",
    gold: COLORS.PRIMARY_HOVER, // Fallback for accents
};

const CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes lineG  { from { width:0 } to { width:100% } }
  .otp-inp { transition: border-color .2s, box-shadow .2s; }
  .otp-inp:focus {
    border-color: #465c47 !important;
    box-shadow: 0 0 0 3px rgba(70,92,71,0.12) !important;
    outline: none;
  }
  .btn-primary-hotel:hover { background:#384a39 !important; transform:translateY(-1px); }
  .btn-primary-hotel:active { transform:translateY(0); }
  .btn-primary-hotel:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .step-num-circle { transition: all .35s ease; }
  .step-line-track  { position:relative; }
  .step-line-fill   { position:absolute; top:0; left:0; height:100%; background:#465c47; animation: lineG .5s ease forwards; }
`;

/* ─── Step indicator ───────────────────────────────────── */
function StepBar({ step }) {
    // step = 1 | 2
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "40px" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="step-num-circle" style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600,
                    background: step >= 1 ? C.primary : "transparent",
                    border: `1.5px solid ${step >= 1 ? C.primary : C.border}`,
                    color: step >= 1 ? "#fff" : C.textMuted,
                }}>
                    {step > 1 ? "✓" : "1"}
                </div>
                <span style={{ fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", color: step === 1 ? C.primary : C.textMuted }}>Email</span>
            </div>

            {/* Line */}
            <div className="step-line-track" style={{ width: 80, height: 1, background: C.border, margin: "0 16px" }}>
                {step > 1 && <div className="step-line-fill" />}
            </div>

            {/* Step2 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="step-num-circle" style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600,
                    background: step === 2 ? C.primary : "transparent",
                    border: `1.5px solid ${step === 2 ? C.primary : C.border}`,
                    color: step === 2 ? "#fff" : C.textMuted,
                }}>
                    2
                </div>
                <span style={{ fontSize: 12, letterSpacing: "1px", textTransform: "uppercase", color: step === 2 ? C.primary : C.textMuted }}>Verify</span>
            </div>
        </div>
    );
}

/* ─── Main component ───────────────────────────────────── */
export default function GuestAccessPage() {
    const navigate = useNavigate();

    const [step, setStep]           = useState(1);
    const [email, setEmail]         = useState("");
    const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const [resendMsg, setResendMsg] = useState("");

    const otpRefs = useRef([]);

    // Auto-focus first OTP box when step changes to 2
    useEffect(() => {
        if (step === 2) setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }, [step]);

    /* ── Step 1: Send OTP ── */
    const handleSendOtp = async (e) => {
        e?.preventDefault();
        if (!email.trim()) return;
        setError("");
        setLoading(true);
        try {
            await guest.requestAccess(email.trim());
            setStep(2);
        } catch (err) {
            setError(err.response?.data || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /* ── Resend OTP ── */
    const handleResend = async () => {
        setOtp(["", "", "", "", "", ""]);
        setError("");
        setResendMsg("");
        await handleSendOtp();
        setResendMsg("OTP code resent!");
        setTimeout(() => setResendMsg(""), 4000);
    };

    /* ── OTP input handlers ── */
    const handleOtpChange = (i, val) => {
        if (!/^\d*$/.test(val)) return; // digits only
        const next = [...otp];
        next[i] = val.slice(-1);
        setOtp(next);
        setError("");
        if (val && i < 5) otpRefs.current[i + 1]?.focus();
        // Auto-submit when all filled
        if (next.every(d => d !== "") && next.join("").length === 6) {
            submitOtp(next.join(""));
        }
    };

    const handleOtpKeyDown = (i, e) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) {
            otpRefs.current[i - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const next = [...otp];
        pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
        setOtp(next);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
        if (pasted.length === 6) submitOtp(pasted);
    };

    /* ── Step 2: Verify OTP ── */
    const submitOtp = async (code) => {
        if (!code || code.length < 6) return;
        setError("");
        setLoading(true);
        try {
            const data = await guest.verifyOtp(email.trim(), code);
            navigate(`/guest/bookings?token=${data.token}`);
        } catch (err) {
            const status = err.response?.status;
            if (status === 410) setError("OTP code expired. Please resend a new one.");
            else setError(err.response?.data || "Invalid OTP code. Please check again.");
            setOtp(["", "", "", "", "", ""]);
            setTimeout(() => otpRefs.current[0]?.focus(), 50);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClick = () => submitOtp(otp.join(""));

    /* ─── Render ─────────────────────────────────────────── */
    return (
        <>
            <style>{CSS}</style>
            <div style={S.pageWrapper}>
                
                {/* Banner Section */}
                <div style={S.banner}>
                    <div style={S.bannerContent}>
                        <div>
                            <h2 style={S.bannerTitle}>
                                Booking <span style={S.bannerTitleAccent}>Lookup</span>
                            </h2>
                            <p style={S.bannerSubtitle}>Review and manage your stay details</p>
                        </div>
                        <div style={S.breadcrumb}>
                            <span>Home</span> <span style={S.breadcrumbSep}>/</span> 
                            <span>My Bookings</span> <span style={S.breadcrumbSep}>/</span> 
                            <span style={S.breadcrumbActive}>Lookup</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={S.mainContainer}>
                    <div style={S.layoutGrid}>
                        
                        {/* Left: Interactive Card */}
                        <div style={S.cardCol}>
                            <div style={S.card}>
                                {/* Top accent */}
                                <div style={S.cardAccent} />

                                <StepBar step={step} />

                                {/* Form Icon Header (Mail Icon Placeholder) */}
                                <div style={S.iconWrapper}>
                                    <div style={S.iconCircle}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </div>
                                </div>

                                {/* Title */}
                                <div style={{ ...S.titleBlock, animation: "fadeUp .4s ease both" }}>
                                    <h1 style={S.h1}>
                                        {step === 1 ? (
                                            <>Booking <em style={S.em}>Lookup</em></>
                                        ) : (
                                            <>Verify <em style={S.em}>Code</em></>
                                        )}
                                    </h1>
                                    <p style={S.subtitle}>
                                        {step === 1
                                            ? "Enter the email used for your booking to receive an OTP verification code."
                                            : <>A 6-digit code has been sent to <strong style={{ color: C.text }}>{email}</strong></>
                                        }
                                    </p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div style={S.errorBox}>{error}</div>
                                )}

                                {/* STEP 1: Email form */}
                                {step === 1 && (
                                    <form onSubmit={handleSendOtp} style={{ animation: "fadeUp .4s .05s ease both", opacity: 0 }}>
                                        <div style={S.fieldGroup}>
                                            <label style={S.label} htmlFor="g-email">Email Address</label>
                                            <div style={S.inputWrapper}>
                                                <span style={S.inputIcon}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                        <polyline points="22,6 12,13 2,6"></polyline>
                                                    </svg>
                                                </span>
                                                <input
                                                    id="g-email"
                                                    type="email"
                                                    autoComplete="email"
                                                    value={email}
                                                    onChange={e => { setEmail(e.target.value); setError(""); }}
                                                    placeholder="your@email.com"
                                                    required
                                                    disabled={loading}
                                                    style={S.inputWithIcon}
                                                    onFocus={e => { e.target.parentNode.style.borderColor = C.borderFocus; e.target.parentNode.style.boxShadow = `0 0 0 3px ${C.primaryDim}`; }}
                                                    onBlur={e => { e.target.parentNode.style.borderColor = C.border; e.target.parentNode.style.boxShadow = "none"; }}
                                                />
                                            </div>
                                            <p style={S.hint}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, verticalAlign: 'middle'}}>
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                </svg>
                                                We will send a 6-digit OTP code. It is valid for 15 minutes.
                                            </p>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn-primary-hotel"
                                            disabled={loading || !email.trim()}
                                            style={S.btnPrimary}
                                        >
                                            {loading ? <><span style={S.spinner} /> Sending...</> : "SEND VERIFICATION CODE \u2192"}
                                        </button>
                                    </form>
                                )}

                                {/* STEP 2: OTP inputs */}
                                {step === 2 && (
                                    <div style={{ animation: "fadeUp .4s .05s ease both", opacity: 0 }}>
                                        {/* Resend success msg */}
                                        {resendMsg && (
                                            <div style={{ ...S.errorBox, background: C.greenBg, borderColor: "rgba(39,174,96,0.3)", color: C.green, marginBottom: 16 }}>
                                                ✓ {resendMsg}
                                            </div>
                                        )}

                                        <div style={S.fieldGroup}>
                                            <label style={{ ...S.label, textAlign: "center", display: "block", marginBottom: 16 }}>
                                                Verification Code
                                            </label>
                                            {/* OTP boxes */}
                                            <div style={S.otpRow} onPaste={handleOtpPaste}>
                                                {otp.map((digit, i) => (
                                                    <input
                                                        key={i}
                                                        className="otp-inp"
                                                        ref={el => otpRefs.current[i] = el}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={e => handleOtpChange(i, e.target.value)}
                                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                                        disabled={loading}
                                                        style={{
                                                            ...S.otpBox,
                                                            borderColor: error ? C.red : digit ? C.primary : C.border,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <p style={{ ...S.hint, textAlign: "center", marginTop: 16 }}>
                                                Code is valid for <strong>15 minutes</strong>
                                            </p>
                                        </div>

                                        <button
                                            className="btn-primary-hotel"
                                            onClick={handleVerifyClick}
                                            disabled={loading || otp.some(d => d === "")}
                                            style={S.btnPrimary}
                                        >
                                            {loading ? <><span style={S.spinner} /> Verifying...</> : "CONFIRM & VIEW BOOKING \u2192"}
                                        </button>

                                        <div style={S.resendRow}>
                                            Didn't receive code?{" "}
                                            <button onClick={handleResend} disabled={loading} style={S.linkBtn}>
                                                Resend
                                            </button>
                                            {" · "}
                                            <button onClick={() => { setStep(1); setError(""); setOtp(["","","","","",""]); }} style={S.linkBtn}>
                                                Change email
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Info Panels */}
                        <div style={S.infoCol}>
                            {/* Panel 1 */}
                            <div style={S.infoPanel}>
                                <h3 style={S.infoTitle}>Need help?</h3>
                                <p style={S.infoText}>
                                    Contact reception 24/7 or call <strong>1800-xxxx</strong> if you need assistance with your booking lookup.
                                </p>
                            </div>

                            {/* Panel 2 */}
                            <div style={S.infoPanel}>
                                <h3 style={{...S.infoTitle, marginBottom: 16}}>Note</h3>
                                <ul style={S.infoList}>
                                    <li style={S.infoListItem}>
                                        <span style={S.bullet}>•</span>
                                        <span>Email must match the information from the initial booking.</span>
                                    </li>
                                    <li style={S.infoListItem}>
                                        <span style={S.bullet}>•</span>
                                        <span>OTP is valid for 15 minutes from when it is sent.</span>
                                    </li>
                                    <li style={S.infoListItem}>
                                        <span style={S.bullet}>•</span>
                                        <span>Check your Spam folder if you don't receive the email.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}

const S = {
    pageWrapper: {
        minHeight: "calc(100vh - 80px)", // Assuming main header is ~80px
        background: C.bg,
        fontFamily: "'Segoe UI', 'Inter', sans-serif",
    },
    banner: {
        background: COLORS.PRIMARY,
        padding: "48px 0",
        borderBottom: `4px solid ${C.gold}`, // subtle accent line at bottom of banner
    },
    bannerContent: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "24px",
    },
    bannerTitle: {
        color: C.white,
        fontSize: "36px",
        fontWeight: 400,
        margin: "0 0 8px 0",
        letterSpacing: "0.5px",
    },
    bannerTitleAccent: {
        fontStyle: "italic",
        color: C.gold,
    },
    bannerSubtitle: {
        color: "#a9b8ab",
        fontSize: "15px",
        margin: 0,
    },
    breadcrumb: {
        color: "#a9b8ab",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    breadcrumbSep: { margin: "0 4px", fontSize: "16px" },
    breadcrumbActive: { color: C.gold },
    mainContainer: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "48px 24px",
    },
    layoutGrid: {
        display: "flex",
        gap: "32px",
        alignItems: "flex-start",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    cardCol: {
        flex: "1 1 500px",
        maxWidth: "540px",
    },
    infoCol: {
        flex: "0 1 340px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    card: {
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "48px 44px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        position: "relative",
        overflow: "hidden",
    },
    cardAccent: {
        position: "absolute", top: 0, left: 0, right: 0, height: "4px",
        background: "linear-gradient(90deg, #465c47, #6b8c6c)", // subtle accent
    },
    iconWrapper: {
        display: "flex",
        justifyContent: "center",
        marginBottom: "20px",
    },
    iconCircle: {
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "#faf4e1", // Light gold tint
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    titleBlock: { textAlign: "center", marginBottom: "32px" },
    h1: {
        fontSize: "26px",
        fontWeight: 600,
        color: C.text,
        marginBottom: "10px",
    },
    em: { fontStyle: "italic", color: C.primary },
    subtitle: { fontSize: "14px", color: C.textMuted, lineHeight: 1.6 },
    fieldGroup: { marginBottom: "24px" },
    label: {
        fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase",
        color: C.textMuted, marginBottom: "10px", display: "block", fontWeight: 600,
    },
    inputWrapper: {
        display: "flex",
        alignItems: "center",
        background: "#ffffff",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
    },
    inputIcon: {
        padding: "0 0 0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    inputWithIcon: {
        flex: 1,
        border: "none",
        padding: "13px 12px",
        color: C.text,
        fontSize: "15px",
        outline: "none",
        background: "transparent",
        fontFamily: "inherit",
    },
    hint: { fontSize: "12px", color: C.textSub, marginTop: "12px", lineHeight: 1.5, display: "flex", alignItems: "flex-start" },
    errorBox: {
        background: C.redBg,
        border: `1px solid ${C.redBorder}`,
        color: C.red,
        padding: "11px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "20px",
        lineHeight: 1.5,
    },
    btnPrimary: {
        width: "100%",
        background: C.primary,
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "14px",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "background .2s, transform .15s",
    },
    spinner: {
        display: "inline-block", width: "16px", height: "16px",
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff", borderRadius: "50%",
        animation: "spin .7s linear infinite",
    },
    otpRow: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
    },
    otpBox: {
        width: "52px", height: "58px",
        background: "#ffffff",
        border: `1.5px solid ${C.border}`,
        borderRadius: "8px",
        fontSize: "24px",
        fontWeight: 700,
        textAlign: "center",
        color: C.text,
        outline: "none",
        fontFamily: "monospace",
        transition: "border-color .2s, box-shadow .2s",
    },
    resendRow: {
        textAlign: "center",
        marginTop: "20px",
        fontSize: "13px",
        color: C.textMuted,
    },
    linkBtn: {
        background: "none",
        border: "none",
        color: C.primary,
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        padding: 0,
        textDecoration: "underline",
        textUnderlineOffset: "2px",
    },
    infoPanel: {
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "24px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        position: "relative",
    },
    infoTitle: {
        fontSize: "16px",
        fontWeight: 600,
        color: C.text,
        margin: "0 0 12px 0",
        paddingLeft: "12px",
        borderLeft: `3px solid ${C.gold}`,
    },
    infoText: {
        fontSize: "14px",
        lineHeight: 1.6,
        color: C.textMuted,
        margin: 0,
    },
    infoList: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    infoListItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        fontSize: "14px",
        lineHeight: 1.5,
        color: C.textMuted,
    },
    bullet: {
        color: C.gold,
        fontWeight: "bold",
        fontSize: "16px",
        lineHeight: 1.2,
    }
};
