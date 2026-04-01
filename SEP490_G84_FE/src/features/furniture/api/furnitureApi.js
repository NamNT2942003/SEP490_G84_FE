import apiClient from '@/services/apiClient';

const ROOM_API_BASE = '/rooms';

export const furnitureApi = {
  listBranches: async () => {
    const response = await apiClient.get('/branches');
    return response.data;
  },

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

  listFurnitureInventoryByBranch: async (branchId, page = 0, size = 10, typeId = null) => {
    const params = new URLSearchParams();
    if (page !== undefined && page !== null) params.append('page', page);
    if (size !== undefined && size !== null) params.append('size', size);
    if (typeId) params.append('typeId', typeId);
    const response = await apiClient.get(`/rooms-detail/furniture/branch/${branchId}?${params.toString()}`);
    return response.data;
  },

  searchFurnitureInventoryByBranch: async (branchId, keyword = '', page = 0, size = 10, typeId = null) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (page !== undefined && page !== null) params.append('page', page);
    if (size !== undefined && size !== null) params.append('size', size);
    if (typeId) params.append('typeId', typeId);
    const response = await apiClient.get(`/rooms-detail/furniture/branch/${branchId}/search?${params.toString()}`);
    return response.data;
  },
};
