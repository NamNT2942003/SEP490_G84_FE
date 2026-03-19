import apiClient from "../../../services/api.js";
import { API_ENDPOINTS } from "../../../constants/apiConfig.js";
import { cleanSearchResults, cleanRoomTypeDetail } from "./searchResults.js";

export const roomService = {
    searchRooms: async (params) => {
        // ensure required parameters are present, apply sensible defaults
        const searchParams = { ...params };
        if (searchParams.branchId === undefined || searchParams.branchId === null) {
            searchParams.branchId = 1;
        }

        const queryParams = new URLSearchParams();

        Object.keys(searchParams).forEach((key) => {
            const value = searchParams[key];
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach((v) => queryParams.append(key, v));
                } else {
                    queryParams.append(key, value);
                }
            }
        });

        const queryString = queryParams.toString();

        const response = await apiClient.get(
            `${API_ENDPOINTS.ROOMS.SEARCH}?${queryString}`,
        );
        // Clean circular references before returning
        return cleanSearchResults(response.data);
    },

    getRoomDetail: async (roomTypeId) => {
        const detailPath = API_ENDPOINTS.ROOM_TYPES.DETAIL_EXTENDED.replace(":id", roomTypeId);
        const response = await apiClient.get(
            detailPath,
        );
        // Clean circular references before returning
        return cleanRoomTypeDetail(response.data);
    },

    getAvailableRatePlans: async ({ roomTypeId, checkInDate, checkOutDate, guestCount }) => {
        const response = await apiClient.get(API_ENDPOINTS.RATE_PLAN_CONDITIONS.AVAILABLE, {
            params: {
                roomTypeId,
                checkInDate,
                checkOutDate,
                guestCount,
            },
        });

        const data = response.data || {};
        const ratePlans = (data.ratePlans || []).map((plan) => ({
            ratePlanId: plan.ratePlanId,
            name: plan.name,
            price: plan.price,
            cancellationType: plan.cancellationType,
            freeCancelBeforeDays: plan.freeCancelBeforeDays,
            paymentType: plan.paymentType,
            priorityOrder: plan.priorityOrder,
            conditionCount: plan.conditionCount,
        }));

        return {
            success: Boolean(data.success),
            roomTypeId: data.roomTypeId,
            checkInDate: data.checkInDate,
            checkOutDate: data.checkOutDate,
            guestCount: data.guestCount,
            ratePlans,
            count: data.count ?? ratePlans.length,
        };
    },
};