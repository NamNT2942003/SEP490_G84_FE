import apiClient from "./api";
import { API_ENDPOINTS } from "../constants/apiConfig";

// Helper function to clean a single room type object
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
    // Don't include roomTypeAmenities to avoid circular reference
  };
};

// Helper function to clean search results
const cleanSearchResults = (data) => {
  if (!data) return data;

  return {
    ...data,
    content: (data.content || []).map((room) => cleanRoomType(room)),
  };
};

// Helper function to clean circular references from API response
const cleanRoomTypeDetail = (data) => {
  if (!data) return data;

  // Clean amenities - remove nested roomTypeAmenities to avoid circular ref
  const amenities = (data.amenities || []).map((amenity) => ({
    amenityId: amenity.amenityId,
    amenityName: amenity.amenityName,
    category: amenity.category,
  }));

  // Clean ratePlans - remove nested roomType to avoid circular ref
  const ratePlans = (data.ratePlans || []).map((ratePlan) => ({
    ratePlanId: ratePlan.ratePlanId,
    name: ratePlan.name,
    price: ratePlan.price,
    cancellationType: ratePlan.cancellationType,
    freeCancelBeforeDays: ratePlan.freeCancelBeforeDays,
    paymentType: ratePlan.paymentType,
  }));

  // Clean roomType - remove nested roomTypeAmenities
  const roomType = cleanRoomType(data.roomType);

  return { roomType, amenities, ratePlans };
};

export const roomService = {
  searchRooms: async (params) => {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        if (Array.isArray(params[key])) {
          params[key].forEach((value) => {
            queryParams.append(key, value);
          });
        } else {
          queryParams.append(key, params[key]);
        }
      }
    });

    const response = await apiClient.get(
      `${API_ENDPOINTS.ROOMS.SEARCH}?${queryParams.toString()}`,
    );
    // Clean circular references before returning
    return cleanSearchResults(response.data);
  },

  getRoomDetail: async (roomId) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.ROOMS.DETAIL}/${roomId}`,
    );
    // Clean circular references before returning
    return cleanRoomTypeDetail(response.data);
  },
};
