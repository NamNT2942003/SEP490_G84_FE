import React, { useEffect, useState } from "react";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import roomInventoryManagementApi from "@/features/room-inventory-management/api/roomInventoryManagementApi";
import { parseApiError } from "@/utils/apiError";
import Buttons from "@/components/ui/Buttons";
import Swal from "sweetalert2";
import "./RoomInventoryManagement.css";

const getToday = () => new Date().toISOString().slice(0, 10);
const formatVnd = (value) => Number(value || 0).toLocaleString("vi-VN");

const EMPTY_FILTER = {
  roomTypeId: "",
  fromDate: getToday(),
  toDate: getToday(),
};

const EMPTY_FORM = {
  roomTypeId: "",
  dateMode: "single",
  workDate: getToday(),
  fromDate: "",
  toDate: "",
  isClosed: false,
  minStay: 1,
};

export default function RoomInventoryManagement() {
  const [branches, setBranches] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [filter, setFilter] = useState(EMPTY_FILTER);

  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

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
      setFilter(EMPTY_FILTER);
      return;
    }

    try {
      const data = await roomTypeManagementApi.listRoomTypesByBranch(selectedBranchId);
      setRoomTypes(data || []);
      setFilter(EMPTY_FILTER);
      setInventories([]);
    } catch (err) {
      setRoomTypes([]);
      setError(parseApiError(err, "Failed to load room types."));
    }
  };

  const loadInventories = async () => {
    if (!filter.roomTypeId) {
      setError("roomTypeId is required for inventory query.");
      setInventories([]);
      return;
    }

    if (filter.fromDate && filter.toDate && filter.toDate < filter.fromDate) {
      setError("toDate must be greater than or equal to fromDate.");
      setInventories([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await roomInventoryManagementApi.listInventories(filter);
      setInventories(data || []);
    } catch (err) {
      setInventories([]);
      setError(parseApiError(err, "Failed to load inventories."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadRoomTypes(branchId);
  }, [branchId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, roomTypeId: filter.roomTypeId || "" });
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      roomTypeId: item.roomTypeId || "",
      dateMode: "single",
      workDate: item.workDate || "",
      fromDate: "",
      toDate: "",
      isClosed: item.isClosed,
      minStay: item.minStay,
    });
    setFormError("");
    setShowFormModal(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setShowFormModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validateInventoryForm = () => {
    // ✅ Always validate roomTypeId regardless of date mode
    if (!formData.roomTypeId) return "Please select a Room Type.";

    if (formData.dateMode === "single" && !formData.workDate) {
      return "Please select a Work Date.";
    }

    const hasRange = formData.fromDate && formData.toDate;
    if (formData.dateMode === "range" && !hasRange) {
      return "Please select both From Date and To Date.";
    }

    if (formData.dateMode === "range" && hasRange && formData.toDate < formData.fromDate) {
      return "To Date must be greater than or equal to From Date.";
    }
    if (formData.minStay !== "" && Number(formData.minStay) < 1) {
      return "Min Stay must be at least 1.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validateInventoryForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormError("");

      if (editingItem?.inventoryId) {
        await roomInventoryManagementApi.updateInventory(editingItem.inventoryId, formData);
      } else {
        await roomInventoryManagementApi.upsertInventory(formData);
      }

      setShowFormModal(false);
      await loadInventories();
    } catch (err) {
      setFormError(parseApiError(err, "Save inventory failed."));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (inventoryId) => {
    const result = await Swal.fire({
      title: 'Delete Inventory?',
      text: "This inventory record will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete it'
    });
    if (!result.isConfirmed) return;

    try {
      await roomInventoryManagementApi.deleteInventory(inventoryId);
      await loadInventories();
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: parseApiError(err, "Delete inventory failed.") });
    }
  };

  return (
    <div className="ri-page">
      <div className="ri-title-row">
        <div>
          <p className="text-muted small mb-1">Admin / Room Inventory Management</p>
          <h4 className="mb-0">Room Inventory Management</h4>
        </div>
        <Buttons variant="primary" className="btn-sm" icon={<i className="bi bi-plus-circle me-1" />} onClick={openCreateModal}>
          Upsert Inventory
        </Buttons>
      </div>

      <div className="ri-card card">
        <div className="ri-toolbar">
          <select className="form-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
          </select>

          <select className="form-select" name="roomTypeId" value={filter.roomTypeId} onChange={handleFilterChange} disabled={!branchId}>
            <option value="">Select room type *</option>
            {roomTypes.map((r) => <option key={r.roomTypeId} value={r.roomTypeId}>{r.name}</option>)}
          </select>

          <input type="date" className="form-control" name="fromDate" value={filter.fromDate} onChange={handleFilterChange} />
          <input type="date" className="form-control" name="toDate" value={filter.toDate} onChange={handleFilterChange} />

          <Buttons variant="primary" className="btn-sm ms-2" onClick={loadInventories} isLoading={loading}>Search</Buttons>
        </div>

        {error && <div className="alert alert-danger rounded-0 mb-0">{error}</div>}

        <div className="table-responsive">
          <table className="table ri-table mb-0">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Date</th>
                <th>Room Type</th>
                <th>Availability</th>
                <th>Base Price</th>
                <th>Final Price</th>
                <th>Delta</th>
                <th>Applied Modifiers</th>
                <th>Min Stay</th>
                <th>Closed</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} className="text-center py-4">Loading...</td></tr>}
              {!loading && inventories.length === 0 && <tr><td colSpan={10} className="text-center py-4 text-muted">No inventory data.</td></tr>}
              {!loading && inventories.map((item) => (
                <React.Fragment key={item.inventoryId}>
                  <tr className={expandedRows[item.inventoryId] ? "border-bottom-0 bg-light" : ""}>
                    <td className="text-center align-middle">
                      <button
                        className="btn btn-sm btn-light border-0 shadow-none text-muted p-1"
                        onClick={() => toggleExpand(item.inventoryId)}
                        title="View price explanation"
                      >
                        <i className={`bi bi-chevron-${expandedRows[item.inventoryId] ? 'up' : 'down'}`}></i>
                      </button>
                    </td>
                    <td>{item.workDate || "-"}</td>
                    <td>{item.roomTypeName || item.roomTypeId || "-"}</td>
                    <td>{item.availability}</td>
                    <td>{formatVnd(item.basePrice)}</td>
                    <td className="fw-bold text-dark">{formatVnd(item.price)}</td>
                    <td className={item.delta < 0 ? "text-success fw-bold" : item.delta > 0 ? "text-danger fw-bold" : "text-muted"}>
                      {item.delta > 0 ? "+" : ""}{formatVnd(item.delta)}
                    </td>
                    <td>
                      <div className="ri-badge-wrap">
                        {(item.appliedPriceModifiers || []).length > 0 ? (item.appliedPriceModifiers || []).map((modifier) => (
                          <span className="ri-modifier-badge" key={`${item.inventoryId}-${modifier.priceModifierId || modifier.name}`}>
                            {modifier.name}
                          </span>
                        )) : <span className="text-muted small">None</span>}
                      </div>
                    </td>
                    <td>{item.minStay}</td>
                    <td>
                      {item.isClosed
                        ? <span className="badge bg-danger rounded-pill">Yes</span>
                        : <span className="badge bg-success rounded-pill">No</span>}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                        onClick={() => openEditModal(item)}
                      >
                        <i className="bi bi-pencil me-1" />Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                        onClick={() => handleDelete(item.inventoryId)}
                      >
                        <i className="bi bi-trash me-1" />Delete
                      </button>
                    </td>
                  </tr>
                  {expandedRows[item.inventoryId] && (
                    <tr className="ri-explain-row bg-light border-top-0">
                      <td></td>
                      <td colSpan={10} className="p-0 pb-3 pe-3">
                        <div className="ri-explain-box ms-0 bg-white shadow-sm border rounded-3 p-3 mt-1">
                          <div className="ri-explain-title fw-bold text-primary mb-2 border-bottom pb-2">
                            <i className="bi bi-calculator me-2"></i> Price Explanation
                          </div>
                          <div className="ri-explain-note text-muted small mb-3 fst-italic">
                            {item.priceCalculation?.notes || "No special notes."}
                          </div>
                          {(item.priceCalculation?.steps || []).length > 0 ? (
                            <div className="ri-steps-list d-flex flex-column gap-2">
                              {item.priceCalculation.steps.map((step, idx) => (
                                <div className="ri-step-item p-2 border rounded-2 bg-light" key={`${item.inventoryId}-step-${idx}`}>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div className="fw-semibold text-dark">
                                      <span className="badge bg-secondary me-2">Step {idx + 1}</span>
                                      {step.name || "Default Rule"}
                                      {step.type && <span className="text-muted fw-normal ms-1">({step.type})</span>}
                                    </div>
                                    <div>
                                      {step.applied
                                        ? <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Applied</span>
                                        : <span className="badge bg-secondary"><i className="bi bi-dash-circle me-1"></i>Ignored</span>}
                                    </div>
                                  </div>
                                  {step.adjustmentType && step.adjustmentValue !== undefined && step.applied && (
                                    <div className="small text-primary fw-semibold mt-1">
                                      <i className="bi bi-arrow-return-right me-1 text-muted"></i>
                                      Adjustment: {step.adjustmentType === 'PERCENT' ? `${step.adjustmentValue}%` : `+${formatVnd(step.adjustmentValue)} ₫`}
                                    </div>
                                  )}
                                  {step.reason && (
                                    <div className="small text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                                      <i className="bi bi-info-circle me-1"></i> {step.reason}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="small text-muted mt-1">No adjustments applied to the base price.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showFormModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingItem ? "Update Inventory" : "Upsert Inventory"}</h5>
                    <button type="button" className="btn-close" onClick={closeModal} disabled={submitLoading} />
                  </div>
                  <div className="modal-body">
                    {formError && <div className="alert alert-danger py-2">{formError}</div>}
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.82rem' }}>
                          <i className="bi bi-info-circle me-1"></i>
                          {!editingItem
                            ? <span><strong>Instructions:</strong> Select room type and date range, then input the fields. Room inventory and base price will sync automatically.</span>
                            : <span><strong>Instructions:</strong> Only modify <strong>Min Stay</strong> or <strong>Closed</strong> for the selected record.</span>}
                        </div>
                      </div>
                      {!editingItem && (
                        <>
                          <div className="col-12">
                            <label className="form-label mb-2">Applicable range</label>
                            <div className="d-flex gap-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="dateMode"
                                  id="date-mode-single"
                                  value="single"
                                  checked={formData.dateMode === "single"}
                                  onChange={handleFormChange}
                                />
                                <label className="form-check-label" htmlFor="date-mode-single">Single day</label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="dateMode"
                                  id="date-mode-range"
                                  value="range"
                                  checked={formData.dateMode === "range"}
                                  onChange={handleFormChange}
                                />
                                <label className="form-check-label" htmlFor="date-mode-range">Multiple days</label>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Room Type <span className="text-danger">*</span></label>
                            <select className="form-select" name="roomTypeId" value={formData.roomTypeId} onChange={handleFormChange}>
                              <option value="">-- Select Room Type --</option>
                              {roomTypes.map((r) => <option key={r.roomTypeId} value={r.roomTypeId}>{r.name}</option>)}
                            </select>
                          </div>
                          {formData.dateMode === "single" && (
                            <div className="col-md-6">
                              <label className="form-label">Work Date</label>
                              <input
                                type="date"
                                className="form-control"
                                name="workDate"
                                value={formData.workDate}
                                onChange={handleFormChange}
                              />
                            </div>
                          )}
                          {formData.dateMode === "range" && (
                            <>
                              <div className="col-md-6">
                                <label className="form-label">From Date</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  name="fromDate"
                                  value={formData.fromDate}
                                  onChange={handleFormChange}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">To Date</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  name="toDate"
                                  value={formData.toDate}
                                  onChange={handleFormChange}
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                      <div className="col-md-4">
                        <label className="form-label">Min Stay (nights)</label>
                        <input type="number" min="1" className="form-control" name="minStay" value={formData.minStay} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-4 d-flex align-items-end">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" name="isClosed" checked={formData.isClosed} onChange={handleFormChange} id="inventory-closed" />
                          <label className="form-check-label" htmlFor="inventory-closed">Mark as Closed</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <Buttons variant="outline" className="btn-sm" onClick={closeModal} disabled={submitLoading}>Cancel</Buttons>
                    <Buttons variant="primary" type="submit" className="btn-sm" isLoading={submitLoading}>Save</Buttons>
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
