import React from 'react';
import apiClient from '@/services/apiClient';
import { calculateDisplayedRoomPrice } from '@/features/booking/utils/roomPrice';

const getAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/api/')) {
        const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, '');
        return baseUrl + url;
    }
    return url;
};

const BookingSummary = ({ selectedRooms = [], checkIn, checkOut, selectedPolicy = null }) => {
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
        (Array.isArray(room?.selectedPricingOption?.modifiers) ? room.selectedPricingOption.modifiers : []);

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
        return calculateDisplayedRoomPrice(room);
    };

    const getAppliedModifierBreakdown = (room) => {
        const breakdown = [];

        for (const mod of getOptionModifiers(room)) {
            const deltaFromReason = extractDeltaFromReason(mod?.reason);
            const delta = deltaFromReason !== null
                ? deltaFromReason
                : (mod?.adjustmentType === 'PERCENT' || mod?.adjustmentType === 'PERCENTAGE')
                    ? (safeNumber(calculateRoomBaseUnitPrice(room), 0) * safeNumber(mod?.adjustmentValue, 0)) / 100
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


    return (
        <div className="bg-white rounded-3 p-3 border custom-shadow">
            <img
                alt="Resort Room"
                className="img-fluid rounded-3 mb-3"
                src={getAbsoluteImageUrl(selectedRooms[0]?.image) || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"}
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"; }}
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
                                    Base: {formatCurrency(calculateRoomBaseUnitPrice(room))}
                                </p>
                                {getAppliedModifierBreakdown(room).length > 0 && (
                                    <div className="mt-1">
                                        <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                            Adjustments:
                                        </p>
                                        {getAppliedModifierBreakdown(room).map((mod, modIdx) => (
                                            <p key={`${index}-mod-${modIdx}`} className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                                • {mod.name} ({normalizeModifierTypeText(mod.type)})
                                                : {mod.delta > 0 ? '+' : ''}{formatCurrency(mod.delta)}
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
            </div>
        </div>
    );
};

export default BookingSummary;