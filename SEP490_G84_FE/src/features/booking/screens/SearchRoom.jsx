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

const extractAdjustmentFromReason = (reason) => {
    const text = String(reason || "");
    const bracketMatch = text.match(/\[\s*([-+]?\d+(?:[.,]\d+)?)\s*\]/);
    if (!bracketMatch) return null;

    const parsed = Number(bracketMatch[1].replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
};

const calculateModifierAdjustment = (basePrice, modifier = {}) => {
    const reasonBasedAdjustment = extractAdjustmentFromReason(modifier?.reason);
    if (reasonBasedAdjustment !== null) {
        return reasonBasedAdjustment;
    }

    const adjustmentType = String(modifier?.adjustmentType || "").toUpperCase();
    const adjustmentValue = safeNumber(modifier?.adjustmentValue, 0);

    if (adjustmentType === "PERCENT") {
        return (basePrice * adjustmentValue) / 100;
    }

    return adjustmentValue;
};

const getRoomPriceFromAvailableModifiers = (room) => {
    const basePrice = safeNumber(room?.basePrice ?? room?.price, 0);
    const modifiers = Array.isArray(room?.availablePriceModifiers) ? room.availablePriceModifiers : [];
    const totalAdjustment = modifiers.reduce(
        (sum, modifier) => sum + calculateModifierAdjustment(basePrice, modifier),
        0,
    );

    return Math.max(0, basePrice + totalAdjustment);
};

// Giá hiển thị trong SearchRoom cart/sidebar — dùng selectedPrice (đã sync với backend).
// KHÔNG dùng lockedUnitPrice: lockedUnitPrice gây chênh lệch giữa cart và GuestInformation.
const getSearchRoomPrice = (room) =>
    safeNumber(
        room?.selectedPrice
            ?? room?.selectedPricingOption?.finalPrice
            ?? getRoomPriceFromAvailableModifiers(room),
        0,
    );

// Modifier types yêu cầu dữ liệu người dùng mới có được (email hoặc policy được chọn rõ ràng).
// Những modifier này KHÔNG được tự áp dụng khi user chưa cung cấp thông tin tương ứng.
const CONTEXT_SENSITIVE_MODIFIER_TYPES = new Set(['USER_HISTORY_DISCOUNT', 'POLICY']);

// Option “trung lập”: không có modifier nào yêu cầu email/policy — dùng cho lần hiển thị đầu tiên.
const isNeutralOption = (option, customerEmail = "") => {
    if (!Array.isArray(option?.modifiers)) return true;
    const hasValidEmail = Boolean(normalizeEmailForSearch(customerEmail));
    return !option.modifiers.some((m) => {
        if (m?.type === 'POLICY') return true;
        if (m?.type === 'USER_HISTORY_DISCOUNT' && !hasValidEmail) return true;
        return false;
    });
};

const withPricingState = (room, policyId = null, customerEmail = "") => {
    if (!room) return room;

    const options = (Array.isArray(room?.pricingOptions) ? room.pricingOptions : [])
        .map(toPricingOption)
        .sort((a, b) => a.finalPrice - b.finalPrice);

    let selectedOption = null;
    const hasValidEmail = Boolean(normalizeEmailForSearch(customerEmail));

    if (policyId !== null && policyId !== undefined && String(policyId).trim() !== "") {
        // Ưu tiên cao nhất là option tương ứng với policy user chọn
        const policyOptions = options.filter(
            (opt) => Number(opt.cancellationPolicyId) === Number(policyId) && !opt.modifiers.some(m => m?.type === 'USER_HISTORY_DISCOUNT' && !hasValidEmail)
        );
        selectedOption = policyOptions[0] || null;
    }

    if (!selectedOption) {
        // Chọn option trung lập / email option tốt nhất
        const neutralOptions = options.filter(opt => isNeutralOption(opt, customerEmail));
        selectedOption = neutralOptions[0] || options[0] || null;
    }

    // Giá hiển thị: ưu tiên finalPrice của neutral option (kết quả backend engine L1+L2)
    // để đồng nhất với GuestInformation (dùng selectedPricingOption.finalPrice).
    // Fallback về availablePriceModifiers / basePrice nếu chưa có pricingOptions.
    const selectedPrice = safeNumber(
        selectedOption?.finalPrice
            ?? getRoomPriceFromAvailableModifiers(room),
        0,
    );

    return {
        ...room,
        pricingOptions: options,
        selectedPricingOption: selectedOption,
        selectedPrice: Number.isFinite(selectedPrice) ? selectedPrice : safeNumber(room?.basePrice ?? room?.price, 0),
        pricingCombinationPolicy: room?.pricingCombinationPolicy || null,
    };
};

const syncCartWithLatestRooms = (prevCart, latestRooms, policyId = null, customerEmail = "") => {
    if (!prevCart.length) return prevCart;
    const roomMap = new Map((latestRooms || []).map((room) => [room.roomTypeId, room]));
    return prevCart
        .map((cartItem) => {
            const latestRoom = roomMap.get(cartItem.roomTypeId);
            if (!latestRoom) {
                // Room này không có trong kết quả trang hiện tại (pagination/filter).
                // Giữ nguyên cart item — không xóa, không cập nhật giá.
                return cartItem;
            }
            const mergedRoom = withPricingState(latestRoom, policyId, customerEmail);
            return {
                ...cartItem,
                ...mergedRoom,
                // selectedPrice luôn được cập nhật từ kết quả mới để đồng bộ giữa cart và GuestInformation.
                selectedPrice: mergedRoom.selectedPrice,
                selectedPricingOption: mergedRoom.selectedPricingOption,
                quantity: Math.min(cartItem.quantity || 1, mergedRoom.availableCount || 999),
            };
        });
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

// ─── Main Component ────────────────────────────────────────────────────────

const SEARCH_STATE_KEY = "searchRoomState";

const SearchRoom = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
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
    const [hasRestoredSearch, setHasRestoredSearch] = useState(false);
    const [uiMessage, setUiMessage] = useState(null);
    // isPricing = true ngay khi user thực hiện hành động → hiển thị spinner tức thì trên giá
    // trước khi API trả về (sau đó set false khi API xong).
    const [isPricing, setIsPricing] = useState(false);
    const isPricingTimerRef = useRef(null);
    // searchVersion tăng mỗi khi cần trigger lại refetch (số phòng, email thay đổi).
    // Giúp quantity/email hoạt động giống hệt như date change — cùng một effect, cùng timer.
    const [searchVersion, setSearchVersion] = useState(0);
    const [customerHistoryEmail, setCustomerHistoryEmail] = useState("");
    const customerHistoryEmailRef = useRef("");
    // Ref để refreshCartPricingByEmail đọc cart data và policy ổn định mà không cần đưa
    // selectedCart/selectedPolicyId vào dependency array (tránh vòng lặp).
    const selectedCartRef = useRef([]);
    const selectedPolicyIdRef = useRef(null);
    const latestRequestIdRef = useRef(0);
    const latestCartRequestIdRef = useRef(0);
    const loadingTimerRef = useRef(null);

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
                } catch (e) { console.error("Policies error:", e); }
            })();
        }
    }, [filters.branchId]);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(SEARCH_STATE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.searchParams) setSearchParams(parsed.searchParams);
                if (parsed?.filters) setFilters((p) => ({ ...p, ...parsed.filters }));
                if (parsed?.customerHistoryEmail) setCustomerHistoryEmail(parsed.customerHistoryEmail);
                setSelectedPolicyId(parsed?.selectedPolicyId ?? null);
            }
        } catch (err) {
            console.warn("Failed to restore search state", err);
        } finally {
            setHasRestoredSearch(true);
        }
    }, []);

    useEffect(() => {
        const savedCart = getCart();
        if (savedCart && savedCart.length > 0) setSelectedCart(savedCart);
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        selectedCartRef.current = selectedCart;
        if (isInitialized) saveCart(selectedCart);
    }, [selectedCart, isInitialized]);

    useEffect(() => {
        selectedPolicyIdRef.current = selectedPolicyId;
    }, [selectedPolicyId]);

    const searchRooms = useCallback((sp) => {
        setSearchParams({ ...sp, policy: null });
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

            const cartTotalRooms = selectedCartRef.current.reduce(
                (sum, r) => sum + (Number(r?.quantity) || 1), 0
            );
            const apiParams = {
                ...searchParams,
                ...filters,
                policy: selectedPolicyId ?? null,
                totalRooms: cartTotalRooms > 0 ? cartTotalRooms : 1,
            };

            // Luôn gửi email khi có → đảm bảo room cards hiển đúng giá sau khi email modifier được apply.
            // Đọc từ ref để tránh thêm customerHistoryEmail vào useCallback deps (sẽ tạo fn mới mỗi lần gõ).
            const normalizedEmail = normalizeEmailForSearch(customerHistoryEmailRef.current);
            if (normalizedEmail) {
                apiParams.customerEmail = normalizedEmail;
            }

            const res = await roomService.searchRooms(apiParams);
            if (requestId !== latestRequestIdRef.current) return;

            const fetchedRooms = (res.content || []).map((room) => withPricingState(room, selectedPolicyId, customerHistoryEmailRef.current));
            setRooms(fetchedRooms);
            setSelectedCart((prev) => syncCartWithLatestRooms(prev, fetchedRooms, selectedPolicyId, customerHistoryEmailRef.current));
            setTotalElements(res.totalElements || 0);
            setTotalPages(res.totalPages || 0);
        } catch (err) {
            const apiError = err?.response?.data?.error;
            const message = apiError && String(apiError).includes("yyyy-MM-dd")
                ? "Date format must be yyyy-MM-dd"
                : (apiError || err.message || "Failed to search rooms");
            setError(message);
        } finally {
            if (requestId === latestRequestIdRef.current) {
                setLoading(false);
                setIsPricing(false);
            }
        }
    }, [searchParams, filters, selectedPolicyId]);

    const refreshCartPricing = useCallback(async () => {
        const currentCart = selectedCartRef.current;
        if (!searchParams || currentCart.length === 0) {
            setIsPricing(false);
            return;
        }

        const roomTypeIds = [...new Set(currentCart.map((room) => room?.roomTypeId).filter(Boolean))];
        if (roomTypeIds.length === 0) { setIsPricing(false); return; }

        const apiParams = {
            ...searchParams,
            branchId: filters.branchId,
            roomTypeIds,
            totalRooms: currentCart.reduce((sum, room) => sum + (Number(room?.quantity) || 1), 0),
            page: 0,
            size: Math.max(roomTypeIds.length, 10),
            sortPrice: filters.sortPrice,
            policy: selectedPolicyIdRef.current ?? null,
        };

        const normalizedEmail = normalizeEmailForSearch(customerHistoryEmailRef.current);
        if (normalizedEmail) {
            apiParams.customerEmail = normalizedEmail;
        }

        const currentCartRequestId = ++latestCartRequestIdRef.current;

        try {
            const res = await roomService.searchRooms(apiParams);
            if (currentCartRequestId !== latestCartRequestIdRef.current) return;
            const latestRooms = (res?.content || []).map((room) => withPricingState(room, selectedPolicyIdRef.current, customerHistoryEmailRef.current));
            setSelectedCart((prev) => syncCartWithLatestRooms(prev, latestRooms, selectedPolicyIdRef.current, customerHistoryEmailRef.current));
        } catch (err) {
            console.error("Failed to refresh cart pricing:", err);
        } finally {
            if (currentCartRequestId === latestCartRequestIdRef.current) {
                setIsPricing(false);
            }
        }
    }, [searchParams, filters.branchId, filters.sortPrice]);

    const handleFilterChange = (nf) => setFilters(p => ({ ...p, ...nf, page: 0 }));
    const handleSortChange = (e) => setFilters(p => ({ ...p, sortPrice: e.target.value, page: 0 }));
    const handlePageChange = (page) => setFilters(p => ({ ...p, page }));

    const handleBooking = (room) => {
        const roomForCart = withPricingState(room, selectedPolicyId, customerHistoryEmail);
        const currentPrice = getSearchRoomPrice(roomForCart);
        const existingIndex = selectedCart.findIndex(r => r.roomTypeId === room.roomTypeId);
        
        setIsPricing(true);
        if (existingIndex >= 0) {
            setSelectedCart(prev => {
                const updated = prev.map((r, idx) =>
                    idx === existingIndex
                        ? {
                            ...r,
                            ...roomForCart,
                            selectedPrice: currentPrice,
                            quantity: Math.min(r.quantity || 1, roomForCart.availableCount || (r.quantity || 1)),
                        }
                        : r
                );
                selectedCartRef.current = updated;
                return updated;
            });
            showUiMessage("success", `${roomForCart.name} pricing has been updated.`);
        } else {
            if (roomForCart.availableCount <= 0) {
    const debounceCartRefresh = useRef(null);
                showUiMessage("warning", `${roomForCart.name} is fully booked.`);
                setIsPricing(false);
                return;
            }
            setSelectedCart(prev => {
                const updated = [
                    ...prev,
                    {
                        ...roomForCart,
                        selectedPrice: currentPrice,
                        quantity: 1,
                    },
                ];
                selectedCartRef.current = updated;
                return updated;
            });
            showUiMessage("success", `${roomForCart.name} has been added to your selection.`);
        }
        setSearchVersion(v => v + 1);
    };

    const handleRemoveFromCart = (roomTypeId) => {
        setIsPricing(true);
        setSelectedCart(prev => {
            const updated = prev.filter(r => r.roomTypeId !== roomTypeId);
            selectedCartRef.current = updated;
            return updated;
        });
        setSearchVersion(v => v + 1);
    };

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
        // Báo hiệu repricing ngay lập tức → spinner hiển thị trước khi API bắt đầu.
        setIsPricing(true);
        setSelectedCart(prev => {
            const updated = prev.map(r => r.roomTypeId === roomTypeId ? { ...r, quantity: newQuantity } : r);
            selectedCartRef.current = updated;
            return updated;
        });
        // Tăng searchVersion → trigger refetch effect (giống hệt như khi date thay đổi).
        // Effect sẽ gọi refetchRooms() với totalRooms mới (từ selectedCartRef.current).
        setSearchVersion(v => v + 1);
    };

    const nights = calculateNights(searchParams?.checkIn, searchParams?.checkOut);
    const cartTotal = selectedCart.reduce((sum, r) => {
        const unitPrice = getSearchRoomPrice(r);
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
                searchParams,
                branchId: filters.branchId,
                totalPrice: cartTotal,
                prefillEmail: customerHistoryEmail.trim() || undefined,
                appliedPolicyId: selectedPolicyId,
                policy: selectedPolicyId ?? null,
            }
        });
    };
    const handleViewDetail = (room) => { setSelectedRoom(room); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setSelectedRoom(null); };

    useEffect(() => {
        if (!isInitialized || !hasRestoredSearch || searchParams) return;

        const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const tom = new Date(now); tom.setDate(now.getDate() + 1);
        searchRooms({ checkIn: fmtYmd(now), checkOut: fmtYmd(tom), adults: 1, children: 0 });
    }, [hasRestoredSearch, isInitialized, searchParams, searchRooms]);

    useEffect(() => {
        if (!hasRestoredSearch) return;
        const payload = {
            searchParams,
            filters,
            customerHistoryEmail,
            selectedPolicyId,
            policy: selectedPolicyId ?? null,
        };
        sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(payload));
    }, [searchParams, filters, customerHistoryEmail, selectedPolicyId, hasRestoredSearch]);

    useEffect(() => { customerHistoryEmailRef.current = customerHistoryEmail; }, [customerHistoryEmail]);

    // ─── PRIMARY FETCH EFFECT ─────────────────────────────────────────────────
    // Điều kiện trigger: filters, searchParams đổi (date/sort/branch) hoặc searchVersion tăng
    // (lượng phòng / email đổi). Tất cả hoạt động giống hệt nhau: gọi refetchRooms lập tức chữ không dùng setTimeout.
    // Liền sau refetch, gọi lại API refreshCartPricing để cập nhật chính xác giá MỌI room đang nằm trong giỏ hàng.
    const debounceEffect = useRef(null);
    useEffect(() => {
        if (!isInitialized || !searchParams) return;
        setIsPricing(true);
        let isActive = true;
        if (debounceEffect.current) clearTimeout(debounceEffect.current);
        debounceEffect.current = setTimeout(async () => {
            await refetchRooms();
            if (isActive) {
                refreshCartPricing();
            }
        }, 300);
        return () => { isActive = false; clearTimeout(debounceEffect.current); };
    }, [filters, searchParams, isInitialized, refetchRooms, refreshCartPricing, searchVersion]);

    // Email: áp dụng thay đổi và cập nhật hiển thị ngay lập tức (không chờ)
    // Dùng searchVersion để trigger Primary Fetch Effect.
    useEffect(() => {
        if (!isInitialized || !searchParams) return;
        setIsPricing(true);
        setSearchVersion(v => v + 1);
    }, [customerHistoryEmail, isInitialized, searchParams]);

    useEffect(() => {
        if (!uiMessage) return;
        const timer = setTimeout(() => setUiMessage(null), 3500);
        return () => clearTimeout(timer);
    }, [uiMessage]);

    useEffect(() => {
        if (loading) {
            if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
            loadingTimerRef.current = setTimeout(() => {
                setShowLoading(true);
            }, 250);
            return () => {
                if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
            };
        }

        if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        setShowLoading(false);
        return undefined;
    }, [loading]);

    const totalSelectedRooms = selectedCart.reduce((sum, r) => sum + (r.quantity || 1), 0);
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
                        initialSearchParams={searchParams}
                        onBranchChange={(id) => handleFilterChange({ branchId: id || undefined })}
                    />
                </div>
            </div>

            <div className="container bc-bar" style={{ position: 'relative', zIndex: 1 }}>

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
                        <div style={{ position: 'sticky', top: '90px', zIndex: 1020 }}>
                        <div className="cart-panel shadow-sm rounded-4 overflow-hidden border-0">
                            <div className="cart-header p-3 pb-0">
                                <h5 className="mb-0 fw-bold text-white">
                                    <i className="bi bi-bag-check me-2" />
                                    My Booking
                                    {isPricing && (
                                        <span className="spinner-border spinner-border-sm ms-2" role="status"
                                            style={{ width: '0.8rem', height: '0.8rem', borderWidth: '0.12em', opacity: 0.8 }} />
                                    )}
                                </h5>
                                <div className="text-white-50 small mt-1">
                                    {nights} {nights > 1 ? "nights" : "night"} stay
                                    {isPricing && <span className="ms-1" style={{ fontSize: '0.7rem', opacity: 0.75 }}>• Updating prices…</span>}
                                </div>
                            </div>

                            <div className="cart-room-list">
                                {selectedCart.length > 0 ? (
                                    selectedCart.map((room, idx) => {
                                        const roomUnitPrice = getSearchRoomPrice(room);
                                        const roomTotal = roomUnitPrice * (room.quantity || 1);
                                        return (
                                            <div key={idx} className="cart-room-item">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="cart-room-name">
                                                            <i className="bi bi-door-open me-2" style={{ color: '#5C6F4E' }} />
                                                            {room.name}
                                                        </div>
                                                        <div className="cart-room-price" style={{ transition: 'opacity 0.2s', opacity: isPricing ? 0.45 : 1 }}>
                                                            {isPricing
                                                                ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: '0.65rem', height: '0.65rem', borderWidth: '0.1em' }} />Updating…</>
                                                                : <><i className="bi bi-currency-dollar me-1" />{new Intl.NumberFormat('vi-VN').format(roomUnitPrice)}₫/stay</>}
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
                                            Loyal Guest Email
                                        </div>
                                        <input
                                            type="email"
                                            className="cart-loyalty-input"
                                            value={customerHistoryEmail}
                                            onChange={(e) => {
                                                setCustomerHistoryEmail(e.target.value);
                                                setSearchVersion(v => v + 1);
                                            }}
                                            placeholder="name@example.com"
                                        />
                                        <div className={`cart-loyalty-note ${isEmailEntered && !isEmailValid ? 'warn' : ''}`}>
                                            {isEmailEntered && !isEmailValid
                                                ? 'Please enter a valid email to check loyal guest discount.'
                                                : 'Enter guest email to auto-check loyal guest discount in real time.'}
                                        </div>
                                    </div>
                                    <div className="cart-total-section">
                                        <span className="cart-total-label"><i className="bi bi-wallet2 me-1" />Total:</span>
                                        <span className="cart-total-amount" style={{ transition: 'opacity 0.2s', opacity: isPricing ? 0.5 : 1 }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}
                                        </span>
                                    </div>
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

                        {/* Hotel Rule Box */}
                        {filters.branchId && (
                            <div 
                                className="shadow-sm rounded-4 overflow-hidden border-0 mt-3 bg-white p-3 d-flex flex-column"
                                style={{
                                    border: '1px solid #ebf2fe',
                                    backgroundColor: '#f8fcff',
                                    boxShadow: '0 4px 12px rgba(24, 119, 242, 0.08)',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/branch/${filters.branchId}/rules`)}
                                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(24, 119, 242, 0.15)' })}
                                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 4px 12px rgba(24, 119, 242, 0.08)' })}
                            >
                                <div className="d-flex align-items-center mb-2" style={{ color: '#1877F2' }}>
                                    <i className="bi bi-info-square-fill fs-5 me-2"></i>
                                    <span className="fw-bold" style={{ fontSize: '1.05rem' }}>Quy tắc chung</span>
                                </div>
                                <p className="text-secondary mb-3" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    Kiểm tra các chính sách nhận/trả phòng, vật nuôi và quy định khác của chỗ nghỉ.
                                </p>
                                <button className="btn btn-sm text-white fw-medium rounded-3" style={{ backgroundColor: '#1877F2' }}>
                                    Xem quy định chi tiết
                                </button>
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

                        <div className="results-wrap">
                            {loading && rooms.length === 0 && (
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

                            {!error && rooms.length > 0 && (
                                <div>
                                    {rooms.map((rt) => (
                                        <RoomCard
                                            key={rt.roomTypeId}
                                            room={rt}
                                            onBooking={handleBooking}
                                            onViewDetail={handleViewDetail}
                                            isPricing={isPricing}
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

                            {showLoading && rooms.length > 0 && (
                                <div className="load-overlay">
                                    <div className="spinner-border" role="status" style={{ color: '#5C6F4E', width: '1.4rem', height: '1.4rem' }}><span className="visually-hidden">Loading...</span></div>
                                    <span>Updating results...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <RoomDetailModal room={selectedRoom} show={showModal} onClose={handleCloseModal} />
        </div>
    );
};

export default SearchRoom;