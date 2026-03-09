import apiClient from "../../../services/api.js";
import { API_ENDPOINTS } from "../../../constants/apiConfig.js";
import { cleanSearchResults, cleanRoomTypeDetail } from "./searchResults.js";

export const roomService = {
  searchRooms: async (params) => {
    // ensure required parameters are present, apply sensible defaults
    const searchParams = { ...params };
    if (searchParams.branchId === undefined || searchParams.branchId === null) {
      searchParams.branchId = 1;
    }

    const queryParams = new URLSearchParams();

    Object.keys(searchParams).forEach((key) => {
      const value = searchParams[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const queryString = queryParams.toString();

    const response = await apiClient.get(
      `${API_ENDPOINTS.ROOMS.SEARCH}?${queryString}`,
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
