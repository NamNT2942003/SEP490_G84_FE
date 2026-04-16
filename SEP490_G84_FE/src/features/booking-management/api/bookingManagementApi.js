import apiClient from "@/services/apiClient";

const ADMIN_BOOKING_BASE = "/admin/bookings";
const BOOKING_BASE = "/bookings";

const toNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const normalizeBooking = (item = {}) => {
    const status = (item.status || item.bookingStatus || "PENDING").toString().toUpperCase();
    const source = (item.source || item.bookingSource || "").toString();

    return {
        bookingId: item.bookingId || item.id || item.reservationId || "-",
        bookingCode: item.bookingCode || item.booking_code || item.code || "",
        customerName:
            item.customerName ||
            item.guestName ||
            item.customer?.name ||
            item.customer?.fullName ||
            "Unknown guest",
        customerEmail: item.customerEmail || item.customer?.email || "",
        customerPhone: item.customerPhone || item.customer?.phone || "",
        branchName: item.branchName || item.branch?.name || "-",
        roomCount: toNumber(item.roomCount ?? item.totalRooms ?? item.rooms?.length, 0),
        totalAmount: toNumber(item.totalAmount ?? item.grandTotal ?? item.amount, 0),
        checkInDate: item.checkInDate || item.arrival_date || item.arrivalDate || "",
        checkOutDate: item.checkOutDate || item.departure_date || item.departureDate || "",
        createdAt: item.createdAt || item.createdDate || item.bookingDate || "",
        status,
        source,
        raw: item,
    };
};

const mapPaginatedResponse = (data, size) => {
    if (Array.isArray(data?.content)) {
        return {
            content: data.content.map(normalizeBooking),
            totalElements: toNumber(data.totalElements, data.content.length),
            totalPages: toNumber(data.totalPages, 1),
            number: toNumber(data.number, 0),
            size: toNumber(data.size, size),
        };
    }

    if (Array.isArray(data?.bookings)) {
        return {
            content: data.bookings.map(normalizeBooking),
            totalElements: toNumber(data.pagination?.totalElements, data.bookings.length),
            totalPages: toNumber(data.pagination?.totalPages, 1),
            number: toNumber(data.pagination?.currentPage, 0),
            size: toNumber(data.pagination?.pageSize, size),
        };
    }

    if (Array.isArray(data?.data?.content)) {
        return {
            content: data.data.content.map(normalizeBooking),
            totalElements: toNumber(data.data.totalElements, data.data.content.length),
            totalPages: toNumber(data.data.totalPages, 1),
            number: toNumber(data.data.number, 0),
            size: toNumber(data.data.size, size),
        };
    }

    return { content: [], totalElements: 0, totalPages: 0, number: 0, size };
};

const shouldTryFallback = (error) => {
    const status = error?.response?.status;
    return status === 404 || status === 405;
};

const bookingManagementApi = {
    listBookings: async ({
                             page = 0,
                             size = 10,
                             search = "",
                             status = "",
                             branchId = "",
                             sourceType = "",
                             fromDate = "",
                             toDate = "",
                         } = {}) => {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("size", size);
        if (search) params.append("keyword", search);
        if (status) params.append("status", status);
        if (branchId) params.append("branchId", branchId);
        if (sourceType) params.append("sourceType", sourceType);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);

        const query = params.toString();
        const response = await apiClient.get(`${ADMIN_BOOKING_BASE}?${query}`);
        const data = response.data;

        if (data && data.content && Array.isArray(data.content)) {
            return {
                content: data.content.map(normalizeBooking),
                totalElements: toNumber(data.totalElements, data.content.length),
                totalPages: toNumber(data.totalPages, 1),
                number: toNumber(data.number, 0),
                size: toNumber(data.size, size),
            };
        }

        return { content: [], totalElements: 0, totalPages: 0, number: 0, size };
    },

    getBookingDetail: async (bookingId) => {
        const response = await apiClient.get(`${ADMIN_BOOKING_BASE}/${bookingId}`);
        return response.data;
    },

    updateBookingStatus: async (bookingId, newStatus) => {
        const response = await apiClient.patch(`${ADMIN_BOOKING_BASE}/${bookingId}/status`, {
            status: newStatus,
        });
        return response.data;
    },

    cancelBooking: async (bookingId) => {
        const response = await apiClient.post(`${ADMIN_BOOKING_BASE}/${bookingId}/cancel`, {});
        return response.data;
    },

    createBookingByStaff: async (payload) => {
        const response = await apiClient.post(`${ADMIN_BOOKING_BASE}/create`, payload);
        return response.data;
    },

    getBookingStatistics: async () => {
        const endpoints = [
            `${ADMIN_BOOKING_BASE}/statistics`,
            `${BOOKING_BASE}/statistics`,
            `${BOOKING_BASE}/stats`,
        ];

        let lastError;
        for (const endpoint of endpoints) {
            try {
                const response = await apiClient.get(endpoint);
                const data = response.data || {};

                return {
                    total: toNumber(data.totalBookings ?? data.total, 0),
                    confirmed: toNumber(data.confirmedBookings ?? data.confirmed, 0),
                    pending: toNumber(data.pendingBookings ?? data.pending, 0),
                    cancelled: toNumber(data.cancelledBookings ?? data.cancelled, 0),
                };
            } catch (error) {
                lastError = error;
                if (!shouldTryFallback(error)) {
                    throw error;
                }
            }
        }

        throw lastError;
    },
};

export default bookingManagementApi;