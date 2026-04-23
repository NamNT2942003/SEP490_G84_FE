import React, { useState, useEffect, useCallback } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import { API_ENDPOINTS } from "../../../constants/apiConfig";
import apiClient from "../../../services/apiClient";
import "./BookingAmendmentModal.css";

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
    // Handle "2025-05-20T00:00:00" or "2025-05-20"
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

function EditStep({ booking, lines, setLines, newArrival, setNewArrival,
                    newDeparture, setNewDeparture, note, setNote, availableRoomTypes }) {
    const details = booking?.details ?? [];
    const [addingRoomTypeId, setAddingRoomTypeId] = useState("");

    // Combine original details and newly mapped lines
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

    // lines = { [roomTypeId]: { roomTypeName, priceAtBooking, currentQty, delta } }
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
        if (lines[rId] || combinedDetails.some(d => (d.roomTypeId || d.roomType?.id) == rId)) return; // already in panel

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
            {/* Bảng phòng hiện tại */}
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
                        const delta = getDelta(item.roomTypeId);
                        const afterQty = item.quantity + delta;
                        return (
                            <tr key={item.roomTypeId}>
                                <td><strong>{item.roomTypeName}</strong></td>
                                <td className="text-end">{item.quantity}</td>
                                <td className="text-end">{formatVND(item.priceAtBooking)}</td>
                                <td className="text-center">
                                    <div className="ba-delta-input">
                                        <button
                                            className="ba-delta-btn"
                                            onClick={() => changeDelta(
                                                item.roomTypeId, item.roomTypeName,
                                                item.priceAtBooking, item.quantity, -1
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
                                                item.roomTypeId, item.roomTypeName,
                                                item.priceAtBooking, item.quantity, +1
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

            {/* Ngày check-in/out */}
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
                        placeholder={toISODate(booking?.arrivalDate)}
                    />
                    {booking?.arrivalDate && (
                        <div style={{ fontSize: "0.73rem", color: "#adb5bd", marginTop: 3 }}>
                            Hiện tại: {formatDate(booking.arrivalDate)}
                        </div>
                    )}
                </div>
                <div className="ba-date-field">
                    <label>Check-out mới</label>
                    <input
                        type="date"
                        value={newDeparture}
                        onChange={(e) => setNewDeparture(e.target.value)}
                        placeholder={toISODate(booking?.departureDate)}
                    />
                    {booking?.departureDate && (
                        <div style={{ fontSize: "0.73rem", color: "#adb5bd", marginTop: 3 }}>
                            Hiện tại: {formatDate(booking.departureDate)}
                        </div>
                    )}
                </div>
            </div>

            {/* Ghi chú */}
            <div className="ba-note-field">
                <label>Ghi chú nội bộ</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Lý do thay đổi booking..."
                    maxLength={500}
                />
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
            {/* Warning banners */}
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

            {/* Tổng quan tài chính */}
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

                {/* Nếu có phần giảm → hiển thị chính sách hoàn */}
                {hasReduction && (
                    <>
                        <div className="ba-section-label" style={{ marginBottom: 8 }}>
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

                        <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: 6 }}>
                            <i className="bi bi-info-circle me-1" />
                            Netting: phí phạt chỉ tính trên phần giảm ròng ({formatVND(grossReductionAmount)}),
                            không phải tổng giá trị phòng hủy ({formatVND(totalCancellationValue)}).
                        </div>
                    </>
                )}
            </div>

            {/* Kiểm tra inventory */}
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
                                <th className="text-end">Cần thêm</th>
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
                                            ? <span className="ba-ok"><i className="bi bi-check-circle-fill" /> Đủ phòng</span>
                                            : <span className="ba-fail"><i className="bi bi-x-circle-fill" /> Thiếu phòng</span>
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

// ─── Main: BookingAmendmentModal ──────────────────────────────────────────

/**
 * Modal sửa đổi booking (Amendment).
 *
 * Props:
 *  - show         {boolean}  hiển thị hay không
 *  - booking      {Object}   dữ liệu booking đầy đủ (cần details[])
 *  - onHide       {Function} đóng modal
 *  - onSuccess    {Function} gọi lại khi amendment thành công
 */
export default function BookingAmendmentModal({ show, booking, onHide, onSuccess }) {
    const [step, setStep]             = useState(1);
    const [lines, setLines]           = useState({});
    const [newArrival, setNewArrival]     = useState("");
    const [newDeparture, setNewDeparture] = useState("");
    const [note, setNote]             = useState("");
    const [availableRoomTypes, setAvailableRoomTypes] = useState([]);

    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview]       = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState("");
    const [success, setSuccess]       = useState(false);

    // Reset khi mở modal
    useEffect(() => {
        if (show) {
            setStep(1);
            setLines({});
            setNewArrival("");
            setNewDeparture("");
            setNote("");
            setPreview(null);
            setError("");
            setSuccess(false);
        }
    }, [show]);

    useEffect(() => {
        if (show && booking?.branchId) {
            apiClient.get(`${API_ENDPOINTS.ROOM_TYPES.BY_BRANCH}/${booking.branchId}`)
                .then(res => setAvailableRoomTypes(res.data?.data || res.data || []))
                .catch(err => console.error("Could not fetch room types", err));
        }
    }, [show, booking?.branchId]);

    if (!show) return null;

    // Kiểm tra có thay đổi nào không
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
                const rId = item.roomTypeId || item.roomType?.roomTypeId || item.roomType?.id;
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
            amendedBy: "STAFF",
            note: note.trim() || null,
        };
        if (newArrival)   payload.newArrivalDate   = newArrival;
        if (newDeparture) payload.newDepartureDate = newDeparture;
        return payload;
    };

    // Bước 1 → 2: gọi preview
    const handlePreview = async () => {
        if (!hasChanges) {
            setError("Vui lòng thực hiện ít nhất một thay đổi trước khi preview.");
            return;
        }
        try {
            setError("");
            setPreviewing(true);
            const result = await bookingManagementApi.previewAmendment(
                booking.bookingId, buildPayload()
            );
            setPreview(result);
            setStep(2);
        } catch (err) {
            const detail = err?.response?.data?.error || err?.response?.data?.detail || err?.message;
            setError("Lỗi khi preview: " + (detail || "Không xác định"));
        } finally {
            setPreviewing(false);
        }
    };

    // Bước 2: Xác nhận apply
    const handleConfirm = async () => {
        // Block nếu có ngày thiếu phòng
        const insufficient = preview?.inventoryStatus?.some(s => !s.sufficient);
        if (insufficient) {
            setError("Không thể xác nhận: một hoặc nhiều ngày không đủ phòng.");
            return;
        }
        try {
            setError("");
            setSubmitting(true);
            await bookingManagementApi.createAmendment(booking.bookingId, buildPayload());
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onHide();
            }, 1500);
        } catch (err) {
            const data = err?.response?.data;
            if (err?.response?.status === 403) {
                setError("Booking OTA không thể sửa đổi qua hệ thống nội bộ.");
            } else if (err?.response?.status === 409) {
                setError(data?.detail || data?.error || "Booking đang trong trạng thái không cho phép sửa đổi.");
            } else if (err?.response?.status === 423) {
                setError("Booking đang được xử lý bởi request khác. Vui lòng thử lại sau vài giây.");
            } else {
                setError(data?.error || data?.detail || err?.message || "Lỗi không xác định.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Block confirm nếu inventory không đủ
    const canConfirm = preview && !preview.inventoryStatus?.some(s => !s.sufficient) && !submitting;

    return (
        <div className="ba-overlay" onClick={(e) => e.target === e.currentTarget && !submitting && onHide()}>
            <div className="ba-modal">
                {/* Header */}
                <div className="ba-header">
                    <div>
                        <h5><i className="bi bi-pencil-square me-2" />Sửa Đổi Booking</h5>
                        <div className="ba-subtitle">
                            #{booking?.bookingCode || booking?.bookingId} · {booking?.customerName}
                        </div>
                    </div>
                    <button
                        className="btn-close"
                        onClick={onHide}
                        disabled={submitting}
                        style={{ marginTop: 2 }}
                    />
                </div>

                {/* Steps */}
                <StepIndicator step={step} />

                {/* Body */}
                <div className="ba-body">
                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-5">
                            <div style={{ fontSize: "3rem", color: "#198754", marginBottom: 12 }}>
                                <i className="bi bi-check-circle-fill" />
                            </div>
                            <h5 style={{ color: "#198754", fontWeight: 700 }}>Amendment áp dụng thành công!</h5>
                            <p className="text-muted small">Modal sẽ tự đóng...</p>
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
                            note={note}
                            setNote={setNote}
                            availableRoomTypes={availableRoomTypes}
                        />
                    ) : (
                        <PreviewStep preview={preview} />
                    )}

                    {/* Error */}
                    {error && !success && (
                        <div className="alert alert-danger py-2 mt-3 mb-0 d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-circle-fill" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="ba-footer">
                        {step === 1 ? (
                            <>
                                <button
                                    className="ba-btn ba-btn-outline"
                                    onClick={onHide}
                                    disabled={previewing}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className="ba-btn ba-btn-primary"
                                    onClick={handlePreview}
                                    disabled={previewing || !hasChanges}
                                >
                                    {previewing ? (
                                        <>
                                            <span className="ba-spinner" />
                                            Đang kiểm tra...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-eye" />
                                            Preview & Kiểm tra
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="ba-btn ba-btn-outline"
                                    onClick={() => { setStep(1); setError(""); }}
                                    disabled={submitting}
                                >
                                    <i className="bi bi-arrow-left" />
                                    Quay lại
                                </button>
                                <button
                                    className="ba-btn ba-btn-danger"
                                    onClick={onHide}
                                    disabled={submitting}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className="ba-btn ba-btn-primary"
                                    onClick={handleConfirm}
                                    disabled={!canConfirm}
                                    title={!canConfirm && preview?.inventoryStatus?.some(s => !s.sufficient)
                                        ? "Không đủ phòng — không thể xác nhận"
                                        : ""}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="ba-spinner" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg" />
                                            Xác nhận thay đổi
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
