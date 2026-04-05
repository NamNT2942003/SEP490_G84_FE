import apiClient from '@/services/apiClient';

export const reportApi = {
    // Monthly room revenue
    getRoomRevenue: async (branchId, month, year) => {
        try {
            const { data } = await apiClient.get('/reports/room-revenue', {
                params: { branchId, month, year }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getYearlyRevenue: async (branchId, year) => {
        try {
            const { data } = await apiClient.get('/reports/yearly-revenue', {
                params: { branchId, year }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // Yearly room dashboard
    getYearlyRoomDashboard: async (branchId, year) => {
        try {
            const { data } = await apiClient.get('/reports/yearly-room-dashboard', {
                params: { branchId, year }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getMultiBranchDashboard: async (branchIds, month, year) => {
        try {
            const { data } = await apiClient.get('/reports/multi-branch', {
                params: { branchIds, month, year },
                paramsSerializer: { indexes: null } // sends branchIds=1&branchIds=2
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getYearlyMultiBranchDashboard: async (branchIds, year) => {
        try {
            const { data } = await apiClient.get('/reports/multi-branch/yearly', {
                params: { branchIds, year },
                paramsSerializer: { indexes: null }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // Service revenue
    getYearlyServiceRevenue: async (branchId, year) => {
        try {
            const { data } = await apiClient.get('/reports/services/yearly', {
                params: { branchId, year }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getMonthlyServiceRevenue: async (branchId, month, year) => {
        try {
            const { data } = await apiClient.get('/reports/services/monthly', {
                params: { branchId, month, year }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // Expense reports
    getYearlyExpenses: async (branchId, year) => {
        try {
            const { data } = await apiClient.get('/reports/expenses/yearly', {
                params: { branchId, year }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getMonthlyExpenses: async (branchId, month, year) => {
        try {
            const { data } = await apiClient.get('/reports/expenses/monthly', {
                params: { branchId, month, year }
            });
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    saveMonthlyExpenses: async (dataPayload) => {
        try {
            const { data } = await apiClient.post('/reports/expenses/save', dataPayload);
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getReportBranches: async () => {
        try {
            const { data } = await apiClient.get('/reports/branches');
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }
};