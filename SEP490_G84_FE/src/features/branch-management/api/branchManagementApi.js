import apiClient from "@/services/apiClient";

const BRANCH_API_BASE = "/branches";
const ENUM_OPTIONS_API_BASE = "/enum-options";

const normalizeBranch = (branch = {}) => ({
  branchId: branch.branchId ?? branch.id,
  branchName: branch.branchName ?? branch.name ?? "",
  propertyType: branch.propertyType ?? "",
  address: branch.address ?? "",
  city: branch.city ?? "",
  country: branch.country ?? "",
  timezone: branch.timezone ?? "",
  currency: branch.currency ?? "",
  contactNumber: branch.contactNumber ?? "",
  channelPropertyId: branch.channelPropertyId ?? "",
});

const normalizeEnumOption = (option = {}) => ({
  code: option.code ?? "",
  value: option.value ?? option.code ?? "",
  label: option.label ?? option.value ?? option.code ?? "",
});

const toBranchRequest = (payload = {}) => ({
  branchName: (payload.branchName || "").trim(),
  propertyType: (payload.propertyType || "").trim(),
  address: (payload.address || "").trim(),
  city: (payload.city || "").trim(),
  contactNumber: (payload.contactNumber || "").trim(),
});

const branchManagementApi = {
  listBranches: async () => {
    const response = await apiClient.get(BRANCH_API_BASE);
    return Array.isArray(response.data) ? response.data.map(normalizeBranch) : [];
  },

  getBranchById: async (branchId) => {
    const response = await apiClient.get(`${BRANCH_API_BASE}/${branchId}`);
    return normalizeBranch(response.data);
  },

  createBranch: async (payload) => {
    const response = await apiClient.post(BRANCH_API_BASE, toBranchRequest(payload));
    return normalizeBranch(response.data);
  },

  updateBranch: async (branchId, payload) => {
    const response = await apiClient.put(`${BRANCH_API_BASE}/${branchId}`, toBranchRequest(payload));
    return normalizeBranch(response.data);
  },

  deleteBranch: async (branchId) => {
    await apiClient.delete(`${BRANCH_API_BASE}/${branchId}`);
  },

  getPropertyTypeOptions: async () => {
    const response = await apiClient.get(`${ENUM_OPTIONS_API_BASE}/property-types`);
    return Array.isArray(response.data) ? response.data.map(normalizeEnumOption) : [];
  },
};

export default branchManagementApi;