import apiClient from "@/services/apiClient";

export const housekeepingApi = {
  getRooms: (branchId) => apiClient.get(`/housekeeping/rooms`, { params: { branchId } }),
  updateRoomStatusToClean: (roomId) => apiClient.put(`/housekeeping/rooms/${roomId}/status`),
  getMyBranches: () => apiClient.get(`/front-desk/my-branches`),
};
