import React, { useEffect, useState } from "react";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import roomInventoryManagementApi from "@/features/room-inventory-management/api/roomInventoryManagementApi";
import { parseApiError } from "@/utils/apiError";
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
  workDate: getToday(),
  fromDate: "",
  toDate: "",
  availability: "",
  price: "",
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
      workDate: item.workDate || "",
      fromDate: "",
      toDate: "",
      availability: item.availability,
      price: item.price,
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
    if (!formData.roomTypeId) return "roomTypeId is required.";

    if (formData.workDate) return "";

    if (!formData.fromDate || !formData.toDate) {
      return "fromDate and toDate are required when workDate is empty.";
    }

    if (formData.toDate < formData.fromDate) {
      return "toDate must be greater than or equal to fromDate.";
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
    if (!window.confirm("Delete this inventory record?")) return;

    try {
      await roomInventoryManagementApi.deleteInventory(inventoryId);
      await loadInventories();
    } catch (err) {
      window.alert(parseApiError(err, "Delete inventory failed."));
    }
  };

  return (
    <div className="ri-page">
      <div className="ri-title-row">
        <div>
          <p className="text-muted small mb-1">Admin / Room Inventory Management</p>
          <h4 className="mb-0">Room Inventory Management</h4>
        </div>
        <button type="button" className="btn btn-brand btn-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-circle me-1" /> Upsert Inventory
        </button>
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

          <button type="button" className="btn btn-brand btn-sm" onClick={loadInventories}>Search</button>
        </div>

        {error && <div className="alert alert-danger rounded-0 mb-0">{error}</div>}

        <div className="table-responsive">
          <table className="table ri-table mb-0">
            <thead>
              <tr>
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
                  <tr>
                    <td>{item.workDate || "-"}</td>
                    <td>{item.roomTypeName || item.roomTypeId || "-"}</td>
                    <td>{item.availability}</td>
                    <td>{formatVnd(item.basePrice)}</td>
                    <td>{formatVnd(item.price)}</td>
                    <td className={item.delta < 0 ? "text-success" : item.delta > 0 ? "text-danger" : "text-muted"}>
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
                    <td>{item.isClosed ? "Yes" : "No"}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button type="button" className="btn btn-outline-primary" onClick={() => openEditModal(item)}>Edit</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(item.inventoryId)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr className="ri-explain-row">
                    <td colSpan={10}>
                      <div className="ri-explain-box">
                        <div className="ri-explain-title">Giai thich tinh gia</div>
                        <div className="ri-explain-note">{item.priceCalculation?.notes || "Khong co ghi chu tinh gia."}</div>
                        {(item.priceCalculation?.steps || []).length > 0 ? (
                          <div className="ri-steps-list">
                            {item.priceCalculation.steps.map((step, idx) => (
                              <div className="ri-step-item" key={`${item.inventoryId}-step-${idx}`}>
                                <div className="fw-semibold">
                                  {step.name || `Step ${idx + 1}`}
                                  {step.type ? ` (${step.type})` : ""}
                                </div>
                                <div className="small text-muted">
                                  applied: {step.applied ? "yes" : "no"}
                                  {step.adjustmentType ? ` | adjustmentType: ${step.adjustmentType}` : ""}
                                  {step.adjustmentValue !== undefined && step.adjustmentValue !== null ? ` | adjustmentValue: ${step.adjustmentValue}` : ""}
                                </div>
                                {step.reason && <div className="small">reason: {step.reason}</div>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="small text-muted mt-1">Khong co steps chi tiet.</div>
                        )}
                      </div>
                    </td>
                  </tr>
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
                      <div className="col-md-6">
                        <label className="form-label">Room Type *</label>
                        <select className="form-select" name="roomTypeId" value={formData.roomTypeId} onChange={handleFormChange}>
                          <option value="">Select room type</option>
                          {roomTypes.map((r) => <option key={r.roomTypeId} value={r.roomTypeId}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Work Date</label>
                        <input type="date" className="form-control" name="workDate" value={formData.workDate} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">From Date</label>
                        <input type="date" className="form-control" name="fromDate" value={formData.fromDate} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">To Date</label>
                        <input type="date" className="form-control" name="toDate" value={formData.toDate} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Availability</label>
                        <input type="number" min="0" className="form-control" name="availability" value={formData.availability} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Price</label>
                        <input type="number" min="0" className="form-control" name="price" value={formData.price} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Min Stay</label>
                        <input type="number" min="1" className="form-control" name="minStay" value={formData.minStay} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-6 d-flex align-items-end">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" name="isClosed" checked={formData.isClosed} onChange={handleFormChange} id="inventory-closed" />
                          <label className="form-check-label" htmlFor="inventory-closed">Closed</label>
                        </div>
                      </div>
                    </div>
                    <div className="small text-muted mt-3">
                      Rule: if workDate is provided, backend will ignore fromDate/toDate.
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

