import apiClient from "@/services/apiClient";

const toAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("/api/")) {
        const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, "");
        return baseUrl + url;
    }
    return url;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop";

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getSearchRoomPrice = (room) =>
    safeNumber(
        room?.selectedPrice
            ?? room?.selectedPricingOption?.finalPrice
            ?? room?.appliedPrice
            ?? room?.basePrice
            ?? room?.price,
        0,
    );

const RoomCard = ({ room, onBooking, onViewDetail }) => {
    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(price);

    const imageSrc = room.image ? toAbsoluteImageUrl(room.image) : FALLBACK_IMAGE;
    const sold = room.availableCount <= 0;
    const visiblePrice = getSearchRoomPrice(room);

    return (
        <>
            <style>{`
        :root { --olive: #5C6F4E; --olive-dark: #4a5b3f; --gold: #D4AF37; --bg-light: #fafbf8; }
        .rc { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid rgba(92,111,78,0.1); margin-bottom: 24px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .rc:hover { box-shadow: 0 12px 30px rgba(92,111,78,0.12); transform: translateY(-4px); }
        .rc-row { display: flex; flex-direction: row; }
        .rc-img { flex: 0 0 320px; position: relative; overflow: hidden; }
        .rc-img img { width: 100%; height: 100%; object-fit: cover; min-height: 260px; transition: transform 0.6s ease; }
        .rc:hover .rc-img img { transform: scale(1.06); }
        .rc-badge { position: absolute; top: 16px; left: 16px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 6px 14px; border-radius: 20px; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 6px; letter-spacing: 0.5px; }
        .rc-badge.urgent { background: rgba(220, 53, 69, 0.9); }
        .rc-info { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; border-right: 1px solid #f0f0f0; }
        .rc-name { font-weight: 800; font-size: 1.35rem; color: #2d3748; margin-bottom: 12px; font-family: 'Playfair Display', serif; }
        .rc-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .rc-tag { font-size: 0.75rem; font-weight: 600; color: var(--olive); background: #f0f4ec; padding: 4px 12px; border-radius: 8px; display: flex; align-items: center; gap: 4px; }
        .rc-desc { font-size: 0.9rem; color: #718096; line-height: 1.6; margin-bottom: auto; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .rc-side-btn { margin-top: 20px; padding: 10px 0; border: 1.5px solid #e2e8f0; border-radius: 12px; background: transparent; color: #4a5568; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; width: max-content; padding: 8px 20px; }
        .rc-side-btn:hover { border-color: var(--olive); color: var(--olive); background: #f0f4ec; }
        
        .rc-pricing { flex: 0 0 310px; padding: 24px; display: flex; flex-direction: column; gap: 16px; background: var(--bg-light); border-left: 1px solid #f0f0f0; }
        .rc-price-box { background: #fff; border: 1.5px solid #edf2f7; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .rc-price-label { font-size: 0.75rem; font-weight: 800; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; }
        .rc-price-value { font-size: 1.35rem; font-weight: 800; color: #2d3748; line-height: 1; display:flex; gap: 4px; align-items:baseline; }
        .rc-price-note { font-size: 0.8rem; color: #718096; }
        .rc-book-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; background: var(--olive); color: #fff; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: auto; }
        .rc-book-btn:hover:not(:disabled) { background: var(--olive-dark); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(92,111,78,0.3); }
        .rc-book-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #cbd5e0; color: #fff; box-shadow: none; transform: none; }
        
        /* Thay vì 1100px cứng nhắc, tăng giới hạn chập khối lên 1399px vì màn hình chứa col-lg-9 hẹp hơn viewport thật */
        @media(max-width:1399px) { 
            .rc-row { flex-direction: column; } 
            .rc-img { flex: auto; height: 300px; } 
            .rc-pricing { flex: auto; border-left: none; border-top: 1px solid #f0f0f0; } 
            .rc-pricing-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        }
        @media(max-width:768px) {
            .rc-pricing-options { grid-template-columns: 1fr; }
        }
      `}</style>
            <div className="rc">
                <div className="rc-row">
                    <div className="rc-img">
                        <img
                            src={imageSrc}
                            alt={room.name}
                            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                        />
                        {room.availableCount > 0 && room.availableCount <= 3 && (
                            <div className="rc-badge urgent"><i className="bi bi-fire"></i> Only {room.availableCount} room(s) left!</div>
                        )}
                        {room.availableCount > 3 && (
                            <div className="rc-badge"><i className="bi bi-check-circle-fill" style={{ color: '#9ae6b4' }}></i> Available: {room.availableCount} room(s)</div>
                        )}
                    </div>

                    <div className="rc-info">
                        <div className="rc-name">{room.name}</div>
                        <div className="rc-tags">
                            <span className="rc-tag"><i className="bi bi-people-fill"></i> Max {room.maxAdult + (room.maxChildren || 0)} guests</span>
                            <span className="rc-tag"><i className="bi bi-arrows-fullscreen"></i> {room.area} m²</span>
                            <span className="rc-tag"><i className="bi bi-person-fill"></i> Adults: {room.maxAdult}</span>
                            {room.maxChildren > 0 && <span className="rc-tag"><i className="bi bi-emoji-smile"></i> Children: {room.maxChildren}</span>}
                        </div>
                        <div className="rc-desc">{room.description}</div>

                        <button className="rc-side-btn" onClick={() => onViewDetail(room)}>
                            <i className="bi bi-info-circle me-1"></i> View details
                        </button>
                    </div>

                    <div className="rc-pricing">
                        <div className="rc-price-box">
                            <div className="rc-price-label">Current price</div>
                            <div className="rc-price-value">
                                {formatPrice(visiblePrice)}
                                <span className="rc-opt-per">/ night</span>
                            </div>
                            <div className="rc-price-note">
                                Adjustments from policy and returning guest discounts are finalized in the guest information step.
                            </div>
                        </div>

                        <button
                            className="rc-book-btn"
                            onClick={() => onBooking({ ...room, selectedPrice: visiblePrice })}
                            disabled={sold}
                        >
                            {sold
                                ? <><i className="bi bi-x-octagon-fill"></i> Sold out</>
                                : <><i className="bi bi-cart-plus-fill"></i> Add to cart</>}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
export default RoomCard;