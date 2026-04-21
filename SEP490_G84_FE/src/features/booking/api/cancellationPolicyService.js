import apiClient from '@/services/apiClient';

const BASE_URL = '/cancellation-policies';

/**
 * Kiểm tra một policy có nằm trong seasonal window của ngày checkIn không.
 * - activeTimeStart / activeTimeEnd là chuỗi "MM-DD" (vd: "08-01")
 * - Nếu null → áp dụng cả năm
 * - Hỗ trợ range vượt năm (vd: 08-01 → 05-01)
 */
const isActivePolicyOnDate = (policy, checkInDate) => {
    if (!policy.active) return false;
    if (!checkInDate) return true; // không có ngày → không lọc season
    const { activeTimeStart, activeTimeEnd } = policy;
    if (!activeTimeStart || !activeTimeEnd) return true; // không giới hạn mùa

    const toMonthDay = (md) => {
        const [mm, dd] = md.split('-').map(Number);
        return mm * 100 + dd; // vd: 0801, 0501
    };
    const checkDate = new Date(checkInDate);
    const checkMD = (checkDate.getMonth() + 1) * 100 + checkDate.getDate();
    const start = toMonthDay(activeTimeStart);
    const end = toMonthDay(activeTimeEnd);

    if (start <= end) {
        // range trong cùng năm: start <= checkMD <= end
        return checkMD >= start && checkMD <= end;
    } else {
        // range vượt năm: checkMD >= start OR checkMD <= end
        return checkMD >= start || checkMD <= end;
    }
};

export const cancellationPolicyService = {
    getPoliciesByBranch: async (branchId) => {
        if (!branchId) return [];
        const response = await apiClient.get(`${BASE_URL}/branch/${branchId}`);
        return response.data;
    },

    /**
     * Fallback client-side: gọi getPoliciesByBranch rồi lọc local.
     * Dùng khi endpoint /active chưa deploy hoặc trả lỗi 404.
     * @param {number} branchId
     * @param {string|null} checkIn - ISO date string "YYYY-MM-DD" hoặc null
     */
    getActivePoliciesClientSide: async (branchId, checkIn) => {
        if (!branchId) return [];
        const response = await apiClient.get(`${BASE_URL}/branch/${branchId}`);
        const all = Array.isArray(response.data) ? response.data : [];
        return all.filter(p => isActivePolicyOnDate(p, checkIn || null));
    },

    /**
     * Lấy danh sách policy đang active và nằm trong seasonal window của ngày check-in.
     * Thử endpoint /active trước; nếu 404 / lỗi network thì fallback về client-side filter.
     * @param {number} branchId
     * @param {string|null} checkIn - ISO date string "YYYY-MM-DD"
     */
    getActivePoliciesForDate: async (branchId, checkIn) => {
        if (!branchId) return [];
        try {
            const params = checkIn ? { checkIn } : {};
            const response = await apiClient.get(`${BASE_URL}/branch/${branchId}/active`, { params });
            return Array.isArray(response.data) ? response.data : [];
        } catch (err) {
            // Nếu backend chưa có endpoint /active (404) thì dùng client-side filter
            const status = err?.response?.status;
            if (status === 404 || status === 405 || !err.response) {
                console.warn('[CancellationPolicyService] /active endpoint unavailable, falling back to client-side filter.');
                const response = await apiClient.get(`${BASE_URL}/branch/${branchId}`);
                const all = Array.isArray(response.data) ? response.data : [];
                return all.filter(p => isActivePolicyOnDate(p, checkIn || null));
            }
            throw err;
        }
    },

    getById: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    },
};
