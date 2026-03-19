import apiClient from "@/services/apiClient";

const CONDITION_BASE = "/rate-plan-conditions";

const normalizeCondition = (item = {}) => ({
  conditionId: item.conditionId,
  ratePlanId: item.ratePlanId,
  conditionType: item.conditionType || "",
  minValue: item.minValue,
  maxValue: item.maxValue,
  startDate: item.startDate || "",
  endDate: item.endDate || "",
  dayOfWeek: item.dayOfWeek || "",
  occupancyCount: item.occupancyCount,
  active: item.active !== false,
  priorityOrder: item.priorityOrder ?? 0,
  createdAt: item.createdAt || "",
  updatedAt: item.updatedAt || "",
});

const toConditionRequest = (payload = {}) => {
  const body = {
    conditionType: payload.conditionType,
    active: payload.active !== false,
    priorityOrder: Number(payload.priorityOrder || 0),
  };

  const optionalNumberFields = [
    "minValue",
    "maxValue",
    "occupancyCount",
    "advanceDays",
    "minNights",
    "maxNights",
    "availability",
  ];

  optionalNumberFields.forEach((field) => {
    const raw = payload[field];
    if (raw !== "" && raw !== null && raw !== undefined) {
      body[field] = Number(raw);
    }
  });

  const optionalTextFields = ["startDate", "endDate", "dayOfWeek"];
  optionalTextFields.forEach((field) => {
    const raw = payload[field];
    if (typeof raw === "string" && raw.trim()) {
      body[field] = raw.trim();
    }
  });

  return body;
};

const ratePlanConditionApi = {
  listByRatePlan: async (ratePlanId) => {
    const response = await apiClient.get(`${CONDITION_BASE}/rate-plan/${ratePlanId}`);
    return Array.isArray(response.data) ? response.data.map(normalizeCondition) : [];
  },

  listActiveByRatePlan: async (ratePlanId) => {
    const response = await apiClient.get(`${CONDITION_BASE}/rate-plan/${ratePlanId}/active`);
    return Array.isArray(response.data) ? response.data.map(normalizeCondition) : [];
  },

  getById: async (conditionId) => {
    const response = await apiClient.get(`${CONDITION_BASE}/${conditionId}`);
    return normalizeCondition(response.data);
  },

  createCondition: async (ratePlanId, payload) => {
    const response = await apiClient.post(
      `${CONDITION_BASE}/rate-plan/${ratePlanId}`,
      toConditionRequest(payload),
    );
    return normalizeCondition(response.data);
  },

  createBatch: async (ratePlanId, payloads) => {
    const response = await apiClient.post(
      `${CONDITION_BASE}/rate-plan/${ratePlanId}/batch`,
      (payloads || []).map(toConditionRequest),
    );
    return Array.isArray(response.data) ? response.data.map(normalizeCondition) : [];
  },

  updateCondition: async (conditionId, payload) => {
    const response = await apiClient.put(`${CONDITION_BASE}/${conditionId}`, toConditionRequest(payload));
    return normalizeCondition(response.data);
  },

  deleteCondition: async (conditionId) => {
    await apiClient.delete(`${CONDITION_BASE}/${conditionId}`);
  },

  deleteByRatePlan: async (ratePlanId) => {
    await apiClient.delete(`${CONDITION_BASE}/rate-plan/${ratePlanId}`);
  },
};

export default ratePlanConditionApi;

