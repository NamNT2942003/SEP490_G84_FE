const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const calculateDisplayedRoomPrice = (room) => {
    const basePrice = safeNumber(
        room?.selectedPricingOption?.finalPrice
            ?? room?.selectedPrice
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