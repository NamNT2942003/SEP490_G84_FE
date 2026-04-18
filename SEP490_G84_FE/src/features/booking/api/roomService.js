import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/apiConfig";
import { cleanSearchResults, cleanRoomTypeDetail } from "./searchResults";

const DEFAULT_SEARCH_PARAMS = {
    branchId: 1,
    adults: 1,
    children: 0,
    sortPrice: "priceAsc",
    strictRateConditionMatching: false,
    page: 0,
    size: 10,
};

const normalizeSearchParams = (params = {}) => {
    const merged = { ...DEFAULT_SEARCH_PARAMS, ...params };
    if (!merged.checkIn || !merged.checkOut) {
        throw new Error("Both check-in and check-out dates are required for room search");
    }

    const queryParams = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
        if (key === "policy" && (value === undefined || value === null || value === "")) {
            queryParams.append(key, "");
            return;
        }
        if (value === undefined || value === null || value === "") return;
        if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
            return;
        }
        if (typeof value === "boolean") {
            queryParams.append(key, value ? "true" : "false");
            return;
        }
        queryParams.append(key, value);
    });
    return queryParams;
};

export const roomService = {
    searchRooms: async (params) => {
        const queryParams = normalizeSearchParams(params);
        const queryString = queryParams.toString();
        const response = await apiClient.get(`${API_ENDPOINTS.ROOMS.SEARCH}?${queryString}`);
        // Clean circular references before returning
        return cleanSearchResults(response.data);
    },

    getRoomDetail: async (roomTypeId) => {
        const detailPath = API_ENDPOINTS.ROOM_TYPES.DETAIL_EXTENDED.replace(":id", roomTypeId);
        const response = await apiClient.get(detailPath);
        // Clean circular references before returning
        return cleanRoomTypeDetail(response.data);
    },
};