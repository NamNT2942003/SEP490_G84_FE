import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import enumOptionsApi from "@/features/common/api/enumOptionsApi";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import ratePlanManagementApi from "@/features/rate-plan-management/api/ratePlanManagementApi";
import ratePlanConditionApi from "@/features/rate-plan-management/api/ratePlanConditionApi";
import { parseApiError } from "@/utils/apiError";
import "./RatePlanConditionManagement.css";

const EMPTY_FORM = {
  conditionType: "ADVANCE_BOOKING",
  minValue: "",
  maxValue: "",
  startDate: "",
  endDate: "",
  dayOfWeek: "",
  occupancyCount: "",
  active: true,
  priorityOrder: 0,
};

const toDisplayValue = (value) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

export default function RatePlanConditionManagement() {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialRatePlanId = query.get("ratePlanId") || "";
  const initialRoomTypeId = query.get("roomTypeId") || "";

  const [branches, setBranches] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [conditions, setConditions] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState(initialRoomTypeId);
  const [ratePlanId, setRatePlanId] = useState(initialRatePlanId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [conditionTypeOptions, setConditionTypeOptions] = useState([]);
  const [dayOfWeekOptions, setDayOfWeekOptions] = useState([]);
  const [ratePlanRules, setRatePlanRules] = useState({});

  const loadBranches = async () => {
    try {
      const data = await branchManagementApi.listBranches();
      setBranches(data || []);
    } catch (err) {
      setError(parseApiError(err, "Failed to load branches."));
    }
  };

  const loadRoomTypes = async (selectedBranchId) => {
    if (!selectedBranchId) {
      setRoomTypes([]);
      setRoomTypeId("");
      return;
    }

    try {
      const data = await roomTypeManagementApi.listRoomTypesByBranch(selectedBranchId);
      setRoomTypes(data || []);
    } catch (err) {
      setRoomTypes([]);
      setError(parseApiError(err, "Failed to load room types."));
    }
  };

  const loadRatePlans = useCallback(async (selectedRoomTypeId) => {
    if (!selectedRoomTypeId) {
      setRatePlans([]);
      setRatePlanId("");
      return;
    }

    try {
      const data = await ratePlanManagementApi.listRatePlans(selectedRoomTypeId);
      setRatePlans(data || []);

      if (initialRatePlanId && String(initialRatePlanId) !== String(ratePlanId)) {
        setRatePlanId(initialRatePlanId);
      }
    } catch (err) {
      setRatePlans([]);
      setError(parseApiError(err, "Failed to load rate plans."));
    }
  }, [initialRatePlanId, ratePlanId]);

  const loadConditions = async (selectedRatePlanId) => {
    if (!selectedRatePlanId) {
      setConditions([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await ratePlanConditionApi.listByRatePlan(selectedRatePlanId);
      setConditions(data || []);
    } catch (err) {
      setConditions([]);
      setError(parseApiError(err, "Failed to load conditions."));
    } finally {
      setLoading(false);
    }
  };

  const loadMetaData = async () => {
    try {
      const [types, dayOptions, rules] = await Promise.all([
        enumOptionsApi.getRatePlanConditionTypes(),
        enumOptionsApi.getDayOfWeekOptions(),
        enumOptionsApi.getRatePlanInputRules(),
      ]);

      setConditionTypeOptions(types || []);
      setDayOfWeekOptions(dayOptions || []);
      setRatePlanRules(rules || {});

      if (types.length > 0) {
        setFormData((prev) => ({
          ...prev,
          conditionType: prev.conditionType || types[0].value || types[0].code,
        }));
      }
    } catch (err) {
      console.error("Load condition metadata failed:", err);
    }
  };

  useEffect(() => {
    loadBranches();
    loadMetaData();
  }, []);

  useEffect(() => {
    if (!branches.length) return;

    if (roomTypeId) {
      const matched = roomTypes.find((item) => String(item.roomTypeId) === String(roomTypeId));
      if (matched?.branchId) {
        setBranchId(String(matched.branchId));
      }
    }
  }, [branches, roomTypes, roomTypeId]);

  useEffect(() => {
    loadRoomTypes(branchId);
  }, [branchId]);

  useEffect(() => {
    loadRatePlans(roomTypeId);
  }, [roomTypeId, loadRatePlans]);

  useEffect(() => {
    loadConditions(ratePlanId);
  }, [ratePlanId]);

  const resetForm = () => {
    setFormData((prev) => ({
      ...EMPTY_FORM,
      conditionType: conditionTypeOptions[0]?.value || conditionTypeOptions[0]?.code || prev.conditionType || EMPTY_FORM.conditionType,
    }));
    setFormError("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    if (!ratePlanId) {
      window.alert("Please select a rate plan first.");
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      conditionType: item.conditionType || "ADVANCE_BOOKING",
      minValue: item.minValue ?? "",
      maxValue: item.maxValue ?? "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      dayOfWeek: item.dayOfWeek || "",
      occupancyCount: item.occupancyCount ?? "",
      active: item.active !== false,
      priorityOrder: item.priorityOrder ?? 0,
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setShowModal(false);
    resetForm();
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const conditionValues = conditionTypeOptions.map((opt) => opt.value || opt.code);
    if (conditionValues.length > 0 && !conditionValues.includes(formData.conditionType)) {
      return "Condition type is invalid.";
    }

    if (formData.minValue !== "" && formData.maxValue !== "" && Number(formData.minValue) > Number(formData.maxValue)) {
      return "Min value must be less than or equal to max value.";
    }

    if (formData.conditionType === "DATE_RANGE") {
      if (!formData.startDate || !formData.endDate) {
        return "DATE_RANGE requires startDate and endDate.";
      }
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        return "End date must be after or equal to start date.";
      }
    }

    if (formData.conditionType === "DAY_OF_WEEK" && !String(formData.dayOfWeek || "").trim()) {
      return "DAY_OF_WEEK requires dayOfWeek.";
    }

    if (formData.conditionType === "DAY_OF_WEEK" && dayOfWeekOptions.length > 0) {
      const dayValues = dayOfWeekOptions.map((opt) => opt.value || opt.code);
      if (!dayValues.includes(formData.dayOfWeek)) {
        return "Day of week is invalid.";
      }
    }

    if (formData.conditionType === "OCCUPANCY") {
      const occupancyCount = Number(formData.occupancyCount);
      const minOccupancy = Number(ratePlanRules?.occupancyCount?.min ?? 1);
      if (!Number.isFinite(occupancyCount) || occupancyCount < minOccupancy) {
        return "OCCUPANCY requires occupancyCount greater than 0.";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ratePlanId) {
      setFormError("Rate plan is required.");
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormError("");

      if (editingItem?.conditionId) {
        await ratePlanConditionApi.updateCondition(editingItem.conditionId, formData);
      } else {
        await ratePlanConditionApi.createCondition(ratePlanId, formData);
      }

      setShowModal(false);
      resetForm();
      await loadConditions(ratePlanId);
    } catch (err) {
      setFormError(parseApiError(err, "Save condition failed."));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (conditionId) => {
    if (!window.confirm("Delete this condition?")) return;

    try {
      await ratePlanConditionApi.deleteCondition(conditionId);
      await loadConditions(ratePlanId);
    } catch (err) {
      window.alert(parseApiError(err, "Delete condition failed."));
    }
  };

  const handleDeleteAll = async () => {
    if (!ratePlanId) return;
    if (!window.confirm("Delete all conditions of this rate plan?")) return;

    try {
      await ratePlanConditionApi.deleteByRatePlan(ratePlanId);
      await loadConditions(ratePlanId);
    } catch (err) {
      window.alert(parseApiError(err, "Delete all conditions failed."));
    }
  };

  return (
    <div className="rpc-page">
      <div className="rpc-title-row">
        <div>
          <p className="text-muted small mb-1">Admin / Rate Plan Condition Management</p>
          <h4 className="mb-0">Rate Plan Condition Management</h4>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDeleteAll} disabled={!ratePlanId || loading}>
            <i className="bi bi-trash me-1" /> Delete All
          </button>
          <button type="button" className="btn btn-brand btn-sm" onClick={openCreateModal}>
            <i className="bi bi-plus-circle me-1" /> Add Condition
          </button>
        </div>
      </div>

      <div className="rpc-card card">
        <div className="rpc-toolbar">
          <select className="form-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
          </select>

          <select className="form-select" value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} disabled={!branchId}>
            <option value="">Select room type</option>
            {roomTypes.map((r) => <option key={r.roomTypeId} value={r.roomTypeId}>{r.name}</option>)}
          </select>

          <select className="form-select" value={ratePlanId} onChange={(e) => setRatePlanId(e.target.value)} disabled={!roomTypeId}>
            <option value="">Select rate plan</option>
            {ratePlans.map((rp) => <option key={rp.ratePlanId} value={rp.ratePlanId}>{rp.name}</option>)}
          </select>

          <span className="small text-muted ms-auto">{loading ? "Loading..." : `${conditions.length} condition(s)`}</span>
        </div>

        {error && <div className="alert alert-danger rounded-0 mb-0">{error}</div>}

        <div className="table-responsive">
          <table className="table rpc-table mb-0">
            <thead>
              <tr>
                <th>Type</th>
                <th>Range</th>
                <th>Date Range</th>
                <th>Day Of Week</th>
                <th>Occupancy</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>}
              {!loading && conditions.length === 0 && <tr><td colSpan={8} className="text-center py-4 text-muted">No condition data.</td></tr>}
              {!loading && conditions.map((item) => (
                <tr key={item.conditionId}>
                  <td>{item.conditionType}</td>
                  <td>{toDisplayValue(item.minValue)} - {toDisplayValue(item.maxValue)}</td>
                  <td>{item.startDate || "-"} {item.endDate ? `-> ${item.endDate}` : ""}</td>
                  <td>{item.dayOfWeek || "-"}</td>
                  <td>{toDisplayValue(item.occupancyCount)}</td>
                  <td>{item.priorityOrder ?? 0}</td>
                  <td>
                    <span className={`badge ${item.active ? "bg-success" : "bg-secondary"}`}>
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button type="button" className="btn btn-outline-primary" onClick={() => openEditModal(item)}>Edit</button>
                      <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(item.conditionId)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingItem ? "Update Condition" : "Create Condition"}</h5>
                    <button type="button" className="btn-close" onClick={closeModal} disabled={submitLoading} />
                  </div>
                  <div className="modal-body">
                    {formError && <div className="alert alert-danger py-2">{formError}</div>}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Condition Type *</label>
                        <select className="form-select" name="conditionType" value={formData.conditionType} onChange={handleFormChange}>
                          {conditionTypeOptions.length === 0 && <option value="">No options</option>}
                          {conditionTypeOptions.map((opt) => (
                            <option key={opt.code || opt.value} value={opt.value || opt.code}>{opt.label || opt.value}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Min Value</label>
                        <input type="number" className="form-control" name="minValue" value={formData.minValue} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Max Value</label>
                        <input type="number" className="form-control" name="maxValue" value={formData.maxValue} onChange={handleFormChange} />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-control" name="startDate" value={formData.startDate} onChange={handleFormChange} />
                        <div className="form-text">Required for DATE_RANGE.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-control" name="endDate" value={formData.endDate} onChange={handleFormChange} />
                        <div className="form-text">Must be after or equal to Start Date.</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Day Of Week</label>
                        <select className="form-select" name="dayOfWeek" value={formData.dayOfWeek} onChange={handleFormChange}>
                          <option value="">Select day</option>
                          {dayOfWeekOptions.map((opt) => (
                            <option key={opt.code || opt.value} value={opt.value || opt.code}>{opt.label || opt.value}</option>
                          ))}
                        </select>
                        <div className="form-text">Required for DAY_OF_WEEK.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Occupancy Count</label>
                        <input type="number" min={ratePlanRules?.occupancyCount?.min ?? 1} className="form-control" name="occupancyCount" value={formData.occupancyCount} onChange={handleFormChange} />
                        <div className="form-text">Required for OCCUPANCY. Min: {ratePlanRules?.occupancyCount?.min ?? 1}</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Priority Order</label>
                        <input type="number" min="0" className="form-control" name="priorityOrder" value={formData.priorityOrder} onChange={handleFormChange} />
                      </div>

                      <div className="col-md-6 d-flex align-items-center pt-4">
                        <div className="form-check form-switch">
                          <input
                            id="condition-active"
                            className="form-check-input"
                            type="checkbox"
                            name="active"
                            checked={Boolean(formData.active)}
                            onChange={handleFormChange}
                          />
                          <label className="form-check-label" htmlFor="condition-active">Active</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-light" onClick={closeModal} disabled={submitLoading}>Cancel</button>
                    <button type="submit" className="btn btn-brand" disabled={submitLoading}>{submitLoading ? "Saving..." : "Save"}</button>
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

