import apiClient from "@/services/apiClient";

export const housekeepingApi = {
  getRooms: (branchId) => apiClient.get(`/housekeeping/rooms`, { params: { branchId } }),
  updateRoomStatusToClean: (roomId, reqData) => apiClient.put(`/housekeeping/rooms/${roomId}/status`, reqData),
  reportIncident: (roomId, reqData) => apiClient.post(`/housekeeping/rooms/${roomId}/incidents`, reqData),
  getMyBranches: () => apiClient.get(`/front-desk/my-branches`),
  // Manager APIs
  getRoomIncidents: (roomId) => apiClient.get(`/housekeeping/rooms/${roomId}/incidents`),
  closeIncident: (roomId, incidentId, resolution) => apiClient.put(`/housekeeping/rooms/${roomId}/incidents/${incidentId}/close`, { resolution }),
  setRoomMaintenance: (roomId, reason) => apiClient.put(`/housekeeping/rooms/${roomId}/maintenance`, { reason }),
  requestCleaning: (roomId) => apiClient.put(`/housekeeping/rooms/${roomId}/dirty`),
};
