const getCancellationText = (cancellationType, freeCancelBeforeDays) => {
    if (cancellationType === "NON_REFUNDABLE") return "Khong hoan tien";
    if (cancellationType === "REFUNDABLE" && freeCancelBeforeDays > 0) {
        return `Mien phi huy truoc ${freeCancelBeforeDays} ngay`;
    }
    if (cancellationType === "REFUNDABLE") return "Mien phi huy";
    return "Chinh sach huy theo goi gia";
};

const getPaymentText = (paymentType) => {
    if (paymentType === "PREPAID") return "Thanh toan truoc";
    if (paymentType === "PAY_AT_HOTEL") return "Thanh toan tai khach san";
    return "Hinh thuc thanh toan theo goi";
};

const RoomCard = ({ room, onBooking, onViewDetail }) => {
    const formatPrice = (price) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(price);

    const getPlaceholderImage = (roomName) => {
        const n = roomName?.toLowerCase() || "";
        if (n.includes("suite")) return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop";
        if (n.includes("deluxe")) return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop";
        if (n.includes("family")) return "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=300&fit=crop";
        return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop";
    };

    const imageSrc = room.image && !room.image.includes(".jpg") ? `/images/${room.image}` : getPlaceholderImage(room.name);
    const sold = room.availableCount <= 0;
    const selectedPrice = room.selectedPrice ?? room.appliedPrice ?? room.basePrice;
    const hasRatePlan = Boolean(room.selectedRatePlanId);
    const hasAnyRatePlan = Boolean(room.availableRatePlans?.length || room.selectedRatePlanId || room.appliedRatePlanId);

    return (
        <>
            <style>{`
        .rc{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.04);border:1px solid #eee;margin-bottom:16px;transition:box-shadow .25s,transform .25s}
        .rc:hover{box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-2px)}
        .rc-row{display:flex}
        .rc-img{flex:0 0 280px;position:relative;overflow:hidden}
        .rc-img img{width:100%;height:100%;object-fit:cover;min-height:220px;transition:transform .4s}
        .rc:hover .rc-img img{transform:scale(1.04)}
        .rc-badge{position:absolute;top:12px;left:12px;background:rgba(92,111,78,.9);color:#fff;font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:8px;backdrop-filter:blur(4px)}
        .rc-info{flex:1;padding:22px 24px;display:flex;flex-direction:column;min-width:0}
        .rc-name{font-weight:800;font-size:1.1rem;color:#222;margin-bottom:6px}
        .rc-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
        .rc-tag{font-size:.72rem;font-weight:600;color:#5C6F4E;background:#f0f4ec;padding:3px 10px;border-radius:6px;display:flex;align-items:center;gap:3px}
        .rc-tag i{font-size:.74rem}
        .rc-desc{font-size:.84rem;color:#777;line-height:1.55;margin-bottom:auto;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .rc-plan{margin-top:12px;padding:10px;border:1px solid #ececec;border-radius:10px;background:#fcfcfc}
        .rc-plan-lbl{font-size:.7rem;font-weight:700;color:#7a7a7a;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px}
        .rc-plan-msg{font-size:.78rem;color:#999;margin-top:6px}
        .rc-plan-msg.err{color:#d9534f}
        .rc-plan-badge{display:inline-flex;align-items:center;gap:5px;background:#edf5e8;color:#4f6540;border:1px solid #dfead5;padding:4px 9px;border-radius:999px;font-size:.74rem;font-weight:700}
        .rc-pol{margin-top:8px;font-size:.76rem;color:#666;display:flex;flex-direction:column;gap:2px}
        .rc-left{margin-top:10px}
        .rc-left span{font-size:.76rem;font-weight:700;color:#e67e22;background:#fef5eb;padding:3px 10px;border-radius:6px}
        .rc-left span i{margin-right:3px}
        .rc-price{flex:0 0 200px;background:#fafbf8;border-left:1px solid #f0f0f0;padding:22px 20px;display:flex;flex-direction:column;justify-content:space-between;text-align:right}
        .rc-from{font-size:.72rem;color:#999;margin-bottom:2px}
        .rc-amt{font-size:1.35rem;font-weight:800;color:#5C6F4E}
        .rc-per{font-size:.72rem;color:#aaa}
        .rc-btns{display:flex;flex-direction:column;gap:8px;margin-top:16px}
        .rc-book{padding:10px 0;border:none;border-radius:10px;background:linear-gradient(135deg,#5C6F4E,#4a5b3f);color:#fff;font-weight:700;font-size:.84rem;cursor:pointer;transition:all .2s;box-shadow:0 3px 10px rgba(92,111,78,.25)}
        .rc-book:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 16px rgba(92,111,78,.35)}
        .rc-book:disabled{opacity:.5;cursor:not-allowed}
        .rc-detail{padding:9px 0;border:1.5px solid #ddd;border-radius:10px;background:#fff;color:#555;font-weight:600;font-size:.82rem;cursor:pointer;transition:all .2s}
        .rc-detail:hover{border-color:#5C6F4E;color:#5C6F4E}
        @media(max-width:768px){.rc-row{flex-direction:column}.rc-img{flex:none;height:200px}.rc-price{flex:none;border-left:none;border-top:1px solid #f0f0f0;flex-direction:row;align-items:center;gap:12px;text-align:left}.rc-btns{flex-direction:row}.rc-book,.rc-detail{flex:1}}
      `}</style>
            <div className="rc">
                <div className="rc-row">
                    <div className="rc-img">
                        <img src={imageSrc} alt={room.name} onError={(e) => { e.target.src = getPlaceholderImage(room.name); }} />
                        {room.availableCount > 0 && room.availableCount <= 3 && (
                            <div className="rc-badge"><i className="bi bi-fire me-1"></i>Only {room.availableCount} left</div>
                        )}
                    </div>
                    <div className="rc-info">
                        <div className="rc-name">{room.name}</div>
                        <div className="rc-tags">
                            <span className="rc-tag"><i className="bi bi-people-fill"></i>Max {room.maxAdult + (room.maxChildren || 0)} guests</span>
                            <span className="rc-tag"><i className="bi bi-arrows-fullscreen"></i>{room.area} m²</span>
                            <span className="rc-tag"><i className="bi bi-person-fill"></i>{room.maxAdult} adults</span>
                            {room.maxChildren > 0 && <span className="rc-tag"><i className="bi bi-emoji-smile"></i>{room.maxChildren} children</span>}
                        </div>
                        <div className="rc-desc">{room.description}</div>
                        <div className="rc-plan">
                            <div className="rc-plan-lbl">Rate Plan</div>
                            {room.ratePlanLoading && <div className="rc-plan-msg">Dang tai goi gia...</div>}
                            {!room.ratePlanLoading && room.ratePlanError && <div className="rc-plan-msg err">{room.ratePlanError}</div>}
                            {!room.ratePlanLoading && !room.ratePlanError && !room.availableRatePlans?.length && (
                                <div className={`rc-plan-msg ${hasAnyRatePlan ? "" : "err"}`}>
                                    {hasAnyRatePlan
                                        ? "Dang ap dung goi gia mac dinh tu ket qua tim phong"
                                        : "Tam thoi khong co goi gia phu hop"}
                                </div>
                            )}

                            {!room.ratePlanLoading && !room.ratePlanError && hasAnyRatePlan && (
                                <div className="rc-plan-msg">
                                    <span className="rc-plan-badge">
                                        <i className="bi bi-gift"></i>
                                        {room.availableRatePlans.length} goi gia uu dai
                                    </span>
                                    <div className="mt-2">Chon phong truoc, sau do ban chon goi gia trong phan "Your Selection".</div>
                                </div>
                            )}

                            {hasRatePlan && (
                                <div className="rc-pol">
                                    <span><i className="bi bi-shield-check me-1"></i>{getCancellationText(room.cancellationType, room.freeCancelBeforeDays)}</span>
                                    <span><i className="bi bi-credit-card me-1"></i>{getPaymentText(room.paymentType)}</span>
                                </div>
                            )}
                        </div>
                        {room.availableCount > 0 && (
                            <div className="rc-left"><span><i className="bi bi-clock-history"></i>Only {room.availableCount} rooms left!</span></div>
                        )}
                    </div>
                    <div className="rc-price">
                        <div>
                            <div className="rc-from">Start from</div>
                            <div className="rc-amt">{formatPrice(selectedPrice)}</div>
                            <div className="rc-per">/ night</div>
                            {room.selectedRatePlanName && (
                                <div className="small text-muted mt-1">{room.selectedRatePlanName}</div>
                            )}
                        </div>
                        <div className="rc-btns">
                            <button className="rc-book" onClick={() => onBooking(room)} disabled={sold || !hasAnyRatePlan}>
                                {sold
                                    ? <><i className="bi bi-x-circle me-1"></i>Fully Booked</>
                                    : !hasAnyRatePlan
                                        ? <><i className="bi bi-slash-circle me-1"></i>Chua co goi gia</>
                                        : <><i className="bi bi-lightning-charge-fill me-1"></i>Book Now</>}
                            </button>
                            <button className="rc-detail" onClick={() => onViewDetail(room)}>
                                <i className="bi bi-eye me-1"></i>View Detail
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RoomCard;