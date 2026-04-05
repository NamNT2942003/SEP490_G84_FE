import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import "./BranchManagement.css";


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
      setFormError(err?.response?.data?.error || err?.response?.data?.message || "Save branch failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (branch) => {
    const branchId = branch.branchId;
    if (!branchId) return;

    const confirmed = window.confirm(`Delete branch "${branch.branchName || branchId}"?`);
    if (!confirmed) return;

    try {
      await branchManagementApi.deleteBranch(branchId);
      await fetchBranches();
    } catch (err) {
      window.alert(err?.response?.data?.error || err?.response?.data?.message || "Delete branch failed.");
    }
  };

  return (
    <div className="branch-page">
      {/* Header */}
      <div className="branch-title-row">
        <div>
          <p className="branch-breadcrumb mb-1">
            <i className="bi bi-house me-1" />
            Admin
            <i className="bi bi-chevron-right mx-1" style={{ fontSize: "0.65rem" }} />
            Branch Management
          </p>
          <h4 className="branch-page-title">Branch Management</h4>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchBranches}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1" /> Refresh
          </button>
          <button type="button" className="btn btn-brand btn-sm" onClick={openCreateModal}>
            <i className="bi bi-plus-circle-fill me-1" />
            Add Branch
          </button>
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
            <button
              type="button"
              className="btn btn-brand btn-sm"
              onClick={handleSearch}
            >
              <i className="bi bi-search me-1" />Search
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleClearSearch}
            >
              Clear
            </button>
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
                  <td className="branch-value">{branch.branchName || "-"}</td>
                  <td className="branch-value">{branch.propertyType || "-"}</td>
                  <td>
                    <div className="branch-value">{branch.address || "-"}</div>
                    <div className="branch-meta">{branch.city || "-"}{branch.country ? `, ${countryCodeToName.get(branch.country) || branch.country}` : ""}</div>
                  </td>
                  <td className="branch-value">{branch.contactNumber || "-"}</td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => navigate(`/admin/branches/${branch.branchId}/cancellation-policies`)}
                        title="Cancellation Policy"
                      >
                        <i className="bi bi-shield-check me-1"></i>Cancellation Policy
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEditModal(branch)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(branch)}
                      >
                        Delete
                      </button>
                    </div>
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
                              {option.label}
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
                    <button type="button" className="btn btn-light" onClick={closeModal} disabled={submitLoading}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-brand" disabled={submitLoading}>
                      {submitLoading ? "Saving..." : editingBranch ? "Update" : "Create"}
                    </button>
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
