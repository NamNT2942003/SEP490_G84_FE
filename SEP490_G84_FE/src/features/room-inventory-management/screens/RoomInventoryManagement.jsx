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
      workDate: item.workDate || "",
      fromDate: "",
      toDate: "",
      availability: item.availability,
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
    if (!formData.roomTypeId) return "Vui lòng chọn loại phòng (Room Type).";

    const hasWorkDate = !!formData.workDate;
    const hasRange = formData.fromDate && formData.toDate;

    if (!hasWorkDate && !hasRange) {
      return "Vui lòng nhập Work Date hoặc khoảng ngày (From Date → To Date).";
    }

    if (!hasWorkDate && hasRange && formData.toDate < formData.fromDate) {
      return "To Date phải lớn hơn hoặc bằng From Date.";
    }

    if (formData.availability !== "" && Number(formData.availability) < 0) {
      return "Availability không được âm.";
    }
    if (formData.minStay !== "" && Number(formData.minStay) < 1) {
      return "Min Stay tối thiểu là 1.";
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
                        title="Xem lịch sử tính giá"
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
                      <div className="btn-group btn-group-sm">
                        <button type="button" className="btn btn-outline-primary" onClick={() => openEditModal(item)}>Edit</button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(item.inventoryId)}>Delete</button>
                      </div>
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
                            {item.priceCalculation?.notes || "Không có ghi chú đặc biệt."}
                          </div>
                          {(item.priceCalculation?.steps || []).length > 0 ? (
                            <div className="ri-steps-list d-flex flex-column gap-2">
                              {item.priceCalculation.steps.map((step, idx) => (
                                <div className="ri-step-item p-2 border rounded-2 bg-light" key={`${item.inventoryId}-step-${idx}`}>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div className="fw-semibold text-dark">
                                      <span className="badge bg-secondary me-2">Bước {idx + 1}</span>
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
                                      Biến động: {step.adjustmentType === 'PERCENT' ? `${step.adjustmentValue}%` : `+${formatVnd(step.adjustmentValue)} ₫`}
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
                            <div className="small text-muted mt-1">Không thấy thay đổi nào can thiệp vào giá.</div>
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
                          <strong>Chế độ ngày:</strong> Nhập <strong>Work Date</strong> cho 1 ngày cụ thể, hoặc nhập <strong>From Date + To Date</strong> cho khoảng nhiều ngày. Nếu có Work Date, From/To Date sẽ bị bỏ qua.
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Room Type <span className="text-danger">*</span></label>
                        <select className="form-select" name="roomTypeId" value={formData.roomTypeId} onChange={handleFormChange}>
                          <option value="">-- Chọn loại phòng --</option>
                          {roomTypes.map((r) => <option key={r.roomTypeId} value={r.roomTypeId}>{r.name}</option>)}
                        </select>
                      </div>
                      {/* Work Date (single day) */}
                      <div className="col-md-6">
                        <label className="form-label d-flex align-items-center gap-2">
                          Work Date (1 ngày cụ thể)
                          {formData.workDate && <span className="badge bg-primary" style={{fontSize:'0.65rem'}}>ĐANG DÙNG</span>}
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          name="workDate"
                          value={formData.workDate}
                          onChange={handleFormChange}
                        />
                      </div>
                      {/* Date Range */}
                      <div className="col-md-4">
                        <label className="form-label d-flex align-items-center gap-2">
                          From Date
                          {!formData.workDate && formData.fromDate && <span className="badge bg-success" style={{fontSize:'0.65rem'}}>ĐANG DÙNG</span>}
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          name="fromDate"
                          value={formData.fromDate}
                          onChange={handleFormChange}
                          disabled={!!formData.workDate}
                          style={formData.workDate ? {opacity:0.4} : {}}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label d-flex align-items-center gap-2">
                          To Date
                          {!formData.workDate && formData.toDate && <span className="badge bg-success" style={{fontSize:'0.65rem'}}>ĐANG DÙNG</span>}
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          name="toDate"
                          value={formData.toDate}
                          onChange={handleFormChange}
                          disabled={!!formData.workDate}
                          style={formData.workDate ? {opacity:0.4} : {}}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Availability (số phòng)</label>
                        <input type="number" min="0" className="form-control" name="availability" value={formData.availability} onChange={handleFormChange} placeholder="Để trống = không đổi" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label d-flex align-items-center gap-1">
                          Giá base
                          <span className="badge bg-secondary" style={{fontSize:'0.6rem', fontWeight:500}}>Tự động</span>
                        </label>
                        <div className="form-control bg-light text-muted" style={{cursor:'not-allowed', fontSize:'0.85rem'}}>
                          <i className="bi bi-lock-fill me-1 text-warning" style={{fontSize:'0.75rem'}}></i>
                          Lấy từ cấu hình Loại Phòng
                        </div>
                        <div className="form-text" style={{fontSize:'0.72rem'}}>
                          Giá cuối = Giá loại phòng ± PriceModifier theo ngày
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Min Stay (đêm)</label>
                        <input type="number" min="1" className="form-control" name="minStay" value={formData.minStay} onChange={handleFormChange} />
                      </div>
                      <div className="col-md-4 d-flex align-items-end">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" name="isClosed" checked={formData.isClosed} onChange={handleFormChange} id="inventory-closed" />
                          <label className="form-check-label" htmlFor="inventory-closed">Đóng phòng (Closed)</label>
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
