import apiClient from '@/services/apiClient';

export const inventoryApi = {
    /** Get yearly overview (12 months) */
    getYearOverview: async (branchId, year) => {
        const { data } = await apiClient.get('/inventory-report/overview', {
            params: { branchId, year }
        });
        return data;
    },

    /** Get detailed monthly report */
    getMonthlyReport: async (branchId, year, month) => {
        const { data } = await apiClient.get('/inventory-report/report', {
            params: { branchId, year, month }
        });
        return data;
    },

    /** Get inventory items for dropdown */
    getInventoryItems: async (branchId) => {
        const { data } = await apiClient.get('/inventory-report/items', {
            params: { branchId }
        });
        return data;
    },

    /** Create import receipt */
    createImportReceipt: async (branchId, payload) => {
        const { data } = await apiClient.post('/inventory-report/receipt', payload, {
            params: { branchId }
        });
        return data;
    },

    /** Save/finalize monthly report */
    saveMonthlyReport: async (payload) => {
        await apiClient.post('/inventory-report/report/save', payload);
    },

    /** Unsave/reopen a finalized report */
    unsaveMonthlyReport: async (branchId, year, month) => {
        await apiClient.post('/inventory-report/report/unsave', null, {
            params: { branchId, year, month }
        });
    },
};
