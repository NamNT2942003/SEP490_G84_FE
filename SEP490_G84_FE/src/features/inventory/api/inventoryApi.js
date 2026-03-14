import axios from "axios";

const API_URL = "http://localhost:8081/api/inventory"; // Đảm bảo đúng Port backend của bạn

export const inventoryApi = {
    // Gọi hàm search từ Service/Repo bạn vừa viết
    searchInventory: (params) => {
        return axios.get(`${API_URL}/search`, { params });
    },

    saveInventory: (data) => {
        return axios.post(API_URL, data);
    },

    deleteInventory: (id) => {
        return axios.delete(`${API_URL}/${id}`);
    },


    importInventory: (id, addedQuantity) => {
        return axios.put(`${API_URL}/import/${id}?addedQuantity=${addedQuantity}`);
    },
    getReport: (month, year, branchId) => {
        return axios.get(`${API_URL}/report`, { params: { month, year, branchId } });
    },

    saveReport: (reportData) => {
        return axios.post(`${API_URL}/report/save`, reportData);
    },

    getImportHistory: () => {
        return axios.get(`${API_URL}/import-history`);
    }
};