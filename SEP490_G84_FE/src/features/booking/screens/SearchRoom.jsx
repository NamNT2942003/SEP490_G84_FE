import {useState, useEffect, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import SearchForm from "./SearchForm.jsx";
import RoomCard from "./RoomCard.jsx";
import RoomDetailModal from "./RoomDetailModal.jsx";
import SmartPagination from "./SmartPagination.jsx";
import {roomService} from "../api/roomService.js";
import {branchService} from "../api/branchService.js";

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
    const [selectedCart, setSelectedCart] = useState([]); // Giỏ hàng chọn phòng
    const [isInitialized, setIsInitialized] = useState(false);
    const [uiMessage, setUiMessage] = useState(null);

    const safeNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const toPricingOption = (option = {}) => ({
        mode: option?.mode || "UNKNOWN",
        finalPrice: safeNumber(option?.finalPrice, 0),
        delta: safeNumber(option?.delta, 0),
        modifierIds: Array.isArray(option?.modifierIds) ? option.modifierIds : [],
        modifierNames: Array.isArray(option?.modifierNames) ? option.modifierNames : [],
        reasons: Array.isArray(option?.reasons) ? option.reasons : [],
    });

    const pricingOptionSignature = (option) => {
        if (!option) return "";
        return `${option.mode || ""}-${option.finalPrice || 0}-${(option.modifierIds || []).join("_")}`;
    };

    const withPricingState = (room, preferredOption = null) => {
        if (!room) return room;

        const options = (Array.isArray(room?.pricingOptions) ? room.pricingOptions : [])
            .map(toPricingOption)
            .sort((a, b) => a.finalPrice - b.finalPrice);

        const selectedOption = options.find(
            (opt) => pricingOptionSignature(opt) === pricingOptionSignature(preferredOption),
        ) || options[0] || null;

        const selectedPrice = selectedOption?.finalPrice
            ?? safeNumber(room?.appliedPrice, NaN)
            ?? safeNumber(room?.basePrice ?? room?.price, 0);

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

        const roomMap = new Map(latestRooms.map((room) => [room.roomTypeId, room]));

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

    const showUiMessage = (type, text) => {
        setUiMessage({ type, text });
    };

    // fetch branches once
    useEffect(() => {
        (async () => {
            try {
                const data = await branchService.getAllBranches();
                setBranches(data);
                if (data.length > 0 && !filters.branchId) setFilters(p => ({ ...p, branchId: data[0].branchId }));
            } catch (e) { console.error("Branches:", e); }
        })();
    }, [filters.branchId]);


    const searchRooms = useCallback(async (sp) => {
        setLoading(true); setError(null);

        // Phát hiện đổi ngày → reset cart luôn, cập nhật ngày trên cart
        const datesChanged = searchParams
            && (sp.checkIn !== searchParams.checkIn || sp.checkOut !== searchParams.checkOut);

        setSearchParams(sp);

        // Reset cart ngay khi đổi ngày (giá & availability theo ngày mới hoàn toàn khác)
        if (datesChanged) {
            setSelectedCart([]);
        }

        try {
            if (sp.checkIn && sp.checkOut) {
                if (new Date(sp.checkOut) <= new Date(sp.checkIn)) {
                    setError("Check-out date must be after check-in date.");
                    setLoading(false); return;
                }
            }
            const params = { branchId: filters.branchId ?? 1, ...filters, ...sp };
            const res = await roomService.searchRooms(params);
            const fetchedRooms = (res.content || []).map((room) => withPricingState(room));
            setRooms(fetchedRooms);
            // Chỉ sync cart khi KHÔNG đổi ngày (sort, phân trang)
            if (!datesChanged) {
                setSelectedCart((prev) => syncCartWithLatestRooms(prev, fetchedRooms));
            }
            setTotalElements(res.totalElements || 0);
            setTotalPages(res.totalPages || 0);
        } catch (err) {
            const apiError = err?.response?.data?.error;
            const message = apiError && String(apiError).includes("yyyy-MM-dd")
                ? "Invalid date format (yyyy-MM-dd)"
                : (apiError || err.message || "Failed to search rooms");
            setError(message);
        } finally { setLoading(false); }
    }, [filters, searchParams]);

    const refetchRooms = useCallback(async () => {
        if (!searchParams) return;
        setLoading(true); setError(null);
        try {
            if (searchParams.checkIn && searchParams.checkOut && new Date(searchParams.checkOut) <= new Date(searchParams.checkIn)) {
                setError("Check-out date must be after check-in date.");
                setLoading(false); return;
            }
            const params = { branchId: filters.branchId ?? 1, ...filters, ...searchParams };
            const res = await roomService.searchRooms(params);
            const fetchedRooms = (res.content || []).map((room) => withPricingState(room));
            setRooms(fetchedRooms);
            setSelectedCart((prev) => syncCartWithLatestRooms(prev, fetchedRooms));
            setTotalElements(res.totalElements || 0);
            setTotalPages(res.totalPages || 0);
        } catch (err) {
            const apiError = err?.response?.data?.error;
            const message = apiError && String(apiError).includes("yyyy-MM-dd")
                ? "Invalid date format (yyyy-MM-dd)"
                : (apiError || err.message || "Failed to search rooms");
            setError(message);
        } finally { setLoading(false); }
    }, [searchParams, filters]);

    const handleFilterChange = (nf) => setFilters(p => ({ ...p, ...nf, page: 0 }));
    const handleSortChange = (e) => setFilters(p => ({ ...p, sortPrice: e.target.value, page: 0 }));
    const handlePageChange = (page) => setFilters(p => ({ ...p, page }));

    const handleBooking = (room) => {
        const roomForCart = withPricingState(room, room.selectedPricingOption);

        // Kiểm tra xem phòng này đã có trong cart chưa
        const existingIndex = selectedCart.findIndex(r => r.roomTypeId === room.roomTypeId);

        if (existingIndex >= 0) {
            // Nếu đã có → tăng quantity (nhưng không vượt quá availableCount)
            const currentQty = selectedCart[existingIndex].quantity || 1;
            if (currentQty >= roomForCart.availableCount) {
                showUiMessage("warning", `Only ${roomForCart.availableCount} room(s) available for ${roomForCart.name}.`);
                return;
            }
            setSelectedCart(prev => prev.map((r, idx) =>
                idx === existingIndex
                    ? {
                        ...r,
                        quantity: Math.min((r.quantity || 1) + 1, roomForCart.availableCount),
                    }
                    : r
            ));
        } else {
            // Nếu chưa → thêm vào cart với quantity = 1
            if (roomForCart.availableCount <= 0) {
                showUiMessage("warning", `${roomForCart.name} is fully booked.`);
                return;
            }
            setSelectedCart(prev => [...prev, { ...roomForCart, quantity: 1 }]);
        }

        showUiMessage("success", `${roomForCart.name} has been added to your selection.`);
    };

    const handleRemoveFromCart = (roomTypeId) => {
        setSelectedCart(prev => prev.filter(r => r.roomTypeId !== roomTypeId));
    };

    const handleUpdateCartQuantity = (roomTypeId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(roomTypeId);
            return;
        }

        // Tìm phòng trong cart để lấy availableCount
        const roomInCart = selectedCart.find(r => r.roomTypeId === roomTypeId);
        if (roomInCart) {
            const maxAvailable = roomInCart.availableCount || 999;
            if (newQuantity > maxAvailable) {
                showUiMessage("warning", `Only ${maxAvailable} room(s) available for ${roomInCart.name}.`);
                return;
            }
        }

        setSelectedCart(prev => prev.map(r =>
            r.roomTypeId === roomTypeId ? { ...r, quantity: newQuantity } : r
        ));
    };

    const handleCheckout = () => {
        if (selectedCart.length === 0) {
            showUiMessage("warning", "Please select at least one room before continuing.");
            return;
        }

        if (searchParams?.checkIn && searchParams?.checkOut && new Date(searchParams.checkOut) <= new Date(searchParams.checkIn)) {
            showUiMessage("warning", "Check-out date must be after check-in date.");
            return;
        }

        // API trả giá tổng cả kỳ lưu trú, không cần nhân nights
        const totalPrice = selectedCart.reduce((sum, room) =>
            sum + ((room.selectedPrice ?? room.appliedPrice ?? room.basePrice ?? room.price ?? 0) * (room.quantity || 1)), 0
        );

        navigate('/guest-information', {
            state: {
                selectedRooms: selectedCart,
                checkIn: searchParams?.checkIn,
                checkOut: searchParams?.checkOut,
                branchId: filters.branchId,
                totalPrice
            }
        });
    };
    const handleViewDetail = (room) => { setSelectedRoom(room); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setSelectedRoom(null); };

    useEffect(() => {
        const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const now = new Date(); now.setHours(0,0,0,0);
        const tom = new Date(now); tom.setDate(now.getDate()+1);

        // Chỉ gọi lần đầu khi component mount
        if (!isInitialized) {
            console.log("🔍 Initial search with default dates");
            searchRooms({ checkIn: fmtYmd(now), checkOut: fmtYmd(tom), adults: 1, children: 0 });
            setIsInitialized(true);
        }
    }, [isInitialized, searchRooms]);

    useEffect(() => {
        if (searchParams && isInitialized) {
            console.log("🔄 Refetch due to filter change");
            refetchRooms();
        }
    }, [filters.branchId, filters.sortPrice, filters.page, searchParams, isInitialized, refetchRooms]);

    useEffect(() => {
        if (!uiMessage) return;
        const timer = setTimeout(() => setUiMessage(null), 3500);
        return () => clearTimeout(timer);
    }, [uiMessage]);

    const nights = calculateNights(searchParams?.checkIn, searchParams?.checkOut);
    const totalSelectedRooms = selectedCart.reduce((sum, r) => sum + (r.quantity || 1), 0);
    const cartTotal = selectedCart.reduce((sum, r) => {
        const unitPrice = r.selectedPrice ?? r.appliedPrice ?? r.basePrice ?? r.price ?? 0;
        return sum + (unitPrice * (r.quantity || 1));
    }, 0);
    const hasValidStayDates =
        Boolean(searchParams?.checkIn) &&
        Boolean(searchParams?.checkOut) &&
        new Date(searchParams.checkOut) > new Date(searchParams.checkIn);

    return (
        <div style={{ background: '#f5f6f8', minHeight: '100vh' }}>
            <style>{`
                .hero{background:linear-gradient(135deg,#5C6F4E 0%,#3d4a33 100%);padding:36px 0 48px;margin-bottom:-22px;position:relative;z-index:10;overflow:visible}
                .hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:36px;background:#f5f6f8;border-radius:20px 20px 0 0;z-index:-1;pointer-events:none}
                .hero-txt{text-align:center;margin-bottom:20px;color:#fff}
                .hero-txt h2{font-weight:800;font-size:1.5rem;margin-bottom:4px}
                .hero-txt p{color:rgba(255,255,255,.7);font-size:.9rem;margin:0}
                .res-hdr{background:#fff;border-radius:14px;padding:14px 18px;box-shadow:0 2px 8px rgba(0,0,0,.04);border:1px solid #eee;margin-bottom:16px}
                .res-cnt{font-size:1rem;font-weight:700;color:#333}
                .res-cnt span{color:#5C6F4E}
                .sort-sel{border:1px solid #dee2e6;border-radius:10px;padding:7px 12px;font-size:.84rem;color:#555;background:#fafafa;cursor:pointer}
                .sort-sel:focus{border-color:#5C6F4E;box-shadow:0 0 0 3px rgba(92,111,78,.1)}
                .empty-st{background:#fff;border-radius:16px;padding:50px 30px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.04)}
                .empty-st i{font-size:3.5rem;color:#ddd;margin-bottom:12px}
                .load-st{background:#fff;border-radius:16px;padding:50px 30px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.04)}
                .err-c{background:#fff;border-radius:14px;border-left:4px solid #dc3545;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
                .bc-bar{padding:12px 0 0}
                .bc-bar .breadcrumb{margin-bottom:0;font-size:.85rem}
                .bc-bar .breadcrumb a{color:#5C6F4E;text-decoration:none;font-weight:500}
                .bc-bar .breadcrumb a:hover{text-decoration:underline}
                .ux-msg{margin-top:12px;border-radius:12px;padding:11px 14px;font-size:.88rem;font-weight:600;display:flex;align-items:center;gap:8px}
                .ux-msg.warn{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}
                .ux-msg.success{background:#ecfdf3;color:#166534;border:1px solid #b7ebc6}
                .cart-date-note{margin-top:10px;font-size:.78rem;color:rgba(255,255,255,.85);line-height:1.45}
                .cart-date-note i{margin-right:4px}
            `}</style>

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
                        <li className="breadcrumb-item"><a href="/public"><i className="bi bi-house-door me-1"></i>Home</a></li>
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
                        {/* Selected Rooms Cart Panel */}
                        <style>{`
                            .cart-panel {
                                background: linear-gradient(135deg, #5C6F4E 0%, #4a5b3f 100%);
                                color: white;
                                position: sticky;
                                top: 90px;
                                z-index: 1020;
                            }
                            .cart-header {
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                padding-bottom: 15px;
                                border-bottom: 2px solid rgba(255,255,255,0.2);
                            }
                            .cart-header i {
                                font-size: 1.4rem;
                            }
                            .cart-room-item {
                                background: rgba(255,255,255,0.95);
                                color: #333;
                                border-radius: 12px;
                                padding: 12px;
                                margin-bottom: 12px;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                            }
                            .cart-room-item:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 4px 12px rgba(0,0,0,0.12);
                            }
                            .cart-room-name {
                                font-weight: 700;
                                font-size: 0.95rem;
                                color: #5C6F4E;
                                margin-bottom: 4px;
                            }
                            .cart-room-price {
                                font-size: 0.8rem;
                                color: #666;
                                margin-bottom: 8px;
                            }
                            .cart-qty-control {
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                background: #f0f4ec;
                                border-radius: 8px;
                                padding: 4px;
                                margin-bottom: 8px;
                            }
                            .cart-qty-control button {
                                background: white;
                                border: 1px solid #ddd;
                                color: #5C6F4E;
                                width: 28px;
                                height: 28px;
                                padding: 0;
                                border-radius: 6px;
                                cursor: pointer;
                                transition: all 0.2s;
                            }
                            .cart-qty-control button:hover {
                                background: #5C6F4E;
                                color: white;
                                border-color: #5C6F4E;
                            }
                            .cart-qty-control button:disabled {
                                background: #f5f5f5;
                                color: #ccc;
                                border-color: #e5e5e5;
                                cursor: not-allowed;
                                opacity: 0.6;
                            }
                            .cart-qty-control button:disabled:hover {
                                background: #f5f5f5;
                                color: #ccc;
                                border-color: #e5e5e5;
                                transform: none;
                            }
                            .cart-qty-input {
                                width: 50px !important;
                                height: 28px !important;
                                text-align: center;
                                border: none !important;
                                background: transparent !important;
                                font-weight: 700;
                                font-size: 1.1rem !important;
                                color: #5C6F4E !important;
                                padding: 0 !important;
                                line-height: 28px !important;
                                box-shadow: none !important;
                            }
                            .cart-qty-input:focus {
                                outline: none !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                            /* Ẩn spinner arrows của input number */
                            .cart-qty-input::-webkit-outer-spin-button,
                            .cart-qty-input::-webkit-inner-spin-button {
                                -webkit-appearance: none;
                                margin: 0;
                            }
                            .cart-qty-input[type=number] {
                                -moz-appearance: textfield;
                            }
                            .cart-room-total {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding-top: 8px;
                                border-top: 1px solid #f0f0f0;
                                font-size: 0.85rem;
                                color: #666;
                            }
                            .cart-plan-box {
                                margin: 10px 0;
                                padding: 8px;
                                border: 1px solid #e8ece4;
                                border-radius: 8px;
                                background: #f8fbf6;
                            }
                            .cart-plan-label {
                                font-size: 0.72rem;
                                color: #6f7569;
                                font-weight: 700;
                                text-transform: uppercase;
                                letter-spacing: 0.3px;
                                margin-bottom: 6px;
                            }
                            .cart-plan-select {
                                width: 100%;
                                border: 1px solid #d6decd;
                                border-radius: 7px;
                                padding: 6px 8px;
                                font-size: 0.8rem;
                                background: #fff;
                                color: #333;
                            }
                            .cart-plan-note {
                                font-size: 0.75rem;
                                color: #7a8271;
                                margin-top: 6px;
                            }
                            .cart-policy {
                                margin-top: 6px;
                                font-size: 0.75rem;
                                color: #657061;
                                display: flex;
                                flex-direction: column;
                                gap: 2px;
                            }
                            .cart-room-total-amount {
                                font-weight: 700;
                                color: #5C6F4E;
                            }
                            .cart-delete-btn {
                                background: #ff4757;
                                color: white;
                                border: none;
                                width: 28px;
                                height: 28px;
                                border-radius: 6px;
                                cursor: pointer;
                                transition: all 0.2s;
                                font-size: 0.8rem;
                            }
                            .cart-delete-btn:hover {
                                background: #ff3838;
                                transform: scale(1.05);
                            }
                            .cart-empty {
                                text-align: center;
                                padding: 30px 20px;
                                color: rgba(255,255,255,0.7);
                            }
                            .cart-empty i {
                                font-size: 2.5rem;
                                opacity: 0.5;
                                display: block;
                                margin-bottom: 10px;
                            }
                            .cart-footer {
                                background: rgba(255,255,255,0.1);
                                border-top: 2px solid rgba(255,255,255,0.2);
                                padding: 15px;
                                border-radius: 0 0 12px 12px;
                                margin-top: 15px;
                            }
                            .cart-total-section {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 12px;
                                font-size: 0.9rem;
                            }
                            .cart-total-label {
                                opacity: 0.9;
                                font-weight: 600;
                            }
                            .cart-total-amount {
                                font-size: 1.3rem;
                                font-weight: 800;
                            }
                            .cart-continue-btn {
                                width: 100%;
                                background: linear-gradient(135deg, #FFD700 0%, #FFC700 100%);
                                color: #333;
                                border: none;
                                padding: 12px;
                                border-radius: 8px;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.3s;
                                font-size: 0.95rem;
                            }
                            .cart-continue-btn:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 6px 20px rgba(255,215,0,0.4);
                            }
                        `}</style>

                        <div className="bg-white rounded-3 custom-shadow p-4 cart-panel">
                            <div className="cart-header">
                                <i className="bi bi-cart2"></i>
                                <h5 className="fw-bold mb-0">Your Selection</h5>
                                {selectedCart.length > 0 && (
                                    <span className="badge bg-danger ms-auto">{totalSelectedRooms}</span>
                                )}
                            </div>

                            <div className="cart-date-note">
                                <div><i className="bi bi-calendar3"></i>{searchParams?.checkIn || "--"} to {searchParams?.checkOut || "--"}</div>
                                <div><i className="bi bi-moon-stars"></i>{nights} {nights > 1 ? "nights" : "night"}</div>
                            </div>

                            <div style={{marginTop: '15px', maxHeight: '450px', overflowY: 'auto', paddingRight: '8px'}}>
                                {selectedCart.length > 0 ? (
                                    selectedCart.map((room, idx) => {
                                        const roomStayPrice = room.selectedPrice ?? room.appliedPrice ?? room.basePrice ?? room.price ?? 0;
                                        const roomTotal = roomStayPrice * (room.quantity || 1);
                                        return (
                                            <div key={idx} className="cart-room-item">
                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                                                    <div style={{flex: 1}}>
                                                        <div className="cart-room-name">
                                                            <i className="bi bi-door-open me-2" style={{color: '#5C6F4E'}}></i>
                                                            {room.name}
                                                        </div>
                                                        <div className="cart-room-price">
                                                            💰 {new Intl.NumberFormat('vi-VN').format(roomStayPrice)}₫ / {nights}N
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
                                                        <span className="me-2">📊</span>
                                                        {room.quantity} room(s)
                                                    </span>
                                                    <span className="cart-room-total-amount">
                                                        {new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(roomTotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="cart-empty">
                                        <i className="bi bi-inbox"></i>
                                        <p style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px'}}>No Rooms Yet</p>
                                        <p style={{fontSize: '0.8rem', opacity: 0.8}}>Click "Book Now" to add rooms</p>
                                    </div>
                                )}
                            </div>

                            {selectedCart.length > 0 && (
                                <div className="cart-footer">
                                    <div className="cart-total-section">
                                        <span className="cart-total-label">💰 Total:</span>
                                        <span className="cart-total-amount">
                                            {new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(cartTotal)}
                                        </span>
                                    </div>
                                    <button
                                        className="cart-continue-btn"
                                        onClick={handleCheckout}
                                        disabled={!hasValidStayDates}
                                    >
                                        <i className="bi bi-arrow-right me-2"></i>Continue to Guest Info
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
                            <div className="res-cnt"><i className="bi bi-building me-2" style={{ color: '#5C6F4E' }}></i>Available Rooms: <span>{totalElements}</span></div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted" style={{ fontSize: '.82rem' }}><i className="bi bi-sort-down me-1"></i>Sort by:</span>
                                <select className="sort-sel" value={filters.sortPrice} onChange={handleSortChange}>
                                    <option value="priceAsc">Price: Low → High</option>
                                    <option value="priceDesc">Price: High → Low</option>
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