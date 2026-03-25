export const API_BASE_URL = "http://localhost:8081/api";

export const API_ENDPOINTS = {
  ROOMS: {
    LIST: "/rooms",
    ALL: "/rooms/all",
    SEARCH: "/room-search/search",
    FLOORS: "/rooms/floors",
    TYPES: "/rooms/types",
    STATISTICS: "/rooms/statistics",
  },
  ROOM_DETAILS: {
    LIST: "/rooms-detail",
    DETAIL: "/rooms-detail",
  },
  BRANCHES: {
    LIST: "/branches",
    DETAIL: "/branches",
  },
  ROOM_TYPES: {
    LIST: "/room-types",
    DETAIL: "/room-types",
    DETAIL_EXTENDED: "/room-types/:id/detail",
    BY_BRANCH: "/room-types/by-branch",
  },
  RATE_PLANS: {
    LIST: "/admin/rate-plans",
    DETAIL: "/admin/rate-plans",
  },
  RATE_PLAN_CONDITIONS: {
    // NEW: Management APIs
    MANAGEMENT_CONDITIONS: "/management/rate-plans/:ratePlanId/conditions",
    // NEW: Booking APIs
    BOOKING_APPLICABLE: "/booking/rate-plans/applicable",
    // LEGACY: deprecated endpoints (for backward compatibility)
    AVAILABLE: "/rate-plan-conditions/available",
    BASE: "/rate-plan-conditions",
    BY_RATE_PLAN: "/rate-plan-conditions/rate-plan",
  },
  ROOM_TYPE_INVENTORIES: {
    LIST: "/admin/room-type-inventories",
    DETAIL: "/admin/room-type-inventories",
  },
};
