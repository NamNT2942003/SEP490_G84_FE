export const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Tính giá đơn vị sau khi đã áp dụng policy / promotion (dùng ở GuestInformation và BookingSummary).
 *
 * KHÔNG dùng lockedUnitPrice ở đây — lockedUnitPrice chỉ dành cho SearchRoom cart
 * (được đọc qua getSearchRoomPrice trong SearchRoom.jsx / RoomCard.jsx).
 * Nếu thêm lockedUnitPrice vào chain này, applyPolicySelectionToRoom sẽ cập nhật
 * selectedPrice nhưng giá hiển thị vẫn giữ nguyên giá cũ → policy không có tác dụng.
 *
 * Thứ tự ưu tiên:
 *   selectedPrice (policy-adjusted) > selectedPricingOption.finalPrice
 *   > appliedPrice > basePrice > price
 */
export const calculateDisplayedRoomPrice = (room) => {
    const basePrice = safeNumber(
        room?.selectedPrice
            ?? room?.selectedPricingOption?.finalPrice
            ?? room?.appliedPrice
            ?? room?.basePrice
            ?? room?.price,
        0,
    );

    const manual = room?.selectedManualPromotion;
    if (!manual) {
        return basePrice;
    }

    const manualValue = safeNumber(manual?.adjustmentValue, 0);
    const delta = manual?.adjustmentType === 'PERCENT' || manual?.adjustmentType === 'PERCENTAGE'
        ? (safeNumber(room?.basePrice, basePrice) * manualValue) / 100
        : manualValue;

    const finalPrice = basePrice + delta;
    return finalPrice > 0 ? finalPrice : 0;
};

/**
 * Alias rõ nghĩa: tính giá đơn vị cho booking payload / tổng đơn hàng.
 * Đồng nhất với calculateDisplayedRoomPrice — dùng khi cần rõ context là
 * "giá đưa lên backend" thay vì "giá hiển thị trên UI".
 */
export const calculateRoomUnitPrice = (room) => calculateDisplayedRoomPrice(room);