const BASE_URL = 'http://localhost:8081/api/reports';

export const reportApi = {
    // API cũ lấy chi tiết tháng
    getRoomRevenue: async (branchId, month, year) => {
        try {
            const response = await fetch(`${BASE_URL}/room-revenue?branchId=${branchId}&month=${month}&year=${year}`);
            if (!response.ok) throw new Error('Error fetching monthly data');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },
    
    // API MỚI: Lấy tổng quan 12 tháng trong năm
    getYearlyRevenue: async (branchId, year) => {
        try {
            const response = await fetch(`${BASE_URL}/yearly-revenue?branchId=${branchId}&year=${year}`);
            if (!response.ok) throw new Error('Error fetching yearly data');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },


// ---- CÁC API MỚI QUẢN LÝ DOANH THU DỊCH VỤ ----
    getYearlyServiceRevenue: async (branchId, year) => {
        try {
            const response = await fetch(`${BASE_URL}/services/yearly?branchId=${branchId}&year=${year}`);
            if (!response.ok) throw new Error('Error fetching yearly data (Service)');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getMonthlyServiceRevenue: async (branchId, month, year) => {
        try {
            const response = await fetch(`${BASE_URL}/services/monthly?branchId=${branchId}&month=${month}&year=${year}`);
            if (!response.ok) throw new Error('Error fetching monthly data (Service)');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },
    // ---- CÁC API MỚI QUẢN LÝ CHI PHÍ VẬN HÀNH ----
    getYearlyExpenses: async (branchId, year) => {
        try {
            const response = await fetch(`${BASE_URL}/expenses/yearly?branchId=${branchId}&year=${year}`);
            if (!response.ok) throw new Error('Error fetching yearly expense report');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    getMonthlyExpenses: async (branchId, month, year) => {
        try {
            const response = await fetch(`${BASE_URL}/expenses/monthly?branchId=${branchId}&month=${month}&year=${year}`);
            if (!response.ok) throw new Error('Error fetching monthly expense report');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    saveMonthlyExpenses: async (dataPayload) => {
        try {
            const response = await fetch(`${BASE_URL}/expenses/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPayload)
            });
            if (!response.ok) throw new Error('Error saving expenses');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },
    
getReportBranches: async () => {
        try {
           
            const token = localStorage.getItem('accessToken'); 
            
            const response = await fetch(`${BASE_URL}/branches`, {
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });
            if (!response.ok) throw new Error('Error fetching branch list');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }



};