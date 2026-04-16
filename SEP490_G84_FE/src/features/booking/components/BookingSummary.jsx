import React from 'react';
import apiClient from '@/services/apiClient';

const getAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/api/')) {
        const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, '');
        return baseUrl + url;
    }
    return url;
};

const BookingSummary = ({ selectedRooms = [], checkIn, checkOut, selectedPolicy = null, depositAmount = null, prepaidAmount = null, bookingTotalAmount = null }) => {
    const HIDDEN_MODIFIER_TYPES = new Set(['POLICY']);

    const getVisibleAppliedModifiers = (room) =>
        getAppliedModifierBreakdown(room).filter((mod) => !['USER_HISTORY_DISCOUNT', 'POLICY'].includes(mod.type));

    const normalizeModeText = (mode) => {
        if (!mode) return 'Standard';
        const raw = String(mode).trim();
        const lower = raw.toLowerCase();

        if (lower.includes('chính sách') || lower.includes('chinh sach') || lower.includes('policy')) {
            return 'Policy';
        }
        if (lower.includes('standard')) {
            return 'Standard';
        }
        return raw;
    };

    const normalizeReasonText = (reason) => {
        if (!reason) return '';
        let text = String(reason).replace(/\s*\[\s*-?\d+(?:\.\d+)?\s*\]$/, '').trim();

        text = text.replace(/Occupancy proxy/gi, 'Room quantity in booking');
        text = text.replace(/Customer history/gi, 'Returning guest');

        // Singular/plural cleanup for guest wording from backend reason.
        text = text.replace(/\((\d+)\s+guests\)/gi, (_, n) => `(${n} ${Number(n) === 1 ? 'guest' : 'guests'})`);
        text = text.replace(/\((\d+)\s+rooms\)/gi, (_, n) => `(${n} ${Number(n) === 1 ? 'room' : 'rooms'})`);

        return text;
    };

    const normalizeModifierTypeText = (type) => {
        if (!type) return 'UNKNOWN';
        if (type === 'OCCUPANCY') return 'ROOM_QUANTITY';
        if (type === 'USER_HISTORY_DISCOUNT') return 'RETURNING_GUEST';
        return type;
    };

    const getCancellationText = (cancellationType, freeCancelBeforeDays) => {
        if (cancellationType === 'NON_REFUNDABLE') return 'Non-refundable';
        if (cancellationType === 'REFUNDABLE' && freeCancelBeforeDays > 0) {
            return `Free cancellation before ${freeCancelBeforeDays} days`;
        }
        if (cancellationType === 'REFUNDABLE') return 'Free cancellation';
        return 'Cancellation policy by room';
    };

    const getPaymentText = (paymentType) => {
        if (paymentType === 'FREE_CANCEL') return 'Free cancellation';
        if (paymentType === 'PARTIAL_REFUND') return 'Partial refund';
        if (paymentType === 'NON_REFUND') return 'Non-refundable';
        if (paymentType === 'PREPAID') return 'Prepaid';
        if (paymentType === 'PAY_AT_HOTEL') return 'Pay at hotel';
        return 'Room-based payment method';
    };

    const calculateNights = (start, end) => {
        if (!start || !end) return 0;
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '--';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const safeNumber = (value, fallback = 0) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    };

    const extractDeltaFromReason = (reason) => {
        if (!reason) return null;
        const match = reason.match(/\[\s*(-?\d+(?:\.\d+)?)\s*\]$/);
        if (!match) return null;
        return safeNumber(match[1], 0);
    };

    const getOptionModifiers = (room) =>
        (Array.isArray(room?.selectedPricingOption?.modifiers) ? room.selectedPricingOption.modifiers : [])
            .filter((modifier) => !HIDDEN_MODIFIER_TYPES.has(modifier?.type));

    const calculateRoomBaseUnitPrice = (room) => {
        return safeNumber(
            room?.selectedPricingOption?.basePrice
                ?? room?.basePrice
                ?? room?.price
                ?? room?.selectedPrice,
            0,
        );
    };

    const calculateRoomUnitPrice = (room) => {
        const baseOptPrice = safeNumber(
            room?.selectedPrice
                ?? room?.selectedPricingOption?.finalPrice
                ?? room?.appliedPrice
                ?? room?.basePrice
                ?? room?.price,
            0,
        );

        const manual = room?.selectedManualPromotion;
        if (!manual) return baseOptPrice;

        const manualValue = safeNumber(manual?.adjustmentValue, 0);
        const delta = manual?.adjustmentType === 'PERCENT' || manual?.adjustmentType === 'PERCENTAGE'
            ? (safeNumber(room?.basePrice, baseOptPrice) * manualValue) / 100
            : manualValue;

        const finalPrice = baseOptPrice + delta;
        return finalPrice > 0 ? finalPrice : 0;
    };

    const getAppliedModifierBreakdown = (room) => {
        const breakdown = [];

        for (const mod of getOptionModifiers(room)) {
            const deltaFromReason = extractDeltaFromReason(mod?.reason);
            const delta = deltaFromReason !== null
                ? deltaFromReason
                : (mod?.adjustmentType === 'PERCENT' || mod?.adjustmentType === 'PERCENTAGE')
                    ? null
                    : safeNumber(mod?.adjustmentValue, 0);

            breakdown.push({
                source: 'option',
                name: mod?.name || 'Modifier',
                type: mod?.type || 'UNKNOWN',
                reason: mod?.reason || 'Applied by pricing rules',
                delta,
            });
        }

        if (room?.selectedManualPromotion) {
            const manual = room.selectedManualPromotion;
            const manualDelta = (manual?.adjustmentType === 'PERCENT' || manual?.adjustmentType === 'PERCENTAGE')
                ? (safeNumber(room?.basePrice, calculateRoomUnitPrice(room)) * safeNumber(manual?.adjustmentValue, 0)) / 100
                : safeNumber(manual?.adjustmentValue, 0);

            breakdown.push({
                source: 'manual',
                name: manual?.name || 'Manual promotion',
                type: manual?.type || 'MANUAL',
                reason: manual?.reason || 'Selected manually by guest',
                delta: manualDelta,
            });
        }

        return breakdown;
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const nights = calculateNights(checkIn, checkOut);
    const totalRooms = selectedRooms.reduce((sum, r) => sum + (r.quantity || 1), 0);
    const subtotal = selectedRooms.reduce(
        (sum, room) => sum + (calculateRoomUnitPrice(room) * (room.quantity || 1)),
        0,
    );
    const baseSubtotal = selectedRooms.reduce(
        (sum, room) => sum + (calculateRoomBaseUnitPrice(room) * (room.quantity || 1)),
        0,
    );
    const totalDelta = subtotal - baseSubtotal;
    const roomNights = Math.max(0, nights) * Math.max(0, totalRooms);
    const safeRoomNights = roomNights > 0 ? roomNights : 1;
    const averageBasePerRoomNight = baseSubtotal / safeRoomNights;
    const averageFinalPerRoomNight = subtotal / safeRoomNights;
    const averageDeltaPerRoomNight = averageFinalPerRoomNight - averageBasePerRoomNight;

    const modifierSummary = selectedRooms.reduce((acc, room) => {
        const qty = room.quantity || 1;
        const roomBreakdown = getVisibleAppliedModifiers(room);

        for (const mod of roomBreakdown) {
            const delta = safeNumber(mod?.delta, 0) * qty;
            if (delta < 0) {
                acc.totalDiscount += Math.abs(delta);
            } else if (delta > 0) {
                acc.totalSurcharge += delta;
            }
        }

        return acc;
    }, { totalDiscount: 0, totalSurcharge: 0 });

    const hasVisibleDiscount = modifierSummary.totalDiscount > 0;
    const hasVisibleSurcharge = modifierSummary.totalSurcharge > 0;

    const returningGuestDelta = selectedRooms.reduce((sum, room) => {
        const qty = room.quantity || 1;
        const modifiers = getAppliedModifierBreakdown(room).filter((mod) => mod.type === 'USER_HISTORY_DISCOUNT');
        const roomDelta = modifiers.reduce((acc, mod) => acc + (safeNumber(mod.delta, 0)), 0);
        return sum + (roomDelta * qty);
    }, 0);
    const hasReturningGuestDiscount = Math.abs(returningGuestDelta) > 0;
    
    // Tính toán điều chỉnh giá theo chính sách
    const getPolicyAdjustment = () => {
        if (!selectedRooms.length) return 0;
        let totalPolicyAdj = 0;
        for (const room of selectedRooms) {
            const qty = room.quantity || 1;
            const modifiers = (Array.isArray(room?.selectedPricingOption?.modifiers) ? room.selectedPricingOption.modifiers : [])
                .filter((modifier) => modifier?.type === 'POLICY');
            
            for (const mod of modifiers) {
                const deltaFromReason = extractDeltaFromReason(mod?.reason);
                const delta = deltaFromReason !== null
                    ? deltaFromReason
                    : (mod?.adjustmentType === 'PERCENT' || mod?.adjustmentType === 'PERCENTAGE')
                        ? (safeNumber(calculateRoomBaseUnitPrice(room), 0) * safeNumber(mod?.adjustmentValue, 0)) / 100
                        : safeNumber(mod?.adjustmentValue, 0);
                totalPolicyAdj += delta * qty;
            }
        }
        return totalPolicyAdj;
    };
    
    const policyAdjustment = getPolicyAdjustment();
    const hasPolicyAdjustment = Math.abs(policyAdjustment) > 0;
    
    const normalizedDepositAmount = Number.isFinite(Number(prepaidAmount)) ? Number(prepaidAmount) : Number.isFinite(Number(depositAmount)) ? Number(depositAmount) : subtotal;
    const normalizedBookingTotalAmount = Number.isFinite(Number(bookingTotalAmount)) ? Number(bookingTotalAmount) : subtotal;
    const safeNights = nights > 0 ? nights : 1;
    const averageBookingPerNight = normalizedBookingTotalAmount / safeNights;

    return (
        <div className="bg-white rounded-3 p-3 border custom-shadow">
            <img
                alt="Resort Room"
                className="img-fluid rounded-3 mb-3"
                src={getAbsoluteImageUrl(selectedRooms[0]?.image) || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"}
                style={{ height: '160px', width: '100%', objectFit: 'cover' }}
            />

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Booking Overview
                </p>
                <p className="fw-bold text-olive-dark mb-0 fs-6">Grand Heritage Resort</p>
            </div>

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Selected Rooms
                </p>
                {selectedRooms.length > 0 ? (
                    selectedRooms.map((room, index) => (
                        <div key={index} className="mb-1">
                            <div>
                                <p className="fw-semibold text-dark mb-0 small">{room.quantity}x {room.name}</p>
                                {room.selectedPricingOption?.mode && (
                                    <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                        Mode: {normalizeModeText(room.selectedPricingOption.mode)}
                                    </p>
                                )}
                                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                    {(room.quantity || 1)} {(room.quantity || 1) > 1 ? 'rooms' : 'room'} for selected stay
                                </p>
                                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                    {getCancellationText(room.cancellationType, room.freeCancelBeforeDays)} · {getPaymentText(room.selectedPricingOption?.cancellationPolicyType || room.paymentType)}
                                </p>
                                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                    Base: {formatCurrency(calculateRoomBaseUnitPrice(room))}
                                </p>
                                {getVisibleAppliedModifiers(room).length > 0 && (
                                    <div className="mt-1">
                                        {getVisibleAppliedModifiers(room).map((mod, modIdx) => (
                                            <p key={`${index}-mod-${modIdx}`} className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                                • {mod.name} ({normalizeModifierTypeText(mod.type)})
                                                {mod.delta !== null ? `: ${mod.delta > 0 ? '+' : ''}${formatCurrency(mod.delta)}` : ''}
                                                {mod.reason ? ` - ${normalizeReasonText(mod.reason)}` : ''}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-danger small">No rooms selected</p>
                )}
            </div>

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Stay Dates
                </p>
                <div className="d-flex align-items-center gap-2 fw-semibold text-dark small">
                    <i className="bi bi-calendar3 text-olive"></i>
                    <span>
            {formatDateDisplay(checkIn)} - {formatDateDisplay(checkOut)} ({nights} {nights > 1 ? 'Nights' : 'Night'})
          </span>
                </div>
            </div>

            <div className="pt-3 border-top mt-2">
                {selectedPolicy && (
                    <div className="mb-3 p-3 rounded-3" style={{ background: '#f4f8ef', border: '1px solid #dbe6cf' }}>
                        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                            <div>
                                <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>Selected Policy</div>
                                <div className="fw-bold text-dark">{selectedPolicy.name || 'Cancellation policy'}</div>
                                <div className="text-muted small">{normalizeModeText(selectedPolicy.type)} · {selectedPolicy.description || 'Policy applied to booking'}</div>
                            </div>
                            <div className="text-end">
                                <div className="fw-bold text-olive">{Number(selectedPolicy.prepaidRate ?? 0)}% deposit</div>
                                <div className="text-muted small">{Number(selectedPolicy.refunRate ?? 0)}% refund rate</div>
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-6">
                                <div className="text-muted small">Final amount</div>
                                <div className="fw-bold text-olive fs-6">{formatCurrency(normalizedDepositAmount)}</div>
                            </div>
                            <div className="col-6 text-end">
                                <div className="text-muted small">Difference to booking total</div>
                                <div className="fw-bold text-dark fs-6">{formatCurrency(normalizedBookingTotalAmount - normalizedDepositAmount)}</div>
                            </div>
                        </div>
                        {selectedPolicy.freeCancelBeforeDays && (
                            <div className="mt-2 p-2 rounded" style={{ background: '#fff', border: '1px solid #dbe6cf' }}>
                                <span className="text-muted small">
                                    <i className="bi bi-calendar-event me-1"></i>
                                    Free cancellation up to {selectedPolicy.freeCancelBeforeDays} day(s) before arrival
                                </span>
                            </div>
                        )}
                    </div>
                )}
                {hasReturningGuestDiscount && (
                    <div className="d-flex justify-content-between align-items-center mb-2 px-2 py-2 rounded"
                         style={{ background: '#ecfdf3', border: '1px solid #9fddb3', boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
                        <span className="fw-bold text-success">
                            <i className="bi bi-stars me-1"></i>
                            Returning Guest Discount
                        </span>
                        <span className="fw-bold text-success">
                            {returningGuestDelta > 0 ? '+' : ''}{formatCurrency(returningGuestDelta)}
                        </span>
                    </div>
                )}
                {hasPolicyAdjustment && (
                    <div className="d-flex justify-content-between align-items-center mb-2 px-2 py-2 rounded"
                         style={{ background: '#f0f4ff', border: '1px solid #b8d8ff', boxShadow: '0 2px 8px rgba(59,130,246,0.08)' }}>
                        <span className="fw-bold text-info">
                            <i className="bi bi-shield-check me-1"></i>
                            Policy Adjustment
                            {selectedPolicy && <span className="text-muted ms-1" style={{ fontSize: '11px', fontWeight: 'normal' }}>({selectedPolicy.name})</span>}
                        </span>
                        <span className={`fw-bold ${policyAdjustment > 0 ? 'text-danger' : 'text-success'}`}>
                            {policyAdjustment > 0 ? '+' : ''}{formatCurrency(policyAdjustment)}
                        </span>
                    </div>
                )}
                {(hasVisibleDiscount || hasVisibleSurcharge) && (
                    <div className="mb-2 p-2 rounded" style={{ background: '#f8fafc', border: '1px dashed #d6dde6' }}>
                        {hasVisibleDiscount && (
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-semibold text-success">
                                    <i className="bi bi-patch-check me-1"></i>
                                    Total Promotions
                                </span>
                                <span className="fw-bold text-success">-{formatCurrency(modifierSummary.totalDiscount)}</span>
                            </div>
                        )}
                        {hasVisibleSurcharge && (
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <span className="fw-semibold text-danger">
                                    <i className="bi bi-arrow-up-right-circle me-1"></i>
                                    Total Surcharges
                                </span>
                                <span className="fw-bold text-danger">+{formatCurrency(modifierSummary.totalSurcharge)}</span>
                            </div>
                        )}
                    </div>
                )}
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Base Subtotal</span>
                    <span className="text-muted">{formatCurrency(baseSubtotal)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Modifier Impact</span>
                    <span className={totalDelta < 0 ? 'text-success fw-semibold' : totalDelta > 0 ? 'text-danger fw-semibold' : 'text-muted'}>
                        {totalDelta > 0 ? '+' : ''}{formatCurrency(totalDelta)}
                    </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark">Subtotal</span>
                    <span className="fw-bold text-olive">{formatCurrency(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Booking total</span>
                    <span className="text-muted">{formatCurrency(normalizedBookingTotalAmount)}</span>
                </div>
                {normalizedDepositAmount !== normalizedBookingTotalAmount && (
                    <div className="p-2 rounded-3 mt-2 mb-2" style={{ background: '#f4f8ef', border: '1px solid #dbe6cf' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold text-olive">Prepaid amount (pay now)</span>
                            <span className="fw-bold text-olive">{formatCurrency(normalizedDepositAmount)}</span>
                        </div>
                        <small className="text-muted d-block">
                            Balance {formatCurrency(normalizedBookingTotalAmount - normalizedDepositAmount)} remaining after booking
                        </small>
                    </div>
                )}
                <div className="d-flex justify-content-between align-items-start mt-1">
                    <span className="text-muted">Avg booking / night</span>
                    <div className="text-end">
                        <div className="fw-semibold text-dark">{formatCurrency(averageBookingPerNight)}</div>
                        <small className="text-muted" style={{ fontSize: '10px' }}>
                            = Booking total / {safeNights} {safeNights > 1 ? 'nights' : 'night'}
                        </small>
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-start mt-1">
                    <span className="text-muted">Avg / room-night</span>
                    <div className="text-end">
                        <div className="fw-semibold text-dark">{formatCurrency(averageFinalPerRoomNight)}</div>
                        <small className="text-muted" style={{ fontSize: '10px' }}>
                            = Subtotal / {safeRoomNights} room-night{safeRoomNights > 1 ? 's' : ''}
                        </small>
                        <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                            Base {formatCurrency(averageBasePerRoomNight)}
                            {' · '}
                            Impact {averageDeltaPerRoomNight > 0 ? '+' : ''}{formatCurrency(averageDeltaPerRoomNight)}
                        </small>
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Final price</span>
                    <span className="fw-bold text-olive">{formatCurrency(normalizedDepositAmount)}</span>
                </div>
                <div className="mt-2">
                    <p className="text-muted small mb-1">
                        <i className="bi bi-info-circle me-1"></i>
                        {nights} {nights > 1 ? 'nights' : 'night'} stay · {totalRooms} {totalRooms > 1 ? 'rooms' : 'room'}
                    </p>
                </div>
                        <small className="text-muted" style={{ fontSize: '11px' }}>*Taxes and fees included</small>
            </div>
        </div>
    );
};

export default BookingSummary;