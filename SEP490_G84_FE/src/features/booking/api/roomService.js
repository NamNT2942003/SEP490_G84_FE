import apiClient from "../../../services/api";
import { API_ENDPOINTS } from "../../../constants/apiConfig";
import { cleanSearchResults, cleanRoomTypeDetail } from "./searchResults";

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
