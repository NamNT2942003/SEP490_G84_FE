import React, { useState, useEffect } from "react";
import { guest } from "../api/guestService";
import { API_ENDPOINTS } from "../../../constants/apiConfig";
import apiClient from "../../../services/apiClient";
import "../../booking-management/components/BookingAmendmentModal.css";

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);

const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("vi-VN");
};

const toISODate = (localDateTime) => {
    if (!localDateTime) return "";
    return localDateTime.substring(0, 10);
};

const REFUND_BADGE = {
    FREE_CANCEL:    { cls: "free",    icon: "bi-check-circle-fill", label: "Miễn phí hủy (hoàn 100%)" },
    PARTIAL_REFUND: { cls: "partial", icon: "bi-clock-history",    label: "Hoàn một phần"              },
    NO_REFUND:      { cls: "none",    icon: "bi-x-circle-fill",    label: "Không hoàn tiền"             },
    NOT_APPLICABLE: { cls: "free",    icon: "bi-dash-circle",      label: "Không áp dụng"              },
};

// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ step }) {
    const steps = [
        { num: 1, label: "Chọn thay đổi" },
        { num: 2, label: "Xác nhận"       },
    ];
    return (
        <div className="ba-steps">
            {steps.map((s, idx) => {
                const cls = step > s.num ? "done" : step === s.num ? "active" : "";
                return (
                    <React.Fragment key={s.num}>
                        <div className={`ba-step ${cls}`}>
                            <span className="ba-step-num">
                                {step > s.num ? <i className="bi bi-check" /> : s.num}
                            </span>
                            {s.label}
                        </div>
                        {idx < steps.length - 1 && (
                            <span className="ba-step-sep">›</span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── Step 1: Edit form ──────────────────────────────────────────────────────

function EditStep({ booking, lines, setLines, newArrival, setNewArrival, newDeparture, setNewDeparture, availableRoomTypes }) {
    const details = booking?.bookingDetails ?? booking?.details ?? [];
    const [addingRoomTypeId, setAddingRoomTypeId] = useState("");

    const combinedDetails = [...details];
    Object.keys(lines).forEach(rId => {
        if (!combinedDetails.some(d => (d.roomTypeId || d.roomType?.id) == rId)) {
            const addedLine = lines[rId];
            combinedDetails.push({
                 roomTypeId: rId,
                 roomTypeName: addedLine.roomTypeName,
                 quantity: 0,
                 priceAtBooking: addedLine.priceAtBooking
            });
        }
    });

    const getDelta = (roomTypeId) => lines[roomTypeId]?.delta ?? 0;

    const changeDelta = (roomTypeId, roomTypeName, priceAtBooking, currentQty, change) => {
        setLines(prev => {
            const current = prev[roomTypeId]?.delta ?? 0;
            const next = current + change;
            if (next < -currentQty) return prev;
            return {
                ...prev,
                [roomTypeId]: { roomTypeName, priceAtBooking, currentQty, delta: next }
            };
        });
    };

    const handleAddNewRoomType = () => {
        if (!addingRoomTypeId) return;
        const targetType = availableRoomTypes?.find(rt => rt.id == addingRoomTypeId || rt.roomTypeId == addingRoomTypeId);
        if (!targetType) return;
        
        const rId = targetType.id || targetType.roomTypeId;
        if (lines[rId] || combinedDetails.some(d => (d.roomTypeId || d.roomType?.id) == rId)) return;

        const roomTypeName = targetType.name || targetType.roomTypeName;
        const basePrice = targetType.basePrice || targetType.price || 0;

        setLines(prev => ({
             ...prev,
             [rId]: { roomTypeName, priceAtBooking: basePrice, currentQty: 0, delta: 1 }
        }));
        setAddingRoomTypeId("");
    };

    return (
        <>
            <div className="ba-section-label">
                <i className="bi bi-door-open" />
                Các loại phòng hiện tại
            </div>
            <table className="ba-rooms-table">
                <thead>
                    <tr>
                        <th>Loại phòng</th>
                        <th className="text-end">Số lượng hiện tại</th>
                        <th className="text-end">Giá/đêm</th>
                        <th className="text-center">Thay đổi (+/-)</th>
                        <th className="text-end">Sau thay đổi</th>
                    </tr>
                </thead>
                <tbody>
                    {combinedDetails.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center text-muted py-3">
                                Không có dữ liệu phòng
                            </td>
                        </tr>
                    ) : combinedDetails.map((item) => {
                        const rnType = item.roomType || item;
                        const rId = rnType.roomTypeId || rnType.id || item.roomTypeId;
                        const rName = rnType.name || rnType.roomTypeName || item.roomTypeName;
                        const delta = getDelta(rId);
                        const afterQty = item.quantity + delta;
                        return (
                            <tr key={rId}>
                                <td><strong>{rName}</strong></td>
                                <td className="text-end">{item.quantity}</td>
                                <td className="text-end">{formatVND(item.priceAtBooking || item.price)}</td>
                                <td className="text-center">
                                    <div className="ba-delta-input">
                                        <button
                                            className="ba-delta-btn"
                                            onClick={() => changeDelta(
                                                rId, rName,
                                                item.priceAtBooking || item.price, item.quantity, -1
                                            )}
                                            disabled={delta <= -item.quantity}
                                            title="Bớt phòng"
                                        >−</button>
                                        <span className={`ba-delta-count ${delta > 0 ? "positive" : delta < 0 ? "negative" : ""}`}>
                                            {delta > 0 ? `+${delta}` : delta}
                                        </span>
                                        <button
                                            className="ba-delta-btn"
                                            onClick={() => changeDelta(
                                                rId, rName,
                                                item.priceAtBooking || item.price, item.quantity, +1
                                            )}
                                            title="Thêm phòng"
                                        >+</button>
                                    </div>
                                </td>
                                <td className="text-end">
                                    <span style={{
                                        fontWeight: 700,
                                        color: afterQty === 0 ? "#dc3545" : afterQty !== item.quantity ? "#0d6efd" : "#212529"
                                    }}>
                                        {afterQty}
                                        {afterQty === 0 && (
                                            <span style={{ fontSize: "0.72rem", marginLeft: 4, color: "#dc3545" }}>
                                                (xóa)
                                            </span>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="ba-add-room-row d-flex align-items-center gap-2 mt-2">
                <select 
                    className="form-select form-select-sm" 
                    style={{ width: "auto", minWidth: "200px" }}
                    value={addingRoomTypeId} 
                    onChange={(e) => setAddingRoomTypeId(e.target.value)}
                >
                    <option value="">-- Thêm loại phòng khác --</option>
                    {availableRoomTypes?.map(rt => {
                         const id = rt.id || rt.roomTypeId;
                         if (combinedDetails.some(d => (d.roomTypeId || d.roomType?.id) == id)) return null;
                         return <option key={id} value={id}>{rt.name}</option>;
                    })}
                </select>
                <button 
                    className="ba-btn ba-btn-outline ba-btn-sm m-0" 
                    onClick={handleAddNewRoomType}
                    disabled={!addingRoomTypeId}
                >
                    Thêm phòng mới
                </button>
            </div>

            <div className="ba-section-label" style={{ marginTop: 16 }}>
                <i className="bi bi-calendar-range" />
                Thay đổi ngày (tuỳ chọn)
            </div>
            <div className="ba-date-row">
                <div className="ba-date-field">
                    <label>Check-in mới</label>
                    <input
                        type="date"
                        value={newArrival}
                        onChange={(e) => setNewArrival(e.target.value)}
                        placeholder={toISODate(booking?.arrivalDate || booking?.checkInDate)}
                    />
                </div>
                <div className="ba-date-field">
                    <label>Check-out mới</label>
                    <input
                        type="date"
                        value={newDeparture}
                        onChange={(e) => setNewDeparture(e.target.value)}
                        placeholder={toISODate(booking?.departureDate || booking?.checkOutDate)}
                    />
                </div>
            </div>
        </>
    );
}

// ─── Step 2: Preview ──────────────────────────────────────────────────────

function PreviewStep({ preview }) {
    if (!preview) return null;

    const {
        deltaTotalAmount, totalAdditionValue, totalCancellationValue,
        grossReductionAmount, refundableAmount, nonRefundableAmount,
        refundWindow, snapshotRefundRateUsed, daysUntilCheckIn,
        warningMessage, inventoryStatus,
    } = preview;

    const badgeCfg = REFUND_BADGE[refundWindow] || REFUND_BADGE.NOT_APPLICABLE;
    const allSufficient = !inventoryStatus?.some(s => !s.sufficient);
    const hasReduction = grossReductionAmount > 0;
    const hasAddition  = totalAdditionValue > 0;

    return (
        <>
            {!allSufficient && (
                <div className="ba-warning-banner danger">
                    <i className="bi bi-exclamation-triangle-fill" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <strong>Không đủ phòng!</strong> Một hoặc nhiều ngày không đủ số phòng yêu cầu.
                        Vui lòng điều chỉnh lại số lượng.
                    </div>
                </div>
            )}
            {warningMessage === "NO_REFUND_POLICY" && (
                <div className="ba-warning-banner danger">
                    <i className="bi bi-x-circle-fill" style={{ flexShrink: 0 }} />
                    <div>
                        <strong>Đã qua thời hạn hoàn tiền.</strong> Phần giảm bớt sẽ không được hoàn.
                        Khách sạn giữ toàn bộ phí phạt.
                    </div>
                </div>
            )}
            {warningMessage === "NULL_POLICY" && (
                <div className="ba-warning-banner">
                    <i className="bi bi-exclamation-circle" style={{ flexShrink: 0 }} />
                    <div>Booking gốc không có chính sách hoàn hủy — mặc định áp dụng <strong>hoàn 0%</strong>.</div>
                </div>
            )}

            <div className="ba-preview-card">
                <div className="ba-preview-title">
                    <i className="bi bi-calculator" />
                    Tóm Tắt Tài Chính
                </div>

                <div className="ba-financial-grid">
                    <div className={`ba-fin-cell ${deltaTotalAmount >= 0 ? "positive" : "negative"}`}>
                        <div className="ba-fin-label">Chênh lệch tổng cộng</div>
                        <div className="ba-fin-value">
                            {deltaTotalAmount >= 0 ? "+" : ""}
                            {formatVND(deltaTotalAmount)}
                        </div>
                    </div>
                    {hasAddition && (
                        <div className="ba-fin-cell positive">
                            <div className="ba-fin-label">Phần thêm mới</div>
                            <div className="ba-fin-value">+{formatVND(totalAdditionValue)}</div>
                        </div>
                    )}
                    {hasReduction && (
                        <div className="ba-fin-cell negative">
                            <div className="ba-fin-label">Phần giảm ròng</div>
                            <div className="ba-fin-value">−{formatVND(grossReductionAmount)}</div>
                        </div>
                    )}
                </div>

                {hasReduction && (
                    <>
                        <div className="ba-section-label" style={{ marginBottom: 8, marginTop: 16 }}>
                            <i className="bi bi-shield-check" />
                            Chính Sách Hoàn Hủy Áp Dụng
                        </div>

                        <div className={`ba-refund-badge ${badgeCfg.cls}`}>
                            <i className={`bi ${badgeCfg.icon}`} />
                            {badgeCfg.label}
                            {refundWindow !== "FREE_CANCEL" && refundWindow !== "NOT_APPLICABLE" && (
                                <span style={{ opacity: 0.7, marginLeft: 4 }}>
                                    ({daysUntilCheckIn} ngày trước check-in • {snapshotRefundRateUsed}% hoàn)
                                </span>
                            )}
                        </div>

                        <div className="ba-financial-grid">
                            <div className="ba-fin-cell positive">
                                <div className="ba-fin-label">Hoàn cho khách</div>
                                <div className="ba-fin-value">{formatVND(refundableAmount)}</div>
                            </div>
                            <div className="ba-fin-cell warning">
                                <div className="ba-fin-label">Phí phạt (KS giữ)</div>
                                <div className="ba-fin-value">{formatVND(nonRefundableAmount)}</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {inventoryStatus?.length > 0 && (
                <div className="ba-preview-card" style={{ marginTop: 0 }}>
                    <div className="ba-preview-title">
                        <i className="bi bi-calendar-check" />
                        Kiểm Tra Phòng Trống
                    </div>
                    <table className="ba-inv-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Loại phòng</th>
                                <th className="text-end">C.Thêm</th>
                                <th className="text-end">Còn trống</th>
                                <th className="text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryStatus.map((row, i) => (
                                <tr key={i}>
                                    <td>{row.date}</td>
                                    <td>{row.roomTypeName}</td>
                                    <td className="text-end">+{row.requiredQuantity}</td>
                                    <td className="text-end">{row.availableQuantity}</td>
                                    <td className="text-center">
                                        {row.sufficient
                                            ? <span className="ba-ok"><i className="bi bi-check-circle-fill" /> Đủ</span>
                                            : <span className="ba-fail"><i className="bi bi-x-circle-fill" /> Thiếu</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

// ─── Main: GuestAmendmentModal ──────────────────────────────────────────

export default function GuestAmendmentModal({ show, booking, token, onHide, onSuccess }) {
    const [step, setStep]             = useState(1);
    const [lines, setLines]           = useState({});
    const [newArrival, setNewArrival]     = useState("");
    const [newDeparture, setNewDeparture] = useState("");
    const [availableRoomTypes, setAvailableRoomTypes] = useState([]);

    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview]       = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState("");
    const [success, setSuccess]       = useState(false);

    useEffect(() => {
        if (show) {
            setStep(1);
            setLines({});
            setNewArrival("");
            setNewDeparture("");
            setPreview(null);
            setError("");
            setSuccess(false);
        }
    }, [show]);

    useEffect(() => {
        if (show && booking?.branchId) {
            apiClient.get(API_ENDPOINTS.ROOM_TYPES.BY_BRANCH, { params: { branchId: booking.branchId } })
                .then(res => setAvailableRoomTypes(res.data?.data || res.data || []))
                .catch(err => console.error("Could not fetch room types", err));
        }
    }, [show, booking?.branchId]);

    if (!show) return null;

    const hasChanges = Object.values(lines).some(l => l.delta !== 0)
        || newArrival !== ""
        || newDeparture !== "";

    const buildPayload = () => {
        const linesPayload = [];
        const details = booking?.bookingDetails ?? booking?.details ?? [];
        
        Object.entries(lines).forEach(([roomTypeId, v]) => {
            linesPayload.push({
                roomTypeId: parseInt(roomTypeId),
                deltaQuantity: v.delta,
                priceAtAmendment: v.priceAtBooking,
            });
        });

        if (newArrival || newDeparture) {
            details.forEach(item => {
                const rType = item.roomType || item;
                const rId = rType.roomTypeId || rType.id || item.roomTypeId;
                if (!linesPayload.find(l => l.roomTypeId === rId)) {
                    linesPayload.push({
                        roomTypeId: rId,
                        deltaQuantity: 0,
                        priceAtAmendment: item.priceAtBooking || item.price,
                    });
                }
            });
        }

        const finalLines = (newArrival || newDeparture) 
            ? linesPayload 
            : linesPayload.filter(l => l.deltaQuantity !== 0);

        const payload = {
            lines: finalLines,
        };
        if (newArrival)   payload.newArrivalDate   = newArrival;
        if (newDeparture) payload.newDepartureDate = newDeparture;
        return payload;
    };

    const handlePreview = async () => {
        if (!hasChanges) {
            setError("Vui lòng thực hiện ít nhất một thay đổi trước khi xem trước.");
            return;
        }
        try {
            setError("");
            setPreviewing(true);
            const result = await guest.previewAmendment(token, booking.bookingCode, buildPayload());
            setPreview(result);
            setStep(2);
        } catch (err) {
            const detail = err?.response?.data?.error || err?.message;
            setError("Lỗi khi kiểm tra: " + (detail || "Không xác định"));
        } finally {
            setPreviewing(false);
        }
    };

    const handleConfirm = async () => {
        const insufficient = preview?.inventoryStatus?.some(s => !s.sufficient);
        if (insufficient) {
            setError("Không thể xác nhận: một hoặc nhiều ngày không đủ phòng.");
            return;
        }
        try {
            setError("");
            setSubmitting(true);
            await guest.applyAmendment(token, booking.bookingCode, buildPayload());
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onHide();
            }, 2000);
        } catch (err) {
            const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message;
            setError(errorMsg || "Lỗi khi xác nhận yêu cầu.");
        } finally {
            setSubmitting(false);
        }
    };

    const canConfirm = preview && !preview.inventoryStatus?.some(s => !s.sufficient) && !submitting;

    return (
        <div className="ba-overlay" onClick={(e) => e.target === e.currentTarget && !submitting && onHide()}>
            <div className="ba-modal">
                <div className="ba-header">
                    <div>
                        <h5><i className="bi bi-pencil-square me-2" />Chỉnh sửa yêu cầu</h5>
                        <div className="ba-subtitle">
                            Mã phòng: #{booking?.bookingCode}
                        </div>
                    </div>
                    <button className="btn-close" onClick={onHide} disabled={submitting} />
                </div>

                <StepIndicator step={step} />

                <div className="ba-body">
                    {success ? (
                        <div className="text-center py-5">
                            <div style={{ fontSize: "3rem", color: "#198754", marginBottom: 12 }}>
                                <i className="bi bi-check-circle-fill" />
                            </div>
                            <h5 style={{ color: "#198754", fontWeight: 700 }}>Thay đổi thành công!</h5>
                            <p className="text-muted small">Đang quay lại...</p>
                        </div>
                    ) : step === 1 ? (
                        <EditStep
                            booking={booking}
                            lines={lines}
                            setLines={setLines}
                            newArrival={newArrival}
                            setNewArrival={setNewArrival}
                            newDeparture={newDeparture}
                            setNewDeparture={setNewDeparture}
                            availableRoomTypes={availableRoomTypes}
                        />
                    ) : (
                        <PreviewStep preview={preview} />
                    )}

                    {error && !success && (
                        <div className="alert alert-danger py-2 mt-3 mb-0 d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-circle-fill" />
                            {error}
                        </div>
                    )}
                </div>

                {!success && (
                    <div className="ba-footer">
                        {step === 1 ? (
                            <>
                                <button className="ba-btn ba-btn-outline" onClick={onHide} disabled={previewing}>
                                    Đóng
                                </button>
                                <button className="ba-btn ba-btn-primary" onClick={handlePreview} disabled={previewing || !hasChanges}>
                                    {previewing ? <><span className="ba-spinner" /> Kiểm tra...</> : "Tiếp theo"}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="ba-btn ba-btn-outline" onClick={() => { setStep(1); setError(""); }} disabled={submitting}>
                                    Quay lại
                                </button>
                                <button className="ba-btn ba-btn-primary" onClick={handleConfirm} disabled={!canConfirm}>
                                    {submitting ? <><span className="ba-spinner" /> Đang xử lý...</> : "Xác nhận"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
