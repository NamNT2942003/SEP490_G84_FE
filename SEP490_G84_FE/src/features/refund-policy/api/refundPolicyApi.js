import apiClient from "@/services/apiClient";

const BASE = "/cancellation-policies";

const refundPolicyApi = {
    getByBranch: async (branchId) => {
        const res = await apiClient.get(`${BASE}/branch/${branchId}`);
        return res.data;
    },
    getById: async (id) => {
        const res = await apiClient.get(`${BASE}/${id}`);
        return res.data;
    },
    create: async (dto) => {
        const res = await apiClient.post(BASE, dto);
        return res.data;
    },
    update: async (id, dto) => {
        const res = await apiClient.put(`${BASE}/${id}`, dto);
        return res.data;
    },
    toggle: async (id) => {
        const res = await apiClient.put(`${BASE}/${id}/toggle`);
        return res.data;
    },
    delete: async (id) => {
        const res = await apiClient.delete(`${BASE}/${id}`);
        return res.data;
    },
};

export default refundPolicyApi;
