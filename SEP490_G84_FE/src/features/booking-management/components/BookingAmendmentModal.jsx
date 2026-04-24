import React, { useState, useEffect, useCallback, useMemo } from "react";
import bookingManagementApi from "../api/bookingManagementApi";
import { API_ENDPOINTS } from "../../../constants/apiConfig";
import apiClient from "../../../services/apiClient";
import { roomService } from "@/features/booking/api/roomService";
import Swal from "sweetalert2";
import "./BookingAmendmentModal.css";

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatVND = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "VND" }).format(amount ?? 0);

const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US");
};

const toISODate = (localDateTime) => {
    if (!localDateTime) return "";
    // Handle "2025-05-20T00:00:00" or "2025-05-20"
    return localDateTime.substring(0, 10);
};

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Extract the pre-computed delta value from the pricing engine's reason string.
 * Example: "Date Range matching [194000]" → 194000
 * This matches the logic used in SearchRoom.jsx.
 */
const extractDeltaFromReason = (reason) => {
    const text = String(reason || "");
    const match = text.match(/\[\s*([-+]?\d+(?:[.,]\d+)?)\s*\]/);
    if (!match) return null;
    const parsed = Number(match[1].replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Calculate the final price from basePrice + availablePriceModifiers.
 * Uses the same approach as SearchRoom: extract deltas from [reason] brackets.
 */
const calculatePriceFromModifiers = (room) => {
    const basePrice = safeNumber(room?.basePrice ?? room?.price, 0);
    const modifiers = Array.isArray(room?.availablePriceModifiers) ? room.availablePriceModifiers : [];
    const totalAdjustment = modifiers.reduce((sum, modifier) => {
        const delta = extractDeltaFromReason(modifier?.reason);
        if (delta !== null) return sum + delta;
        // Fallback: compute from adjustmentType/adjustmentValue
        const adjValue = safeNumber(modifier?.adjustmentValue, 0);
        const adjType = String(modifier?.adjustmentType || "").toUpperCase();
        if (adjType === "PERCENT") return sum + (basePrice * adjValue) / 100;
        return sum + adjValue;
    }, 0);
    return Math.max(0, basePrice + totalAdjustment);
};



// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ step }) {
    const steps = [
        { num: 1, label: "Edit Changes" },
        { num: 2, label: "Confirm" },
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
    newDeparture, setNewDeparture, note, setNote, availableRoomTypes, roomPricingMap }) {
    const details = booking?.details ?? [];

    // Combine original details and newly added lines
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

    const changeDelta = (roomTypeId, roomTypeName, price, currentQty, change) => {
        setLines(prev => {
            const current = prev[roomTypeId]?.delta ?? 0;
            const next = current + change;
            if (next < -currentQty) return prev;
            // Auto-remove newly added rooms (currentQty=0) when delta returns to 0
            if (currentQty === 0 && next === 0) {
                const copy = { ...prev };
                delete copy[roomTypeId];
                return copy;
            }
            return {
                ...prev,
                [roomTypeId]: { roomTypeName, priceAtBooking: price, currentQty, delta: next }
            };
        });
    };

    const handleAddFromCard = (rt) => {
        const rId = String(rt.roomTypeId || rt.id);
        if (lines[rId] || combinedDetails.some(d => String(d.roomTypeId || d.roomType?.id) === rId)) return;
        const roomTypeName = rt.name || rt.roomTypeName;
        const livePricing = roomPricingMap?.[rId];
        // Use live engine price — already includes all modifiers (no double-counting)
        const price = livePricing?.finalPrice ?? calculatePriceFromModifiers(rt) ?? rt.basePrice ?? 0;
        setLines(prev => ({
            ...prev,
            [rId]: { roomTypeName, priceAtBooking: price, currentQty: 0, delta: 1 }
        }));
    };

    // Room types available to add: not already in booking, have availability
    const existingRoomTypeIds = new Set(combinedDetails.map(d => String(d.roomTypeId || d.roomType?.id)));
    const addableRoomTypes = Object.values(roomPricingMap).filter(rp =>
        !existingRoomTypeIds.has(String(rp.roomTypeId)) && rp.availableCount > 0
    );

    return (
        <>
            {/* ── Stay Dates ── */}
            <div className="ba-section-label">
                <i className="bi bi-calendar-range" />
                Stay Dates
            </div>
            <div className="ba-date-row">
                <div className="ba-date-field">
                    <label>Check-in</label>
                    <input
                        type="date"
                        value={newArrival}
                        onChange={(e) => setNewArrival(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div className="ba-date-field">
                    <label>Check-out</label>
                    <input
                        type="date"
                        value={newDeparture}
                        onChange={(e) => setNewDeparture(e.target.value)}
                        min={newArrival || new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            {/* ── Current Room Types ── */}
            <div className="ba-section-label">
                <i className="bi bi-door-open" />
                Current Room Types
            </div>
            <table className="ba-rooms-table">
                <thead>
                    <tr>
                        <th>Room Type</th>
                        <th className="text-end">Qty</th>
                        <th className="text-end">Total Price</th>
                        <th className="text-center">Change (+/-)</th>
                        <th className="text-end">After</th>
                    </tr>
                </thead>
                <tbody>
                    {combinedDetails.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center text-muted py-3">
                                No room data available
                            </td>
                        </tr>
                    ) : combinedDetails.map((item) => {
                        const delta = getDelta(item.roomTypeId);
                        const afterQty = item.quantity + delta;
                        const livePricing = roomPricingMap?.[String(item.roomTypeId)];
                        // Price per unit: live engine price (already all-inclusive) > DB snapshot
                        const unitPrice = livePricing?.finalPrice ?? item.priceAtBooking;
                        const totalPrice = unitPrice * item.quantity;
                        return (
                            <tr key={item.roomTypeId}>
                                <td>
                                    <strong>{item.roomTypeName}</strong>
                                    <div style={{ fontSize: "0.7rem", color: "#7a8a7b" }}>
                                        {formatVND(unitPrice)} /stay
                                    </div>
                                </td>
                                <td className="text-end">{item.quantity}</td>
                                <td className="text-end">{formatVND(totalPrice)}</td>
                                <td className="text-center">
                                    <div className="ba-delta-input">
                                        <button
                                            className="ba-delta-btn"
                                            onClick={() => changeDelta(
                                                item.roomTypeId, item.roomTypeName,
                                                unitPrice, item.quantity, -1
                                            )}
                                            disabled={delta <= -item.quantity}
                                            title="Remove room"
                                        >−</button>
                                        <span className={`ba-delta-count ${delta > 0 ? "positive" : delta < 0 ? "negative" : ""}`}>
                                            {delta > 0 ? `+${delta}` : delta}
                                        </span>
                                        <button
                                            className="ba-delta-btn"
                                            onClick={() => changeDelta(
                                                item.roomTypeId, item.roomTypeName,
                                                unitPrice, item.quantity, +1
                                            )}
                                            title="Add room"
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
                                                (removed)
                                            </span>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* ── Add New Room Types (visual cards) ── */}
            {addableRoomTypes.length > 0 && (
                <>
                    <div className="ba-section-label" style={{ marginTop: 8 }}>
                        <i className="bi bi-plus-circle" />
                        Add Room Type
                    </div>
                    <div className="ba-rt-grid">
                        {addableRoomTypes.map((rp) => {
                            const baseP = rp.basePrice || 0;
                            const finalP = rp.finalPrice || baseP;
                            const hasDiscount = baseP > 0 && finalP < baseP;
                            const discountPct = hasDiscount ? Math.round((1 - finalP / baseP) * 100) : 0;
                            const modifiers = rp.pricingOptions?.[0]?.modifiers || [];
                            // Find image from availableRoomTypes list
                            const rtMeta = availableRoomTypes?.find(rt =>
                                String(rt.id || rt.roomTypeId) === String(rp.roomTypeId));
                            return (
                                <div key={rp.roomTypeId} className="ba-rt-card" onClick={() => handleAddFromCard(rp)}>
                                    <div className="ba-rt-card-img">
                                        {rtMeta?.image ? (
                                            <img src={rtMeta.image} alt={rp.name} />
                                        ) : (
                                            <i className="bi bi-building" />
                                        )}
                                    </div>
                                    <div className="ba-rt-card-body">
                                        <div className="ba-rt-card-name">{rp.name}</div>
                                        <div className="ba-rt-card-cap">
                                            {rtMeta?.maxAdults > 0 && <span><i className="bi bi-person me-1" />{rtMeta.maxAdults}</span>}
                                            {rtMeta?.area > 0 && <span><i className="bi bi-grid me-1" />{rtMeta.area}m²</span>}
                                        </div>
                                        <div>
                                            <span className="ba-rt-card-price">
                                                {formatVND(finalP)}
                                                <span className="ba-rt-card-price-sub">/stay</span>
                                            </span>
                                            {hasDiscount && (
                                                <>
                                                    <span className="ba-rt-card-base">{formatVND(baseP)}</span>
                                                    <span className="ba-rt-card-discount">-{discountPct}%</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="ba-rt-card-avail">{rp.availableCount} room(s) available</div>
                                        {modifiers.length > 0 && (
                                            <div className="ba-rt-card-tags">
                                                {modifiers.slice(0, 3).map((m, i) => (
                                                    <span key={i} className="ba-rt-tag ba-rt-tag-blue">{m.name || m.type}</span>
                                                ))}
                                                {modifiers.length > 3 && (
                                                    <span className="ba-rt-tag ba-rt-tag-gray">+{modifiers.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Internal note */}
            <div className="ba-note-field">
                <label>Internal Note</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reason for booking amendment..."
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


    const allSufficient = !inventoryStatus?.some(s => !s.sufficient);
    const hasReduction = grossReductionAmount > 0;
    const hasAddition = totalAdditionValue > 0;

    return (
        <>
            {/* Warning banners */}
            {!allSufficient && (
                <div className="ba-warning-banner danger">
                    <i className="bi bi-exclamation-triangle-fill" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <strong>Insufficient rooms!</strong> One or more dates do not have enough rooms.
                        Please adjust the quantities.
                    </div>
                </div>
            )}
            {warningMessage === "NO_REFUND_POLICY" && (
                <div className="ba-warning-banner danger">
                    <i className="bi bi-x-circle-fill" style={{ flexShrink: 0 }} />
                    <div>
                        <strong>Refund deadline has passed.</strong> The reduced portion will not be refunded.
                        The hotel retains the full penalty fee.
                    </div>
                </div>
            )}
            {warningMessage === "NULL_POLICY" && (
                <div className="ba-warning-banner">
                    <i className="bi bi-exclamation-circle" style={{ flexShrink: 0 }} />
                    <div>Original booking has no cancellation policy — defaulting to <strong>0% refund</strong>.</div>
                </div>
            )}

            {/* Tổng quan tài chính */}
            <div className="ba-preview-card">
                <div className="ba-preview-title">
                    <i className="bi bi-calculator" />
                    Financial Summary
                </div>

                <div className="ba-financial-grid">
                    <div className={`ba-fin-cell ${deltaTotalAmount >= 0 ? "positive" : "negative"}`}>
                        <div className="ba-fin-label">Total Difference</div>
                        <div className="ba-fin-value">
                            {deltaTotalAmount >= 0 ? "+" : ""}
                            {formatVND(deltaTotalAmount)}
                        </div>
                    </div>
                    {hasAddition && (
                        <div className="ba-fin-cell positive">
                            <div className="ba-fin-label">Additions</div>
                            <div className="ba-fin-value">+{formatVND(totalAdditionValue)}</div>
                        </div>
                    )}
                    {hasReduction && (
                        <div className="ba-fin-cell negative">
                            <div className="ba-fin-label">Net Reduction</div>
                            <div className="ba-fin-value">−{formatVND(grossReductionAmount)}</div>
                        </div>
                    )}
                </div>

                {/* Nếu có phần giảm → hiển thị chính sách hoàn */}
                {hasReduction && (
                    <>
                        <div className="ba-section-label" style={{ marginBottom: 8 }}>
                            <i className="bi bi-shield-check" />
                            Applied Cancellation Policy
                        </div>

                        {/* Structured policy rules — matching CancelBookingModal format */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                            {/* FREE_CANCEL window */}
                            {refundWindow === "FREE_CANCEL" && (
                                <div style={{
                                    fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                                    borderRadius: 7, padding: "8px 12px", color: "#15803d",
                                }}>
                                    <i className="bi bi-check-circle-fill" style={{ marginTop: 1, flexShrink: 0, color: "#16a34a" }} />
                                    <span style={{ flex: 1 }}>
                                        Free cancellation window — <strong>{daysUntilCheckIn} days</strong> before check-in.
                                        The net reduction of <strong>{formatVND(grossReductionAmount)}</strong> is <strong>100% refundable</strong>.
                                    </span>
                                    <span style={{ flexShrink: 0, fontWeight: 700, color: "#15803d" }}>✓ Eligible</span>
                                </div>
                            )}

                            {/* PARTIAL_REFUND window */}
                            {refundWindow === "PARTIAL_REFUND" && snapshotRefundRateUsed > 0 && (
                                <div style={{
                                    fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                    background: "#fffbeb", border: "1px solid #fcd34d",
                                    borderRadius: 7, padding: "8px 12px", color: "#92400e",
                                }}>
                                    <i className="bi bi-exclamation-triangle-fill" style={{ marginTop: 1, flexShrink: 0, color: "#d97706" }} />
                                    <span style={{ flex: 1 }}>
                                        Free cancellation window expired ({daysUntilCheckIn} days before check-in).
                                        Partial refund: get back <strong>{formatVND(refundableAmount)}</strong> ({snapshotRefundRateUsed}% of net reduction).
                                        Cancellation fee is <strong>{formatVND(nonRefundableAmount)}</strong>.
                                    </span>
                                    <span style={{ flexShrink: 0, fontWeight: 700, color: "#b91c1c" }}>✗ Expired</span>
                                </div>
                            )}

                            {/* PARTIAL_REFUND window with 0% rate — effectively no refund */}
                            {refundWindow === "PARTIAL_REFUND" && snapshotRefundRateUsed === 0 && (
                                <div style={{
                                    fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    borderRadius: 7, padding: "8px 12px", color: "#991b1b",
                                }}>
                                    <i className="bi bi-x-circle-fill" style={{ marginTop: 1, flexShrink: 0, color: "#dc2626" }} />
                                    <span style={{ flex: 1 }}>
                                        Free cancellation window expired ({daysUntilCheckIn} days before check-in).
                                        No refund (0% refund rate). Hotel retains the full <strong>{formatVND(grossReductionAmount)}</strong> net reduction.
                                    </span>
                                    <span style={{ flexShrink: 0, fontWeight: 700, color: "#b91c1c" }}>✗ Expired</span>
                                </div>
                            )}

                            {/* NO_REFUND — check-in day or past */}
                            {refundWindow === "NO_REFUND" && (
                                <div style={{
                                    fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8,
                                    background: "#fef2f2", border: "1px solid #fecaca",
                                    borderRadius: 7, padding: "8px 12px", color: "#991b1b",
                                }}>
                                    <i className="bi bi-x-circle-fill" style={{ marginTop: 1, flexShrink: 0, color: "#dc2626" }} />
                                    <span style={{ flex: 1 }}>
                                        Refund deadline has passed (check-in day or past).
                                        No refund. Hotel retains the full <strong>{formatVND(grossReductionAmount)}</strong> net reduction.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Financial breakdown */}
                        <div className="ba-financial-grid">
                            <div className="ba-fin-cell positive">
                                <div className="ba-fin-label">Guest Refund</div>
                                <div className="ba-fin-value">{formatVND(refundableAmount)}</div>
                            </div>
                            <div className="ba-fin-cell warning">
                                <div className="ba-fin-label">Penalty (Hotel retains)</div>
                                <div className="ba-fin-value">{formatVND(nonRefundableAmount)}</div>
                            </div>
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: 6 }}>
                            <i className="bi bi-info-circle me-1" />
                            Refund is calculated on the net reduction amount ({formatVND(grossReductionAmount)}), after netting
                            additions against the total cancelled value ({formatVND(totalCancellationValue)}).
                        </div>
                    </>
                )}
            </div>

            {/* Kiểm tra inventory */}
            {inventoryStatus?.length > 0 && (
                <div className="ba-preview-card" style={{ marginTop: 0 }}>
                    <div className="ba-preview-title">
                        <i className="bi bi-calendar-check" />
                        Availability Check
                    </div>
                    <table className="ba-inv-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Room Type</th>
                                <th className="text-end">Required</th>
                                <th className="text-end">Available</th>
                                <th className="text-center">Status</th>
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
                                            ? <span className="ba-ok"><i className="bi bi-check-circle-fill" /> Available</span>
                                            : <span className="ba-fail"><i className="bi bi-x-circle-fill" /> Insufficient</span>
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
export default function BookingAmendmentModal({ show, booking, onHide, onSuccess, onRequestCancel }) {
    const [step, setStep] = useState(1);
    const [lines, setLines] = useState({});
    const [newArrival, setNewArrival] = useState("");
    const [newDeparture, setNewDeparture] = useState("");
    const [note, setNote] = useState("");
    const [availableRoomTypes, setAvailableRoomTypes] = useState([]);
    const [roomPricingMap, setRoomPricingMap] = useState({});

    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Reset khi mở modal
    useEffect(() => {
        if (show) {
            setStep(1);
            setLines({});
            setNewArrival(toISODate(booking?.arrivalDate) || "");
            setNewDeparture(toISODate(booking?.departureDate) || "");
            setNote("");
            setPreview(null);
            setError("");
            setSuccess(false);
            setRoomPricingMap({});
        }
    }, [show]);

    useEffect(() => {
        if (show && booking?.branchId) {
            apiClient.get(`${API_ENDPOINTS.ROOM_TYPES.BY_BRANCH}/${booking.branchId}`)
                .then(res => setAvailableRoomTypes(res.data?.data || res.data || []))
                .catch(err => console.error("Could not fetch room types", err));
        }
    }, [show, booking?.branchId]);

    // Fetch live pricing from the same engine used by SearchRoom / CreateBookingByStaffModal
    // so that new room types added during amendment use engine-computed finalPrice.
    const effectiveArrival = newArrival || toISODate(booking?.arrivalDate);
    const effectiveDeparture = newDeparture || toISODate(booking?.departureDate);

    useEffect(() => {
        if (!show || !booking?.branchId || !effectiveArrival || !effectiveDeparture) {
            return;
        }
        if (effectiveArrival >= effectiveDeparture) return;

        let isMounted = true;
        const fetchPricing = async () => {
            try {
                const params = {
                    branchId: Number(booking.branchId),
                    checkIn: effectiveArrival,
                    checkOut: effectiveDeparture,
                    adults: 1,
                    children: 0,
                    totalRooms: 1,
                    page: 0,
                    size: 200,
                    sortPrice: "priceAsc",
                };
                // Include customer email for loyalty discount and policy for policy modifier
                if (booking.customerEmail) params.customerEmail = booking.customerEmail;
                if (booking.appliedPolicyId) params.policy = booking.appliedPolicyId;
                const data = await roomService.searchRooms(params);
                if (!isMounted) return;
                const map = {};
                (data?.content || []).forEach((room) => {
                    const options = (Array.isArray(room.pricingOptions) ? room.pricingOptions : [])
                        .sort((a, b) => (a.finalPrice || 0) - (b.finalPrice || 0));
                    // Determine final price: pricingOptions > basePrice+modifiers > basePrice
                    const engineFinalPrice = options.length > 0
                        ? Number(options[0].finalPrice)
                        : null;
                    const modifierCalculatedPrice = calculatePriceFromModifiers(room);
                    const resolvedFinalPrice = engineFinalPrice ?? modifierCalculatedPrice;
                    map[String(room.roomTypeId)] = {
                        roomTypeId: room.roomTypeId,
                        name: room.name,
                        availableCount: Number(room.availableCount ?? 0),
                        basePrice: Number(room.basePrice ?? 0),
                        finalPrice: resolvedFinalPrice,
                        pricingOptions: options,
                    };
                });
                setRoomPricingMap(map);
            } catch (err) {
                console.error("Failed to fetch amendment pricing:", err);
                if (isMounted) setRoomPricingMap({});
            }
        };
        fetchPricing();
        return () => { isMounted = false; };
    }, [show, booking?.branchId, effectiveArrival, effectiveDeparture]);

    if (!show) return null;

    // Kiểm tra có thay đổi nào không
    const origArrival = toISODate(booking?.arrivalDate);
    const origDeparture = toISODate(booking?.departureDate);
    const hasChanges = Object.values(lines).some(l => l.delta !== 0)
        || (newArrival !== "" && newArrival !== origArrival)
        || (newDeparture !== "" && newDeparture !== origDeparture);

    // Helper to determine if all rooms would be zero after amendment
    const allRoomsZero = () => {
        // Combine original details and added lines similar to EditStep
        const details = booking?.bookingDetails ?? booking?.details ?? [];
        const combined = [...details];
        Object.keys(lines).forEach(rId => {
            if (!combined.some(d => (d.roomTypeId || d.roomType?.id) == rId)) {
                const added = lines[rId];
                combined.push({
                    roomTypeId: rId,
                    roomTypeName: added.roomTypeName,
                    quantity: 0,
                    priceAtBooking: added.priceAtBooking,
                });
            }
        });
        // Check each combined item after applying delta
        return combined.every(item => {
            const rId = item.roomTypeId || item.roomType?.roomTypeId || item.roomType?.id;
            const delta = lines[rId]?.delta ?? 0;
            const afterQty = (item.quantity ?? 0) + delta;
            return afterQty === 0;
        });
    };

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

        if ((newArrival && newArrival !== origArrival) || (newDeparture && newDeparture !== origDeparture)) {
            details.forEach(item => {
                const rId = item.roomTypeId || item.roomType?.roomTypeId || item.roomType?.id;
                if (!linesPayload.find(l => l.roomTypeId === rId)) {
                    // Use live pricing if available, fallback to DB snapshot
                    const livePrice = roomPricingMap[String(rId)]?.finalPrice;
                    linesPayload.push({
                        roomTypeId: rId,
                        deltaQuantity: 0,
                        priceAtAmendment: livePrice ?? item.priceAtBooking ?? item.price,
                    });
                }
            });
        }

        const datesChanged = (newArrival && newArrival !== origArrival) || (newDeparture && newDeparture !== origDeparture);
        const finalLines = datesChanged
            ? linesPayload
            : linesPayload.filter(l => l.deltaQuantity !== 0);

        const payload = {
            lines: finalLines,
            amendedBy: "STAFF",
            note: note.trim() || null,
        };
        if (newArrival && newArrival !== origArrival) payload.newArrivalDate = newArrival;
        if (newDeparture && newDeparture !== origDeparture) payload.newDepartureDate = newDeparture;
        return payload;
    };

    // Bước 1 → 2: gọi preview
    const handlePreview = async () => {
        if (!hasChanges) {
            setError("Please make at least one change before previewing.");
            return;
        }

        // Nếu tất cả phòng về 0 → hỏi user có muốn hủy booking không
        if (allRoomsZero()) {
            const { isConfirmed } = await Swal.fire({
                icon: "warning",
                title: "All rooms reduced to 0",
                html: `<p>You have reduced all room types to <strong>0</strong>.</p>
                       <p>Would you like to <strong>cancel this booking</strong> instead?</p>`,
                showCancelButton: true,
                confirmButtonText: "Cancel Booking",
                cancelButtonText: "Go back to edit",
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6b7280",
                reverseButtons: true,
            });

            if (isConfirmed) {
                // Đóng modal chỉnh sửa và mở modal hủy booking
                onHide();
                onRequestCancel?.(booking.bookingId);
            } else {
                // Hoàn tác: reset tất cả thay đổi về 0
                setLines({});
                setError("");
            }
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
            setError("Preview error: " + (detail || "Unknown error"));
        } finally {
            setPreviewing(false);
        }
    };

    // Bước 2: Xác nhận apply
    const handleConfirm = async () => {
        // Block nếu có ngày thiếu phòng
        const insufficient = preview?.inventoryStatus?.some(s => !s.sufficient);
        if (insufficient) {
            setError("Cannot confirm: one or more dates have insufficient rooms.");
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
                setError("OTA bookings cannot be amended through the internal system.");
            } else if (err?.response?.status === 409) {
                setError(data?.detail || data?.error || "Booking is in a status that does not allow amendments.");
            } else if (err?.response?.status === 423) {
                setError("Booking is being processed by another request. Please try again in a few seconds.");
            } else {
                setError(data?.error || data?.detail || err?.message || "Unknown error.");
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
                        <h5><i className="bi bi-pencil-square me-2" />Amend Booking</h5>
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
                            <h5 style={{ color: "#198754", fontWeight: 700 }}>Amendment applied successfully!</h5>
                            <p className="text-muted small">This modal will close automatically...</p>
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
                            roomPricingMap={roomPricingMap}
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
                                    Cancel
                                </button>
                                <button
                                    className="ba-btn ba-btn-primary"
                                    onClick={handlePreview}
                                    disabled={previewing || !hasChanges}
                                >
                                    {previewing ? (
                                        <>
                                            <span className="ba-spinner" />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-eye" />
                                            Preview & Check
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
                                    Go Back
                                </button>
                                <button
                                    className="ba-btn ba-btn-danger"
                                    onClick={onHide}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="ba-btn ba-btn-primary"
                                    onClick={handleConfirm}
                                    disabled={!canConfirm}
                                    title={!canConfirm && preview?.inventoryStatus?.some(s => !s.sufficient)
                                        ? "Insufficient rooms — cannot confirm"
                                        : ""}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="ba-spinner" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg" />
                                            Confirm Changes
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
