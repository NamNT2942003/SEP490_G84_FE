import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import Buttons from "@/components/ui/Buttons";
import Swal from "sweetalert2";

// ─── RuleFormModal ────────────────────────────────────────────────────────────
const RuleFormModal = ({ isOpen, onClose, onSave, initialData, saving }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setDescription(initialData.description || "");
        } else {
            setName("");
            setDescription("");
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) {
            Swal.fire("Lỗi", "Tên quy tắc không được để trống", "error");
            return;
        }
        onSave({ name: name.trim(), description: description.trim() });
    };

    return (
        <>
            <style>{`
                .hr-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1050; display:flex; align-items:center; justify-content:center; }
                .hr-modal { background:#fff; border-radius:20px; padding:0; max-width:600px; width:95%; box-shadow:0 20px 60px rgba(0,0,0,0.2); overflow:hidden; }
                .hr-modal-header { padding:20px 28px 16px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg,#5C6F4E 0%,#4a5b3f 100%); }
                .hr-modal-body { padding:24px 28px; }
                .hr-modal-footer { padding:16px 28px; border-top:1px solid #f0f0f0; display:flex; justify-content:flex-end; gap:12px; background:#fafbf8; }
            `}</style>
            <div className="hr-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="hr-modal">
                    <div className="hr-modal-header">
                        <h5 style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                            <i className="bi bi-journal-check me-2"></i>
                            {initialData ? "Cập nhật quy tắc" : "Thêm quy tắc mới"}
                        </h5>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }}>×</button>
                    </div>
                    <div className="hr-modal-body">
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Tên quy tắc <span className="text-danger">*</span></label>
                            <input
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VD: Nhận phòng, Trả phòng, Hủy phòng..."
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Mô tả chi tiết</label>
                            <textarea
                                className="form-control"
                                rows="6"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Nhập mô tả chi tiết cho quy tắc này..."
                                style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.stopPropagation();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="hr-modal-footer">
                        <Buttons variant="outline" className="btn-sm" onClick={onClose} disabled={saving}>Hủy</Buttons>
                        <Buttons
                            variant="primary"
                            className="btn-sm"
                            onClick={handleSubmit}
                            disabled={saving || !name.trim()}
                            isLoading={saving}
                            icon={!saving && <i className="bi bi-floppy" />}
                        >
                            {initialData ? "Cập nhật" : "Thêm mới"}
                        </Buttons>
                    </div>
                </div>
            </div>
        </>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const HotelRuleManagement = () => {
    const { branchId } = useParams();
    const navigate = useNavigate();

    const [rules, setRules] = useState([]);
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
            const data = await branchManagementApi.getHotelRules(branchId);
            setRules(data);
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
            if (editing) {
                await branchManagementApi.updateHotelRule(editing.id, {
                    name: form.name,
                    description: form.description,
                    branchId: parseInt(branchId, 10),
                });
                showAlert("success", "Cập nhật quy tắc thành công!");
            } else {
                await branchManagementApi.addHotelRule(branchId, {
                    name: form.name,
                    description: form.description,
                });
                showAlert("success", "Thêm quy tắc thành công!");
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

    const handleDelete = async (rule) => {
        Swal.fire({
            title: 'Xóa quy tắc?',
            text: `Bạn có chắc muốn xóa quy tắc "${rule.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#5C6F4E',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await branchManagementApi.deleteHotelRule(rule.id);
                    showAlert("success", "Đã xóa quy tắc.");
                    load();
                } catch {
                    showAlert("error", "Xóa thất bại.");
                }
            }
        });
    };

    return (
        <>
            <style>{`
                :root { --olive: #5C6F4E; --olive-dark: #4a5b3f; --gold: #D4AF37; }
                .hr-page { padding: 28px 32px; min-height: 100vh; background: #f8fafc; }
                .hr-hero { background: linear-gradient(135deg, #5C6F4E 0%, #4a5b3f 60%, #3d4e33 100%); border-radius: 20px; padding: 28px 32px; color: #fff; margin-bottom: 28px; position: relative; overflow: hidden; }
                .hr-hero::before { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; border-radius: 50%; background: rgba(255,255,255,0.05); }
                .hr-hero-title { font-size: 1.6rem; font-weight: 800; margin: 0; }
                .hr-hero-sub { font-size: 0.9rem; opacity: 0.8; margin-top: 4px; }

                .hr-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; max-width: 500px; }
                .hr-stat-card { background: #fff; border-radius: 16px; padding: 18px 20px; border: 1px solid #f0f0f0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
                .hr-stat-num { font-size: 1.8rem; font-weight: 800; line-height: 1; }
                .hr-stat-label { font-size: 0.78rem; color: #718096; margin-top: 4px; }

                .hr-card { background: #fff; border-radius: 18px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
                .hr-card-header { padding: 18px 24px; border-bottom: 1px solid #f0f0f0; background: #fafbf8; display: flex; align-items: center; justify-content: space-between; }

                .hr-rule-card { border: 1.5px solid #edf2f7; border-radius: 16px; padding: 22px; transition: all 0.2s; position: relative; background: #fff; }
                .hr-rule-card:hover { border-color: var(--olive); box-shadow: 0 8px 24px rgba(92,111,78,0.1); transform: translateY(-2px); }
                .hr-rule-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; padding: 24px; }

                .hr-rule-name { font-size: 1.05rem; font-weight: 700; color: #2d3748; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
                .hr-rule-desc { font-size: 0.88rem; color: #4a5568; line-height: 1.65; white-space: pre-wrap; background: #f8faf6; border-radius: 10px; padding: 12px 14px; border: 1px solid #e8ede4; min-height: 60px; }

                @media(max-width:768px) { .hr-stats { grid-template-columns: 1fr; } .hr-rule-grid { grid-template-columns: 1fr; } }
            `}</style>

            <div className="hr-page">
                {/* Hero Header */}
                <div className="hr-hero">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <button onClick={() => navigate("/admin/branches")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem", marginBottom: 12 }}>
                                <i className="bi bi-arrow-left me-1"></i> Quay lại
                            </button>
                            <div className="hr-hero-title">
                                <i className="bi bi-journal-check me-2"></i>Quản lý quy tắc chung
                            </div>
                            <div className="hr-hero-sub">
                                Chi nhánh: <strong>{branchInfo?.branchName || `#${branchId}`}</strong>
                                {branchInfo?.address && <span className="ms-2 opacity-75">— {branchInfo.address}</span>}
                            </div>
                        </div>
                        <Buttons variant="primary" icon={<i className="bi bi-plus-lg" />} onClick={() => { setEditing(null); setModalOpen(true); }}>
                            Thêm quy tắc
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
                    <div className="hr-stats">
                        <div className="hr-stat-card">
                            <div className="hr-stat-num" style={{ color: "#5C6F4E" }}>{rules.length}</div>
                            <div className="hr-stat-label"><i className="bi bi-list-check me-1"></i>Tổng quy tắc</div>
                        </div>
                        <div className="hr-stat-card">
                            <div className="hr-stat-num" style={{ color: "#2563eb" }}>{rules.filter(r => r.description && r.description.trim()).length}</div>
                            <div className="hr-stat-label"><i className="bi bi-card-text me-1"></i>Có mô tả</div>
                        </div>
                    </div>
                )}

                {/* Rules Grid */}
                <div className="hr-card">
                    <div className="hr-card-header">
                        <span className="fw-bold" style={{ color: "#5C6F4E" }}>
                            <i className="bi bi-collection me-2"></i>Danh sách quy tắc
                        </span>
                        <span className="badge bg-secondary" style={{ fontSize: "0.7rem" }}>{rules.length} quy tắc</span>
                    </div>

                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-secondary" role="status"></div>
                            <div className="text-muted mt-2">Đang tải quy tắc...</div>
                        </div>
                    )}

                    {!loading && rules.length === 0 && (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-journal-x fs-1 d-block mb-2 opacity-25"></i>
                            Chưa có quy tắc nào.<br />
                            <small>Nhấn <strong>+ Thêm quy tắc</strong> để bắt đầu tạo.</small>
                        </div>
                    )}

                    {!loading && rules.length > 0 && (
                        <div className="hr-rule-grid">
                            {rules.map(rule => (
                                <div key={rule.id} className="hr-rule-card">
                                    <div className="hr-rule-name">
                                        <i className="bi bi-bookmark-fill" style={{ color: "#5C6F4E", fontSize: "0.9rem" }}></i>
                                        {rule.name}
                                    </div>
                                    <div className="hr-rule-desc">
                                        {rule.description || <span className="text-muted fst-italic">Chưa có mô tả</span>}
                                    </div>
                                    <div className="d-flex gap-2 mt-3">
                                        <button
                                            className="btn btn-sm btn-outline-secondary flex-fill"
                                            onClick={() => { setEditing(rule); setModalOpen(true); }}
                                        >
                                            <i className="bi bi-pencil me-1"></i>Sửa
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger flex-fill"
                                            onClick={() => handleDelete(rule)}
                                        >
                                            <i className="bi bi-trash me-1"></i>Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <RuleFormModal
                key={editing ? editing.id : "new-rule"}
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                onSave={handleSave}
                initialData={editing}
                saving={saving}
            />
        </>
    );
};

export default HotelRuleManagement;
