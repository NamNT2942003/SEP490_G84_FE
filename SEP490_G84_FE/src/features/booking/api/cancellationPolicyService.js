import apiClient from '@/services/apiClient';

const BASE_URL = '/cancellation-policies';

export const cancellationPolicyService = {
    getPoliciesByBranch: async (branchId) => {
        if (!branchId) return [];
        const response = await apiClient.get(`${BASE_URL}/branch/${branchId}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    }
};
