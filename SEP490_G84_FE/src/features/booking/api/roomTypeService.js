import apiClient from "../../../services/api";
import { API_ENDPOINTS } from "../../../constants/apiConfig";

export const roomTypeService = {
  getAllRoomTypes: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ROOM_TYPES.LIST);
    return response.data;
  },

  getRoomTypesByBranch: async (branchId) => {
    // Backend: GET /api/room-types/by-branch/{branchId} (path param)
    const response = await apiClient.get(
      `${API_ENDPOINTS.ROOM_TYPES.BY_BRANCH}/${branchId}`,
    );
    return response.data;
  },
};
