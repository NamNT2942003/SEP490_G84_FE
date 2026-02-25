// Helper functions to clean API response data and avoid circular references

const cleanRoomType = (room) => {
  if (!room) return room;
  return {
    roomTypeId: room.roomTypeId,
    name: room.name,
    maxAdult: room.maxAdult,
    maxChildren: room.maxChildren,
    basePrice: room.basePrice,
    image: room.image,
    description: room.description,
    area: room.area,
    bedType: room.bedType,
    bedCount: room.bedCount,
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

  const roomType = cleanRoomType(data.roomType);

  return { roomType, amenities, ratePlans };
};
