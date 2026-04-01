const RoomCard = ({ room, onBooking, onViewDetail }) => {
    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(price);

    const getPlaceholderImage = (roomName) => {
        const n = roomName?.toLowerCase() || "";
        if (n.includes("suite")) return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop";
        if (n.includes("deluxe")) return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop";
        if (n.includes("family")) return "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=300&fit=crop";
        return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop";
    };

    const imageSrc = room.image && !room.image.includes(".jpg") ? `/images/${room.image}` : getPlaceholderImage(room.name);
    const sold = room.availableCount <= 0;
    const options = Array.isArray(room?.pricingOptions) ? room.pricingOptions : [];
    const policy = room?.pricingCombinationPolicy;

    const handleBookOption = (option) => {
        onBooking({
            ...room,
            selectedPricingOption: option,
            selectedPrice: option?.finalPrice ?? room.selectedPrice ?? room.appliedPrice ?? room.basePrice ?? room.price ?? 0,
        });
    };

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
        .rc-pricing-hd { font-size: 0.85rem; font-weight: 700; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: space-between; }
        .rc-pricing-options { display: flex; flex-direction: column; gap: 16px; }

        .rc-opt { background: #fff; border: 1.5px solid #edf2f7; border-radius: 16px; padding: 18px; transition: all 0.2s; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .rc-opt:hover { border-color: var(--gold); box-shadow: 0 8px 16px rgba(212,175,55,0.08); }
        .rc-opt-highlight { border-color: var(--olive); background: linear-gradient(to right, #ffffff, #f9fbf8); }
        .rc-opt-highlight::before { content: 'GÓI ĐỀ XUẤT'; position: absolute; top: 0; right: 0; background: var(--gold); color: #fff; font-size: 0.6rem; font-weight: 800; padding: 3px 10px; border-bottom-left-radius: 10px; }
        
        .rc-opt-header { background: #f8fafc; padding: 8px 12px; border-radius: 10px; margin-bottom: 12px; display: inline-block; width: max-content; }
        .rc-opt-mode { font-size: 0.85rem; font-weight: 800; color: var(--olive-dark); letter-spacing: 0.5px;}
        
        .rc-opt-prices { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; }
        .rc-opt-base { font-size: 0.85rem; color: #a0aec0; text-decoration: line-through; font-weight: 600; margin-bottom: 2px; }
        .rc-opt-amt { font-size: 1.35rem; font-weight: 800; color: #2d3748; line-height: 1; display:flex; gap: 4px; align-items:baseline;}
        .rc-opt-per { font-size: 0.8rem; color: #a0aec0; font-weight: 600; }
        
        .rc-opt-meta { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; flex-grow: 1; }
        .rc-promo-badge { font-size: 0.75rem; background: #ebf4ff; color: #3182ce; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; width: max-content; }
        .rc-promo-reason { font-size: 0.75rem; color: #718096; font-style: italic; }
        
        .rc-opt-book { width: 100%; padding: 12px; border: none; border-radius: 12px; background: var(--olive); color: #fff; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: auto; }
        .rc-opt-book:hover:not(:disabled) { background: var(--olive-dark); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(92,111,78,0.3); }
        .rc-opt-book.highlight-btn { background: var(--gold); color: #2d3748;}
        .rc-opt-book.highlight-btn:hover:not(:disabled) { background: #b8962c; }
        .rc-opt-book:disabled { opacity: 0.5; cursor: not-allowed; background: #cbd5e0; color: #fff; box-shadow: none; transform: none; }
        
        .rc-pricing-empty { padding: 20px; border: 2px dashed #edf2f7; border-radius: 16px; font-size: 0.9rem; color: #a0aec0; text-align: center; }
        
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
                        <img src={imageSrc} alt={room.name} onError={(e) => { e.target.src = getPlaceholderImage(room.name); }} />
                        {room.availableCount > 0 && room.availableCount <= 3 && (
                            <div className="rc-badge urgent"><i className="bi bi-fire"></i> Chỉ còn {room.availableCount} phòng!</div>
                        )}
                        {room.availableCount > 3 && (
                            <div className="rc-badge"><i className="bi bi-check-circle-fill" style={{color: '#9ae6b4'}}></i> Sẵn sàng: {room.availableCount} phòng</div>
                        )}
                    </div>
                    
                    <div className="rc-info">
                        <div className="rc-name">{room.name}</div>
                        <div className="rc-tags">
                            <span className="rc-tag"><i className="bi bi-people-fill"></i> Tối đa {room.maxAdult + (room.maxChildren || 0)} khách</span>
                            <span className="rc-tag"><i className="bi bi-arrows-fullscreen"></i> {room.area} m²</span>
                            <span className="rc-tag"><i className="bi bi-person-fill"></i> N.Lớn: {room.maxAdult}</span>
                            {room.maxChildren > 0 && <span className="rc-tag"><i className="bi bi-emoji-smile"></i> T.Em: {room.maxChildren}</span>}
                        </div>
                        <div className="rc-desc">{room.description}</div>
                        
                        <button className="rc-side-btn" onClick={() => onViewDetail(room)}>
                            <i className="bi bi-info-circle me-1"></i> Xem thông tin chi tiết
                        </button>
                    </div>

                    <div className="rc-pricing">
                        <div className="rc-pricing-hd">
                            <span><i className="bi bi-tag-fill me-1"></i> Các Gói Giá</span>
                            <span className="badge bg-secondary" style={{fontSize: '0.65rem'}}>{options.length} Lựa chọn</span>
                        </div>
                        
                        <div className="rc-pricing-options">
                            {options.length > 0 ? options.map((option, idx) => {
                                const isRecommended = idx === 0 && options.length > 1; // Highlight first element
                                const hasDiscount = option.delta < 0;
                                
                                return (
                                    <div className={`rc-opt ${isRecommended ? 'rc-opt-highlight' : ''}`} key={`${room.roomTypeId}-${option.mode}-${idx}`}>
                                        <div className="rc-opt-header">
                                            <div className="rc-opt-mode">
                                                {option.mode?.startsWith("POLICY_") ? "Gói Thanh Toán Chuẩn" : (option.mode || "Gói Tiêu Chuẩn")}
                                            </div>
                                        </div>
                                        
                                        <div className="rc-opt-prices">
                                            <div>
                                                {hasDiscount && <div className="rc-opt-base">{formatPrice(option.basePrice)}</div>}
                                                <div className="rc-opt-amt">
                                                    {formatPrice(option.finalPrice || 0)}
                                                    <span className="rc-opt-per">/ đêm</span>
                                                </div>
                                            </div>
                                        </div>

                                        {(option.modifiers && option.modifiers.length > 0) && (
                                            <div className="rc-opt-meta">
                                                {option.modifiers.map((m, i) => {
                                                    const rawAmountMatch = m.reason ? m.reason.match(/\[\s*(-?\d+)\s*\]$/) : null;
                                                    let displayReason = m.reason || "";
                                                    let formattedAmount = '';
                                                    let isDiscount = false;
                                                    let isSurcharge = false;
                                                    
                                                    if (rawAmountMatch) {
                                                        const amt = parseInt(rawAmountMatch[1], 10);
                                                        isDiscount = amt < 0;
                                                        isSurcharge = amt > 0;
                                                        formattedAmount = formatPrice(Math.abs(amt));
                                                        displayReason = displayReason.replace(/\[\s*-?\d+\s*\]$/, "").trim();
                                                    } else if (m.adjustmentValue) {
                                                        isDiscount = m.adjustmentValue < 0;
                                                        isSurcharge = m.adjustmentValue > 0;
                                                        const suffixType = m.adjustmentType === 'PERCENT' ? '%' : ' VNĐ';
                                                        formattedAmount = Math.abs(m.adjustmentValue) + suffixType;
                                                    }

                                                    return (
                                                        <div key={i} className="mb-2 p-2 rounded" style={{ background: isDiscount ? '#f0fdf4' : (isSurcharge ? '#fff5f5' : '#f8fafc'), border: `1px solid ${isDiscount ? '#bbf7d0' : (isSurcharge ? '#fed7d7' : '#e2e8f0')}` }}>
                                                            <div className="d-flex justify-content-between align-items-start gap-2">
                                                                <div className="rc-promo-badge" style={{ background: isDiscount ? '#dcfce7' : (isSurcharge ? '#fed7d7' : '#ebf4ff'), color: isDiscount ? '#166534' : (isSurcharge ? '#9b2c2c' : '#3182ce'), margin: 0 }}>
                                                                    <i className={isDiscount ? "bi bi-tag-fill" : (isSurcharge ? "bi bi-graph-up-arrow" : "bi bi-info-circle")}></i> {m.name}
                                                                </div>
                                                                {formattedAmount && (
                                                                    <div className="fw-bold" style={{ fontSize: '0.8rem', color: isDiscount ? '#16a34a' : (isSurcharge ? '#e53e3e' : '#4a5568') }}>
                                                                        {isDiscount ? '-' : (isSurcharge ? '+' : '')}{formattedAmount}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="rc-promo-reason mt-1 ms-1 d-flex gap-1" style={{ color: isDiscount ? '#15803d' : (isSurcharge ? '#c53030' : '#718096') }}>
                                                                <i className="bi bi-arrow-return-right mt-1" style={{ fontSize: '0.7rem' }}></i>
                                                                <span>{displayReason}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <button
                                            className={`rc-opt-book ${isRecommended ? 'highlight-btn' : ''}`}
                                            onClick={() => handleBookOption(option)}
                                            disabled={sold}
                                        >
                                            {sold
                                                ? <><i className="bi bi-x-octagon-fill"></i> Đã Hết Phòng</>
                                                : <><i className="bi bi-cart-plus-fill"></i> Chọn Gói Này</>}
                                        </button>
                                    </div>
                                );
                            }) : (
                                <div className="rc-pricing-empty">
                                    <i className="bi bi-calendar-x fs-1 text-muted d-block mb-2"></i>
                                    Không tìm thấy mức giá áp dụng cho ngày này.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default RoomCard;