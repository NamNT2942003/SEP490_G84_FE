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
    BY_BRANCH: "/room-types/by-branch",
  },
};
