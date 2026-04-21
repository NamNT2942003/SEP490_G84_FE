import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Input from '@/components/ui/Input';
import bookingService from '@/features/booking/api/bookingService';
import { roomService } from '@/features/booking/api/roomService';
import { cancellationPolicyService } from '@/features/booking/api/cancellationPolicyService';
import { branchService } from '@/features/booking/api/branchService';
import { calculateRoomUnitPrice } from '@/features/booking/utils/roomPrice';
import { guest } from '@/features/guest/api/guestService';
import Swal from 'sweetalert2';
import './GuestInformation.css';
import { saveCart } from "@/utils/cartStorage";

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const HIDDEN_PRICE_MODIFIER_TYPES = new Set();

const extractDeltaFromReason = (reason) => {
    if (!reason) return null;
    const deltaRegex = new RegExp('\\[\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\]$');
    const match = String(reason).match(deltaRegex);
    if (!match) return null;
    return safeNumber(match[1], 0);
};

const getModifierDelta = (room, modifier) => {
    const fromReason = extractDeltaFromReason(modifier?.reason);
    if (fromReason !== null) return fromReason;

    const adjustmentValue = safeNumber(modifier?.adjustmentValue, 0);
    if (modifier?.adjustmentType === 'PERCENT' || modifier?.adjustmentType === 'PERCENTAGE') {
        const percentBase = safeNumber(room?.basePrice ?? room?.price ?? room?.selectedPrice, 0);
        return (percentBase * adjustmentValue) / 100;
    }
    return adjustmentValue;
};

const getPolicyDeltaFromOption = (room, option) => {
    if (!option || !Array.isArray(option?.modifiers)) return 0;
    return option.modifiers
        .filter((modifier) => modifier?.type === 'POLICY')
        .reduce((sum, modifier) => sum + getModifierDelta(room, modifier), 0);
};

const stripPolicyFromOption = (room, option) => {
    if (!option) return option;

    const policyDelta = getPolicyDeltaFromOption(room, option);
    const finalPrice = Math.max(0, safeNumber(option?.finalPrice, 0) - policyDelta);

    return {
        ...option,
        finalPrice,
        delta: Math.max(0, safeNumber(option?.delta, 0) - policyDelta),
        cancellationPolicyId: null,
        cancellationPolicyType: '',
        cancellationPolicyName: '',
        prepaidRate: 0,
        refunRate: 0,
        modifiers: Array.isArray(option?.modifiers)
            ? option.modifiers.filter((modifier) => modifier?.type !== 'POLICY')
            : [],
    };
};

const getVisiblePriceFromOption = (room, option) => {
    const effectiveOption = option || room?.selectedPricingOption || null;
    if (!effectiveOption) return safeNumber(room?.appliedPrice ?? room?.basePrice ?? room?.price ?? 0, 0);

    // GuestInformation must display final option price including selected policy impact.
    const hiddenDelta = (Array.isArray(effectiveOption.modifiers) ? effectiveOption.modifiers : [])
        .filter((modifier) => HIDDEN_PRICE_MODIFIER_TYPES.has(modifier?.type))
        .reduce((sum, modifier) => sum + getModifierDelta(room, modifier), 0);

    const visiblePrice = safeNumber(effectiveOption.finalPrice, 0) - hiddenDelta;
    return visiblePrice > 0 ? visiblePrice : 0;
};

// calculateRoomUnitPrice được import từ utils/roomPrice.js — dùng chung với BookingSummary
// để đảm bảo giá ở footer và sidebar luôn nhất quán.

const normalizePolicyId = (policy) => policy?.id ?? policy?.policyId ?? null;

/**
 * Tính ngày hạn huỷ miễn phí: checkIn - dateRange (ngày).
 * dateRange là chuỗi số ngày (ví dụ: "3") hoặc null.
 */
const computeFreeCancelDeadline = (checkIn, dateRange) => {
    if (!checkIn || !dateRange) return null;
    const days = parseInt(dateRange, 10);
    if (!Number.isFinite(days) || days <= 0) return null;
    const dt = new Date(checkIn);
    if (isNaN(dt.getTime())) return null;
    dt.setDate(dt.getDate() - days);
    return dt;
};

const formatDeadlineDate = (dt) => {
    if (!dt) return null;
    return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const normalizePolicy = (policy) => {
    if (!policy) return null;

    return {
        ...policy,
        id: normalizePolicyId(policy),
        prepaidRate: Number(policy?.prepaidRate ?? 0),
        refunRate: Number(policy?.refunRate ?? 0),
    };
};

const optionHasPolicyModifier = (option) =>
    Array.isArray(option?.modifiers) && option.modifiers.some((modifier) => modifier?.type === 'POLICY');

const findOptionWithoutPolicyAdjustment = (room, customerEmail = "") => {
    const options = Array.isArray(room?.pricingOptions) ? room.pricingOptions : [];
    if (!options.length) return null;

    const hasValidEmail = Boolean(normalizeEmailForSearch(customerEmail));

    const nonPolicyOptions = options.filter((option) => {
        const hasPolicyId = option?.cancellationPolicyId !== null && option?.cancellationPolicyId !== undefined && `${option.cancellationPolicyId}`.trim() !== '';
        return !hasPolicyId && !optionHasPolicyModifier(option) && !(option.modifiers?.some(m => m.type === 'USER_HISTORY_DISCOUNT' && !hasValidEmail));
    });

    return nonPolicyOptions[0] || options[0] || null;
};

const findPricingOptionForPolicy = (room, policyId, customerEmail = "") => {
    const options = Array.isArray(room?.pricingOptions) ? room.pricingOptions : [];
    if (!options.length) return room?.selectedPricingOption || null;

    const hasValidEmail = Boolean(normalizeEmailForSearch(customerEmail));

    if (policyId === null || policyId === undefined || `${policyId}`.trim() === '') {
        return findOptionWithoutPolicyAdjustment(room, customerEmail);
    }

    const normalizedPolicyId = Number(policyId);
    const matchedOptions = options.filter(
        (option) => Number(option?.cancellationPolicyId) === normalizedPolicyId && optionHasPolicyModifier(option) && !(option.modifiers?.some(m => m.type === 'USER_HISTORY_DISCOUNT' && !hasValidEmail))
    );
    if (matchedOptions.length > 0) return matchedOptions[0];

    // Policy not available for this room type => no policy adjustment for this room.
    return findOptionWithoutPolicyAdjustment(room, customerEmail);
};

const applyPolicySelectionToRoom = (room, policyId, customerEmail = "") => {
    const selectedOption = findPricingOptionForPolicy(room, policyId, customerEmail);
    if (!selectedOption) return room;

    const selectedPrice = getVisiblePriceFromOption(room, selectedOption);
    const hasSelectedPolicyValue = !(policyId === null || policyId === undefined || `${policyId}`.trim() === '');
    const optionPolicyId = selectedOption?.cancellationPolicyId;
    const optionMatchesSelectedPolicy = hasSelectedPolicyValue
        && optionPolicyId !== null
        && optionPolicyId !== undefined
        && Number(optionPolicyId) === Number(policyId)
        && optionHasPolicyModifier(selectedOption);

    const effectiveOption = optionMatchesSelectedPolicy
        ? selectedOption
        : stripPolicyFromOption(room, selectedOption);

    return {
        ...room,
        selectedPricingOption: effectiveOption,
        selectedPrice: Number.isFinite(selectedPrice) ? selectedPrice : 0,
        policyApplied: optionMatchesSelectedPolicy,
    };
};

const formatPolicyTypeLabel = (type) => {
    const normalized = String(type || '').trim().toUpperCase();
    switch (normalized) {
        case 'FREE_CANCEL':
            return 'Free cancellation';
        case 'PARTIAL_REFUND':
            return 'Partial refund';
        case 'NON_REFUND':
            return 'Non-refundable';
        case 'PREPAID':
            return 'Prepaid';
        case 'PAY_AT_HOTEL':
            return 'Pay at hotel';
        default:
            return normalized || 'Standard policy';
    }
};

const DETAIL_LEVEL_TYPES = new Set(['DAY_OF_WEEK', 'DATE_RANGE', 'ADVANCE_BOOKING', 'AVAILABILITY', 'POLICY', 'USER_HISTORY_DISCOUNT']);
const BOOKING_LEVEL_TYPES = new Set(['LENGTH_OF_STAY', 'OCCUPANCY']);

const uniqueIds = (items) => [...new Set((items || []).filter((v) => v !== null && v !== undefined && `${v}`.trim() !== '').map((v) => `${v}`))];

const getOptionModifiers = (room) => Array.isArray(room?.selectedPricingOption?.modifiers) ? room.selectedPricingOption.modifiers : [];

const resolveSafeFallbackModifierId = (room) => {
    const fallbackId = room?.appliedPriceModifierId;
    if (!fallbackId) return null;

    if (!room?.policyApplied) {
        // Do not carry forward legacy fallback modifier when policy is not applied
        // to this room; it may contain stale POLICY ids from previous selections.
        return null;
    }

    const optionModifiers = getOptionModifiers(room);
    if (!optionModifiers.length) return fallbackId;

    const matched = optionModifiers.find((m) => String(m?.priceModifierId) === String(fallbackId));
    if (!matched) {
        // Ignore stale fallback id that does not belong to the currently selected pricing option.
        return null;
    }

    if (!room?.policyApplied && matched?.type === 'POLICY') {
        return null;
    }

    return fallbackId;
};

const getRoomDetailModifierIds = (room) => {
    const optionDetailIds = getOptionModifiers(room)
        .filter((m) => DETAIL_LEVEL_TYPES.has(m?.type))
        .filter((m) => room?.policyApplied || m?.type !== 'POLICY')
        .map((m) => m?.priceModifierId);

    const fallbackId = resolveSafeFallbackModifierId(room);

    return uniqueIds([...optionDetailIds, fallbackId]);
};

const getRoomBookingLevelModifierIds = (room) => {
    const ids = getOptionModifiers(room)
        .filter((m) => BOOKING_LEVEL_TYPES.has(m?.type))
        .map((m) => m?.priceModifierId);
    return uniqueIds(ids);
};

const getAppliedModifierId = (room) => {
    const detailIds = getRoomDetailModifierIds(room);
    if (detailIds.length > 0) return detailIds[0];

    const bookingIds = getRoomBookingLevelModifierIds(room);
    if (bookingIds.length > 0) return bookingIds[0];

    return resolveSafeFallbackModifierId(room);
};

const normalizeEmailForSearch = (emailRaw) => {
    const email = String(emailRaw || '').trim();
    if (!email) return '';
    const emailRegex = new RegExp('.+@.+\\..+');
    return emailRegex.test(email) ? email : '';
};

const toPricingOption = (option = {}) => ({
    optionCode: option?.optionCode || option?.combinationKey || option?.mode || 'UNKNOWN',
    mode: option?.mode || 'UNKNOWN',
    basePrice: Number(option?.basePrice ?? 0),
    finalPrice: Number(option?.finalPrice ?? 0),
    delta: Number(option?.delta ?? 0),
    cancellationPolicyId: option?.cancellationPolicyId ?? null,
    cancellationPolicyType: option?.cancellationPolicyType || '',
    cancellationPolicyName: option?.cancellationPolicyName || '',
    prepaidRate: Number(option?.prepaidRate ?? 0),
    refunRate: Number(option?.refunRate ?? 0),
    modifierIds: Array.isArray(option?.modifierIds) ? option.modifierIds : [],
    modifierNames: Array.isArray(option?.modifierNames) ? option.modifierNames : [],
    reasons: Array.isArray(option?.reasons) ? option.reasons : [],
    modifiers: Array.isArray(option?.modifiers)
        ? option.modifiers.map((m) => ({
            priceModifierId: m?.priceModifierId,
            name: m?.name,
            type: m?.type,
            adjustmentType: m?.adjustmentType,
            adjustmentValue: safeNumber(m?.adjustmentValue, 0),
            reason: m?.reason,
        }))
        : [],
    combinationKey: option?.combinationKey || option?.optionCode || option?.mode || 'UNKNOWN',
});

const withPricingState = (room, customerEmail = "") => {
    const options = (Array.isArray(room?.pricingOptions) ? room.pricingOptions : [])
        .map(toPricingOption)
        .sort((a, b) => a.finalPrice - b.finalPrice);

    const hasValidEmail = Boolean(normalizeEmailForSearch(customerEmail));

    const nonPolicyOptions = options.filter((option) => {
         const hasPolicyId = option?.cancellationPolicyId !== null && option?.cancellationPolicyId !== undefined && `${option.cancellationPolicyId}`.trim() !== '';
         return !hasPolicyId && !(option.modifiers?.some(m => m.type === 'USER_HISTORY_DISCOUNT' && !hasValidEmail));
    });

    const selectedOption = nonPolicyOptions[0] || options[0] || null;

    const selectedPrice = getVisiblePriceFromOption(room, selectedOption);

    return {
        ...room,
        pricingOptions: options,
        selectedPricingOption: selectedOption,
        selectedPrice: Number.isFinite(selectedPrice) ? selectedPrice : safeNumber(room?.basePrice ?? room?.price, 0),
    };
};

const buildBookingPayload = (formData, selectedPolicyId, rooms, checkIn, checkOut, expectedTotalAmount) => {
    const bookingLevelIds = uniqueIds(
        rooms.flatMap((room) => getRoomBookingLevelModifierIds(room)),
    );
    const safePhone = (formData.phone || '').replace(new RegExp('\\s+', 'g'), '');
    const otaId = `WEB-${safePhone || 'GUEST'}-${checkIn}-${checkOut}`;

    const payload = {
        appliedPolicyId: selectedPolicyId ?? null,
        expectedTotalAmount,
        otaReservationId: otaId,
        arrivalDate: checkIn,
        departureDate: checkOut,
        rooms: rooms.map((room) => {
            const roomLevelIds = getRoomDetailModifierIds(room);
            const fallbackId = getAppliedModifierId(room);
            const allIds = uniqueIds([...roomLevelIds, fallbackId]);
            return {
                roomTypeId: room.roomTypeId,
                price: calculateRoomUnitPrice(room),
                quantity: room.quantity || 1,
                priceModifierId: allIds[0] || null,
                priceModifierIds: allIds,
            };
        }),
        bookingPriceModifierIds: bookingLevelIds,
        customer: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
        },
        specialRequests: [
            formData.estimatedArrivalTime ? `Estimated Arrival: ${formData.estimatedArrivalTime}` : '',
            formData.specialRequests || ''
        ].filter(Boolean).join(' | '),
    };

    return payload;
};

// ─── RoomItem ──────────────────────────────────────────────────────────────

const RoomItem = ({ room, onQuantityChange, onRemove, isRepricing }) => {
    const unitPrice = calculateRoomUnitPrice(room);
    const qty = room.quantity || 1;
    const maxQty = room.availableCount || 999;

    return (
        <div className="room-item shadow-sm border-0 rounded-4 overflow-hidden mb-3" style={{ background: '#fff', transition: 'all 0.3s' }}>
            <div className="room-item-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <div className="room-name fs-5 fw-bold text-dark mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {room.name}
                            <span className="text-secondary fw-normal ms-2" style={{ fontFamily: "Arial, sans-serif", fontSize: '0.95rem' }}>
                                - Max Adult: {room.maxAdult || 0} , Max children: {room.maxChildren || 0}
                            </span>
                        </div>
                        <div className="room-price fw-semibold text-secondary mb-1" style={{ fontSize: '0.95rem', transition: 'opacity 0.2s', opacity: isRepricing ? 0.45 : 1 }}>
                            {isRepricing
                                ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: '0.75rem', height: '0.75rem', borderWidth: '0.1em' }} />Updating price…</>
                                : <><i className="bi bi-currency-dollar me-1" />{new Intl.NumberFormat('vi-VN').format(unitPrice)} ₫ <span className="fw-normal">/ stay</span></>}
                        </div>
                        <div className="d-flex gap-3" />
                    </div>
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm rounded-circle p-2 lh-1"
                        onClick={() => onRemove(room.roomTypeId)}
                        title="Remove room"
                    >
                        <i className="bi bi-trash" />
                    </button>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="qty-control shadow-sm border rounded-pill d-flex align-items-center p-1 bg-white">
                        <button
                            type="button"
                            className="btn btn-sm btn-light rounded-circle"
                            onClick={() => onQuantityChange(room.roomTypeId, qty - 1)}
                            style={{ width: '32px', height: '32px', padding: 0 }}
                        >
                            <i className="bi bi-dash fw-bold" />
                        </button>
                        <input
                            type="number"
                            className="form-control border-0 text-center text-dark fw-bold px-1"
                            value={qty}
                            min="1"
                            max={maxQty}
                            onChange={(e) =>
                                onQuantityChange(room.roomTypeId, parseInt(e.target.value) || 1)
                            }
                            style={{ width: '45px', height: '32px', background: 'transparent' }}
                        />
                        <button
                            type="button"
                            className="btn btn-sm btn-light rounded-circle"
                            onClick={() => onQuantityChange(room.roomTypeId, qty + 1)}
                            disabled={qty >= maxQty}
                            style={{ width: '32px', height: '32px', padding: 0 }}
                        >
                            <i className="bi bi-plus fw-bold" />
                        </button>
                    </div>
                    <div className="room-total fs-4 fw-bold" style={{ color: '#5C6F4E', transition: 'opacity 0.2s', opacity: isRepricing ? 0.5 : 1 }}>
                        {formatVND(unitPrice * qty)}
                    </div>
                </div>
            </div>

        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────

const GuestInformation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const SEARCH_STATE_KEY = "searchRoomState";

    const {
        selectedRooms = [],
        checkIn = '',
        checkOut = '',
        searchParams = {},
        prefillEmail = '',
        branchId = 1,
    } = location.state || {};

    const [rooms, setRooms] = useState(selectedRooms);
    const [formData, setFormData] = useState({
        fullName: '',
        email: prefillEmail || '',
        phone: '',
        specialRequests: '',
        estimatedArrivalTime: '',
        appliedPolicyId: null,
    });
    const [policies, setPolicies] = useState([]);
    const [selectedPolicyId, setSelectedPolicyId] = useState(null);
    const [policyLoading, setPolicyLoading] = useState(false);
    const [hasLoadedPolicies, setHasLoadedPolicies] = useState(false);
    const [branchName, setBranchName] = useState("Loading...");
    // isRepricing = true ngay khi user thay đổi số phòng/email/policy → hiển spinner tức thì
    // trước khi API trả về (set false khi refreshRoomsByEmail xong).
    const [isRepricing, setIsRepricing] = useState(false);
    // pricingVersion tăng mỗi khi rooms được reprice → force re-render các computed values
    // dùng ref (policyPricingCacheRef) mà React không tự theo dõi.
    const [pricingVersion, setPricingVersion] = useState(0);
    // cacheRebuildSignal tăng khi cần rebuild cache policy (sau refreshRoomsByEmail).
    // Tách khỏi pricingVersion để tránh vòng lặp: rebuild → pricingVersion++ → rebuild...
    const [cacheRebuildSignal, setCacheRebuildSignal] = useState(0);
    const latestPricingRequestIdRef = useRef(0);
    const roomsRef = useRef(selectedRooms);
    const selectedPolicyIdRef = useRef(null);
    const policySnapshotRef = useRef('');
    const guestEmailRef = useRef(prefillEmail || '');
    // Cache lưu pricing options đã fetch cho từng policy: Map<policyId, Map<roomTypeId, room>>
    const policyPricingCacheRef = useRef(new Map());

    useEffect(() => {
        if (!location.state || selectedRooms.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No rooms selected',
                text: 'Please select a room before providing guest details.',
                confirmButtonColor: '#5C6F4E'
            }).then(() => {
                navigate('/search-room');
            });
        }
    }, [location.state, selectedRooms.length, navigate]);

    useEffect(() => {
        if (!branchId) return;
        (async () => {
            try {
                const data = await branchService.getBranchById(branchId);
                if (data && data.branchName) {
                    setBranchName(data.branchName);
                }
            } catch (e) {
                console.error("Failed to load branch details:", e);
                setBranchName("");
            }
        })();
    }, [branchId]);

    useEffect(() => {
        roomsRef.current = rooms;
    }, [rooms]);

    useEffect(() => {
        if (!location.state) return;
        saveCart(rooms);
    }, [rooms, location.state]);

    useEffect(() => {
        selectedPolicyIdRef.current = selectedPolicyId;
    }, [selectedPolicyId]);

    useEffect(() => {
        setRooms((prev) => prev.map((room) => applyPolicySelectionToRoom(room, selectedPolicyId, guestEmailRef.current)));
    }, [selectedPolicyId]);

    const refreshPolicies = useCallback(async (silent = true) => {
        if (!branchId) return [];

        const normalizeNullablePolicyId = (value) => (value === null || value === undefined || value === '' ? null : Number(value));

        if (!silent && !hasLoadedPolicies) {
            setPolicyLoading(true);
        }
        try {
            // Dùng getActivePoliciesForDate để lọc đúng:
            //   1. Chỉ lấy policy có active = true
            //   2. Lọc theo seasonal window của ngày check-in
            // Nếu endpoint /active chưa deploy → tự fallback về client-side filter.
            const data = await cancellationPolicyService.getActivePoliciesForDate(branchId, checkIn || null);
            const normalized = (Array.isArray(data) ? data : [])
                .map(normalizePolicy)
                .filter(Boolean)
                .sort((a, b) => Number(a.id) - Number(b.id));

            const snapshot = normalized
                .map((p) => `${p.id}:${p.active}:${p.prepaidRate}:${p.refunRate}:${p.name || ''}`)
                .join('|');

            const currentSelected = selectedPolicyIdRef.current;
            const hasCurrentSelected = normalized.some((policy) => Number(policy.id) === Number(currentSelected));
            const nextSelectedPolicyId = hasCurrentSelected ? Number(currentSelected) : null;

            const normalizedNext = normalizeNullablePolicyId(nextSelectedPolicyId);

            if (snapshot !== policySnapshotRef.current) {
                setPolicies(normalized);
                policySnapshotRef.current = snapshot;
            }

            if (currentSelected && !hasCurrentSelected && !silent) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Policy Updated',
                    text: 'The selected cancellation policy was deleted or deactivated. Please choose another policy.',
                    confirmButtonColor: '#5C6F4E',
                });
            }

            selectedPolicyIdRef.current = nextSelectedPolicyId;
            setSelectedPolicyId((prev) => {
                const normalizedPrev = normalizeNullablePolicyId(prev);
                return normalizedPrev === normalizedNext ? prev : nextSelectedPolicyId;
            });
            setHasLoadedPolicies(true);
            return normalized;
        } catch (error) {
            console.error('Failed to load cancellation policies', error);
            return [];
        } finally {
            if (!silent && !hasLoadedPolicies) {
                setPolicyLoading(false);
            }
        }
    }, [branchId, checkIn, hasLoadedPolicies]);

    useEffect(() => {
        refreshPolicies(false);
    }, [refreshPolicies]);

    useEffect(() => {
        if (!branchId) return undefined;

        const intervalId = setInterval(() => {
            refreshPolicies(true);
        }, 30000);

        const handleWindowFocus = () => {
            refreshPolicies(true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshPolicies(true);
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [branchId, refreshPolicies]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            appliedPolicyId: selectedPolicyId,
        }));
    }, [selectedPolicyId]);

    const handleInputChange = (e) => {
        const { id, name, value } = e.target;
        setFormData((prev) => ({ ...prev, [id || name]: value }));
    };

    const handleQuantityChange = (roomTypeId, newQty) => {
        if (newQty <= 0) {
            handleRemoveRoom(roomTypeId);
            return;
        }
        const room = rooms.find((r) => r.roomTypeId === roomTypeId);
        if (room && newQty > (room.availableCount || 999)) {
            Swal.fire({
                icon: 'warning',
                title: 'Limit Reached',
                text: `Only ${room.availableCount} room(s) left for ${room.name}`,
                confirmButtonColor: '#5C6F4E',
            });
            return;
        }
        // Báo repricing ngay lập tức → spinner trên giá hiển thị tức thì.
        setIsRepricing(true);
        setRooms((prev) => {
            const updated = prev.map((r) => (r.roomTypeId === roomTypeId ? { ...r, quantity: newQty } : r));
            roomsRef.current = updated;
            return updated;
        });
    };

    const handleRemoveRoom = (roomTypeId) => {
        setRooms((prev) => prev.filter((r) => r.roomTypeId !== roomTypeId));
    };

    // Sync email ref mỗi khi formData.email thay đổi để refreshRoomsByEmail luôn dùng email mới nhất.
    useEffect(() => { guestEmailRef.current = formData.email; }, [formData.email]);

    const refreshRoomsByEmail = useCallback(async () => {
        const roomsSnapshot = roomsRef.current;
        if (!checkIn || !checkOut || roomsSnapshot.length === 0) return;

        const requestId = ++latestPricingRequestIdRef.current;
        const roomTypeIds = [...new Set(roomsSnapshot.map((r) => r.roomTypeId).filter(Boolean))];
        if (roomTypeIds.length === 0) { setIsRepricing(false); return; }

        const params = {
            branchId: branchId || 1,
            checkIn,
            checkOut,
            adults: Number(searchParams?.adults ?? 1),
            children: Number(searchParams?.children ?? 0),
            totalRooms: roomsSnapshot.reduce((sum, room) => sum + (Number(room?.quantity) || 1), 0),
            roomTypeIds,
            size: Math.max(roomsSnapshot.length, 10),
            page: 0,
            sortPrice: 'priceAsc',
        };

        const currentPolicyId = selectedPolicyIdRef.current;
        if (currentPolicyId !== null && currentPolicyId !== undefined) {
            params.policy = currentPolicyId;
        }

        const normalizedEmail = normalizeEmailForSearch(guestEmailRef.current);
        if (normalizedEmail) {
            params.customerEmail = normalizedEmail;
        }

        try {
            const res = await roomService.searchRooms(params);
            if (requestId !== latestPricingRequestIdRef.current) {
                return;
            }

            const latestRoomMap = new Map((res?.content || []).map((room) => [room.roomTypeId, room]));
            setRooms((prev) => prev.map((oldRoom) => {
                const latest = latestRoomMap.get(oldRoom.roomTypeId);
                if (!latest) return oldRoom;

                const merged = withPricingState(latest, guestEmailRef.current);

                return {
                    ...oldRoom,
                    ...merged,
                    quantity: oldRoom.quantity || 1,
                };
            }).map((room) => applyPolicySelectionToRoom(room, selectedPolicyIdRef.current, guestEmailRef.current)));
        } catch (error) {
            console.warn('Failed to refresh room pricing by email', error);
        } finally {
            if (requestId === latestPricingRequestIdRef.current) {
                // Xóa cache cũ ngay lập tức để computeTotalForPolicy dùng fallback
                // từ rooms state mới thay vì hiển thị giá policy cũ.
                // fetchAllPolicies sẽ rebuild cache đầy đủ trong background một chút sau.
                policyPricingCacheRef.current = new Map();
                setIsRepricing(false);
                // pricingVersion: force re-render policy cards (tính lại computeTotalForPolicy).
                setPricingVersion((v) => v + 1);
                // cacheRebuildSignal: yêu cầu fetchAllPolicies chạy lại với data mới.
                setCacheRebuildSignal((v) => v + 1);
            }
        }
    }, [branchId, checkIn, checkOut, searchParams?.adults, searchParams?.children]);
    const debounceRefreshTimeout = useRef(null);


    // Trigger re-price khi email thay đổi: báo isRepricing ngay lập tức
    useEffect(() => {
        if (!checkIn || !checkOut || roomsRef.current.length === 0) return;
        setIsRepricing(true);
        if (debounceRefreshTimeout.current) clearTimeout(debounceRefreshTimeout.current);
        debounceRefreshTimeout.current = setTimeout(() => {
            refreshRoomsByEmail();
        }, 500);
        return () => clearTimeout(debounceRefreshTimeout.current);
    }, [formData.email, checkIn, checkOut, refreshRoomsByEmail]);

    // totalRoomsInCart: dependency để trigger re-price và cache rebuild khi số phòng thay đổi.
    const totalRoomsInCart = rooms.reduce((sum, r) => sum + (Number(r?.quantity) || 1), 0);

    // Trigger re-price khi số lượng phòng thay đổi ngay lập tức
    useEffect(() => {
        if (!checkIn || !checkOut || roomsRef.current.length === 0) return;
        refreshRoomsByEmail();
    }, [totalRoomsInCart, checkIn, checkOut, refreshRoomsByEmail]);

    // Sau khi policies load, fetch pricing cho tất cả policies song song để có đủ pricingOptions.
    // Cache này giúp computeTotalForPolicy hiển thị đúng giá cuối cho mỗi card policy.
    // cacheRebuildSignal trong deps đảm bảo cache rebuild sau mỗi lần refreshRoomsByEmail
    // mà KHÔNG gây vòng lặp (vì fetchAllPolicies chỉ set policyPricingCacheRef, không set cacheRebuildSignal).
    useEffect(() => {
        if (!policies.length || !checkIn || !checkOut || roomsRef.current.length === 0) return;
        let cancelled = false;

        const fetchAllPolicies = async () => {
            const roomsSnapshot = roomsRef.current;
            const roomTypeIds = [...new Set(roomsSnapshot.map((r) => r.roomTypeId).filter(Boolean))];
            if (roomTypeIds.length === 0) return;

            const baseParams = {
                branchId: branchId || 1,
                checkIn,
                checkOut,
                adults: Number(searchParams?.adults ?? 1),
                children: Number(searchParams?.children ?? 0),
                totalRooms: totalRoomsInCart,
                roomTypeIds,
                size: Math.max(roomsSnapshot.length, 10),
                page: 0,
                sortPrice: 'priceAsc',
            };
            const normalizedEmail = normalizeEmailForSearch(guestEmailRef.current);
            if (normalizedEmail) baseParams.customerEmail = normalizedEmail;

            const newCache = new Map();

            await Promise.all(policies.map(async (policy) => {
                if (cancelled) return;
                try {
                    const res = await roomService.searchRooms({ ...baseParams, policy: policy.id });
                    if (cancelled) return;
                    const roomMap = new Map(
                        (res?.content || []).map((r) => [r.roomTypeId, r])
                    );
                    newCache.set(Number(policy.id), roomMap);
                } catch {
                    // fallback: policy giá này sẽ dùng neutral option
                }
            }));

            if (!cancelled) {
                policyPricingCacheRef.current = newCache;
                // Force re-render để policy cards đọc cache mới (không set cacheRebuildSignal).
                setPricingVersion((v) => v + 1);
            }
        };

        fetchAllPolicies();
        return () => { cancelled = true; };
    }, [policies, checkIn, checkOut, branchId, searchParams?.adults, searchParams?.children, cacheRebuildSignal, totalRoomsInCart]);

    useEffect(() => {
        if (!checkIn || !checkOut || roomsRef.current.length === 0) return;
        // Báo repricing ngay khi policy thay đổi (applyPolicySelectionToRoom chạy sync,
        // nhưng refreshRoomsByEmail cần API sau đó).
        setIsRepricing(true);
        refreshRoomsByEmail();
    }, [selectedPolicyId, checkIn, checkOut, refreshRoomsByEmail]);

    const calculateTotalPrice = () => {
        return rooms.reduce(
            (sum, room) => sum + calculateRoomUnitPrice(room) * (room.quantity || 1),
            0
        );
    };

    const normalizeMoney = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return 0;
        return Math.round(Math.max(0, n) * 100) / 100;
    };

    const selectedPolicy = policies.find((policy) => Number(policy.id) === Number(selectedPolicyId)) || null;

    // Tính tổng tiền cho 1 policy cụ thể, độc lập với policy đang chọn.
    // Ưu tiên dùng policyPricingCache (đã fetch đầy đủ L1+L2+L3) nếu có.
    // Fallback về applyPolicySelectionToRoom (dùng pricingOptions hiện tại của room).
    const computeTotalForPolicy = (policyId) => normalizeMoney(
        rooms.reduce((sum, room) => {
            const cachedRoomMap = policyPricingCacheRef.current.get(Number(policyId));
            const cachedRoom = cachedRoomMap?.get(room.roomTypeId);
            if (cachedRoom) {
                // Dùng cached room đã có đúng pricingOptions cho policy này
                const roomWithPolicy = applyPolicySelectionToRoom(
                    { ...cachedRoom, quantity: room.quantity },
                    policyId
                );
                return sum + calculateRoomUnitPrice(roomWithPolicy) * (room.quantity || 1);
            }
            // Fallback: dùng pricingOptions hiện tại (có thể không có option cho policy này)
            const roomWithPolicy = applyPolicySelectionToRoom(room, policyId);
            return sum + calculateRoomUnitPrice(roomWithPolicy) * (room.quantity || 1);
        }, 0)
    );

    // finalBookingAmount: nếu đã chọn policy → dùng computeTotalForPolicy (đồng bộ với card hiển thị)
    // Nếu chưa chọn → dùng giá trung lập từ rooms state.
    const finalBookingAmount = selectedPolicyId != null
        ? computeTotalForPolicy(selectedPolicyId)
        : normalizeMoney(calculateTotalPrice());

    // Tính deposit theo prepaidRate của policy đang chọn.
    const depositRate = selectedPolicy ? safeNumber(selectedPolicy.prepaidRate, 100) : 100;
    const depositAmount = normalizeMoney(finalBookingAmount * depositRate / 100);

    const handleContinue = async () => {
        if (!formData.fullName || !formData.email || !formData.phone) {
            Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill in all guest information.', confirmButtonColor: '#5C6F4E' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            Swal.fire({ icon: 'warning', title: 'Invalid Email', text: 'Please provide a valid email address to receive the verification code.', confirmButtonColor: '#5C6F4E' });
            return;
        }

        if (rooms.length === 0) {
            Swal.fire({ icon: 'warning', title: 'No Rooms Selected', text: 'Please select at least one room.', confirmButtonColor: '#5C6F4E' });
            return;
        }

        if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
            Swal.fire({ icon: 'warning', title: 'Invalid Date', text: 'Please select a check-out date after check-in (yyyy-MM-dd).', confirmButtonColor: '#5C6F4E' });
            return;
        }

        // Re-check latest policies before booking confirmation to avoid stale/deleted selection.
        const refreshedPolicies = await refreshPolicies(true);
        const currentPolicyId = selectedPolicyIdRef.current;
        const activeSelectedPolicy = refreshedPolicies.find((policy) => Number(policy.id) === Number(currentPolicyId));
        if (currentPolicyId && !activeSelectedPolicy) {
            Swal.fire({
                icon: 'warning',
                title: 'Policy No Longer Available',
                text: 'Selected policy was changed or removed. Please review policy selection before continuing.',
                confirmButtonColor: '#5C6F4E',
            });
            return;
        }

        const roomMissingModifier = rooms.find((room) => {
            const ids = uniqueIds([...getRoomDetailModifierIds(room), ...getRoomBookingLevelModifierIds(room), getAppliedModifierId(room)]);
            return ids.length === 0;
        });

        if (roomMissingModifier) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Pricing Selection',
                text: `Room ${roomMissingModifier.name || roomMissingModifier.roomTypeId} does not have a valid price modifier. Please re-select a pricing option.`,
                confirmButtonColor: '#5C6F4E',
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Sending Verification Code...',
                text: `Wait a moment, we are sending an OTP to ${formData.email}`,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await guest.sendBookingOtp(formData.email, formData.fullName);
            Swal.close();

            // OTP verification loop — allows retry and resend
            let otpVerified = false;
            let lastError = '';

            while (!otpVerified) {
                const { value: otpCode, dismiss } = await Swal.fire({
                    title: 'Enter Verification Code',
                    html: `
                        <p style="margin:0 0 8px;color:#555;font-size:0.92rem;">
                            An OTP has been sent to <strong>${formData.email}</strong>. It is valid for 15 minutes.
                        </p>
                        ${lastError ? `<p style="margin:0 0 8px;color:#dc2626;font-size:0.85rem;font-weight:600;"><i class="bi bi-exclamation-circle me-1"></i>${lastError}</p>` : ''}
                    `,
                    input: 'text',
                    inputPlaceholder: 'Enter 6-digit OTP',
                    inputAttributes: {
                        maxlength: '6',
                        inputmode: 'numeric',
                        pattern: '[0-9]*',
                        autocomplete: 'one-time-code',
                        style: 'text-align:center; font-size:1.4rem; letter-spacing:8px; font-weight:700;',
                    },
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonColor: '#5C6F4E',
                    confirmButtonText: 'Verify & Continue',
                    denyButtonText: '<i class="bi bi-arrow-clockwise me-1"></i>Resend Code',
                    denyButtonColor: '#6b7280',
                    cancelButtonText: 'Cancel',
                    inputValidator: (value) => {
                        if (!value || !/^\d{6}$/.test(value.trim())) {
                            return 'Please enter exactly 6 digits!';
                        }
                    },
                    didOpen: () => {
                        const input = Swal.getInput();
                        if (input) {
                            input.addEventListener('input', (e) => {
                                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            });
                        }
                    },
                    allowOutsideClick: false,
                });

                // User clicked Cancel
                if (dismiss === Swal.DismissReason.cancel) {
                    return;
                }

                // User clicked Resend Code
                if (dismiss === Swal.DismissReason.deny) {
                    try {
                        Swal.fire({
                            title: 'Resending Code...',
                            text: `Sending a new OTP to ${formData.email}`,
                            allowOutsideClick: false,
                            didOpen: () => Swal.showLoading(),
                        });
                        await guest.sendBookingOtp(formData.email, formData.fullName);
                        Swal.close();
                        lastError = '';
                    } catch (resendErr) {
                        console.error('Resend OTP error:', resendErr);
                        Swal.close();
                        lastError = 'Failed to resend code. Please try again.';
                    }
                    continue;
                }

                // User entered OTP and clicked Verify
                if (otpCode) {
                    Swal.fire({
                        title: 'Verifying...',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading(),
                    });

                    try {
                        await guest.verifyOtp(formData.email, otpCode.trim());
                        Swal.close();
                        otpVerified = true;
                    } catch (verifyErr) {
                        console.error('OTP Verification Error:', verifyErr);
                        Swal.close();
                        // Parse error message — backend may return plain string or { message: "..." }
                        const respData = verifyErr?.response?.data;
                        const msg = (typeof respData === 'string' && respData.length > 0)
                            ? respData
                            : (respData?.message || verifyErr?.friendlyMessage || verifyErr.message || 'Invalid OTP. Please try again.');
                        lastError = msg;
                        // Small delay to prevent SweetAlert race condition between close() and next fire()
                        await new Promise(r => setTimeout(r, 150));
                    }
                }
            }

            // OTP verified successfully, proceed with booking creation
            await proceedToBookingCreation();

        } catch (error) {
            console.error('OTP Flow Error:', error);
            const message = error?.response?.data?.message || typeof error?.response?.data === 'string' ? error.response.data : error?.friendlyMessage || error.message || 'OTP verification failed';
            Swal.fire({ icon: 'error', title: 'Verification Failed', text: message, confirmButtonColor: '#d33' });
        }
    };

    const proceedToBookingCreation = async () => {
        try {
            Swal.fire({
                title: 'Creating Booking...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const payload = buildBookingPayload(formData, selectedPolicyId, rooms, checkIn, checkOut, finalBookingAmount);
            const currentBranchId = branchId || 1;
            const data = await bookingService.createFromFrontend(currentBranchId, payload);
            const createdBookingId = data?.bookingId ?? data?.id;
            const backendTotalAmount = normalizeMoney(data?.totalAmount);

            Swal.close();

            if (Math.abs(backendTotalAmount - finalBookingAmount) > 0.01) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Price changed',
                    text: `Backend recalculated ${formatVND(backendTotalAmount)} but Guest Information shows ${formatVND(finalBookingAmount)}. Please review room pricing and continue again.`,
                    confirmButtonColor: '#5C6F4E',
                });
                await refreshRoomsByEmail();
                return;
            }

            const bookingTotalAmount = backendTotalAmount;
            const prepaidAmountValue = normalizeMoney(data?.prepaidAmount ?? bookingTotalAmount);

            if (!createdBookingId) {
                Swal.fire({ icon: 'error', title: 'Booking Error', text: 'Did not receive a booking ID from the server.', confirmButtonColor: '#d33' });
                return;
            }

            navigate('/payment-selection', {
                state: {
                    bookingId: createdBookingId,
                    totalAmount: bookingTotalAmount,
                    finalAmount: bookingTotalAmount,
                    bookingTotalAmount,
                    prepaidAmount: prepaidAmountValue,
                    depositAmount: prepaidAmountValue,
                    rooms,
                    checkIn,
                    checkOut,
                    branchId: currentBranchId,
                    selectedPolicy: selectedPolicy ? {
                        id: selectedPolicy.id,
                        name: selectedPolicy.name,
                        type: selectedPolicy.type,
                        prepaidRate: selectedPolicy.prepaidRate,
                        refunRate: selectedPolicy.refunRate,
                        description: selectedPolicy.description,
                    } : null,
                },
            });
        } catch (error) {
            Swal.close();
            console.error('Booking error:', error);
            const message = error?.response?.data?.message || typeof error?.response?.data === 'string' ? error.response.data : error?.friendlyMessage || error.message || 'Unable to create booking';
            Swal.fire({ icon: 'error', title: 'Booking Error', text: message, confirmButtonColor: '#d33' });
        }
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
            {/* Header */}
            <header className="bg-olive p-3 sticky-top shadow-sm" style={{ zIndex: 1030, backgroundColor: '#5C6F4E' }}>
                <div className="container d-flex align-items-center">
                    <button
                        className="btn text-white p-0 me-3 fs-5"
                        onClick={() => {
                            try {
                                const existingRaw = sessionStorage.getItem(SEARCH_STATE_KEY);
                                const existingState = existingRaw ? JSON.parse(existingRaw) : {};
                                const fallbackSearchParams = existingState?.searchParams || {
                                    checkIn,
                                    checkOut,
                                };
                                const nextSearchParams = location.state?.searchParams || fallbackSearchParams;
                                const nextFilters = {
                                    ...(existingState?.filters || {}),
                                    branchId,
                                };
                                const nextState = {
                                    ...existingState,
                                    searchParams: nextSearchParams,
                                    filters: nextFilters,
                                    customerHistoryEmail: formData.email || prefillEmail || existingState?.customerHistoryEmail || "",
                                    selectedPolicyId: null,
                                    policy: null,
                                };
                                sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(nextState));
                            } catch (err) {
                                console.warn("Failed to persist search state before back navigation", err);
                            }
                            navigate(-1);
                        }}
                    >
                        <i className="bi bi-arrow-left" />
                    </button>
                    <h5 className="mb-0 mx-auto text-white fw-semibold">
                        <i className="bi bi-person-badge me-2" />
                        Guest Information
                    </h5>
                </div>
            </header>

            {/* Content */}
            <main className="container mt-4 mb-5 pb-5">
                <div className="row g-4 pb-5">
                    {/* Left column */}
                    <div className="col-xl-7 col-lg-6">
                        {rooms.length > 0 && (
                            <div className="guest-section">
                                <h5>
                                    <i className="bi bi-door-open" />
                                    Your Rooms ({rooms.length})
                                </h5>
                                {rooms.map((room) => (
                                    <RoomItem
                                        key={room.roomTypeId}
                                        room={room}
                                        onQuantityChange={handleQuantityChange}
                                        onRemove={handleRemoveRoom}
                                        isRepricing={isRepricing}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-clipboard-person" />
                                Your Details
                            </h5>
                            <div className="row">
                                <div className="col-12">
                                    <Input
                                        id="fullName"
                                        label="Full Name"
                                        icon="bi-person"
                                        placeholder="Nguyen Van A"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Input
                                        id="email"
                                        label="Email Address"
                                        icon="bi-envelope"
                                        placeholder="example@email.com"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Input
                                        id="phone"
                                        label="Phone Number"
                                        icon="bi-telephone"
                                        placeholder="0123 456 789"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-shield-check" />
                                Cancellation Policy
                                {checkIn && (
                                    <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                                        — cho ngày check-in {checkIn}
                                    </span>
                                )}
                            </h5>

                            {!hasLoadedPolicies && policyLoading ? (
                                <div className="text-muted d-flex align-items-center gap-2">
                                    <span className="spinner-border spinner-border-sm" />
                                    Đang tải chính sách...
                                </div>
                            ) : policies.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {policies.map((policy) => {
                                        const isSelected = Number(selectedPolicyId) === Number(policy.id);
                                        const pType = String(policy.type || '').trim().toUpperCase();

                                        // Tính giá độc lập cho policy này (không bị ảnh hưởng bởi policy đang chọn)
                                        const policyTotal = computeTotalForPolicy(policy.id);
                                        const prepaidAmount = normalizeMoney(policyTotal * (safeNumber(policy.prepaidRate, 100)) / 100);
                                        const refundAmount = normalizeMoney(policyTotal * (safeNumber(policy.refunRate, 0)) / 100);

                                        // Hạn huỷ miễn phí
                                        const deadline = computeFreeCancelDeadline(checkIn, policy.dateRange);
                                        const deadlineStr = formatDeadlineDate(deadline);
                                        const today = new Date(); today.setHours(0, 0, 0, 0);
                                        const deadlineDay = deadline ? new Date(deadline) : null;
                                        if (deadlineDay) deadlineDay.setHours(0, 0, 0, 0);
                                        const isDeadlineToday = deadlineDay && deadlineDay.getTime() === today.getTime();
                                        const isDeadlinePast = deadline && !isDeadlineToday && deadline < today;

                                        // Màu theo loại
                                        const typeConfig = {
                                            FREE_CANCEL: { label: 'Miễn phí huỷ', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', badgeBg: '#dcfce7', badgeColor: '#15803d', icon: 'bi-check-circle-fill' },
                                            PARTIAL_REFUND: { label: 'Hoàn một phần', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', badgeBg: '#fef3c7', badgeColor: '#92400e', icon: 'bi-arrow-left-right' },
                                            NON_REFUND: { label: 'Không hoàn tiền', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', badgeBg: '#fee2e2', badgeColor: '#991b1b', icon: 'bi-x-circle-fill' },
                                            PAY_AT_HOTEL: { label: 'Thanh toán tại khách sạn', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', badgeBg: '#dbeafe', badgeColor: '#1e40af', icon: 'bi-building-check' },
                                        }[pType] || { label: pType || 'Chính sách chuẩn', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', badgeBg: '#f3f4f6', badgeColor: '#374151', icon: 'bi-shield' };

                                        return (
                                            <div
                                                key={policy.id}
                                                onClick={() => setSelectedPolicyId(isSelected ? null : Number(policy.id))}
                                                style={{
                                                    border: isSelected ? `2px solid ${typeConfig.color}` : '1.5px solid #e5e7eb',
                                                    borderRadius: 14,
                                                    padding: '14px 16px',
                                                    background: isSelected ? typeConfig.bg : '#fff',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.18s',
                                                    boxShadow: isSelected ? `0 0 0 3px ${typeConfig.border}40` : '0 1px 3px rgba(0,0,0,0.06)',
                                                }}
                                            >
                                                {/* Header */}
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                                        background: typeConfig.badgeBg, color: typeConfig.badgeColor,
                                                        whiteSpace: 'nowrap', flexShrink: 0,
                                                    }}>
                                                        <i className={`bi ${typeConfig.icon}`} />
                                                        {typeConfig.label}
                                                    </span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', lineHeight: 1.3 }}>
                                                            {policy.name}
                                                        </div>
                                                        {isSelected && (
                                                            <div style={{ fontSize: 11, color: typeConfig.color, fontWeight: 600, marginTop: 2 }}>
                                                                <i className="bi bi-check-circle-fill me-1" />Applied
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Radio indicator */}
                                                    <div style={{
                                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                                        border: isSelected ? `2px solid ${typeConfig.color}` : '2px solid #d1d5db',
                                                        background: isSelected ? typeConfig.color : '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                                                    </div>
                                                </div>

                                                {/* 3 key figures */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: (deadlineStr || (policy.activeTimeStart && policy.activeTimeEnd)) ? 10 : 0 }}>
                                                    {/* Prepaid */}
                                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', borderLeft: `3px solid ${typeConfig.color}` }}>
                                                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>Prepaid</div>
                                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{formatVND(prepaidAmount)}</div>
                                                        <div style={{ fontSize: 10, color: '#9ca3af' }}>{policy.prepaidRate ?? 0}% of total</div>
                                                    </div>
                                                    {/* Refund */}
                                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', borderLeft: `3px solid ${refundAmount > 0 ? '#16a34a' : '#e5e7eb'}` }}>
                                                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>Refund if cancelled</div>
                                                        <div style={{ fontSize: 15, fontWeight: 800, color: refundAmount > 0 ? '#16a34a' : '#dc2626' }}>{formatVND(refundAmount)}</div>
                                                        <div style={{ fontSize: 10, color: '#9ca3af' }}>{policy.refunRate ?? 0}% of total</div>
                                                    </div>
                                                    {/* Total booking */}
                                                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', borderLeft: `3px solid ${typeConfig.color}` }}>
                                                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>Total booking</div>
                                                        <div style={{ fontSize: 15, fontWeight: 800, color: typeConfig.color }}>{formatVND(policyTotal)}</div>
                                                        <div style={{ fontSize: 10, color: '#9ca3af' }}>incl. policy</div>
                                                    </div>
                                                </div>

                                                {/* Hạn huỷ miễn phí */}
                                                {deadline && (
                                                    isDeadlineToday ? (
                                                        <div style={{
                                                            fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                                                            background: '#fffbeb', border: '1px solid #fcd34d',
                                                            borderRadius: 8, padding: '6px 10px',
                                                            marginTop: 8, color: '#92400e',
                                                        }}>
                                                            <i className="bi bi-clock-fill" />
                                                            <span>
                                                                <strong>Cancel before 6:00 PM today</strong>
                                                                {' '}for a <strong>full refund</strong>
                                                                <span style={{ color: '#b45309', fontWeight: 400 }}>
                                                                    {' '}— free cancellation window ends tonight
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ) : isDeadlinePast ? (
                                                        <div style={{
                                                            fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                                                            background: '#fff7ed', border: '1px solid #fed7aa',
                                                            borderRadius: 8, padding: '6px 10px',
                                                            marginTop: 8, color: '#c2410c',
                                                        }}>
                                                            <i className="bi bi-exclamation-triangle-fill" />
                                                            <span>
                                                                <strong>Free cancellation expired</strong> on{' '}
                                                                <strong>{deadlineStr}</strong>
                                                                <span style={{ color: '#9a3412', fontWeight: 400 }}>
                                                                    {' '}— cancellation fees apply per policy
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                                                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                                                            borderRadius: 8, padding: '6px 10px',
                                                            marginTop: 8, color: '#15803d',
                                                        }}>
                                                            <i className="bi bi-clock-history" />
                                                            <span>
                                                                <strong>Full refund</strong> if cancelled before{' '}
                                                                <strong>{deadlineStr}</strong>
                                                                <span style={{ color: '#6b7280', fontWeight: 400 }}>
                                                                    {' '}({parseInt(policy.dateRange, 10)} days before check-in)
                                                                </span>
                                                            </span>
                                                        </div>
                                                    )
                                                )}

                                                {/* Mùa áp dụng */}
                                                {policy.activeTimeStart && policy.activeTimeEnd && (
                                                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <i className="bi bi-sun" />
                                                        Áp dụng từ{' '}
                                                        <strong style={{ color: '#374151' }}>
                                                            {policy.activeTimeStart} – {policy.activeTimeEnd}
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {selectedPolicyId && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            style={{ alignSelf: 'flex-start', fontSize: 12 }}
                                            onClick={() => setSelectedPolicyId(null)}
                                        >
                                            <i className="bi bi-x-circle me-1" />Bỏ chọn chính sách
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-muted">
                                    <i className="bi bi-info-circle me-1" />
                                    Không tìm thấy chính sách nào cho ngày check-in này. Hệ thống sẽ dùng 100% tổng tiền làm số tiền đặt cọc.
                                </div>
                            )}
                        </div>

                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-star" />
                                Special Requests (Optional)
                            </h5>
                            <textarea
                                id="specialRequests"
                                className="form-control"
                                rows="4"
                                value={formData.specialRequests}
                                onChange={handleInputChange}
                                placeholder="e.g. high floor, extra pillows, late checkout..."
                            />
                        </div>

                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-clock-history" />
                                Check-in Information
                            </h5>
                            <div className="mb-3 d-flex align-items-center gap-2 text-dark">
                                <i className="bi bi-check-circle text-success fs-5"></i>
                                <span>Your room will be ready for check-in at 14:00.</span>
                            </div>
                            <div className="mb-4 d-flex align-items-center gap-2 text-dark">
                                <i className="bi bi-person-badge text-success fs-5"></i>
                                <span>24-hour front desk - Always here to help when you need!</span>
                            </div>
                            <div className="mb-4 d-flex align-items-center gap-2 text-dark">
                                <i className="bi bi-person-badge text-success fs-5"></i>
                                <span>Please do not bring more people than the room can accommodate!</span>
                            </div>
                            <div className="mb-2 fw-medium text-dark">Add your estimated arrival time (optional)</div>
                            <select
                                id="estimatedArrivalTime"
                                name="estimatedArrivalTime"
                                className="form-select w-50"
                                value={formData.estimatedArrivalTime}
                                onChange={handleInputChange}
                            >
                                <option value="">Please choose</option>
                                <option value="14:00 - 15:00">14:00 - 15:00</option>
                                <option value="15:00 - 16:00">15:00 - 16:00</option>
                                <option value="16:00 - 17:00">16:00 - 17:00</option>
                                <option value="17:00 - 18:00">17:00 - 18:00</option>
                                <option value="18:00 - 19:00">18:00 - 19:00</option>
                                <option value="19:00 - 20:00">19:00 - 20:00</option>
                                <option value="20:00 - 21:00">20:00 - 21:00</option>
                                <option value="21:00 - 22:00">21:00 - 22:00</option>
                                <option value="22:00 - 23:00">22:00 - 23:00</option>
                                <option value="23:00 - 00:00">23:00 - 00:00</option>
                                <option value="Late (After 00:00)">Late</option>
                            </select>
                            <div className="text-muted small mt-2">Time according to Hanoi time zone</div>
                        </div>
                    </div>

                    {/* Right column – Booking Summary */}
                    <div className="col-xl-5 col-lg-6">
                        <div className="sticky-top d-none d-lg-block" style={{ top: '90px', zIndex: 10, maxHeight: 'calc(100vh - 120px)' }}>
                            <div className="pe-2 pb-5 mb-5 hide-scrollbar" style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                                <BookingSummary
                                    selectedRooms={rooms}
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    selectedPolicy={selectedPolicy}
                                    depositAmount={depositAmount}
                                    bookingTotalAmount={finalBookingAmount}
                                    branchName={branchName}
                                    policySelected={!!selectedPolicy}
                                />
                            </div>
                        </div>
                        <div className="d-lg-none mt-4">
                            <BookingSummary
                                selectedRooms={rooms}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                selectedPolicy={selectedPolicy}
                                depositAmount={depositAmount}
                                bookingTotalAmount={finalBookingAmount}
                                branchName={branchName}
                                policySelected={!!selectedPolicy}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="fixed-bottom bg-white border-top p-3 shadow-lg" style={{ zIndex: 1031 }}>
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        {selectedPolicy ? (
                            <>
                                <small className="text-muted fw-bold text-uppercase">Total</small>
                                <h4 className="mb-0 fw-bold" style={{ color: '#5C6F4E' }}>
                                    {formatVND(finalBookingAmount)}
                                </h4>
                                <div style={{ fontSize: 12, marginTop: 2 }}>
                                    <span style={{ color: '#6b7280' }}>Prepaid:</span>{' '}
                                    <strong style={{ color: '#d97706' }}>{formatVND(depositAmount)}</strong>
                                    <span style={{ color: '#9ca3af', marginLeft: 4 }}>({safeNumber(selectedPolicy.prepaidRate, 100)}%)</span>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <i className="bi bi-shield-exclamation" style={{ fontSize: 20, color: '#d97706' }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>Select a cancellation policy</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>to see your total price</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn-gold px-4 py-2 fw-bold rounded-3"
                        onClick={handleContinue}
                        disabled={rooms.length === 0}
                    >
                        Continue to payment <i className="bi bi-arrow-right ms-2" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default GuestInformation;
