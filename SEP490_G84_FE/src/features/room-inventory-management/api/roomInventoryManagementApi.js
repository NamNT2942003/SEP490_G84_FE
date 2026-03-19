import apiClient from "@/services/apiClient";

const INVENTORY_BASE = "/admin/room-type-inventories";

const normalizeInventory = (item = {}) => ({
  inventoryId: item.inventoryId,
  workDate: item.workDate || "",
  availability: Number(item.availability ?? 0),
  price: Number(item.price ?? 0),
  isClosed: Boolean(item.isClosed),
  minStay: Number(item.minStay ?? 1),
  roomTypeId: item.roomTypeId,
  roomTypeName: item.roomTypeName || "",
  ratePlanId: item.ratePlanId,
  ratePlanName: item.ratePlanName || "",
});

const toInventoryRequest = (payload = {}) => {
  const request = {
    roomTypeId: Number(payload.roomTypeId),
    availability: payload.availability !== "" && payload.availability !== undefined ? Number(payload.availability) : undefined,
    price: payload.price !== "" && payload.price !== undefined ? Number(payload.price) : undefined,
    isClosed: Boolean(payload.isClosed),
    minStay: payload.minStay !== "" && payload.minStay !== undefined ? Number(payload.minStay) : undefined,
  };

  if (payload.ratePlanId) request.ratePlanId = Number(payload.ratePlanId);

  if (payload.workDate) {
    request.workDate = payload.workDate;
  } else {
    if (payload.fromDate) request.fromDate = payload.fromDate;
    if (payload.toDate) request.toDate = payload.toDate;
  }

  return request;
};

const roomInventoryManagementApi = {
  listInventories: async ({ roomTypeId, ratePlanId, fromDate, toDate }) => {
    const params = new URLSearchParams();
    params.append("roomTypeId", roomTypeId);
    if (ratePlanId) params.append("ratePlanId", ratePlanId);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const response = await apiClient.get(`${INVENTORY_BASE}?${params.toString()}`);
    return Array.isArray(response.data) ? response.data.map(normalizeInventory) : [];
  },

  getInventoryById: async (inventoryId) => {
    const response = await apiClient.get(`${INVENTORY_BASE}/${inventoryId}`);
    return normalizeInventory(response.data);
  },

  upsertInventory: async (payload) => {
    const response = await apiClient.post(INVENTORY_BASE, toInventoryRequest(payload));
    return normalizeInventory(response.data);
  },

  updateInventory: async (inventoryId, payload) => {
    const response = await apiClient.put(`${INVENTORY_BASE}/${inventoryId}`, toInventoryRequest(payload));
    return normalizeInventory(response.data);
  },

  deleteInventory: async (inventoryId) => {
    await apiClient.delete(`${INVENTORY_BASE}/${inventoryId}`);
  },
};

export default roomInventoryManagementApi;

