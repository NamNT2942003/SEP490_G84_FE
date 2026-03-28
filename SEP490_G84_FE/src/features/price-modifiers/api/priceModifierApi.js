import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/apiConfig";

export const priceModifierApi = {
    getModifiersByRoomType: async (roomTypeId) => {
        const response = await apiClient.get(`${API_ENDPOINTS.PRICE_MODIFIERS.BASE}/room-type/${roomTypeId}`);
        return response.data;
    },
    
    createModifier: async (config) => {
        const response = await apiClient.post(`${API_ENDPOINTS.PRICE_MODIFIERS.BASE}`, config);
        return response.data;
    },
    
    updateModifier: async (id, config) => {
        const response = await apiClient.put(`${API_ENDPOINTS.PRICE_MODIFIERS.BASE}/${id}`, config);
        return response.data;
    },
    
    toggleModifier: async (id) => {
        const response = await apiClient.put(`${API_ENDPOINTS.PRICE_MODIFIERS.BASE}/${id}/toggle`);
        return response.data;
    },
    
    deleteModifier: async (id) => {
        const response = await apiClient.delete(`${API_ENDPOINTS.PRICE_MODIFIERS.BASE}/${id}`);
        return response.data;
    }
};
