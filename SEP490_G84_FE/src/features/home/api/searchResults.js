// Helper functions to clean API response data and avoid circular references

const cleanRoomType = (room) => {
  if (!room) return room;
  return {
    ...room, // Giữ lại tất cả các trường (bao gồm availableCount, branchId, branchName...)
    branch: room.branch
        ? {
          branchId: room.branch.branchId,
          branchName: room.branch.branchName,
          address: room.branch.address,
          contactNumber: room.branch.contactNumber,
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

  const ratePlans = (data.ratePlans || []).map((ratePlan) => ({
    ratePlanId: ratePlan.ratePlanId,
    name: ratePlan.name,
    price: ratePlan.price,
    cancellationType: ratePlan.cancellationType,
    freeCancelBeforeDays: ratePlan.freeCancelBeforeDays,
    paymentType: ratePlan.paymentType,
  }));

  // Clean the main roomType object while keeping its extended properties
  const roomType = cleanRoomType(data.roomType);

  return { ...data, roomType, amenities, ratePlans };
};