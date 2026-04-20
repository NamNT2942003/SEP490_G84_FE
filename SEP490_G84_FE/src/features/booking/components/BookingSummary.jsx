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

const BookingSummary = ({ selectedRooms = [], checkIn, checkOut, selectedPolicy = null, branchName = '' }) => {
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
        (Array.isArray(room?.availablePriceModifiers) && room.availablePriceModifiers.length > 0
            ? room.availablePriceModifiers
            : Array.isArray(room?.selectedPricingOption?.modifiers)
                ? room.selectedPricingOption.modifiers
                : []);

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
        const modifiers = getOptionModifiers(room);
        if (modifiers.length > 0) {
            const basePrice = calculateRoomBaseUnitPrice(room);
            const totalDelta = modifiers.reduce((sum, mod) => {
                const deltaFromReason = extractDeltaFromReason(mod?.reason);
                if (deltaFromReason !== null) return sum + deltaFromReason;

                const adjustmentValue = safeNumber(mod?.adjustmentValue, 0);
                if (mod?.adjustmentType === 'PERCENT' || mod?.adjustmentType === 'PERCENTAGE') {
                    return sum + ((basePrice * adjustmentValue) / 100);
                }
                return sum + adjustmentValue;
            }, 0);

            return Math.max(0, basePrice + totalDelta);
        }

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
                <p className="fw-bold text-olive-dark mb-0 fs-6">{branchName || "Loading..."}</p>
            </div>

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Selected Rooms
                </p>
                {selectedRooms.length > 0 ? (
                    selectedRooms.map((room, index) => {
                        const qty = room.quantity || 1;
                        const unitPrice = calculateRoomUnitPrice(room);
                        const roomTotal = unitPrice * qty;
                        const roomModifiers = getOptionModifiers(room);

                        return (
                        <div key={index} className="mb-2 pb-2" style={{ borderBottom: '1px dashed #e9ecef' }}>
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
                                    Max {room.maxAdult || 0} Adults, {room.maxChildren || 0} Children / room
                                </p>
                                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                    Base: {formatCurrency(calculateRoomBaseUnitPrice(room))}
                                </p>
                                {selectedPolicy && (
                                    <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                        Policy: {selectedPolicy.name || 'Selected policy'}
                                    </p>
                                )}
                                <p className="fw-semibold mb-0" style={{ fontSize: '11px', color: '#5C6F4E' }}>
                                    Current: {formatCurrency(unitPrice)} / room · Total: {formatCurrency(roomTotal)}
                                </p>
                                {roomModifiers.length > 0 && (
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
                    )})
                ) : (
                    <p className="text-danger small">No rooms selected</p>
                )}
            </div>

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Stay Dates
                </p>
                <div className="d-flex align-items-center gap-2 fw-semibold text-dark small mt-1">
                    <i className="bi bi-calendar3 text-olive"></i>
                    <span>
            {formatDateDisplay(checkIn)} - {formatDateDisplay(checkOut)} ({nights} {nights > 1 ? 'Nights' : 'Night'})
          </span>
                </div>
                <div className="mt-2 text-muted fw-medium" style={{ fontSize: '11px' }}>
                    <div><i className="bi bi-box-arrow-in-right me-1"></i> Check-in at 14:00 on {formatDateDisplay(checkIn)}</div>
                    <div className="mt-1"><i className="bi bi-box-arrow-left me-1"></i> Check-out at 12:00 on {formatDateDisplay(checkOut)}</div>
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