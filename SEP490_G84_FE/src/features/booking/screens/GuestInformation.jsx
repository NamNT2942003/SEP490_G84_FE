import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Input from '@/components/ui/Input';
import bookingService from '@/features/booking/api/bookingService';
import { roomService } from '@/features/booking/api/roomService';
import { cancellationPolicyService } from '@/features/booking/api/cancellationPolicyService';
import Swal from 'sweetalert2';
import './GuestInformation.css';
import { saveCart } from "@/utils/cartStorage";

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

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

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const HIDDEN_PRICE_MODIFIER_TYPES = new Set(['POLICY', 'USER_HISTORY_DISCOUNT']);

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

const getVisiblePriceFromOption = (room, option) => {
    const effectiveOption = option || room?.selectedPricingOption || null;
    if (!effectiveOption) return safeNumber(room?.appliedPrice ?? room?.basePrice ?? room?.price ?? 0, 0);

    const hiddenDelta = (Array.isArray(effectiveOption.modifiers) ? effectiveOption.modifiers : [])
        .filter((modifier) => HIDDEN_PRICE_MODIFIER_TYPES.has(modifier?.type))
        .reduce((sum, modifier) => sum + getModifierDelta(room, modifier), 0);

    const visiblePrice = safeNumber(effectiveOption.finalPrice, 0) - hiddenDelta;
    return visiblePrice > 0 ? visiblePrice : 0;
};

const calculateRoomUnitPrice = (room) => {
    return room.policyNeutralPrice ?? room.selectedPricingOption?.finalPrice ?? room.selectedPrice ?? room.appliedPrice ?? room.basePrice ?? room.price ?? 0;
};

const normalizePolicyId = (policy) => policy?.id ?? policy?.policyId ?? null;

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

const findOptionWithoutPolicyAdjustment = (room) => {
    const options = Array.isArray(room?.pricingOptions) ? room.pricingOptions : [];
    if (!options.length) return null;

    const nonPolicyOptions = options.filter((option) => {
        const hasPolicyId = option?.cancellationPolicyId !== null && option?.cancellationPolicyId !== undefined && `${option.cancellationPolicyId}`.trim() !== '';
        return !hasPolicyId && !optionHasPolicyModifier(option);
    });

    if (!nonPolicyOptions.length) {
        return room?.selectedPricingOption || options[0] || null;
    }

    return findPreferredPricingOption(nonPolicyOptions, room?.selectedPricingOption)
        || nonPolicyOptions[0]
        || null;
};

const findPricingOptionForPolicy = (room, policyId) => {
    const options = Array.isArray(room?.pricingOptions) ? room.pricingOptions : [];
    if (!options.length) return room?.selectedPricingOption || null;

    if (policyId === null || policyId === undefined || `${policyId}`.trim() === '') {
        return findOptionWithoutPolicyAdjustment(room);
    }

    const normalizedPolicyId = Number(policyId);
    const matched = options.find((option) => Number(option?.cancellationPolicyId) === normalizedPolicyId);
    if (matched) return matched;

    // Policy not available for this room type => no policy adjustment for this room.
    return findOptionWithoutPolicyAdjustment(room);
};

const applyPolicySelectionToRoom = (room, policyId) => {
    const selectedOption = findPricingOptionForPolicy(room, policyId);
    if (!selectedOption) return room;

    const selectedPrice = getVisiblePriceFromOption(room, selectedOption);
    const policyDelta = getPolicyDeltaFromOption(room, selectedOption);
    const selectedOptionFinal = safeNumber(selectedOption?.finalPrice, 0);
    const hasPolicySelected = !(policyId === null || policyId === undefined || `${policyId}`.trim() === '');
    const policyNeutralPrice = hasPolicySelected
        ? null
        : Math.max(0, selectedOptionFinal - policyDelta);

    return {
        ...room,
        selectedPricingOption: selectedOption,
        selectedPrice: Number.isFinite(selectedPrice) ? selectedPrice : 0,
        policyApplied: hasPolicySelected,
        policyNeutralPrice,
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

const DETAIL_LEVEL_TYPES = new Set(['DAY_OF_WEEK', 'DATE_RANGE', 'ADVANCE_BOOKING', 'AVAILABILITY', 'POLICY']);
const BOOKING_LEVEL_TYPES = new Set(['LENGTH_OF_STAY', 'OCCUPANCY', 'USER_HISTORY_DISCOUNT']);

const uniqueIds = (items) => [...new Set((items || []).filter((v) => v !== null && v !== undefined && `${v}`.trim() !== '').map((v) => `${v}`))];

const getOptionModifiers = (room) => Array.isArray(room?.selectedPricingOption?.modifiers) ? room.selectedPricingOption.modifiers : [];

const getRoomDetailModifierIds = (room) => {
    const optionDetailIds = getOptionModifiers(room)
        .filter((m) => DETAIL_LEVEL_TYPES.has(m?.type))
        .filter((m) => room?.policyApplied || m?.type !== 'POLICY')
        .map((m) => m?.priceModifierId);

    const fallbackId = room?.appliedPriceModifierId;

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

    return room?.appliedPriceModifierId ?? null;
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

const pricingOptionSignature = (option) => {
    if (!option) return '';
    return `${option.mode || ''}-${option.finalPrice || 0}-${(option.modifierIds || []).join('_')}`;
};

const findPreferredPricingOption = (options, preferredOption) => {
    if (!preferredOption || !Array.isArray(options) || options.length === 0) return null;

    const preferredCode = preferredOption.optionCode || preferredOption.combinationKey || null;
    if (preferredCode) {
        const byCode = options.find(
            (opt) => (opt.optionCode || opt.combinationKey || null) === preferredCode,
        );
        if (byCode) return byCode;
    }

    const preferredCombinationKey = preferredOption.combinationKey || null;
    if (preferredCombinationKey) {
        const byCombinationKey = options.find((opt) => opt.combinationKey === preferredCombinationKey);
        if (byCombinationKey) return byCombinationKey;
    }

    const preferredSignature = pricingOptionSignature(preferredOption);
    if (preferredSignature) {
        const bySignature = options.find((opt) => pricingOptionSignature(opt) === preferredSignature);
        if (bySignature) return bySignature;
    }

    return null;
};

const withPricingState = (room, preferredOption = null) => {
    const options = (Array.isArray(room?.pricingOptions) ? room.pricingOptions : [])
        .map(toPricingOption)
        .sort((a, b) => a.finalPrice - b.finalPrice);

    const selectedOption = findPreferredPricingOption(options, preferredOption) || options[0] || null;

    const selectedPrice = getVisiblePriceFromOption(room, selectedOption);

    return {
        ...room,
        pricingOptions: options,
        selectedPricingOption: selectedOption,
        selectedPrice: Number.isFinite(selectedPrice) ? selectedPrice : safeNumber(room?.basePrice ?? room?.price, 0),
    };
};

const buildBookingPayload = (formData, rooms, checkIn, checkOut, expectedTotalAmount) => {
    const bookingLevelIds = uniqueIds(
        rooms.flatMap((room) => getRoomBookingLevelModifierIds(room)),
    );
    const safePhone = (formData.phone || '').replace(new RegExp('\\s+', 'g'), '');
    const otaId = `WEB-${safePhone || 'GUEST'}-${checkIn}-${checkOut}`;

    return {
        appliedPolicyId: formData.appliedPolicyId,
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
        specialRequests: formData.specialRequests,
    };
};

// ─── RoomItem ──────────────────────────────────────────────────────────────

const RoomItem = ({ room, onQuantityChange, onRemove }) => {
    const unitPrice = calculateRoomUnitPrice(room);
    const qty = room.quantity || 1;
    const maxQty = room.availableCount || 999;

    return (
        <div className="room-item shadow-sm border-0 rounded-4 overflow-hidden mb-4" style={{ background: '#fff', transition: 'all 0.3s' }}>
            <div className="room-item-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div className="room-name fs-5 fw-bold text-dark mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{room.name}</div>
                        <div className="room-price fw-semibold text-secondary mb-2" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-currency-dollar me-1"></i>{new Intl.NumberFormat('vi-VN').format(unitPrice)} ₫ <span className="fw-normal">/ stay</span>
                        </div>
                        <div className="d-flex gap-3">
                            <div className="small px-2 py-1 rounded" style={{ background: '#ebf4ff', color: '#3182ce', fontWeight: 600 }}>
                                <i className="bi bi-shield-check me-1" />
                                {getCancellationText(room.cancellationType, room.freeCancelBeforeDays)}
                            </div>
                            <div className="small px-2 py-1 rounded" style={{ background: '#e6fffa', color: '#319795', fontWeight: 600 }}>
                                <i className="bi bi-credit-card me-1" />
                                {getPaymentText(room.selectedPricingOption?.cancellationPolicyType || room.paymentType)}
                            </div>
                        </div>
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

                <div className="d-flex justify-content-between align-items-center mt-4">
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
                            className="form-control border-0 text-center text-dark fw-bold"
                            value={qty}
                            min="1"
                            max={maxQty}
                            onChange={(e) =>
                                onQuantityChange(room.roomTypeId, parseInt(e.target.value) || 1)
                            }
                            style={{ width: '50px', background: 'transparent' }}
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
                    <div className="room-total fs-4 fw-bold" style={{ color: '#5C6F4E' }}>
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
        appliedPolicyId: null,
    });
    const [policies, setPolicies] = useState([]);
    const [selectedPolicyId, setSelectedPolicyId] = useState(null);
    const [policyLoading, setPolicyLoading] = useState(false);
    const [hasLoadedPolicies, setHasLoadedPolicies] = useState(false);
    const latestPricingRequestIdRef = useRef(0);
    const roomsRef = useRef(selectedRooms);
    const selectedPolicyIdRef = useRef(null);
    const policySnapshotRef = useRef('');

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
        setRooms((prev) => prev.map((room) => applyPolicySelectionToRoom(room, selectedPolicyId)));
    }, [selectedPolicyId]);

    const refreshPolicies = useCallback(async (silent = true) => {
        if (!branchId) return [];

        const normalizeNullablePolicyId = (value) => (value === null || value === undefined || value === '' ? null : Number(value));

        if (!silent && !hasLoadedPolicies) {
            setPolicyLoading(true);
        }
        try {
            const data = await cancellationPolicyService.getPoliciesByBranch(branchId);
            const normalized = (Array.isArray(data) ? data : [])
                .map(normalizePolicy)
                .filter((policy) => policy && policy.active !== false)
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
    }, [branchId, hasLoadedPolicies]);

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
        setRooms((prev) =>
            prev.map((r) => (r.roomTypeId === roomTypeId ? { ...r, quantity: newQty } : r))
        );
    };

    const handleRemoveRoom = (roomTypeId) => {
        setRooms((prev) => prev.filter((r) => r.roomTypeId !== roomTypeId));
    };

    const refreshRoomsByEmail = useCallback(async () => {
        const roomsSnapshot = roomsRef.current;
        if (!checkIn || !checkOut || roomsSnapshot.length === 0) return;

        const requestId = ++latestPricingRequestIdRef.current;
        const roomTypeIds = [...new Set(roomsSnapshot.map((r) => r.roomTypeId).filter(Boolean))];
        if (roomTypeIds.length === 0) return;

        const params = {
            branchId: branchId || 1,
            checkIn,
            checkOut,
            adults: Number(searchParams?.adults ?? 1),
            children: Number(searchParams?.children ?? 0),
            roomTypeIds,
            size: Math.max(roomsSnapshot.length, 10),
            page: 0,
            sortPrice: 'priceAsc',
        };

        const normalizedEmail = normalizeEmailForSearch(formData.email);
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

                const merged = withPricingState(latest, oldRoom.selectedPricingOption);

                return {
                    ...oldRoom,
                    ...merged,
                    quantity: oldRoom.quantity || 1,
                };
            }).map((room) => applyPolicySelectionToRoom(room, selectedPolicyId)));
        } catch (error) {
            // Ignore transient repricing failures to avoid interrupting typing flow.
            console.warn('Failed to refresh room pricing by email', error);
        }
    }, [branchId, checkIn, checkOut, formData.email, selectedPolicyId, searchParams?.adults, searchParams?.children]);

    useEffect(() => {
        if (!checkIn || !checkOut || roomsRef.current.length === 0) return;
        const timer = setTimeout(() => {
            refreshRoomsByEmail();
        }, 350);
        return () => clearTimeout(timer);
    }, [formData.email, checkIn, checkOut, refreshRoomsByEmail]);

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
    const finalBookingAmount = normalizeMoney(calculateTotalPrice());

    const handleContinue = async () => {
        if (!formData.fullName || !formData.email || !formData.phone) {
            Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill in all guest information.', confirmButtonColor: '#5C6F4E' });
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
            const payload = buildBookingPayload(formData, rooms, checkIn, checkOut, finalBookingAmount);
            const currentBranchId = branchId || 1;
            const data = await bookingService.createFromFrontend(currentBranchId, payload);
            const createdBookingId = data?.bookingId ?? data?.id;
            const backendTotalAmount = normalizeMoney(data?.totalAmount);

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
            console.error('Booking error:', error);
            const message = error?.response?.data?.message || error?.friendlyMessage || error.message || 'Unable to create booking';
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
                                    selectedPolicyId: selectedPolicyId ?? existingState?.selectedPolicyId ?? null,
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
            <main className="container mt-4">
                <div className="row g-4">
                    {/* Left column */}
                    <div className="col-lg-8">
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
                            </h5>
                            {!hasLoadedPolicies && policyLoading ? (
                                <div className="text-muted">Loading policies...</div>
                            ) : policies.length > 0 ? (
                                <>
                                    <label className="form-label fw-semibold">Select policy</label>
                                    <select
                                        className="form-select"
                                        value={selectedPolicyId ?? ''}
                                        onChange={(e) => setSelectedPolicyId(e.target.value ? Number(e.target.value) : null)}
                                    >
                                        <option value="">Choose a policy</option>
                                        {policies.map((policy) => (
                                            <option key={policy.id} value={policy.id}>
                                                {policy.name} - {formatPolicyTypeLabel(policy.type)}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedPolicy && (
                                        <div className="policy-detail-card mt-3">
                                            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                                <div>
                                                    <div className="fw-bold text-dark">{selectedPolicy.name}</div>
                                                    <div className="text-muted small">{formatPolicyTypeLabel(selectedPolicy.type)}</div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold text-olive">{selectedPolicy.prepaidRate ?? 0}% deposit</div>
                                                    <div className="text-muted small">{selectedPolicy.refunRate ?? 0}% refund rate</div>
                                                </div>
                                            </div>
                                            {selectedPolicy.description && (
                                                <div className="mt-2 text-muted small">{selectedPolicy.description}</div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-muted">
                                    No branch policy found. The system will use the full booking amount as deposit.
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
                    </div>

                    {/* Right column – Booking Summary */}
                    <div className="col-lg-4">
                        <div className="sticky-top d-none d-lg-block" style={{ top: '90px', zIndex: 1020, maxHeight: 'calc(100vh - 120px)' }}>
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <div className="bg-white rounded-3 custom-shadow" style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                                <BookingSummary
                                    selectedRooms={rooms}
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    selectedPolicy={selectedPolicy}
                                    depositAmount={finalBookingAmount}
                                    bookingTotalAmount={finalBookingAmount}
                                />
                            </div>
                        </div>
                        <div className="d-lg-none mt-4">
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <BookingSummary
                                selectedRooms={rooms}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                selectedPolicy={selectedPolicy}
                                depositAmount={finalBookingAmount}
                                bookingTotalAmount={finalBookingAmount}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="fixed-bottom bg-white border-top p-3 shadow-lg" style={{ zIndex: 1031 }}>
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted fw-bold text-uppercase">Final price</small>
                        <h4 className="mb-0 fw-bold" style={{ color: '#5C6F4E' }}>
                            {formatVND(finalBookingAmount)}
                        </h4>
                        <div className="text-muted small mt-1">
                            All pricing adjustments are already included.
                        </div>
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
