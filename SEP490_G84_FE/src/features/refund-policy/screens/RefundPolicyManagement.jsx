import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import refundPolicyApi from "@/features/refund-policy/api/refundPolicyApi";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";

// ─── Constants ───────────────────────────────────────────────────────────────
const POLICY_TYPES = [
    { value: "FREE_CANCEL",    label: "Huỷ miễn phí",      color: "#16a34a", bg: "#dcfce7", icon: "bi-check-circle-fill" },
    { value: "PARTIAL_REFUND", label: "Hoàn tiền một phần", color: "#d97706", bg: "#fef3c7", icon: "bi-arrow-left-right" },
    { value: "NON_REFUND",     label: "Không hoàn tiền",    color: "#dc2626", bg: "#fee2e2", icon: "bi-x-circle-fill" },
    { value: "PREPAID",        label: "Thanh toán trước",   color: "#7c3aed", bg: "#ede9fe", icon: "bi-credit-card-fill" },
];

const EMPTY_FORM = {
    name: "",
    type: "FREE_CANCEL",
    branchId: null,
    dateRange: "",
    prepaidRate: 0,
    refunRate: 100,
    activeTimeStart: "",
    activeTimeEnd: "",
    active: true,
};

const getPolicyType = (value) => POLICY_TYPES.find(t => t.value === value) || POLICY_TYPES[0];

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
            setForm({ ...EMPTY_FORM, branchId, ...initialData });
        } else {
            setForm({ ...EMPTY_FORM, branchId });
        }
    }, [initialData, branchId, isOpen]);

    if (!isOpen) return null;

    const handle = (e) => {
        const { name, value, type: inputType, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: inputType === "checkbox" ? checked : value }));
    };

    const handleNum = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value === "" ? 0 : Math.min(100, Math.max(0, parseInt(value) || 0)) }));
    };

    return (
        <>
            <style>{`
                .rp-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1050; display:flex; align-items:center; justify-content:center; }
                .rp-modal { background:#fff; border-radius:20px; padding:0; max-width:580px; width:95%; box-shadow:0 20px 60px rgba(0,0,0,0.2); overflow:hidden; }
                .rp-modal-header { padding:20px 28px 16px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg,#5C6F4E 0%,#4a5b3f 100%); }
                .rp-modal-body { padding:24px 28px; max-height:70vh; overflow-y:auto; }
                .rp-type-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px; }
                .rp-type-btn { border:2px solid #e2e8f0; border-radius:12px; padding:12px; cursor:pointer; transition:all 0.2s; text-align:center; background:#fff; }
                .rp-type-btn.selected { border-color:var(--t-color); background:var(--t-bg); }
                .rp-rate-row { display:flex; gap:16px; }
                .rp-rate-row>div { flex:1; }
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
                            {initialData ? "Cập nhật chính sách" : "Tạo chính sách hoàn tiền"}
                        </h5>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>×</button>
                    </div>
                    <div className="rp-modal-body">
                        {/* Name */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Tên chính sách <span className="text-danger">*</span></label>
                            <input
                                className="form-control"
                                name="name"
                                value={form.name}
                                onChange={handle}
                                placeholder="VD: Huỷ miễn phí trước 7 ngày"
                                required
                            />
                        </div>

                        {/* Type selector */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Loại chính sách</label>
                            <div className="rp-type-grid">
                                {POLICY_TYPES.map(t => (
                                    <div
                                        key={t.value}
                                        className={`rp-type-btn ${form.type === t.value ? "selected" : ""}`}
                                        style={{ "--t-color": t.color, "--t-bg": t.bg }}
                                        onClick={() => setForm(prev => ({ ...prev, type: t.value }))}
                                    >
                                        <i className={`bi ${t.icon} d-block mb-1`} style={{ color: t.color, fontSize: "1.2rem" }}></i>
                                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: form.type === t.value ? t.color : "#4a5568" }}>{t.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rates */}
                        <div className="rp-rate-row mb-3">
                            <div>
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-cash-coin me-1 text-warning"></i>
                                    Đặt cọc / Thanh toán trước (%)
                                </label>
                                <input type="number" className="form-control" name="prepaidRate" value={form.prepaidRate} onChange={handleNum} min={0} max={100} />
                                <input type="range" className="rp-slider mt-1" name="prepaidRate" value={form.prepaidRate} onChange={handleNum} min={0} max={100} />
                                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Khách phải thanh toán {form.prepaidRate}% khi đặt phòng</div>
                            </div>
                            <div>
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-arrow-counterclockwise me-1 text-success"></i>
                                    Tỷ lệ hoàn tiền khi huỷ (%)
                                </label>
                                <input type="number" className="form-control" name="refunRate" value={form.refunRate} onChange={handleNum} min={0} max={100} />
                                <input type="range" className="rp-slider mt-1" name="refunRate" value={form.refunRate} onChange={handleNum} min={0} max={100} />
                                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Hoàn lại {form.refunRate}% số tiền đã trả khi huỷ</div>
                            </div>
                        </div>

                        {/* Date range (N days before) */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-calendar-range me-1 text-primary"></i>
                                Điều kiện áp dụng (VD: "0-7" = huỷ trong 7 ngày trước check-in)
                            </label>
                            <input
                                className="form-control"
                                name="dateRange"
                                value={form.dateRange}
                                onChange={handle}
                                placeholder='VD: "0-2" hoặc "3-7" hoặc "8-30"'
                            />
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>Nhập khoảng số ngày trước ngày check-in để chính sách này có hiệu lực</div>
                        </div>

                        {/* Active season */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-calendar3 me-1 text-info"></i>
                                Áp dụng theo mùa (MM-DD → MM-DD, để trống = cả năm)
                            </label>
                            <div className="rp-range-row">
                                <input className="form-control" name="activeTimeStart" value={form.activeTimeStart} onChange={handle} placeholder="01-01" />
                                <span className="text-muted fw-bold">→</span>
                                <input className="form-control" name="activeTimeEnd" value={form.activeTimeEnd} onChange={handle} placeholder="12-31" />
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
                        <button className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Huỷ</button>
                        <button
                            className="btn fw-bold px-4"
                            style={{ backgroundColor: "#5C6F4E", color: "#fff", borderRadius: 10 }}
                            onClick={() => onSave(form)}
                            disabled={saving || !form.name.trim()}
                        >
                            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</> : <><i className="bi bi-floppy me-1"></i>{initialData ? "Cập nhật" : "Tạo mới"}</>}
                        </button>
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
            showAlert("error", "Không thể tải dữ liệu: " + (err?.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { if (branchId) load(); }, [load]);

    const handleSave = async (form) => {
        setSaving(true);
        try {
            const dto = { ...form, branchId: parseInt(branchId, 10) };
            if (editing) {
                await refundPolicyApi.update(editing.id, dto);
                showAlert("success", "Cập nhật chính sách thành công!");
            } else {
                await refundPolicyApi.create(dto);
                showAlert("success", "Tạo chính sách mới thành công!");
            }
            setModalOpen(false);
            setEditing(null);
            load();
        } catch (err) {
            showAlert("error", "Lưu thất bại: " + (err?.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await refundPolicyApi.toggle(id);
            load();
        } catch { showAlert("error", "Không thể thay đổi trạng thái."); }
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Xác nhận xoá chính sách "${p.name}"?`)) return;
        try {
            await refundPolicyApi.delete(p.id);
            showAlert("success", "Đã xoá chính sách.");
            load();
        } catch { showAlert("error", "Xoá thất bại."); }
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
                                <i className="bi bi-arrow-left me-1"></i> Quay lại
                            </button>
                            <div className="rp-hero-title">
                                <i className="bi bi-shield-check me-2"></i>Chính sách hoàn tiền
                            </div>
                            <div className="rp-hero-sub">
                                Chi nhánh: <strong>{branchInfo?.branchName || `#${branchId}`}</strong>
                                {branchInfo?.address && <span className="ms-2 opacity-75">— {branchInfo.address}</span>}
                            </div>
                        </div>
                        <button className="rp-add-btn" onClick={() => { setEditing(null); setModalOpen(true); }}>
                            <i className="bi bi-plus-lg"></i> Thêm chính sách
                        </button>
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
                            <div className="rp-stat-label"><i className="bi bi-list-check me-1"></i>Tổng chính sách</div>
                        </div>
                        <div className="rp-stat-card">
                            <div className="rp-stat-num" style={{ color: "#16a34a" }}>{policies.filter(p => p.active).length}</div>
                            <div className="rp-stat-label"><i className="bi bi-check-circle me-1"></i>Đang kích hoạt</div>
                        </div>
                        <div className="rp-stat-card">
                            <div className="rp-stat-num" style={{ color: "#7c3aed" }}>{policies.filter(p => p.type === "PREPAID").length}</div>
                            <div className="rp-stat-label"><i className="bi bi-credit-card me-1"></i>Yêu cầu đặt cọc</div>
                        </div>
                        <div className="rp-stat-card">
                            <div className="rp-stat-num" style={{ color: "#dc2626" }}>{policies.filter(p => p.type === "NON_REFUND").length}</div>
                            <div className="rp-stat-label"><i className="bi bi-x-circle me-1"></i>Không hoàn</div>
                        </div>
                    </div>
                )}

                {/* Policies Grid */}
                <div className="rp-card">
                    <div className="rp-card-header">
                        <span className="fw-bold" style={{ color: "#5C6F4E" }}>
                            <i className="bi bi-collection me-2"></i>Danh sách chính sách
                        </span>
                        <span className="badge bg-secondary" style={{ fontSize: "0.7rem" }}>{policies.length} chính sách</span>
                    </div>

                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-secondary" role="status"></div>
                            <div className="text-muted mt-2">Đang tải chính sách...</div>
                        </div>
                    )}

                    {!loading && policies.length === 0 && (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-shield-x fs-1 d-block mb-2 opacity-25"></i>
                            Chưa có chính sách hoàn tiền nào.<br />
                            <small>Nhấn <strong>+ Thêm chính sách</strong> để bắt đầu cấu hình.</small>
                        </div>
                    )}

                    {!loading && policies.length > 0 && (
                        <div className="rp-policy-grid">
                            {policies.map(p => {
                                const t = getPolicyType(p.type);
                                return (
                                    <div key={p.id} className={`rp-policy-card ${!p.active ? "inactive" : ""}`}>
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <PolicyTypeBadge type={p.type} />
                                                <div className="fw-bold mt-2" style={{ fontSize: "1rem", color: "#2d3748" }}>{p.name}</div>
                                            </div>
                                            <div className="form-check form-switch mb-0" title="Bật/tắt chính sách">
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
                                                <div className="text-muted" style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Đặt cọc</div>
                                                <div className="fw-bold" style={{ color: "#d97706", fontSize: "1.15rem" }}>{p.prepaidRate}%</div>
                                                <div className="rp-rate-bar">
                                                    <div className="rp-rate-fill" style={{ width: `${p.prepaidRate}%`, background: "#d97706" }}></div>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="text-muted" style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Hoàn tiền</div>
                                                <div className="fw-bold" style={{ color: "#16a34a", fontSize: "1.15rem" }}>{p.refunRate}%</div>
                                                <div className="rp-rate-bar">
                                                    <div className="rp-rate-fill" style={{ width: `${p.refunRate}%`, background: "#16a34a" }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta info */}
                                        <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: "0.8rem", color: "#718096" }}>
                                            {p.dateRange && (
                                                <div><i className="bi bi-calendar-event me-1 text-primary"></i>Áp dụng: <strong>{p.dateRange}</strong> ngày trước check-in</div>
                                            )}
                                            {p.activeTimeStart && p.activeTimeEnd && (
                                                <div><i className="bi bi-calendar-range me-1 text-info"></i>Mùa: <strong>{p.activeTimeStart} → {p.activeTimeEnd}</strong></div>
                                            )}
                                            {!p.dateRange && !p.activeTimeStart && (
                                                <div className="text-muted fst-italic"><i className="bi bi-infinity me-1"></i>Áp dụng mọi lúc</div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="d-flex gap-2">
                                            <button
                                                className="rp-action-btn flex-fill"
                                                style={{ borderColor: "#5C6F4E", color: "#5C6F4E" }}
                                                onClick={() => { setEditing(p); setModalOpen(true); }}
                                                onMouseEnter={e => { e.target.style.background = "#5C6F4E"; e.target.style.color = "#fff"; }}
                                                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#5C6F4E"; }}
                                            >
                                                <i className="bi bi-pencil me-1"></i>Sửa
                                            </button>
                                            <button
                                                className="rp-action-btn"
                                                style={{ borderColor: "#dc2626", color: "#dc2626" }}
                                                onClick={() => handleDelete(p)}
                                                onMouseEnter={e => { e.target.style.background = "#dc2626"; e.target.style.color = "#fff"; }}
                                                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#dc2626"; }}
                                            >
                                                <i className="bi bi-trash"></i>
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
