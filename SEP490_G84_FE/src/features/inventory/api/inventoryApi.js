import axios from "axios";

// Đảm bảo đúng Port backend của bạn (ở đây là 8081)
const API_URL = "http://localhost:8081/api/inventory";

export const inventoryApi = {
    // --- Các API có sẵn của bạn ---
    searchInventory: (params) => {
        return axios.get(`${API_URL}/search`, { params });
    },
    saveInventory: (data) => {
        return axios.post(API_URL, data);
    },
    deleteInventory: (id) => {
        return axios.delete(`${API_URL}/${id}`);
    },

    // ==========================================
    // --- CÁC API CHO MÀN BÁO CÁO & NHẬP KHO ---
    // ==========================================

    // 1. Lấy danh sách mặt hàng của 1 cơ sở để chọn lúc Nhập Kho
    getItemsByBranch: (branchId) => {
        return axios.get(`${API_URL}/branch/${branchId}/items`);
    },

    // 2. Nhập kho hàng loạt (Thay cho import cũ)
    // Payload có dạng: { branchId: 1, items: [{inventoryId: 1, quantity: 10}] }
    importInventory: (payload) => {
        return axios.post(`${API_URL}/import`, payload);
    },

    // 3. Lấy dữ liệu báo cáo tháng
    getReport: (month, year, branchId) => {
        return axios.get(`${API_URL}/report`, { params: { month, year, branchId } });
    },

    // 4. Lưu chốt sổ báo cáo tháng
    saveReport: (reportData) => {
        return axios.post(`${API_URL}/report/save`, reportData);
    },

    // 5. Lấy lịch sử nhập kho (Sửa lại path cho chuẩn backend)
    getImportHistory: () => {
        return axios.get(`${API_URL}/history`);
    }
};