import apiClient from "@/services/apiClient";

const BASE = "/enum-options";

const normalizeOption = (item = {}) => ({
  code: item.code ?? "",
  value: item.value ?? item.code ?? "",
  label: item.label ?? item.value ?? item.code ?? "",
});

const normalizeRuleMap = (data) => {
  if (!data) return {};

  if (Array.isArray(data)) {
    return data.reduce((acc, item) => {
      if (!item || !item.field) return acc;
      acc[item.field] = item;
      return acc;
    }, {});
  }

  if (typeof data === "object") {
    return data;
  }

  return {};
};

const enumOptionsApi = {
  getRoomTypeBedTypes: async () => {
    const response = await apiClient.get(`${BASE}/room-type/bed-types`);
    return Array.isArray(response.data) ? response.data.map(normalizeOption) : [];
  },

  getDayOfWeekOptions: async () => {
    const response = await apiClient.get(`${BASE}/day-of-week`);
    return Array.isArray(response.data) ? response.data.map(normalizeOption) : [];
  },

  getRoomTypeInputRules: async () => {
    const response = await apiClient.get(`${BASE}/room-type/input-rules`);
    return normalizeRuleMap(response.data);
  },
};

export default enumOptionsApi;

