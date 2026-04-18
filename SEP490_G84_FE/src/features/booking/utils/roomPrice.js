export const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Tính giá đơn vị hiển thị của một phòng (bao gồm manual promotion nếu có).
 * Đây là "nguồn sự thật" duy nhất cho giá phòng trên toàn bộ luồng booking.
 *
 * Thứ tự ưu tiên:
 *   lockedUnitPrice > selectedPrice > selectedPricingOption.finalPrice
 *   > appliedPrice > basePrice > price
 */
export const calculateDisplayedRoomPrice = (room) => {
    const basePrice = safeNumber(
        room?.lockedUnitPrice
            ?? room?.selectedPrice
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