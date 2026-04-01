import apiClient from "@/services/apiClient";

const INVENTORY_BASE = "/admin/room-type-inventories";

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeInventory = (item = {}) => ({
  inventoryId: item.inventoryId,
  workDate: item.workDate || "",
  availability: toSafeNumber(item.availability, 0),
  basePrice: toSafeNumber(item.basePrice ?? item.price, 0),
  price: toSafeNumber(item.price ?? item.basePrice, 0),
  delta: toSafeNumber(item?.priceCalculation?.delta ?? (item.price ?? 0) - (item.basePrice ?? 0), 0),
  appliedPriceModifiers: Array.isArray(item.appliedPriceModifiers)
    ? item.appliedPriceModifiers.map((modifier) => ({
      priceModifierId: modifier?.priceModifierId,
      name: modifier?.name || "Unnamed modifier",
      type: modifier?.type || "",
      adjustmentType: modifier?.adjustmentType || "",
      adjustmentValue: modifier?.adjustmentValue,
    }))
    : [],
  priceCalculation: item?.priceCalculation
    ? {
      basePrice: toSafeNumber(item.priceCalculation.basePrice ?? item.basePrice, 0),
      finalPrice: toSafeNumber(item.priceCalculation.finalPrice ?? item.price, 0),
      delta: toSafeNumber(item.priceCalculation.delta, 0),
      notes: item.priceCalculation.notes || "",
      steps: Array.isArray(item.priceCalculation.steps)
        ? item.priceCalculation.steps.map((step) => ({
          name: step?.name || "",
          type: step?.type || "",
          applied: Boolean(step?.applied),
          adjustmentType: step?.adjustmentType || "",
          adjustmentValue: step?.adjustmentValue,
          reason: step?.reason || "",
          priceModifierId: step?.priceModifierId,
        }))
        : [],
    }
    : null,
  isClosed: Boolean(item.isClosed),
  minStay: toSafeNumber(item.minStay, 1),
  roomTypeId: item.roomTypeId,
  roomTypeName: item.roomTypeName || "",
});

const toInventoryRequest = (payload = {}) => {
  const request = {
    roomTypeId: Number(payload.roomTypeId),
    availability: payload.availability !== "" && payload.availability !== undefined ? Number(payload.availability) : undefined,
    price: payload.price !== "" && payload.price !== undefined ? Number(payload.price) : undefined,
    isClosed: Boolean(payload.isClosed),
    minStay: payload.minStay !== "" && payload.minStay !== undefined ? Number(payload.minStay) : undefined,
  };

  if (payload.workDate) {
    request.workDate = payload.workDate;
  } else {
    if (payload.fromDate) request.fromDate = payload.fromDate;
    if (payload.toDate) request.toDate = payload.toDate;
  }

  return request;
};

const roomInventoryManagementApi = {
  listInventories: async ({ roomTypeId, fromDate, toDate }) => {
    const params = new URLSearchParams();
    params.append("roomTypeId", roomTypeId);
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
