import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import Buttons from "@/components/ui/Buttons";
import { COLORS } from "@/constants";
import Swal from "sweetalert2";
import "./BranchManagement.css";

const translatePropertyType = (val) => {
  if (!val) return val;
  const lower = val.toLowerCase();
  if (lower.includes("khách sạn")) return "Hotel";
  if (lower.includes("nhà nghỉ")) return "Motel";
  if (lower.includes("căn hộ")) return "Apartment";
  if (lower.includes("nhà khách")) return "Guesthouse";
  if (lower.includes("khu nghỉ dưỡng")) return "Resort";
  if (lower.includes("Homestay")) return "HomeStay";
  // fallback for codes or already-English labels
  if (val === "HOTEL") return "Hotel";
  if (val === "MOTEL") return "Motel";
  if (val === "APARTMENT") return "Apartment";
  if (val === "GUESTHOUSE") return "Guesthouse";
  if (val === "RESORT") return "Resort";
  if (val === "HOMESTAY") return "HomeStay";
  return val;
};

const EMPTY_FORM = {
  branchName: "",
  propertyType: "",
  address: "",
  country: "VN",
  city: "",
  contactNumber: "",
};

const FORM_FIELDS = [
  { key: "branchName", label: "Branch name", required: true },
  { key: "address", label: "Address" },
  { key: "contactNumber", label: "Contact number" },
];

export default function BranchManagement() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([]);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);
  const [propertyTypeError, setPropertyTypeError] = useState("");
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [geoLib, setGeoLib] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await branchManagementApi.listBranches();
      setBranches(data || []);
    } catch (err) {
      setBranches([]);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to load branch list.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  React.useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        setLoadingPropertyTypes(true);
        setPropertyTypeError("");
        const options = await branchManagementApi.getPropertyTypeOptions();
        setPropertyTypeOptions(options || []);
      } catch (err) {
        setPropertyTypeOptions([]);
        setPropertyTypeError(
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Cannot load property types."
        );
      } finally {
        setLoadingPropertyTypes(false);
      }
    };

    fetchPropertyTypes();
  }, []);

  React.useEffect(() => {
    const loadGeoData = async () => {
      if (!showFormModal || geoLib) return;
      try {
        setGeoLoading(true);
        setGeoError("");
        const module = await import("country-state-city");
        const countries = module.Country.getAllCountries()
          .map((country) => ({
            value: country.isoCode,
            label: country.name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setGeoLib(module);
        setCountryOptions(countries);
      } catch (err) {
        setGeoError("Cannot load country/city data.");
      } finally {
        setGeoLoading(false);
      }
    };

    loadGeoData();
  }, [showFormModal, geoLib]);

  React.useEffect(() => {
    if (!geoLib || !formData.country) {
      setCityOptions([]);
      return;
    }
    const cities = geoLib.City.getCitiesOfCountry(formData.country) || [];
    const options = cities
      .map((city) => ({
        value: city.name,
        label: city.name,
      }))
      .filter((opt, idx, arr) => arr.findIndex((o) => o.value === opt.value) === idx)
      .sort((a, b) => a.label.localeCompare(b.label));
    setCityOptions(options);
  }, [geoLib, formData.country]);

  const filteredBranches = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return branches;

    return branches.filter((branch) =>
      [
        branch.branchName,
        branch.address,
        branch.city,
        branch.country,
        branch.contactNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [branches, search]);

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branchName: branch.branchName || "",
      propertyType: branch.propertyType || "",
      address: branch.address || "",
      country: branch.country || "VN",
      city: branch.city || "",
      contactNumber: branch.contactNumber || "",
    });
    setFormError("");
    setShowFormModal(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setShowFormModal(false);
    setFormError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "country") {
        return { ...prev, country: value, city: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const selectedCountryOption = useMemo(
    () => countryOptions.find((option) => option.value === formData.country) || null,
    [countryOptions, formData.country]
  );

  const selectedCityOption = useMemo(
    () => cityOptions.find((option) => option.value === formData.city) || null,
    [cityOptions, formData.city]
  );

  const handleCountrySelect = (option) => {
    setFormData((prev) => ({
      ...prev,
      country: option?.value || "",
      city: "",
    }));
  };

  const handleCitySelect = (option) => {
    setFormData((prev) => ({
      ...prev,
      city: option?.value || "",
    }));
  };

  const countryCodeToName = useMemo(() => {
    const lookup = new Map();
    countryOptions.forEach((option) => {
      lookup.set(option.value, option.label);
    });
    return lookup;
  }, [countryOptions]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
  };

  const handleClearSearch = () => {
    setInputVal("");
    setSearch("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.branchName.trim()) {
      setFormError("Branch name is required.");
      return;
    }

    if (!formData.country.trim()) {
      setFormError("Country is required.");
      return;
    }

    if (!formData.city.trim()) {
      setFormError("City is required.");
      return;
    }

    try {
      setSubmitLoading(true);
      setFormError("");

      if (editingBranch?.branchId) {
        await branchManagementApi.updateBranch(editingBranch.branchId, formData);
      } else {
        await branchManagementApi.createBranch(formData);
      }

      setShowFormModal(false);
      await fetchBranches();
    } catch (err) {
      console.error('[BranchManagement] saveBranch failed:', {
        mode: editingBranch?.branchId ? 'update' : 'create',
        branchId: editingBranch?.branchId,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      setFormError(err?.response?.data?.error || err?.response?.data?.message || "Save branch failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (branch) => {
    const branchId = branch.branchId;
    if (!branchId) return;

    const result = await Swal.fire({
      title: 'Delete Branch?',
      text: `"${branch.branchName || branchId}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: COLORS.PRIMARY,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    try {
      await branchManagementApi.deleteBranch(branchId);
      await fetchBranches();
      Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Branch has been removed.', timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('[BranchManagement] deleteBranch failed:', {
        branchId,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      Swal.fire({ icon: 'error', title: 'Failed', text: err?.response?.data?.error || err?.response?.data?.message || 'Delete branch failed.' });
    }
  };

  return (
    <div className="branch-page">
      {/* Header */}
      <div className="branch-title-row">
        <div>
          <h4 className="branch-page-title">Branch Management</h4>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Buttons variant="outline" className="btn-sm" icon={<i className="bi bi-arrow-clockwise" />} onClick={fetchBranches} isLoading={loading}>
            Refresh
          </Buttons>
          <Buttons variant="primary" className="btn-sm" icon={<i className="bi bi-plus-circle-fill" />} onClick={openCreateModal}>
            Add Branch
          </Buttons>
        </div>
      </div>

      {/* Table card */}
      <div className="branch-table-card">
        {/* Toolbar */}
        <div className="branch-toolbar">
          <div className="input-group" style={{ maxWidth: 340 }}>
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              type="text"
              className="form-control no-left-border"
              placeholder="Search by name, city, country, address..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
            />
          </div>
          <div className="d-flex gap-2">
            <Buttons variant="primary" className="btn-sm" icon={<i className="bi bi-search" />} onClick={handleSearch}>
              Search
            </Buttons>
            <Buttons variant="outline" className="btn-sm" onClick={handleClearSearch}>
              Clear
            </Buttons>
          </div>
          <span className="text-muted ms-auto" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
            {loading ? "Loading..." : `${filteredBranches.length} branch(es)`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger rounded-0 mb-0 border-0 py-2 px-4" role="alert">
            <i className="bi bi-exclamation-circle me-1" /> {error}
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="table branch-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Property type</th>
                <th>Address</th>
                <th>Contact</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="branch-empty text-center py-4">
                    <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
                    Loading branches...
                  </td>
                </tr>
              )}
              {!loading && filteredBranches.length === 0 && (
                <tr>
                  <td colSpan={5} className="branch-empty text-center py-4">
                    No branch data.
                  </td>
                </tr>
              )}
              {!loading && filteredBranches.map((branch) => (
                <tr key={branch.branchId || `${branch.branchName}-${branch.address}`}>
                  <td>
                    <div className="fw-semibold" style={{ color: COLORS.PRIMARY }}>{branch.branchName || "-"}</div>
                    {branch.branchId && <div className="text-muted" style={{ fontSize: "0.72rem" }}>ID #{branch.branchId}</div>}
                  </td>
                    <td className="branch-value">{translatePropertyType(branch.propertyType) || "-"}</td>
                  <td>
                    <div className="branch-value">{branch.address || "-"}</div>
                    <div className="branch-meta">{branch.city || "-"}{branch.country ? `, ${countryCodeToName.get(branch.country) || branch.country}` : ""}</div>
                  </td>
                  <td className="branch-value">{branch.contactNumber || "-"}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary me-1"
                      style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                      onClick={() => navigate(`/admin/branches/${branch.branchId}/cancellation-policies`)}
                      title="Cancellation Policy"
                    >
                      <i className="bi bi-shield-check me-1" />Policy
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary me-1"
                      style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                      onClick={() => openEditModal(branch)}
                    >
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                      onClick={() => handleDelete(branch)}
                    >
                      <i className="bi bi-trash me-1" />Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header border-bottom">
                    <h5 className="modal-title branch-modal-title mb-0">
                      {editingBranch ? "Update Branch" : "Create Branch"}
                    </h5>
                    <button type="button" className="btn-close" onClick={closeModal} disabled={submitLoading} />
                  </div>

                  <div className="modal-body">
                    {formError && (
                      <div className="alert alert-danger py-2" role="alert">
                        {formError}
                      </div>
                    )}

                    {propertyTypeError && (
                      <div className="alert alert-warning py-2" role="alert">
                        {propertyTypeError}
                      </div>
                    )}

                    {geoError && (
                      <div className="alert alert-warning py-2" role="alert">
                        {geoError}
                      </div>
                    )}

                    {editingBranch && (
                      <div className="branch-system-field mb-3">
                        <div className="branch-system-label">Channel property ID</div>
                        <div className="branch-system-value">
                          {editingBranch.channelPropertyId || "Not generated yet"}
                        </div>
                        <small className="text-muted">
                          This value is managed by the system and synced from backend.
                        </small>
                      </div>
                    )}

                    {!editingBranch && (
                      <div className="alert alert-info py-2" role="alert">
                        Channel property ID will be auto-generated by the system after creating branch.
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Property type</label>
                        <select
                          className="form-select"
                          name="propertyType"
                          value={formData.propertyType}
                          onChange={handleFormChange}
                          disabled={submitLoading || loadingPropertyTypes}
                        >
                          <option value="">
                            {loadingPropertyTypes ? "Loading property types..." : "Select property type"}
                          </option>
                          {propertyTypeOptions.map((option) => (
                            <option key={option.code || option.value} value={option.value}>
                                {translatePropertyType(option.label)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Country *</label>
                        <Select
                          classNamePrefix="branch-select"
                          options={countryOptions}
                          value={selectedCountryOption}
                          onChange={handleCountrySelect}
                          isDisabled={submitLoading || geoLoading}
                          isSearchable
                          placeholder="Select country"
                          noOptionsMessage={() => "No country found"}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">City *</label>
                        <Select
                          classNamePrefix="branch-select"
                          options={cityOptions}
                          value={selectedCityOption}
                          onChange={handleCitySelect}
                          isDisabled={submitLoading || geoLoading || !formData.country}
                          isSearchable
                          placeholder={formData.country ? "Select city" : "Select country first"}
                          noOptionsMessage={() => "No city found"}
                        />
                      </div>

                      {FORM_FIELDS.map((field) => (
                        <div className="col-md-6" key={field.key}>
                          <label className="form-label">
                            {field.label}{field.required ? " *" : ""}
                          </label>
                          <input
                            className="form-control"
                            name={field.key}
                            value={formData[field.key]}
                            onChange={handleFormChange}
                            required={field.required}
                            disabled={submitLoading}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-footer border-top">
                    <Buttons variant="outline" className="btn-sm" onClick={closeModal} disabled={submitLoading}>
                      Cancel
                    </Buttons>
                    <Buttons variant="primary" type="submit" className="btn-sm" isLoading={submitLoading}>
                      {editingBranch ? "Update" : "Create"}
                    </Buttons>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}