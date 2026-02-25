import apiClient from "../../../services/api";
import { API_ENDPOINTS } from "../../../constants/apiConfig";
export const branchService = {

  getAllBranches: async () => {
    const response = await apiClient.get(API_ENDPOINTS.BRANCHES.LIST);
    return response.data;
  },

  getBranchById: async (branchId) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BRANCHES.DETAIL}/${branchId}`,
    );
    return response.data;
  },
};