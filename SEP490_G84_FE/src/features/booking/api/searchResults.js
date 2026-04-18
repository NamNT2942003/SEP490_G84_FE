// Helper functions to clean API response data and avoid circular references

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeModifier = (modifier) => ({
    priceModifierId: modifier?.priceModifierId,
    name: modifier?.name,
    type: modifier?.type,
    adjustmentType: modifier?.adjustmentType,
    adjustmentValue: safeNumber(modifier?.adjustmentValue, 0),
    reason: modifier?.reason,
});

const getModifierLayer = (type) => {
    switch (type) {
        case 'DAY_OF_WEEK':
        case 'DATE_RANGE':
            return 1;
        case 'ADVANCE_BOOKING':
        case 'LENGTH_OF_STAY':
        case 'OCCUPANCY':
        case 'AVAILABILITY':
            return 2;
        case 'USER_HISTORY_DISCOUNT':
        case 'POLICY':
            return 3;
        default:
            return 4;
    }
};

const calculateAdjustment = (reference, modifier) => {
    if (!modifier) return 0;
    const value = safeNumber(modifier.adjustmentValue, 0);
    const type = String(modifier.adjustmentType || '').toUpperCase();
    if (type === 'PERCENT' || type === 'PERCENTAGE') {
        return (reference * value) / 100;
    }
    return value;
};

const buildFallbackPricingOptions = (room, matchedModifiers) => {
    const modifiers = Array.isArray(matchedModifiers) ? matchedModifiers.map(normalizeModifier) : [];
    const basePrice = safeNumber(room?.basePrice ?? room?.price, 0);

    if (!modifiers.length) {
        return [];
    }

    const ordered = [...modifiers].sort((a, b) => {
        const layerDiff = getModifierLayer(a?.type) - getModifierLayer(b?.type);
        if (layerDiff !== 0) return layerDiff;
        return safeNumber(a?.priceModifierId, 0) - safeNumber(b?.priceModifierId, 0);
    });

    let rate1 = basePrice;
    let rate2 = basePrice;
    let finalRate = basePrice;

    ordered.forEach((modifier) => {
        if (getModifierLayer(modifier?.type) === 1) {
            rate1 += calculateAdjustment(basePrice, modifier);
        }
    });
    rate2 = rate1;
    ordered.forEach((modifier) => {
        if (getModifierLayer(modifier?.type) === 2) {
            rate2 += calculateAdjustment(rate1, modifier);
        }
    });
    finalRate = rate2;
    ordered.forEach((modifier) => {
        if (getModifierLayer(modifier?.type) === 3) {
            finalRate += calculateAdjustment(rate2, modifier);
        }
    });

    const finalPrice = Math.max(0, safeNumber(finalRate, basePrice));

    return [{
        optionCode: 'MATCHED',
        mode: 'Matched modifiers',
        basePrice,
        finalPrice,
        delta: finalPrice - basePrice,
        cancellationPolicyId: null,
        cancellationPolicyType: '',
        cancellationPolicyName: '',
        prepaidRate: 0,
        refunRate: 0,
        modifierIds: modifiers.map((m) => m.priceModifierId),
        modifierNames: modifiers.map((m) => m.name).filter(Boolean),
        reasons: modifiers.map((m) => m.reason).filter(Boolean),
        modifiers,
        combinationKey: 'MATCHED',
    }];
};

const cleanRoomType = (room) => {
    if (!room) return room;

    const availablePriceModifiers = Array.isArray(room.availablePriceModifiers)
        ? room.availablePriceModifiers.map(normalizeModifier)
        : [];

    const pricingOptions = Array.isArray(room.pricingOptions) && room.pricingOptions.length > 0
        ? room.pricingOptions.map((option) => ({
            optionCode: option?.optionCode || option?.combinationKey || option?.mode || "UNKNOWN",
            mode: option?.mode || "UNKNOWN",
            basePrice: Number(option?.basePrice ?? 0),
            finalPrice: Number(option?.finalPrice ?? 0),
            delta: Number(option?.delta ?? 0),
            cancellationPolicyId: option?.cancellationPolicyId ?? null,
            cancellationPolicyType: option?.cancellationPolicyType || "",
            cancellationPolicyName: option?.cancellationPolicyName || "",
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
                    adjustmentValue: Number(m?.adjustmentValue ?? 0),
                    reason: m?.reason,
                }))
                : [],
            combinationKey: option?.combinationKey || option?.optionCode || option?.mode || "UNKNOWN",
        }))
        : buildFallbackPricingOptions(room, availablePriceModifiers);

    return {
        ...room, // Giữ lại tất cả các trường (bao gồm availableCount, branchId, branchName...)
        // ⚠️ TEMPORARY FIX: Nếu backend chưa có availableCount, set default
        // TODO: Backend cần thêm field availableCount vào RoomSearchResult DTO
        availableCount: room.availableCount !== undefined && room.availableCount !== null
            ? room.availableCount
            : 999, // Default: không giới hạn (chờ backend implement)
        branch: room.branch
            ? {
                branchId: room.branch.branchId,
                branchName: room.branch.branchName,
                address: room.branch.address,
                contactNumber: room.branch.contactNumber,
            }
            : null,
        availablePriceModifiers,
        pricingOptions,
        pricingCombinationPolicy: room.pricingCombinationPolicy
            ? {
                maxCombinationSize: room.pricingCombinationPolicy.maxCombinationSize,
                maxGeneratedOptions: room.pricingCombinationPolicy.maxGeneratedOptions,
                rule: room.pricingCombinationPolicy.rule || "",
            }
            : null,
    };
};

export const cleanSearchResults = (data) => {
    if (!data) return data;
    return {
        ...data,
        content: (data.content || []).map((room) => cleanRoomType(room)),
    };
};

export const cleanRoomTypeDetail = (data) => {
    if (!data) return data;

    const amenities = (data.amenities || []).map((amenity) => ({
        amenityId: amenity.amenityId,
        amenityName: amenity.amenityName,
        category: amenity.category,
    }));

    // Clean the main roomType object while keeping its extended properties
    const roomType = cleanRoomType(data.roomType);

    return { ...data, roomType, amenities };
};