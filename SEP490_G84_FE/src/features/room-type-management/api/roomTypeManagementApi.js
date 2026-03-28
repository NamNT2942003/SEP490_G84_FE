import apiClient from "@/services/apiClient";

const ROOM_TYPE_BASE = "/room-types";

const normalizeRoomType = (item = {}) => ({
  roomTypeId: item.roomTypeId,
  channelRoomTypeId: item.channelRoomTypeId || "",
  name: item.name || "",
  maxAdult: Number(item.maxAdult ?? 0),
  maxChildren: Number(item.maxChildren ?? 0),
  basePrice: Number(item.basePrice ?? 0),
  image: item.image || "",
  description: item.description || "",
  area: item.area || "",
  bedType: item.bedType || "",
  bedCount: Number(item.bedCount ?? 0),
  branchId: item.branchId,
  branchName: item.branchName || "",
});

const toRoomTypeRequest = (payload = {}) => {
  const body = {
    name: (payload.name || "").trim(),
    maxAdult: Number(payload.maxAdult || 0),
    maxChildren: Number(payload.maxChildren || 0),
    basePrice: Number(payload.basePrice || 0),
    image: (payload.image || "").trim(),
    description: (payload.description || "").trim(),
    branchId: Number(payload.branchId),
  };

  if (payload.area !== "" && payload.area !== null && payload.area !== undefined) {
    body.area = Number(payload.area);
  }

  if ((payload.bedType || "").trim()) {
    body.bedType = (payload.bedType || "").trim();
  }

  if (payload.bedCount !== "" && payload.bedCount !== null && payload.bedCount !== undefined) {
    body.bedCount = Number(payload.bedCount);
  }

  return body;
};

const roomTypeManagementApi = {
  listRoomTypes: async () => {
    const response = await apiClient.get(ROOM_TYPE_BASE);
    return Array.isArray(response.data) ? response.data.map(normalizeRoomType) : [];
  },

  listRoomTypesByBranch: async (branchId) => {
    const response = await apiClient.get(`${ROOM_TYPE_BASE}/by-branch/${branchId}`);
    return Array.isArray(response.data) ? response.data.map(normalizeRoomType) : [];
  },

  getRoomTypeById: async (roomTypeId) => {
    const response = await apiClient.get(`${ROOM_TYPE_BASE}/${roomTypeId}`);
    return normalizeRoomType(response.data);
  },

  getRoomTypeDetail: async (roomTypeId) => {
    const response = await apiClient.get(`${ROOM_TYPE_BASE}/${roomTypeId}/detail`);
    const data = response.data || {};
    return {
      roomType: normalizeRoomType(data.roomType || {}),
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
    };
  },

  createRoomType: async (payload) => {
    const response = await apiClient.post(ROOM_TYPE_BASE, toRoomTypeRequest(payload));
    return normalizeRoomType(response.data);
  },

  updateRoomType: async (roomTypeId, payload) => {
    const response = await apiClient.put(`${ROOM_TYPE_BASE}/${roomTypeId}`, toRoomTypeRequest(payload));
    return normalizeRoomType(response.data);
  },

  deleteRoomType: async (roomTypeId) => {
    await apiClient.delete(`${ROOM_TYPE_BASE}/${roomTypeId}`);
  },
};

export default roomTypeManagementApi;

