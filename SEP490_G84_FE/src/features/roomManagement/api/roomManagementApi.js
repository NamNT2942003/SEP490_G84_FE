import apiClient from '../../../services/apiClient';

const ROOM_API_BASE = '/rooms';
const FURNITURE_API_BASE = '/rooms/furniture';
const ADMIN_ROOM_API_BASE = '/admin/rooms';

export const roomManagementApi = {
  // List rooms with search and filter
  listRooms: async (search = '', status = '', page = 0, size = 10, branchId = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (branchId) params.append('branchId', branchId);
    params.append('page', page);
    params.append('size', size);

    const response = await apiClient.get(`${ROOM_API_BASE}?${params.toString()}`);
    
    const backendData = response.data;
    if (backendData && backendData.rooms) {
      return {
        content: backendData.rooms.map(room => ({
          roomId: room.roomId,
          roomName: room.roomName,
          roomType: room.type, 
          roomTypeName: room.roomTypeName,
          floor: room.floor,
          status: room.status || 'AVAILABLE',
          totalEquipment: room.totalEquipment || 0,
          equipmentBroken: room.equipmentBroken || 0,
          totalIssues: room.totalIssues || 0,
          branchId: room.branchId,
          branchName: room.branchName,
        })),
        totalElements: backendData.pagination?.totalElements || backendData.rooms.length,
        totalPages: backendData.pagination?.totalPages || 1,
        number: backendData.pagination?.currentPage || 0,
        size: backendData.pagination?.pageSize || size,
      };
    }
    
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size };
  },

  listBranches: async () => {
    const response = await apiClient.get('/branches');
    return response.data;
  },

  // Get room detail with equipment and issues
  getRoomDetail: async (roomId) => {
    // Standardized to use RoomManagementController endpoint which now returns full detail
    const response = await apiClient.get(`${ROOM_API_BASE}/${roomId}/detail`);
    return response.data;
  },

  // Get room statistics
  getRoomStatistics: async (branchId = '') => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    const query = params.toString();
    const response = await apiClient.get(`${ROOM_API_BASE}/statistics${query ? '?' + query : ''}`);
    return response.data;
  },

  // Get equipment list for a room  
  getRoomEquipment: async (roomId) => {
    const response = await apiClient.get(`${ROOM_API_BASE}/${roomId}/equipment`);
    return response.data;
  },

  // Get issues/incidents list for a room
  getRoomIssues: async (roomId) => {
    const response = await apiClient.get(`${ADMIN_ROOM_API_BASE}/${roomId}/incidents`);
    const data = response.data;
    // Backend returns paginated result; extract content array
    return Array.isArray(data) ? data : (data?.content || []);
  },

  // Get floor list
  getFloors: async () => {
    const response = await apiClient.get(`${ROOM_API_BASE}/floors`);
    return response.data;
  },

  // Get room types
  getRoomTypes: async () => {
    const response = await apiClient.get(`${ROOM_API_BASE}/types`);
    return response.data;
  },

  // Update room furniture status/quantity (maintenance actions)
  updateRoomFurniture: async (roomId, furnitureId, payload) => {
    const response = await apiClient.put(
      `${ADMIN_ROOM_API_BASE}/${roomId}/furniture/${furnitureId}`,
      payload,
    );
    return response.data;
  },

  // Replace a room furniture item from inventory
  replaceFromInventory: async (roomId, oldFurnitureId, payload) => {
    const response = await apiClient.post(
      `${ADMIN_ROOM_API_BASE}/${roomId}/furniture/${oldFurnitureId}/replace`,
      payload,
    );
    return response.data;
  },

  // Report incident for room
  createIncident: async (roomId, payload) => {
    const response = await apiClient.post(
      `${ADMIN_ROOM_API_BASE}/${roomId}/incidents`,
      payload,
    );
    return response.data;
  },

  // Report issue - alias for createIncident
  reportIssue: async (roomId, payload) => {
    const response = await apiClient.post(
      `${ADMIN_ROOM_API_BASE}/${roomId}/incidents`,
      payload,
    );
    return response.data;
  },

  // Update room status after maintenance 
  updateRoomStatus: async (roomId, status) => {
    const response = await apiClient.put(
      `${ADMIN_ROOM_API_BASE}/${roomId}/status`,
      { status }
    );
    return response.data;
  },

  // Fix/repair equipment - uses furniture update endpoint to set condition to GOOD
  repairEquipment: async (roomId, equipmentId) => {
    const response = await apiClient.put(
      `${ADMIN_ROOM_API_BASE}/${roomId}/furniture/${equipmentId}`,
      { status: "GOOD" }
    );
    return response.data;
  },

  // List incidents
  listIncidents: async (roomId, page = 0, size = 10) => {
    const response = await apiClient.get(
      `${ADMIN_ROOM_API_BASE}/${roomId}/incidents?page=${page}&size=${size}`,
    );
    return response.data;
  },

  // Search inventory for replacement
  searchInventory: async ({
    branchId = null,
    keyword = '',
    inStockOnly = true,
    page = 0,
    size = 10,
  } = {}) => {
    const params = new URLSearchParams();
    if (branchId !== null && branchId !== undefined) params.append('branchId', branchId);
    if (keyword) params.append('keyword', keyword);
    params.append('inStockOnly', String(inStockOnly));
    params.append('page', page);
    params.append('size', size);
    const response = await apiClient.get(`${ADMIN_ROOM_API_BASE}/inventory?${params.toString()}`);
    return response.data;
  },

  // List all furniture
  listFurniture: async (page = 0, size = 10) => {
    const response = await apiClient.get(`${FURNITURE_API_BASE}/list?page=${page}&size=${size}`);
    return response.data;
  },

  // Search furniture
  searchFurniture: async (keyword = '', page = 0, size = 10) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    params.append('page', page);
    params.append('size', size);

    const response = await apiClient.get(`${FURNITURE_API_BASE}/search?${params.toString()}`);
    return response.data;
  },

  // Furniture Inventory - List by branch with details (in-use, broken, stock, etc.)
  listFurnitureInventoryByBranch: async (branchId, page = 0, size = 10) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    const response = await apiClient.get(`/rooms-detail/furniture/branch/${branchId}?${params.toString()}`);
    return response.data;
  },

  // Furniture Inventory - Search by branch
  searchFurnitureInventoryByBranch: async (branchId, keyword = '', page = 0, size = 10) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    params.append('page', page);
    params.append('size', size);
    const response = await apiClient.get(`/rooms-detail/furniture/branch/${branchId}/search?${params.toString()}`);
    return response.data;
  },
};
