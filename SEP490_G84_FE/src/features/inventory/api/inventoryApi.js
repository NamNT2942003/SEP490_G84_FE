const BASE_URL = 'http://localhost:8081/api/inventory-report';

export const inventoryApi = {
    /** Lấy tổng quan 12 tháng trong năm */
    getYearOverview: async (branchId, year) => {
        const res = await fetch(`${BASE_URL}/overview?branchId=${branchId}&year=${year}`);
        if (!res.ok) throw new Error('Error fetching inventory year overview');
        return res.json();
    },

    /** Lấy báo cáo chi tiết 1 tháng */
    getMonthlyReport: async (branchId, year, month) => {
        const res = await fetch(`${BASE_URL}/report?branchId=${branchId}&year=${year}&month=${month}`);
        if (!res.ok) throw new Error('Error fetching inventory monthly report');
        return res.json();
    },

    /** Lấy danh sách mặt hàng kho (cho dropdown) */
    getInventoryItems: async (branchId) => {
        const res = await fetch(`${BASE_URL}/items?branchId=${branchId}`);
        if (!res.ok) throw new Error('Error fetching inventory items');
        return res.json();
    },

    /** Tạo đơn nhập hàng */
    createImportReceipt: async (branchId, payload) => {
        const res = await fetch(`${BASE_URL}/receipt?branchId=${branchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error creating import receipt');
        return res.json();
    },

    /** Chốt báo cáo tháng */
    saveMonthlyReport: async (payload) => {
        const res = await fetch(`${BASE_URL}/report/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error saving monthly report');
    },

    /** Mở lại báo cáo đã chốt */
    unsaveMonthlyReport: async (branchId, year, month) => {
        const res = await fetch(
            `${BASE_URL}/report/unsave?branchId=${branchId}&year=${year}&month=${month}`,
            { method: 'POST' }
        );
        if (!res.ok) throw new Error('Error unsaving monthly report');
    },
};
