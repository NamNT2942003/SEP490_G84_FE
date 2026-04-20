import apiClient from '@/services/apiClient';

const BASE_URL = '/cancellation-policies';

export const cancellationPolicyService = {
    getPoliciesByBranch: async (branchId) => {
        if (!branchId) return [];
        const response = await apiClient.get(`${BASE_URL}/branch/${branchId}`);
        return response.data;
    },
    /**
     * Lấy danh sách policy đang active và nằm trong seasonal window của ngày check-in.
     * @param {number} branchId
     * @param {string} checkIn - ISO date string "YYYY-MM-DD"
     */
    getActivePoliciesForDate: async (branchId, checkIn) => {
        if (!branchId) return [];
        const params = checkIn ? { checkIn } : {};
        const response = await apiClient.get(`${BASE_URL}/branch/${branchId}/active`, { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    }
};

