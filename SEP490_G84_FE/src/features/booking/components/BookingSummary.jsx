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

const BookingSummary = ({ selectedRooms = [], checkIn, checkOut, selectedPolicy = null, branchName = '', bookingTotalAmount = 0 }) => {
    const normalizeModeText = (mode) => {
        if (!mode) return 'Standard';
        const raw = String(mode).trim();
        const lower = raw.toLowerCase();
        if (lower.includes('chính sách') || lower.includes('chinh sach') || lower.includes('policy')) return 'Policy';
        if (lower.includes('standard')) return 'Standard';
        return raw;
    };

    const normalizeReasonText = (reason) => {
        if (!reason) return '';
        let text = String(reason).replace(/\s*\[\s*-?\d+(?:\.\d+)?\s*\]$/, '').trim();
        text = text.replace(/Occupancy proxy/gi, 'Room quantity in booking');
        text = text.replace(/Customer history/gi, 'Returning guest');
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

    // Example: Mon, Apr 20, 2026
    const formatDateBig = (dateStr) => {
        if (!dateStr) return '--';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isToday = (dateStr) => {
        if (!dateStr) return false;
        return new Date().toDateString() === new Date(dateStr).toDateString();
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
    
    let totalBasePrice = 0;
    let allModifiers = [];
    let totalRooms = 0;
    let totalAdults = 0;
    let totalChildren = 0;
    
    selectedRooms.forEach(room => {
        const qty = room.quantity || 1;
        totalRooms += qty;
        totalAdults += (room.maxAdult || 0) * qty;
        totalChildren += (room.maxChildren || 0) * qty;
        totalBasePrice += calculateRoomBaseUnitPrice(room) * qty;
        
        getAppliedModifierBreakdown(room).forEach(mod => {
            // multiply delta by qty to show total discount
            const modDelta = mod.delta * qty; 
            
            // Check if we already have this modifier
            const existIdx = allModifiers.findIndex(m => m.name === mod.name && m.type === mod.type);
            if (existIdx >= 0) {
                allModifiers[existIdx].delta += modDelta;
            } else {
                allModifiers.push({ ...mod, delta: modDelta });
            }
        });
    });

    return (
        <div className="d-flex flex-column gap-2">
            {/* Card 1: Property Details */}
            <div className="bg-white rounded-3 p-3 border custom-shadow">
                <img
                    alt="Resort Room"
                    className="img-fluid rounded-3 mb-3"
                    src={getAbsoluteImageUrl(selectedRooms[0]?.image) || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"}
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"; }}
                    style={{ height: '90px', width: '100%', objectFit: 'cover' }}
                />
                <div className="d-flex align-items-center gap-1 mb-2 text-warning" style={{ fontSize: '13px' }}>
                    <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i>
                </div>
                <h5 className="fw-bold m-0" style={{ fontSize: '18px' }}>{branchName || "Hotel Property"}</h5>
                {/* Normally we'd put the real address here, falling back to a placeholder */}
                <p className="text-muted mb-2 mt-1" style={{ fontSize: '13px' }}>Location available upon confirmation</p>
                <div className="d-flex gap-3 text-dark mt-2" style={{ fontSize: '13px' }}>
                    <span><i className="bi bi-snow me-1"></i>Air conditioning</span>
                    <span><i className="bi bi-wifi me-1"></i>Free WiFi</span>
                </div>
            </div>

            {/* Card 2: Your booking details */}
            <div className="bg-white rounded-3 p-4 border custom-shadow">
                <h5 className="fw-bold mb-3" style={{ fontSize: '18px' }}>Your booking details</h5>
                
                <div className="row g-0 mb-3" style={{ fontSize: '14px' }}>
                    <div className="col-6 border-end pe-3">
                        <p className="mb-1 text-dark fw-medium">Check-in</p>
                        <div className="fw-bold mb-1" style={{ fontSize: '16px' }}>{formatDateBig(checkIn)}</div>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>From 14:00 (2:00 PM)</p>
                    </div>
                    <div className="col-6 ps-3">
                        <p className="mb-1 text-dark fw-medium">Check-out</p>
                        <div className="fw-bold mb-1" style={{ fontSize: '16px' }}>{formatDateBig(checkOut)}</div>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Until 12:00 PM</p>
                    </div>
                </div>

                {isToday(checkIn) && (
                    <div className="mb-3" style={{ color: '#d97706', fontSize: '14px', fontWeight: '600' }}>
                        <i className="bi bi-exclamation-circle me-1"></i> Check-in is today
                    </div>
                )}
                
                <hr className="my-3 text-muted" />
                
                <div className="mb-0" style={{ fontSize: '14px' }}>
                    <p className="text-dark fw-medium mb-1">You selected</p>
                    <div className="fw-bold mb-2" style={{ fontSize: '16px' }}>
                        {nights} {nights > 1 ? 'nights' : 'night'}, {totalRooms} {totalRooms > 1 ? 'rooms' : 'room'} for {totalAdults} {totalAdults > 1 ? 'adults' : 'adult'} and {totalChildren} {totalChildren > 1 ? 'children' : 'child'}
                    </div>
                    
                    {selectedRooms.length > 0 ? (
                        selectedRooms.map((room, index) => (
                            <div key={index} className="text-dark mb-1" style={{ fontSize: '15px' }}>
                                {room.quantity || 1} x {room.name}
                            </div>
                        ))
                    ) : (
                        <p className="text-danger" style={{ fontSize: '13px' }}>No rooms selected</p>
                    )}
                </div>
            </div>

            {/* Card 3: Your price summary */}
            <div className="bg-white rounded-3 border custom-shadow overflow-hidden">
                <div className="p-4">
                    <h5 className="fw-bold mb-3" style={{ fontSize: '18px' }}>Your price summary</h5>
                    
                    <div className="d-flex justify-content-between mb-2 text-dark" style={{ fontSize: '16px' }}>
                        <span>Original price</span>
                        <span>{formatCurrency(totalBasePrice)}</span>
                    </div>
                    
                    {allModifiers.map((mod, i) => (
                        <div className="d-flex justify-content-between mb-2" key={i} style={{ fontSize: '15px' }}>
                            <div className="text-dark">
                                <div>{mod.name}</div>
                                {mod.reason && <div className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>{mod.reason}</div>}
                            </div>
                            <div className="text-dark">
                                {mod.delta < 0 ? `- ${formatCurrency(Math.abs(mod.delta))}` : `+ ${formatCurrency(mod.delta)}`}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Total Section with light blue background */}
                <div className="p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ebf3ff' }}>
                    <h5 className="fw-bold m-0 text-dark" style={{ fontSize: '18px' }}>Total</h5>
                    <div className="text-end">
                        {totalBasePrice > bookingTotalAmount && (
                            <div className="text-danger text-decoration-line-through mb-1 fw-medium" style={{ fontSize: '15px' }}>
                                {formatCurrency(totalBasePrice)}
                            </div>
                        )}
                        <h3 className="fw-bold m-0 text-dark">{formatCurrency(bookingTotalAmount)}</h3>
                        <div className="text-muted mt-1" style={{ fontSize: '13px' }}>Includes taxes and fees</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;