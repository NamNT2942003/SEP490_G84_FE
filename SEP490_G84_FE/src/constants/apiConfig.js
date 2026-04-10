export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://sep490-g84-1.onrender.com/api";

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
    LIST: "/public/branches",
    DETAIL: "/public/branches",
  },
  ROOM_TYPES: {
    LIST: "/room-types",
    DETAIL: "/room-types",
    DETAIL_EXTENDED: "/room-types/:id/detail",
    BY_BRANCH: "/room-types/by-branch",
  },
  ROOM_TYPE_INVENTORIES: {
    LIST: "/admin/room-type-inventories",
    DETAIL: "/admin/room-type-inventories",
  },
  BOOKING: {
    CREATE_FROM_FRONTEND: "/bookings/create-from-frontend",
  },
  PAYMENT: {
    CREATE: "/payment/create",
    STATUS: "/payment/status",
    STRIPE_SUCCESS: "/payment/stripe-success",
    STRIPE_WEBHOOK: "/payment/stripe-webhook",
    SEPAY_WEBHOOK: "/payment/sepay-webhook",
  },
  ENUM_OPTIONS: {
    BASE: "/enum-options",
  },
  PRICE_MODIFIERS: {
    BASE: "/price-modifiers",
  },
  GUEST: {
    REQUEST_ACCESS: "/guest/request-access",
    VERIFY_OTP: "/guest/verify-otp",
    BOOKINGS: "/guest/bookings",
  },
};