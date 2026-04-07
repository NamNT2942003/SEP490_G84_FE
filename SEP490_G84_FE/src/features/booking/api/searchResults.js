// Helper functions to clean API response data and avoid circular references

const cleanRoomType = (room) => {
    if (!room) return room;

    const pricingOptions = Array.isArray(room.pricingOptions)
        ? room.pricingOptions.map((option) => ({
            optionCode: option?.optionCode || option?.combinationKey || option?.mode || "UNKNOWN",
            mode: option?.mode || "UNKNOWN",
            basePrice: Number(option?.basePrice ?? 0),
            finalPrice: Number(option?.finalPrice ?? 0),
            delta: Number(option?.delta ?? 0),
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
        : [];

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