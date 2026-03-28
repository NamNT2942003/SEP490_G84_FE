
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/apiConfig";

const getEffectiveBranchId = (branchId) => (branchId ?? 1);

const bookingService = {
  createFromFrontend: async (branchId, bookingPayload) => {
	const effectiveBranchId = getEffectiveBranchId(branchId);
	try {
	  const response = await apiClient.post(
		API_ENDPOINTS.BOOKING.CREATE_FROM_FRONTEND,
		bookingPayload,
		{ params: { branchId: effectiveBranchId } },
	  );
	  return response.data;
	} catch (error) {
	  const serverData = error?.response?.data;
	  if (serverData) {
		if (typeof serverData === "string") {
		  error.friendlyMessage = serverData;
		} else if (serverData?.message) {
		  error.friendlyMessage = serverData.message;
		} else if (serverData?.error) {
		  error.friendlyMessage = serverData.error;
		}
	  }
	  throw error;
	}
  },
};

export default bookingService;
