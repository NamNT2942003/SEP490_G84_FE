import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchForm from "./SearchForm.jsx";
import RoomCard from "./RoomCard.jsx";
import RoomDetailModal from "./RoomDetailModal.jsx";
import SmartPagination from "./SmartPagination.jsx";
import { roomService } from "../api/roomService.js";
import { branchService } from "../api/branchService.js";
import { cancellationPolicyService } from "../api/cancellationPolicyService.js";
import { getOrCreateCartId, getCart, saveCart } from "../../../utils/cartStorage.js";
import Swal from "sweetalert2";
import "./SearchRoom.css";

// ─── Helpers ───────────────────────────────────────────────────────────────

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const HIDDEN_PRICE_MODIFIER_TYPES = new Set(["POLICY", "USER_HISTORY_DISCOUNT"]);

const toPricingOption = (option = {}) => ({
    optionCode: option?.optionCode || option?.combinationKey || option?.mode || "UNKNOWN",
    mode: option?.mode || "UNKNOWN",
    basePrice: safeNumber(option?.basePrice, 0),
    finalPrice: safeNumber(option?.finalPrice, 0),
    delta: safeNumber(option?.delta, 0),
    cancellationPolicyId: option?.cancellationPolicyId ?? null,
    cancellationPolicyType: option?.cancellationPolicyType || "",
    cancellationPolicyName: option?.cancellationPolicyName || "",
    prepaidRate: safeNumber(option?.prepaidRate, 0),
    refunRate: safeNumber(option?.refunRate, 0),
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
    combinationKey: option?.combinationKey || option?.optionCode || option?.mode || "UNKNOWN",
});

const extractDeltaFromReason = (reason) => {
    if (!reason) return null;
    const deltaRegex = new RegExp("\\[\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\]$");
    const match = String(reason).match(deltaRegex);
    if (!match) return null;
    return safeNumber(match[1], 0);
};

const getModifierDelta = (room, modifier) => {
    const fromReason = extractDeltaFromReason(modifier?.reason);
    if (fromReason !== null) return fromReason;

    const adjustmentValue = safeNumber(modifier?.adjustmentValue, 0);
    if (modifier?.adjustmentType === "PERCENT" || modifier?.adjustmentType === "PERCENTAGE") {
        const percentBase = safeNumber(room?.basePrice ?? room?.price ?? room?.selectedPrice, 0);
        return (percentBase * adjustmentValue) / 100;
    }
    return adjustmentValue;
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

const pricingOptionSignature = (option) => {
    if (!option) return "";
    return `${option.mode || ""}-${option.finalPrice || 0}-${(option.modifierIds || []).join("_")}`;
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
    if (!room) return room;

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
        pricingCombinationPolicy: room?.pricingCombinationPolicy || null,
    };
};

const syncCartWithLatestRooms = (prevCart, latestRooms) => {
    if (!prevCart.length) return prevCart;
    const roomMap = new Map((latestRooms || []).map((room) => [room.roomTypeId, room]));
    return prevCart
        .map((cartItem) => {
            const latestRoom = roomMap.get(cartItem.roomTypeId);
            if (!latestRoom) return null;
            const mergedRoom = withPricingState(latestRoom, cartItem.selectedPricingOption);
            return {
                ...cartItem,
                ...mergedRoom,
                quantity: Math.min(cartItem.quantity || 1, mergedRoom.availableCount || 999),
            };
        })
        .filter(Boolean);
};

const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const normalizeEmailForSearch = (emailRaw) => {
    const email = String(emailRaw || "").trim();
    if (!email) return "";
    const emailRegex = new RegExp(".+@.+\\..+");
    return emailRegex.test(email) ? email : "";
};

const calculateUserHistoryModifierUnitDelta = (room, modifier) => {
    return getModifierDelta(room, modifier);
};

// ─── Main Component ────────────────────────────────────────────────────────

const SearchRoom = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [branches, setBranches] = useState([]);
    const [filters, setFilters] = useState({
        branchId: 1,
        sortPrice: "priceAsc",
        page: 0,
        size: 5,
    });
    const [searchParams, setSearchParams] = useState(null);
    const navigate = useNavigate();
    const [selectedCart, setSelectedCart] = useState([]);
    const [cartId] = useState(getOrCreateCartId());
    const [policies, setPolicies] = useState([]);
    const [selectedPolicyId, setSelectedPolicyId] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [uiMessage, setUiMessage] = useState(null);
    const [customerHistoryEmail, setCustomerHistoryEmail] = useState("");
    const customerHistoryEmailRef = useRef("");
    const latestRequestIdRef = useRef(0);

    const showUiMessage = (type, text) => setUiMessage({ type, text });

    useEffect(() => {
        (async () => {
            try {
                const data = await branchService.getAllBranches();
                setBranches(data);
                if (data.length > 0 && !filters.branchId) setFilters(p => ({ ...p, branchId: data[0].branchId }));
            } catch (e) { console.error("Branches error:", e); }
        })();
    }, [filters.branchId]);

    useEffect(() => {
        if (filters.branchId) {
            (async () => {
                try {
                    const data = await cancellationPolicyService.getPoliciesByBranch(filters.branchId);
                    setPolicies(data);
                    if (data.length > 0) {
                        const firstActivePolicy = data.find((policy) => policy?.active !== false) || data[0];
                        setSelectedPolicyId(firstActivePolicy?.id ?? firstActivePolicy?.policyId ?? null);
                    }
                } catch (e) { console.error("Policies error:", e); }
            })();
        }
    }, [filters.branchId]);

    useEffect(() => {
        const savedCart = getCart();
        if (savedCart && savedCart.length > 0) setSelectedCart(savedCart);
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (isInitialized) saveCart(selectedCart);
    }, [selectedCart, isInitialized]);

    const searchRooms = useCallback((sp) => {
        setSearchParams(sp);
        setFilters((p) => ({ ...p, page: 0 }));
    }, []);

    const refetchRooms = useCallback(async () => {
        if (!searchParams) return;
        const requestId = ++latestRequestIdRef.current;
        setLoading(true); setError(null);
        try {
            if (searchParams.checkIn && searchParams.checkOut && new Date(searchParams.checkOut) <= new Date(searchParams.checkIn)) {
                setError("Check-out date must be after check-in date.");
                setLoading(false); return;
            }

            const apiParams = { ...searchParams, ...filters };

            const res = await roomService.searchRooms(apiParams);
            if (requestId !== latestRequestIdRef.current) return;

            const fetchedRooms = (res.content || []).map((room) => withPricingState(room));
            setRooms(fetchedRooms);
            setSelectedCart((prev) => syncCartWithLatestRooms(prev, fetchedRooms));
            setTotalElements(res.totalElements || 0);
            setTotalPages(res.totalPages || 0);
        } catch (err) {
            const apiError = err?.response?.data?.error;
            const message = apiError && String(apiError).includes("yyyy-MM-dd")
                ? "Date format must be yyyy-MM-dd"
                : (apiError || err.message || "Failed to search rooms");
            setError(message);
        } finally {
            if (requestId === latestRequestIdRef.current) setLoading(false);
        }
    }, [searchParams, filters]);

    const refreshCartPricingByEmail = useCallback(async () => {
        if (!searchParams || selectedCart.length === 0) return;

        const roomTypeIds = [...new Set(selectedCart.map((room) => room?.roomTypeId).filter(Boolean))];
        if (roomTypeIds.length === 0) return;

        const apiParams = {
            ...searchParams,
            branchId: filters.branchId,
            roomTypeIds,
            page: 0,
            size: Math.max(roomTypeIds.length, 10),
            sortPrice: filters.sortPrice,
        };

        const normalizedEmail = normalizeEmailForSearch(customerHistoryEmailRef.current);
        if (normalizedEmail) {
            apiParams.customerEmail = normalizedEmail;
        }

        try {
            const res = await roomService.searchRooms(apiParams);
            const latestRooms = (res?.content || []).map((room) => withPricingState(room));
            setSelectedCart((prev) => syncCartWithLatestRooms(prev, latestRooms));
        } catch (err) {
            console.error("Failed to refresh cart pricing by email:", err);
        }
    }, [searchParams, filters.branchId, filters.sortPrice, selectedCart]);

    const handleFilterChange = (nf) => setFilters(p => ({ ...p, ...nf, page: 0 }));
    const handleSortChange = (e) => setFilters(p => ({ ...p, sortPrice: e.target.value, page: 0 }));
    const handlePageChange = (page) => setFilters(p => ({ ...p, page }));

    const handleBooking = (room) => {
        const roomForCart = withPricingState(room, room.selectedPricingOption);
        const existingIndex = selectedCart.findIndex(r => r.roomTypeId === room.roomTypeId);
        if (existingIndex >= 0) {
            setSelectedCart(prev => prev.map((r, idx) =>
                idx === existingIndex
                    ? { ...r, ...roomForCart, quantity: Math.min(r.quantity || 1, roomForCart.availableCount || (r.quantity || 1)) }
                    : r
            ));
            showUiMessage("success", `${roomForCart.name} pricing has been updated.`);
        } else {
            if (roomForCart.availableCount <= 0) {
                showUiMessage("warning", `${roomForCart.name} is fully booked.`);
                return;
            }
            setSelectedCart(prev => [...prev, { ...roomForCart, quantity: 1 }]);
            showUiMessage("success", `${roomForCart.name} has been added to your selection.`);
        }
    };

    const handleRemoveFromCart = (roomTypeId) => setSelectedCart(prev => prev.filter(r => r.roomTypeId !== roomTypeId));

    const handleUpdateCartQuantity = (roomTypeId, newQuantity) => {
        if (newQuantity <= 0) { handleRemoveFromCart(roomTypeId); return; }
        const roomInCart = selectedCart.find(r => r.roomTypeId === roomTypeId);
        if (roomInCart) {
            const maxAvailable = roomInCart.availableCount || 999;
            if (newQuantity > maxAvailable) {
                showUiMessage("warning", `Only ${maxAvailable} room(s) available for ${roomInCart.name}.`);
                return;
            }
        }
        setSelectedCart(prev => prev.map(r => r.roomTypeId === roomTypeId ? { ...r, quantity: newQuantity } : r));
    };

    const nights = calculateNights(searchParams?.checkIn, searchParams?.checkOut);
    const cartTotal = selectedCart.reduce((sum, r) => {
        const unitPrice = r.selectedPrice ?? r.appliedPrice ?? r.basePrice ?? r.price ?? 0;
        return sum + (unitPrice * (r.quantity || 1));
    }, 0);

    const handleCheckout = () => {
        if (selectedCart.length === 0) { showUiMessage("warning", "Please select at least one room before continuing."); return; }
        if (searchParams?.checkIn && searchParams?.checkOut && new Date(searchParams.checkOut) <= new Date(searchParams.checkIn)) {
            showUiMessage("warning", "Check-out date must be after check-in date."); return;
        }
        navigate('/guest-information', {
            state: {
                selectedRooms: selectedCart,
                checkIn: searchParams?.checkIn,
                checkOut: searchParams?.checkOut,
                branchId: filters.branchId,
                totalPrice: cartTotal,
                prefillEmail: customerHistoryEmail.trim() || undefined,
                appliedPolicyId: selectedPolicyId
            }
        });
    };
    const handleViewDetail = (room) => { setSelectedRoom(room); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setSelectedRoom(null); };

    useEffect(() => {
        const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const tom = new Date(now); tom.setDate(now.getDate() + 1);
        if (!isInitialized) {
            searchRooms({ checkIn: fmtYmd(now), checkOut: fmtYmd(tom), adults: 1, children: 0 });
            setIsInitialized(true);
        }
    }, [isInitialized, searchRooms]);

    useEffect(() => { customerHistoryEmailRef.current = customerHistoryEmail; }, [customerHistoryEmail]);

    useEffect(() => {
        if (!isInitialized || !searchParams) return;
        const timer = setTimeout(() => {
            console.log("🔄 Refetching rooms due to criteria change");
            refetchRooms();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, searchParams, isInitialized, refetchRooms]);

    useEffect(() => {
        if (!isInitialized || !searchParams || selectedCart.length === 0) return;
        const timer = setTimeout(() => {
            refreshCartPricingByEmail();
        }, 300);
        return () => clearTimeout(timer);
    }, [customerHistoryEmail, isInitialized, searchParams, selectedCart.length, refreshCartPricingByEmail]);

    useEffect(() => {
        if (!uiMessage) return;
        const timer = setTimeout(() => setUiMessage(null), 3500);
        return () => clearTimeout(timer);
    }, [uiMessage]);

    const totalSelectedRooms = selectedCart.reduce((sum, r) => sum + (r.quantity || 1), 0);
    const selectedCartHistoryModifiers = selectedCart
        .map((room) => ({
            room,
            modifier: Array.isArray(room?.selectedPricingOption?.modifiers)
                ? room.selectedPricingOption.modifiers.find((m) => m?.type === "USER_HISTORY_DISCOUNT")
                : null,
        }))
        .filter((item) => item.modifier);
    const userHistoryDiscountTotal = selectedCartHistoryModifiers.reduce((sum, item) => {
        const qty = item.room.quantity || 1;
        const unitDelta = calculateUserHistoryModifierUnitDelta(item.room, item.modifier);
        return sum + (unitDelta * qty);
    }, 0);
    const cartTotalAfterLoyalty = cartTotal + userHistoryDiscountTotal;
    const userHistoryBookingCountLabel = selectedCartHistoryModifiers.length > 0
        ? (() => {
            const reason = selectedCartHistoryModifiers[0].modifier?.reason || "";
            const countRegex = new RegExp('\\((\\d+)\\s+bookings?', 'i');
            const match = reason.match(countRegex);
            return match ? match[1] : null;
        })()
        : null;
    const hasUserHistoryDiscount = selectedCartHistoryModifiers.length > 0;
    const isEmailEntered = customerHistoryEmail.trim().length > 0;
    const isEmailValid = normalizeEmailForSearch(customerHistoryEmail).length > 0;
    const hasValidStayDates =
        Boolean(searchParams?.checkIn) &&
        Boolean(searchParams?.checkOut) &&
        new Date(searchParams.checkOut) > new Date(searchParams.checkIn);

    return (
        <div className="search-room-page">

            <div className="hero">
                <div className="container position-relative" style={{ zIndex: 2 }}>
                    <div className="hero-txt">
                        <h2><i className="bi bi-stars me-2" style={{ fontSize: '1.2rem' }}></i>Find Your Perfect Room</h2>
                        <p>Book quickly — enjoy an exceptional experience</p>
                    </div>
                    <SearchForm
                        onSearch={searchRooms}
                        loading={loading}
                        branches={branches}
                        branchId={filters.branchId}
                        onBranchChange={(id) => handleFilterChange({ branchId: id || undefined })}
                    />
                </div>
            </div>

            <div className="container bc-bar" style={{ position: 'relative', zIndex: 1 }}>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link to="/public"><i className="bi bi-house-door me-1"></i>Home</Link></li>
                        <li className="breadcrumb-item active">Search Results</li>
                    </ol>
                </nav>
                {uiMessage && (
                    <div className={`ux-msg ${uiMessage.type === "success" ? "success" : "warn"}`} role="alert" aria-live="polite">
                        <i className={`bi ${uiMessage.type === "success" ? "bi-check-circle" : "bi-exclamation-triangle"}`}></i>
                        <span>{uiMessage.text}</span>
                    </div>
                )}
            </div>

            <div className="container pb-5">
                <div className="row g-4">
                    <div className="col-lg-3 col-md-4">
                        <div className="cart-panel shadow-sm rounded-4 overflow-hidden border-0">
                            <div className="cart-header p-3 pb-0">
                                <h5 className="mb-0 fw-bold text-white"><i className="bi bi-bag-check me-2"></i>Cart</h5>
                                <div className="text-white-50 small mt-1">{nights} {nights > 1 ? "nights" : "night"} stay</div>
                            </div>

                            <div className="cart-room-list">
                                {selectedCart.length > 0 ? (
                                    selectedCart.map((room, idx) => {
                                        const roomUnitPrice = room.selectedPrice ?? room.appliedPrice ?? room.basePrice ?? room.price ?? 0;
                                        const roomTotal = roomUnitPrice * (room.quantity || 1);
                                        return (
                                            <div key={idx} className="cart-room-item">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="cart-room-name">
                                                            <i className="bi bi-door-open me-2" style={{ color: '#5C6F4E' }}></i>
                                                            {room.name}
                                                        </div>
                                                        <div className="cart-room-price">
                                                            <i className="bi bi-currency-dollar me-1"></i>{new Intl.NumberFormat('vi-VN').format(roomUnitPrice)}₫/stay
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="cart-delete-btn"
                                                        onClick={() => handleRemoveFromCart(room.roomTypeId)}
                                                        title="Remove"
                                                        type="button"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>

                                                <div className="cart-qty-control">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateCartQuantity(room.roomTypeId, (room.quantity || 1) - 1)}
                                                        title="Decrease"
                                                    >
                                                        <i className="bi bi-dash"></i>
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={room.quantity || 1}
                                                        onChange={(e) => handleUpdateCartQuantity(room.roomTypeId, parseInt(e.target.value) || 1)}
                                                        className="cart-qty-input"
                                                        min="1"
                                                        max={room.availableCount || 999}
                                                        title={`Max ${room.availableCount} available`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateCartQuantity(room.roomTypeId, (room.quantity || 1) + 1)}
                                                        title="Increase"
                                                        disabled={(room.quantity || 1) >= (room.availableCount || 999)}
                                                    >
                                                        <i className="bi bi-plus"></i>
                                                    </button>
                                                </div>

                                                <div className="cart-room-total">
                                                    <span>
                                                        <i className="bi bi-bar-chart-line me-2"></i>
                                                        {room.quantity} room(s)
                                                    </span>
                                                    <span className="cart-room-total-amount">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(roomTotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="cart-empty">
                                        <i className="bi bi-inbox"></i>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>No Rooms Yet</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Click "Book Now" to add rooms</p>
                                    </div>
                                )}
                            </div>

                            {selectedCart.length > 0 && (
                                <div className="cart-footer">
                                    <div className="cart-loyalty-box">
                                        <div className="cart-loyalty-label">
                                            <i className="bi bi-person-vcard me-1"></i>
                                            Returning Guest Email
                                        </div>
                                        <input
                                            type="email"
                                            className="cart-loyalty-input"
                                            value={customerHistoryEmail}
                                            onChange={(e) => setCustomerHistoryEmail(e.target.value)}
                                            placeholder="name@example.com"
                                        />
                                        {hasUserHistoryDiscount ? (
                                            <div className="cart-loyalty-note ok">
                                                <div>
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    Auto-applied returning guest discount
                                                    {userHistoryBookingCountLabel ? ` (${userHistoryBookingCountLabel} bookings)` : ""}.
                                                </div>
                                                <div>
                                                    Adjustment: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(userHistoryDiscountTotal)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`cart-loyalty-note ${isEmailEntered && !isEmailValid ? 'warn' : ''}`}>
                                                {isEmailEntered && !isEmailValid
                                                    ? 'Please enter a valid email to check returning guest discount.'
                                                    : 'Enter guest email to auto-check returning guest discount in real time.'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="cart-total-section">
                                        <span className="cart-total-label"><i className="bi bi-wallet2 me-1"></i>Total:</span>
                                        <span className="cart-total-amount">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotalAfterLoyalty)}
                                        </span>
                                    </div>
                                    {hasUserHistoryDiscount && (
                                        <div className="text-end mb-2" style={{ fontSize: '0.76rem', opacity: 0.9 }}>
                                            Before loyalty discount: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}
                                        </div>
                                    )}
                                    <button
                                        className="cart-continue-btn"
                                        onClick={handleCheckout}
                                        disabled={!hasValidStayDates}
                                    >
                                        <i className="bi bi-arrow-right me-2"></i>Continue to guest information
                                    </button>
                                    {!hasValidStayDates && (
                                        <p className="mb-0 mt-2" style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                                            Please re-select valid stay dates before continuing.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-lg-9 col-md-8" style={{ position: 'relative', zIndex: 0 }}>
                        <div className="res-hdr d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="res-cnt"><i className="bi bi-building me-2" style={{ color: '#5C6F4E' }}></i>Available rooms: <span>{totalElements}</span></div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted" style={{ fontSize: '.82rem' }}><i className="bi bi-sort-down me-1"></i>Sort by:</span>
                                <select className="sort-sel" value={filters.sortPrice} onChange={handleSortChange}>
                                    <option value="priceAsc">Price: low to high</option>
                                    <option value="priceDesc">Price: high to low</option>
                                </select>
                            </div>
                        </div>

                        {loading && (
                            <div className="load-st">
                                <div className="spinner-border mb-3" role="status" style={{ color: '#5C6F4E', width: '2.5rem', height: '2.5rem' }}><span className="visually-hidden">Loading...</span></div>
                                <p className="text-muted mb-0">Searching for available rooms...</p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="err-c">
                                <div className="d-flex align-items-start gap-3">
                                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.3rem', color: '#dc3545' }}></i>
                                    <div>
                                        <h6 className="mb-1 fw-bold" style={{ color: '#dc3545' }}>Unable to load rooms</h6>
                                        <p className="mb-1 text-muted" style={{ fontSize: '.9rem' }}>{error}</p>
                                        <p className="mb-0 text-muted" style={{ fontSize: '.8rem' }}>Please try again or adjust your search criteria.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && !error && rooms.length === 0 && (
                            <div className="empty-st">
                                <i className="bi bi-inbox d-block"></i>
                                <h5 className="fw-bold mb-2" style={{ color: '#333' }}>No rooms found</h5>
                                <p className="text-muted mb-3">No rooms match your search criteria.</p>
                                <p className="text-muted small mb-0"><i className="bi bi-lightbulb me-1"></i>Try changing dates, branch, or filters.</p>
                            </div>
                        )}

                        {!loading && !error && rooms.length > 0 && (
                            <div>
                                {rooms.map((rt) => (
                                    <RoomCard
                                        key={rt.roomTypeId}
                                        room={rt}
                                        onBooking={handleBooking}
                                        onViewDetail={handleViewDetail}
                                    />
                                ))}
                                <SmartPagination
                                    currentPage={filters.page}
                                    totalPages={totalPages}
                                    totalElements={totalElements}
                                    pageSize={filters.size}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <RoomDetailModal room={selectedRoom} show={showModal} onClose={handleCloseModal} />
        </div>
    );
};

export default SearchRoom;