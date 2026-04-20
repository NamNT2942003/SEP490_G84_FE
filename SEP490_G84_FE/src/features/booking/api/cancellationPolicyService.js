import apiClient from '@/services/apiClient';

const BASE_URL = '/cancellation-policies';

/**
 * Client-side seasonal filter — mirror backend isActiveOnDate().
 * Dùng làm fallback khi endpoint /active chưa available.
 */
function isPolicyActiveOnDate(policy, checkInDateStr) {
    if (!policy.active) return false;
    const { activeTimeStart, activeTimeEnd } = policy;
    if (!activeTimeStart || !activeTimeEnd) return true;

    let checkMM, checkDD;
    if (checkInDateStr) {
        const parts = checkInDateStr.split('-');
        checkMM = parseInt(parts[1], 10);
        checkDD = parseInt(parts[2], 10);
    } else {
        const now = new Date();
        checkMM = now.getMonth() + 1;
        checkDD = now.getDate();
    }
    const checkVal = checkMM * 100 + checkDD;
    const [sMM, sDD] = activeTimeStart.split('-').map(Number);
    const [eMM, eDD] = activeTimeEnd.split('-').map(Number);
    const startVal = sMM * 100 + sDD;
    const endVal   = eMM * 100 + eDD;

    if (startVal <= endVal) {
        return checkVal >= startVal && checkVal <= endVal;
    } else {
        return checkVal >= startVal || checkVal <= endVal;
    }
}

export const cancellationPolicyService = {
    getPoliciesByBranch: async (branchId) => {
        if (!branchId) return [];
        const response = await apiClient.get(`${BASE_URL}/branch/${branchId}`);
        return response.data;
    },

    /**
     * Lấy policy active cho ngày check-in.
     * Thử endpoint /active trước; nếu 404 (chưa deploy) thì fallback client-side filter.
     */
    getActivePoliciesForDate: async (branchId, checkIn) => {
        if (!branchId) return [];
        try {
            const params = checkIn ? { checkIn } : {};
            const response = await apiClient.get(`${BASE_URL}/branch/${branchId}/active`, { params });
            return Array.isArray(response.data) ? response.data : [];
        } catch (err) {
            // Fallback: nếu endpoint /active chưa có → lấy all rồi filter FE
            if (err?.response?.status === 404) {
                console.warn('[CancellationPolicyService] /active endpoint not found, falling back to client-side filter');
                const res = await apiClient.get(`${BASE_URL}/branch/${branchId}`);
                const all = Array.isArray(res.data) ? res.data : [];
                return all.filter(p => isPolicyActiveOnDate(p, checkIn || null));
            }
            throw err;
        }
    },

    getById: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    }
};

