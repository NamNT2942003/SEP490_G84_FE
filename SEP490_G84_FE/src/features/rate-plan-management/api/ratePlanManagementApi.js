import apiClient from "@/services/apiClient";

const RATE_PLAN_BASE = "/admin/rate-plans";

const normalizeRatePlan = (item = {}) => ({
  ratePlanId: item.ratePlanId,
  name: item.name || "",
  channelRatePlanId: item.channelRatePlanId || "",
  price: Number(item.price ?? 0),
  cancellationType: item.cancellationType || "",
  freeCancelBeforeDays: Number(item.freeCancelBeforeDays ?? 0),
  paymentType: item.paymentType || "",
  active: Boolean(item.active),
  roomTypeId: item.roomTypeId,
  roomTypeName: item.roomTypeName || "",
});

const toRatePlanRequest = (payload = {}) => ({
  name: (payload.name || "").trim(),
  price: Number(payload.price || 0),
  cancellationType: payload.cancellationType || "",
  freeCancelBeforeDays: Number(payload.freeCancelBeforeDays || 0),
  paymentType: payload.paymentType || "",
  roomTypeId: Number(payload.roomTypeId),
  active: payload.active !== false,
});

const ratePlanManagementApi = {
  listRatePlans: async (roomTypeId) => {
    const params = new URLSearchParams();
    if (roomTypeId) params.append("roomTypeId", roomTypeId);

    const response = await apiClient.get(`${RATE_PLAN_BASE}?${params.toString()}`);
    return Array.isArray(response.data) ? response.data.map(normalizeRatePlan) : [];
  },

  getRatePlanById: async (ratePlanId) => {
    const response = await apiClient.get(`${RATE_PLAN_BASE}/${ratePlanId}`);
    return normalizeRatePlan(response.data);
  },

  createRatePlan: async (payload) => {
    const response = await apiClient.post(RATE_PLAN_BASE, toRatePlanRequest(payload));
    return normalizeRatePlan(response.data);
  },

  updateRatePlan: async (ratePlanId, payload) => {
    const response = await apiClient.put(`${RATE_PLAN_BASE}/${ratePlanId}`, toRatePlanRequest(payload));
    return normalizeRatePlan(response.data);
  },

  deleteRatePlan: async (ratePlanId) => {
    await apiClient.delete(`${RATE_PLAN_BASE}/${ratePlanId}`);
  },
};

export default ratePlanManagementApi;

