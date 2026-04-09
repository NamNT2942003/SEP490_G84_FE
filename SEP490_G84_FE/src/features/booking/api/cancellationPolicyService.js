import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/cancellation-policies';

export const cancellationPolicyService = {
    getPoliciesByBranch: async (branchId) => {
        if (!branchId) return [];
        const response = await axios.get(`${BASE_URL}/branch/${branchId}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    }
};
