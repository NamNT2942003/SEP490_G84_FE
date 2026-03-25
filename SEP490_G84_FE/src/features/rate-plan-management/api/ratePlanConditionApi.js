import apiClient from "@/services/apiClient";

const CONDITION_BASE = "/rate-plan-conditions";
const MANAGEMENT_BASE = "/management/rate-plans";
const BOOKING_BASE = "/booking/rate-plans";

const normalizeConditionType = (value) => {
  if (value === "OCCUPANCY") return "ROOM_COUNT";
  return value || "";
};

const toApiConditionType = (value) => {
  if (value === "ROOM_COUNT") return "OCCUPANCY";
  return value || "";
};

const CONDITION_FIELDS = {
  ADVANCE_BOOKING: ["minValue", "maxValue"],
  LENGTH_OF_STAY: ["minValue", "maxValue"],
  ROOM_COUNT: ["occupancyCount"],
  DATE_RANGE: ["startDate", "endDate"],
  DAY_OF_WEEK: ["dayOfWeek"],
  AVAILABILITY: ["minValue", "maxValue"],
};

const normalizeCondition = (item = {}) => ({
  conditionId: item.conditionId,
  ratePlanId: item.ratePlanId,
  conditionType: normalizeConditionType(item.conditionType),
  minValue: item.minValue ?? item.conditionMinValue,
  maxValue: item.maxValue ?? item.conditionMaxValue,
  startDate: item.startDate || "",
  endDate: item.endDate || "",
  dayOfWeek: item.dayOfWeek || "",
  occupancyCount: item.occupancyCount,
  active: (item.active ?? item.isActive) !== false,
  priorityOrder: item.priorityOrder ?? 0,
  createdAt: item.createdAt || "",
  updatedAt: item.updatedAt || "",
});

const normalizeRatePlan = (item = {}) => ({
  ratePlanId: item.ratePlanId,
  name: item.name || "",
  price: Number(item.price ?? 0),
  cancellationType: item.cancellationType || "",
  freeCancelBeforeDays: Number(item.freeCancelBeforeDays ?? 0),
  paymentType: item.paymentType || "",
  active: Boolean(item.active),
  priorityOrder: Number(item.priorityOrder ?? 0),
  conditionCount: Number(item.conditionCount ?? 0),
});

const toConditionRequest = (payload = {}) => {
  const normalizedType = normalizeConditionType(payload.conditionType);
  const apiType = toApiConditionType(normalizedType);
  const body = {
    conditionType: apiType,
    isActive: payload.active !== false,
    priorityOrder: Number(payload.priorityOrder || 0),
  };

  const allowedFields = CONDITION_FIELDS[normalizedType] || [];
  const optionalNumberFields = ["minValue", "maxValue", "occupancyCount"];

  optionalNumberFields.forEach((field) => {
    if (!allowedFields.includes(field)) return;
    const raw = payload[field];
    if (raw !== "" && raw !== null && raw !== undefined) {
      const numberValue = Number(raw);
      if (field === "minValue") body.conditionMinValue = numberValue;
      else if (field === "maxValue") body.conditionMaxValue = numberValue;
      else body[field] = numberValue;
    }
  });

  const optionalTextFields = ["startDate", "endDate", "dayOfWeek"];
  optionalTextFields.forEach((field) => {
    if (!allowedFields.includes(field)) return;
    const raw = payload[field];
    if (typeof raw === "string" && raw.trim()) {
      body[field] = raw.trim();
    }
  });

  return body;
};

const ratePlanConditionApi = {
  // ============ MANAGEMENT APIs (quản lý điều kiện) ============
  /**
   * Lấy tất cả conditions của 1 rate plan (Management view)
   * GET /api/management/rate-plans/{ratePlanId}/conditions
   */
  listByRatePlanManagement: async (ratePlanId) => {
    const response = await apiClient.get(`${MANAGEMENT_BASE}/${ratePlanId}/conditions`);
    const conditions = Array.isArray(response.data?.conditions) ? response.data.conditions : [];
    return conditions.map(normalizeCondition);
  },

  // ============ BOOKING APIs (tìm rate plan applicable) ============
  /**
   * Tìm rate plans applicable theo điều kiện booking
   * GET /api/booking/rate-plans/applicable
   * Query params: roomTypeId, checkInDate (yyyy-MM-dd), checkOutDate (yyyy-MM-dd), guestCount?, strictMatching?
   */
  getApplicableRatePlans: async (queryParams = {}) => {
    const params = new URLSearchParams();
    if (queryParams.roomTypeId) params.append("roomTypeId", queryParams.roomTypeId);
    if (queryParams.checkInDate) params.append("checkInDate", queryParams.checkInDate);
    if (queryParams.checkOutDate) params.append("checkOutDate", queryParams.checkOutDate);
    if (queryParams.guestCount !== undefined) params.append("guestCount", queryParams.guestCount);
    if (queryParams.strictMatching !== undefined) params.append("strictMatching", queryParams.strictMatching);

    const response = await apiClient.get(`${BOOKING_BASE}/applicable?${params.toString()}`);
    const ratePlans = Array.isArray(response.data?.ratePlans) ? response.data.ratePlans : [];
    return ratePlans.map(normalizeRatePlan);
  },

  // ============ LEGACY APIs (deprecated, keep for backward compatibility) ============
  listByRatePlan: async (ratePlanId) => {
    const response = await apiClient.get(`${CONDITION_BASE}/rate-plan/${ratePlanId}`);
    return Array.isArray(response.data) ? response.data.map(normalizeCondition) : [];
  },

  listActiveByRatePlan: async (ratePlanId) => {
    const response = await apiClient.get(`${CONDITION_BASE}/rate-plan/${ratePlanId}/active`);
    return Array.isArray(response.data) ? response.data.map(normalizeCondition) : [];
  },

  // ============ CRUD Operations ============
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

