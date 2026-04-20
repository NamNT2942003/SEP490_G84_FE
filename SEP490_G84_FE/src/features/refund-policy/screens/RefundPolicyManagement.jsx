import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import refundPolicyApi from "@/features/refund-policy/api/refundPolicyApi";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import Buttons from "@/components/ui/Buttons";
import Swal from "sweetalert2";

// ─── Constants ───────────────────────────────────────────────────────────────
const POLICY_TYPES = [
    { value: "FREE_CANCEL", label: "Free cancellation", color: "#16a34a", bg: "#dcfce7", icon: "bi-check-circle-fill" },
    { value: "PARTIAL_REFUND", label: "Partial refund", color: "#d97706", bg: "#fef3c7", icon: "bi-arrow-left-right" },
    { value: "NON_REFUND", label: "Non-refundable", color: "#dc2626", bg: "#fee2e2", icon: "bi-x-circle-fill" },
    { value: "PAY_AT_HOTEL", label: "Pay at hotel", color: "#0f766e", bg: "#ccfbf1", icon: "bi-building-check" },
];

const EMPTY_FORM = {
    name: "",
    branchId: null,
    daysBeforeCheckIn: "",
    prepaidRate: 0,
    refunRate: 100,
    activeTimeStart: "",
    activeTimeEnd: "",
    seasonalStartMonth: "",
    seasonalStartDay: "",
    seasonalEndMonth: "",
    seasonalEndDay: "",
    active: true,
};

const MONTH_OPTIONS = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
];

const DAYS_BY_MONTH = {
    "01": 31,
    "02": 29,
    "03": 31,
    "04": 30,
    "05": 31,
    "06": 30,
    "07": 31,
    "08": 31,
    "09": 30,
    "10": 31,
    "11": 30,
    "12": 31,
};

const getPolicyType = (value) => POLICY_TYPES.find(t => t.value === value) || POLICY_TYPES[0];

const derivePolicyType = (prepaidRate, refunRate) => {
    const prepaid = Math.max(0, Math.min(100, Number(prepaidRate) || 0));
    const refund = Math.max(0, Math.min(100, Number(refunRate) || 0));

    if (prepaid === 0) return "PAY_AT_HOTEL";
    if (refund >= 100) return "FREE_CANCEL";
    if (refund <= 0) return "NON_REFUND";
    return "PARTIAL_REFUND";
};

const parseDaysValue = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const text = String(value).trim();
    if (!text) return "";
    if (/^\d+$/.test(text)) return text;
    if (text.includes("-")) {
        const parts = text.split("-").map(part => parseInt(part.trim(), 10));
        const valid = parts.filter(Number.isFinite);
        if (valid.length === 2) return String(Math.max(valid[0], valid[1]));
    }
    return "";
};

const parseSeasonalWindow = (value) => {
    if (!value) return { start: "", end: "" };
    const parts = String(value).split("->").map(part => part.trim());
    if (parts.length !== 2) return { start: "", end: "" };
    return {
        start: parts[0] || "",
        end: parts[1] || "",
    };
};

const resolvePolicySeasonal = (policy) => {
    const directStart = policy?.activeTimeStart || "";
    const directEnd = policy?.activeTimeEnd || "";
    if (directStart && directEnd) {
        return { start: directStart, end: directEnd };
    }
    return parseSeasonalWindow(policy?.seasonalWindow);
};

const parseMonthDay = (value) => {
    if (!value || typeof value !== "string" || !value.includes("-")) {
        return { month: "", day: "" };
    }
    const [month, day] = value.split("-").map(part => part.trim());
    if (!/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
        return { month: "", day: "" };
    }
    return { month, day };
};

const toMonthDayString = (month, day) => {
    if (!month || !day) {
        return "";
    }
    return `${month}-${day}`;
};

const getDayOptions = (month) => {
    const max = DAYS_BY_MONTH[month] || 31;
    return Array.from({ length: max }, (_, index) => {
        const day = String(index + 1).padStart(2, "0");
        return { value: day, label: day };
    });
};

const normalizePolicyForm = (initialData, branchId) => ({
    ...EMPTY_FORM,
    branchId,
    ...(initialData || {}),
    name: initialData?.name ?? "",
    daysBeforeCheckIn: parseDaysValue(initialData?.daysBeforeCheckIn ?? initialData?.dateRange),
    prepaidRate: Number.isFinite(Number(initialData?.prepaidRate)) ? Number(initialData.prepaidRate) : 0,
    refunRate: Number.isFinite(Number(initialData?.refunRate)) ? Number(initialData.refunRate) : 100,
    active: initialData?.active ?? true,
    ...(() => {
        const seasonal = parseSeasonalWindow(initialData?.seasonalWindow);
        const start = parseMonthDay(initialData?.activeTimeStart ?? seasonal.start);
        const end = parseMonthDay(initialData?.activeTimeEnd ?? seasonal.end);
        return {
            activeTimeStart: toMonthDayString(start.month, start.day),
            activeTimeEnd: toMonthDayString(end.month, end.day),
            seasonalStartMonth: start.month,
            seasonalStartDay: start.day,
            seasonalEndMonth: end.month,
            seasonalEndDay: end.day,
        };
    })(),
});

// ─── PolicyTypeBadge ─────────────────────────────────────────────────────────
const PolicyTypeBadge = ({ type }) => {
    const t = getPolicyType(type);
    return (
        <span style={{
            background: t.bg, color: t.color,
            border: `1px solid ${t.color}33`,
            padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem",
            fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5,
        }}>
            <i className={`bi ${t.icon}`}></i> {t.label}
        </span>
    );
};

// ─── PolicyFormModal ──────────────────────────────────────────────────────────
const PolicyFormModal = ({ isOpen, onClose, onSave, initialData, branchId, saving }) => {
    const [form, setForm] = useState({ ...EMPTY_FORM, branchId });

    useEffect(() => {
        if (initialData) {
            setForm(normalizePolicyForm(initialData, branchId));
        } else {
            setForm({ ...EMPTY_FORM, branchId });
        }
    }, [initialData, branchId, isOpen]);

    if (!isOpen) return null;

    const previewType = derivePolicyType(form.prepaidRate, form.refunRate);
    const previewTypeMeta = getPolicyType(previewType);

    const handle = (e) => {
        const { name, value, type: inputType, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: inputType === "checkbox" ? checked : value }));
    };

    const handleNum = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value === "" ? 0 : Math.min(100, Math.max(0, parseInt(value) || 0)) }));
    };

    const handleSeasonalSelect = (field, value) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };

            const startDayOptions = getDayOptions(next.seasonalStartMonth).map(option => option.value);
            const endDayOptions = getDayOptions(next.seasonalEndMonth).map(option => option.value);

            if (next.seasonalStartDay && !startDayOptions.includes(next.seasonalStartDay)) {
                next.seasonalStartDay = "";
            }
            if (next.seasonalEndDay && !endDayOptions.includes(next.seasonalEndDay)) {
                next.seasonalEndDay = "";
            }

            next.activeTimeStart = toMonthDayString(next.seasonalStartMonth, next.seasonalStartDay);
            next.activeTimeEnd = toMonthDayString(next.seasonalEndMonth, next.seasonalEndDay);
            return next;
        });
    };

    const seasonalPreviewStart = toMonthDayString(form.seasonalStartMonth, form.seasonalStartDay);
    const seasonalPreviewEnd = toMonthDayString(form.seasonalEndMonth, form.seasonalEndDay);

    return (
        <>
            <style>{`
                .rp-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1050; display:flex; align-items:center; justify-content:center; }
                .rp-modal { background:#fff; border-radius:20px; padding:0; max-width:580px; width:95%; box-shadow:0 20px 60px rgba(0,0,0,0.2); overflow:hidden; }
                .rp-modal-header { padding:20px 28px 16px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg,#5C6F4E 0%,#4a5b3f 100%); }
                .rp-modal-body { padding:24px 28px; max-height:70vh; overflow-y:auto; }
                .rp-rate-row { display:flex; gap:16px; }
                .rp-rate-row>div { flex:1; }
                .rp-rate-row .form-label { min-height:44px; display:flex; align-items:flex-start; line-height:1.25; margin-bottom:8px; }
                .rp-rate-help { min-height:32px; font-size:0.75rem; color:#6b7280; }
                .rp-range-row { display:flex; gap:12px; align-items:center; }
                .rp-range-row input { flex:1; }
                .rp-slider { width:100%; accent-color:#5C6F4E; }
                .rp-modal-footer { padding:16px 28px; border-top:1px solid #f0f0f0; display:flex; justify-content:flex-end; gap:12px; background:#fafbf8; }
            `}</style>
            <div className="rp-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="rp-modal">
                    <div className="rp-modal-header">
                        <h5 style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                            <i className="bi bi-shield-check me-2"></i>
                            {initialData ? "Update Cancellation Policy" : "Create Cancellation Policy"}
                        </h5>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>×</button>
                    </div>
                    <div className="rp-modal-body">
                        {/* Name */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Policy name <span className="text-danger">*</span></label>
                            <input
                                className="form-control"
                                name="name"
                                value={form.name}
                                onChange={handle}
                                placeholder="Example: Free cancellation up to 7 days before check-in"
                                required
                            />
                        </div>

                        {/* Auto-classified type */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Policy type (auto-classified)</label>
                            <div
                                style={{
                                    background: previewTypeMeta.bg,
                                    color: previewTypeMeta.color,
                                    border: `1px solid ${previewTypeMeta.color}33`,
                                    borderRadius: 12,
                                    padding: "10px 12px",
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <i className={`bi ${previewTypeMeta.icon}`}></i>
                                {previewTypeMeta.label}
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                                Automatically classified based on prepayment and refund rate.
                            </div>
                        </div>

                        {/* Rates */}
                        <div className="rp-rate-row mb-3">
                            <div>
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-cash-coin me-1 text-warning"></i>
                                    Prepayment rate (%)
                                </label>
                                <input type="number" className="form-control" name="prepaidRate" value={form.prepaidRate} onChange={handleNum} min={0} max={100} />
                                <input type="range" className="rp-slider mt-1" name="prepaidRate" value={form.prepaidRate} onChange={handleNum} min={0} max={100} />
                                <div className="rp-rate-help">Guest must pay {form.prepaidRate}% when booking</div>
                            </div>
                            <div>
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-arrow-counterclockwise me-1 text-success"></i>
                                    Cancellation refund rate (%)
                                </label>
                                <input type="number" className="form-control" name="refunRate" value={form.refunRate} onChange={handleNum} min={0} max={100} />
                                <input type="range" className="rp-slider mt-1" name="refunRate" value={form.refunRate} onChange={handleNum} min={0} max={100} />
                                <div className="rp-rate-help">Refund {form.refunRate}% of paid amount when cancelled</div>
                            </div>
                        </div>

                        {/* Free cancellation window */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-calendar-check me-1 text-success"></i>
                                Free cancellation window (days before check-in)
                            </label>
                            <input
                                type="number"
                                className="form-control"
                                name="daysBeforeCheckIn"
                                value={form.daysBeforeCheckIn}
                                onChange={handle}
                                min={0}
                                placeholder="Example: 7"
                            />
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                                If cancelled <strong>≥ N days</strong> before check-in → <span style={{ color: "#16a34a", fontWeight: 600 }}>full refund (100%)</span>. After that window → refund follows the rate above.
                            </div>
                        </div>

                        {/* Active season */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-calendar3 me-1 text-info"></i>
                                Seasonal window (month/day, no year)
                            </label>
                            <div className="rp-range-row mb-2">
                                <select className="form-select" value={form.seasonalStartMonth} onChange={(e) => handleSeasonalSelect("seasonalStartMonth", e.target.value)}>
                                    <option value="">Start month</option>
                                    {MONTH_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <select className="form-select" value={form.seasonalStartDay} onChange={(e) => handleSeasonalSelect("seasonalStartDay", e.target.value)} disabled={!form.seasonalStartMonth}>
                                    <option value="">Start day</option>
                                    {getDayOptions(form.seasonalStartMonth).map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="rp-range-row">
                                <select className="form-select" value={form.seasonalEndMonth} onChange={(e) => handleSeasonalSelect("seasonalEndMonth", e.target.value)}>
                                    <option value="">End month</option>
                                    {MONTH_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <select className="form-select" value={form.seasonalEndDay} onChange={(e) => handleSeasonalSelect("seasonalEndDay", e.target.value)} disabled={!form.seasonalEndMonth}>
                                    <option value="">End day</option>
                                    {getDayOptions(form.seasonalEndMonth).map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: "0.75rem" }}>
                                {seasonalPreviewStart && seasonalPreviewEnd
                                    ? <>Current seasonal window: <strong>{seasonalPreviewStart} → {seasonalPreviewEnd}</strong></>
                                    : <>Current seasonal window: <strong>Whole year</strong></>
                                }
                            </div>
                        </div>

                        {/* Active toggle */}
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" name="active" id="activeToggle" checked={form.active} onChange={handle} />
                            <label className="form-check-label fw-semibold" htmlFor="activeToggle">
                                {form.active ? <><i className="bi bi-toggle-on me-1"></i>Active</> : <><i className="bi bi-toggle-off me-1"></i>Paused</>}
                            </label>
                        </div>
                    </div>
                    <div className="rp-modal-footer">
                        <Buttons variant="outline" className="btn-sm" onClick={onClose} disabled={saving}>Cancel</Buttons>
                        <Buttons
                            variant="primary"
                            className="btn-sm"
                            onClick={() => onSave(form)}
                            disabled={saving || !form.name.trim()}
                            isLoading={saving}
                            icon={!saving && <i className="bi bi-floppy" />}
                        >
                            {initialData ? "Update" : "Create"}
                        </Buttons>
                    </div>
                </div>
            </div>
        </>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const RefundPolicyManagement = () => {
    const { branchId } = useParams();
    const navigate = useNavigate();

    const [policies, setPolicies] = useState([]);
    const [branchInfo, setBranchInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [alert, setAlert] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await refundPolicyApi.getByBranch(branchId);
            setPolicies(data);
            try {
                const b = await branchManagementApi.getBranchById(branchId);
                setBranchInfo(b);
            } catch { /* ignore */ }
        } catch (err) {
            showAlert("error", "Failed to load data: " + (err?.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { if (branchId) load(); }, [load]);

    const handleSave = async (form) => {
        const seasonalStart = toMonthDayString(form.seasonalStartMonth, form.seasonalStartDay);
        const seasonalEnd = toMonthDayString(form.seasonalEndMonth, form.seasonalEndDay);
        const hasAnySeasonalPart = !!(form.seasonalStartMonth || form.seasonalStartDay || form.seasonalEndMonth || form.seasonalEndDay);
        if (hasAnySeasonalPart && !(seasonalStart && seasonalEnd)) {
            showAlert("error", "Please select both start and end month/day for Seasonal window.");
            return;
        }

        setSaving(true);
        try {
            const days = form.daysBeforeCheckIn === "" || form.daysBeforeCheckIn === null
                ? null
                : Math.max(0, parseInt(form.daysBeforeCheckIn, 10) || 0);
            const dto = {
                id: form.id,
                name: form.name,
                active: form.active,
                branchId: parseInt(branchId, 10),
                daysBeforeCheckIn: days,
                dateRange: days !== null ? String(days) : null,
                prepaidRate: Math.max(0, Math.min(100, Number(form.prepaidRate) || 0)),
                refunRate: Math.max(0, Math.min(100, Number(form.refunRate) || 0)),
                activeTimeStart: seasonalStart || null,
                activeTimeEnd: seasonalEnd || null,
                seasonalWindow: seasonalStart && seasonalEnd ? `${seasonalStart}->${seasonalEnd}` : null,
                type: derivePolicyType(form.prepaidRate, form.refunRate),
            };
            if (editing) {
                await refundPolicyApi.update(editing.id, dto);
                showAlert("success", "Policy updated successfully!");
            } else {
                await refundPolicyApi.create(dto);
                showAlert("success", "Policy created successfully!");
            }
            setModalOpen(false);
            setEditing(null);
            load();
        } catch (err) {
            showAlert("error", "Save failed: " + (err?.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await refundPolicyApi.toggle(id);
            load();
        } catch { showAlert("error", "Unable to change status."); }
    };

    const handleDelete = async (p) => {
        Swal.fire({
            title: 'Delete Policy?',
            text: `Confirm deleting policy "${p.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await refundPolicyApi.delete(p.id);
                    showAlert("success", "Policy deleted.");
                    load();
                } catch { showAlert("error", "Delete failed."); }
            }
        });
    };

    return (
        <>
            <style>{`
                :root { --olive: #5C6F4E; --olive-dark: #4a5b3f; --gold: #D4AF37; }
                .rp-page { padding: 28px 32px; min-height: 100vh; background: #f8fafc; }
                .rp-hero { background: linear-gradient(135deg, #5C6F4E 0%, #4a5b3f 60%, #3d4e33 100%); border-radius: 20px; padding: 28px 32px; color: #fff; margin-bottom: 28px; position: relative; overflow: hidden; }
                .rp-hero::before { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; border-radius: 50%; background: rgba(255,255,255,0.05); }
                .rp-hero-title { font-size: 1.6rem; font-weight: 800; margin: 0; }
                .rp-hero-sub { font-size: 0.9rem; opacity: 0.8; margin-top: 4px; }
                .rp-add-btn { background: #D4AF37; color: #fff; border: none; border-radius: 12px; padding: 10px 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
                .rp-add-btn:hover { background: #b8962c; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212,175,55,0.4); }
                
                .rp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
                .rp-stat-card { background: #fff; border-radius: 16px; padding: 18px 20px; border: 1px solid #f0f0f0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
                .rp-stat-num { font-size: 1.8rem; font-weight: 800; line-height: 1; }
                .rp-stat-label { font-size: 0.78rem; color: #718096; margin-top: 4px; }
                
                .rp-card { background: #fff; border-radius: 18px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
                .rp-card-header { padding: 18px 24px; border-bottom: 1px solid #f0f0f0; background: #fafbf8; display: flex; align-items: center; justify-content: space-between; }

                .rp-policy-card { border: 1.5px solid #edf2f7; border-radius: 16px; padding: 20px; transition: all 0.2s; position: relative; background: #fff; }
                .rp-policy-card:hover { border-color: var(--olive); box-shadow: 0 8px 24px rgba(92,111,78,0.1); transform: translateY(-2px); }
                .rp-policy-card.inactive { opacity: 0.6; background: #fafafa; }
                .rp-policy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; padding: 24px; }
                
                .rp-rate-bar { background: #f0f4ec; border-radius: 8px; height: 8px; overflow: hidden; margin: 4px 0 2px; }
                .rp-rate-fill { height: 100%; border-radius: 8px; transition: width 0.6s ease; }
                
                .rp-action-btn { border: 1.5px solid; border-radius: 8px; padding: 5px 12px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s; background: transparent; }
                
                @media(max-width:768px) { .rp-stats { grid-template-columns: repeat(2, 1fr); } .rp-policy-grid { grid-template-columns: 1fr; } }
            `}</style>

            <div className="rp-page">
                {/* Hero Header */}
                <div className="rp-hero">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem", marginBottom: 12 }}>
                                <i className="bi bi-arrow-left me-1"></i> Back
                            </button>
                            <div className="rp-hero-title">
                                <i className="bi bi-shield-check me-2"></i>Cancellation Policy
                            </div>
                            <div className="rp-hero-sub">
                                Branch: <strong>{branchInfo?.branchName || `#${branchId}`}</strong>
                                {branchInfo?.address && <span className="ms-2 opacity-75">— {branchInfo.address}</span>}
                            </div>
                        </div>
                        <Buttons variant="primary" icon={<i className="bi bi-plus-lg" />} onClick={() => { setEditing(null); setModalOpen(true); }}>
                            Add Cancellation Policy
                        </Buttons>
                    </div>
                </div>

                {/* Alert */}
                {alert && (
                    <div className={`alert alert-${alert.type === "error" ? "danger" : "success"} alert-dismissible fade show d-flex align-items-center gap-2 mb-4`} role="alert">
                        <i className={`bi ${alert.type === "error" ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"}`}></i>
                        {alert.message}
                        <button type="button" className="btn-close ms-auto" onClick={() => setAlert(null)}></button>
                    </div>
                )}

                {/* Stats */}
                {!loading && (
                    <div className="rp-stats">
                        <div className="rp-stat-card">
                            <div className="rp-stat-num" style={{ color: "#5C6F4E" }}>{policies.length}</div>
                            <div className="rp-stat-label"><i className="bi bi-list-check me-1"></i>Total policies</div>
                        </div>
                        <div className="rp-stat-card">
                            <div className="rp-stat-num" style={{ color: "#16a34a" }}>{policies.filter(p => p.active).length}</div>
                            <div className="rp-stat-label"><i className="bi bi-check-circle me-1"></i>Active</div>
                        </div>
                        <div className="rp-stat-card">
                            <div className="rp-stat-num" style={{ color: "#0f766e" }}>{policies.filter(p => p.type === "PAY_AT_HOTEL").length}</div>
                            <div className="rp-stat-label"><i className="bi bi-building-check me-1"></i>Pay at hotel</div>
                        </div>
                        <div className="rp-stat-card">
                            <div className="rp-stat-num" style={{ color: "#dc2626" }}>{policies.filter(p => p.type === "NON_REFUND").length}</div>
                            <div className="rp-stat-label"><i className="bi bi-x-circle me-1"></i>Non-refundable</div>
                        </div>
                    </div>
                )}

                {/* Policies Grid */}
                <div className="rp-card">
                    <div className="rp-card-header">
                        <span className="fw-bold" style={{ color: "#5C6F4E" }}>
                            <i className="bi bi-collection me-2"></i>Policy list
                        </span>
                        <span className="badge bg-secondary" style={{ fontSize: "0.7rem" }}>{policies.length} policies</span>
                    </div>

                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-secondary" role="status"></div>
                            <div className="text-muted mt-2">Loading policies...</div>
                        </div>
                    )}

                    {!loading && policies.length === 0 && (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-shield-x fs-1 d-block mb-2 opacity-25"></i>
                            No cancellation policies yet.<br />
                            <small>Click <strong>+ Add Cancellation Policy</strong> to start configuring.</small>
                        </div>
                    )}

                    {!loading && policies.length > 0 && (
                        <div className="rp-policy-grid">
                            {policies.map(p => {
                                const t = getPolicyType(p.type);
                                const seasonal = resolvePolicySeasonal(p);
                                return (
                                    <div key={p.id} className={`rp-policy-card ${!p.active ? "inactive" : ""}`}>
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <PolicyTypeBadge type={p.type} />
                                                <div className="fw-bold mt-2" style={{ fontSize: "1rem", color: "#2d3748" }}>{p.name}</div>
                                            </div>
                                            <div className="form-check form-switch mb-0" title="Toggle policy status">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={!!p.active}
                                                    onChange={() => handleToggle(p.id)}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </div>
                                        </div>

                                        {/* Rates */}
                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <div className="text-muted" style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Prepayment</div>
                                                <div className="fw-bold" style={{ color: "#d97706", fontSize: "1.15rem" }}>{p.prepaidRate}%</div>
                                                <div className="rp-rate-bar">
                                                    <div className="rp-rate-fill" style={{ width: `${p.prepaidRate}%`, background: "#d97706" }}></div>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="text-muted" style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Cancellation</div>
                                                <div className="fw-bold" style={{ color: "#16a34a", fontSize: "1.15rem" }}>{p.refunRate}%</div>
                                                <div className="rp-rate-bar">
                                                    <div className="rp-rate-fill" style={{ width: `${p.refunRate}%`, background: "#16a34a" }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta info */}
                                        <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: "0.8rem", color: "#718096" }}>
                                            {(p.daysBeforeCheckIn !== null && p.daysBeforeCheckIn !== undefined) || p.dateRange ? (
                                                <div>
                                                    <span style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        background: "#dcfce7", color: "#16a34a",
                                                        border: "1px solid #bbf7d0", borderRadius: 20,
                                                        padding: "2px 10px", fontWeight: 700, fontSize: "0.75rem",
                                                    }}>
                                                        <i className="bi bi-calendar-check-fill" />
                                                        Free cancel: {p.daysBeforeCheckIn ?? p.dateRange} days before
                                                    </span>
                                                    <div className="mt-1 text-muted" style={{ fontSize: "0.75rem" }}>
                                                        Cancel &lt; {p.daysBeforeCheckIn ?? p.dateRange} days before → {p.refunRate}% refund
                                                    </div>
                                                </div>
                                            ) : null}
                                            {seasonal.start && seasonal.end && (
                                                <div><i className="bi bi-calendar-range me-1 text-info"></i>Active Seasonal window: <strong>{seasonal.start} → {seasonal.end}</strong></div>
                                            )}
                                            {!p.dateRange && p.daysBeforeCheckIn == null && !p.activeTimeStart && (
                                                <div className="text-muted fst-italic"><i className="bi bi-infinity me-1"></i>Always applicable</div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="d-flex gap-2 mt-2">
                                            <button
                                                className="btn btn-sm btn-outline-secondary flex-fill"
                                                onClick={() => { setEditing(p); setModalOpen(true); }}
                                            >
                                                <i className="bi bi-pencil me-1"></i>Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger flex-fill"
                                                onClick={() => handleDelete(p)}
                                            >
                                                <i className="bi bi-trash me-1"></i>Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <PolicyFormModal
                key={editing ? editing.id : "new-policy"}
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                onSave={handleSave}
                initialData={editing}
                branchId={parseInt(branchId, 10)}
                saving={saving}
            />
        </>
    );
};

export default RefundPolicyManagement;
