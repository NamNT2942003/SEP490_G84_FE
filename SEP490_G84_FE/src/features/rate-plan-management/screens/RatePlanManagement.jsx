import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import enumOptionsApi from "@/features/common/api/enumOptionsApi";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import ratePlanManagementApi from "@/features/rate-plan-management/api/ratePlanManagementApi";
import { parseApiError } from "@/utils/apiError";
import "./RatePlanManagement.css";

const EMPTY_FORM = {
  name: "",
  price: 0,
  cancellationType: "REFUNDABLE",
  freeCancelBeforeDays: 0,
  paymentType: "PAY_AT_HOTEL",
  roomTypeId: "",
  active: true,
};

export default function RatePlanManagement() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cancellationTypeOptions, setCancellationTypeOptions] = useState([]);
  const [paymentTypeOptions, setPaymentTypeOptions] = useState([]);
  const [ratePlanRules, setRatePlanRules] = useState({});

  const loadBranches = async () => {
    try {
      setError("");
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

  const loadRatePlans = async (selectedRoomTypeId) => {
    if (!selectedRoomTypeId) {
      setRatePlans([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await ratePlanManagementApi.listRatePlans(selectedRoomTypeId);
      setRatePlans(data || []);
    } catch (err) {
      setRatePlans([]);
      setError(parseApiError(err, "Failed to load rate plans."));
    } finally {
      setLoading(false);
    }
  };

  const loadMetaData = async () => {
    try {
      const [cancellationOptions, paymentOptions, rules] = await Promise.all([
        enumOptionsApi.getRatePlanCancellationTypes(),
        enumOptionsApi.getRatePlanPaymentTypes(),
        enumOptionsApi.getRatePlanInputRules(),
      ]);

      setCancellationTypeOptions(cancellationOptions || []);
      setPaymentTypeOptions(paymentOptions || []);
      setRatePlanRules(rules || {});

      if (cancellationOptions.length > 0) {
        setFormData((prev) => ({
          ...prev,
          cancellationType: prev.cancellationType || cancellationOptions[0].value || cancellationOptions[0].code,
        }));
      }
      if (paymentOptions.length > 0) {
        setFormData((prev) => ({
          ...prev,
          paymentType: prev.paymentType || paymentOptions[0].value || paymentOptions[0].code,
        }));
      }
    } catch (err) {
      console.error("Load rate plan metadata failed:", err);
    }
  };

  useEffect(() => {
    loadBranches();
    loadMetaData();
  }, []);

  useEffect(() => {
    loadRoomTypes(branchId);
  }, [branchId]);

  useEffect(() => {
    loadRatePlans(roomTypeId);
  }, [roomTypeId]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      ...EMPTY_FORM,
      roomTypeId: roomTypeId || "",
      cancellationType: cancellationTypeOptions[0]?.value || cancellationTypeOptions[0]?.code || EMPTY_FORM.cancellationType,
      paymentType: paymentTypeOptions[0]?.value || paymentTypeOptions[0]?.code || EMPTY_FORM.paymentType,
    });
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      price: item.price || 0,
      cancellationType: item.cancellationType || "REFUNDABLE",
      freeCancelBeforeDays: item.freeCancelBeforeDays || 0,
      paymentType: item.paymentType || "PAY_AT_HOTEL",
      roomTypeId: item.roomTypeId || "",
      active: item.active !== false,
    });
    setFormError("");
    setShowFormModal(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setShowFormModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const price = Number(formData.price);
    const freeCancelBeforeDays = Number(formData.freeCancelBeforeDays);
    const minPrice = Number(ratePlanRules?.price?.minExclusive ?? ratePlanRules?.price?.min ?? 1);
    const minCancelDays = Number(ratePlanRules?.freeCancelBeforeDays?.min ?? 0);

    if (!formData.roomTypeId) {
      setFormError("Room type is required.");
      return;
    }

    if (!formData.name.trim()) {
      setFormError("Rate plan name is required.");
      return;
    }

    if (!Number.isFinite(price) || price < minPrice) {
      setFormError("Price must be greater than 0.");
      return;
    }

    const validCancellationValues = cancellationTypeOptions.map((opt) => opt.value || opt.code);
    if (validCancellationValues.length > 0 && !validCancellationValues.includes(formData.cancellationType)) {
      setFormError("Cancellation type must be REFUNDABLE or NON_REFUNDABLE.");
      return;
    }

    const validPaymentValues = paymentTypeOptions.map((opt) => opt.value || opt.code);
    if (validPaymentValues.length > 0 && !validPaymentValues.includes(formData.paymentType)) {
      setFormError("Payment type must be PREPAID or PAY_AT_HOTEL.");
      return;
    }

    if (!Number.isFinite(freeCancelBeforeDays) || freeCancelBeforeDays < minCancelDays) {
      setFormError(`Free cancel before days must be greater than or equal to ${minCancelDays}.`);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormError("");

      if (editingItem?.ratePlanId) {
        await ratePlanManagementApi.updateRatePlan(editingItem.ratePlanId, formData);
      } else {
        await ratePlanManagementApi.createRatePlan(formData);
      }

      setShowFormModal(false);
      await loadRatePlans(formData.roomTypeId);
      if (!roomTypeId) setRoomTypeId(String(formData.roomTypeId));
    } catch (err) {
      setFormError(parseApiError(err, "Save rate plan failed."));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (ratePlanId) => {
    if (!window.confirm("Delete this rate plan?")) return;

    try {
      await ratePlanManagementApi.deleteRatePlan(ratePlanId);
      await loadRatePlans(roomTypeId);
    } catch (err) {
      window.alert(parseApiError(err, "Delete rate plan failed."));
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-title-row">
        <div>
          <p className="text-muted small mb-1">Admin / Rate Plan Management</p>
          <h4 className="mb-0">Rate Plan Management</h4>
        </div>
        <button type="button" className="btn btn-brand btn-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-circle me-1" /> Add Rate Plan
        </button>
      </div>

      <div className="rp-card card">
        <div className="rp-toolbar">
          <select className="form-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
          </select>
          <select className="form-select" value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} disabled={!branchId}>
            <option value="">Select room type</option>
            {roomTypes.map((r) => <option key={r.roomTypeId} value={r.roomTypeId}>{r.name}</option>)}
          </select>
          <span className="small text-muted ms-auto">{loading ? "Loading..." : `${ratePlans.length} plan(s)`}</span>
        </div>

        {error && <div className="alert alert-danger rounded-0 mb-0">{error}</div>}

        <div className="table-responsive">
          <table className="table rp-table mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Cancellation</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Room Type</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>}
              {!loading && ratePlans.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">No rate plan data.</td></tr>}
              {!loading && ratePlans.map((item) => (
                <tr key={item.ratePlanId}>
                  <td>
                    <div className="fw-semibold">{item.name || "-"}</div>
                    <div className="small text-muted">{item.channelRatePlanId || "-"}</div>
                  </td>
                  <td>{Number(item.price || 0).toLocaleString("vi-VN")}</td>
                  <td>
                    {item.cancellationType}
                    {item.cancellationType === "REFUNDABLE" ? ` (${item.freeCancelBeforeDays || 0}d)` : ""}
                  </td>
                  <td>{item.paymentType}</td>
                  <td>
                    <span className={`badge ${item.active ? "bg-success" : "bg-secondary"}`}>
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{item.roomTypeName || item.roomTypeId}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(`/admin/rate-plan-conditions?ratePlanId=${item.ratePlanId}&roomTypeId=${item.roomTypeId}`)}
                      >
                        Conditions
                      </button>
                      <button type="button" className="btn btn-outline-primary" onClick={() => openEditModal(item)}>Edit</button>
                      <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(item.ratePlanId)}>Delete</button>
                    </div>
                  </td>
                </tr>
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
                    <h5 className="modal-title">{editingItem ? "Update Rate Plan" : "Create Rate Plan"}</h5>
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
                      <div className="col-md-6">
                        <label className="form-label">Name *</label>
                        <input className="form-control" name="name" value={formData.name} onChange={handleFormChange} />
                      </div>
                      {editingItem?.channelRatePlanId && (
                        <div className="col-md-6">
                          <label className="form-label">Channel Rate Plan ID</label>
                          <input className="form-control" value={editingItem.channelRatePlanId} readOnly />
                          <div className="form-text">Read-only. Managed by backend sync.</div>
                        </div>
                      )}
                      <div className="col-md-6">
                        <label className="form-label">Price</label>
                        <input type="number" min={ratePlanRules?.price?.min ?? 1} className="form-control" name="price" value={formData.price} onChange={handleFormChange} />
                        <div className="form-text">Must be greater than 0.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Cancellation Type</label>
                        <select className="form-select" name="cancellationType" value={formData.cancellationType} onChange={handleFormChange}>
                          {cancellationTypeOptions.length === 0 && <option value="">No options</option>}
                          {cancellationTypeOptions.map((opt) => (
                            <option key={opt.code || opt.value} value={opt.value || opt.code}>{opt.label || opt.value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Free Cancel Before Days</label>
                        <input type="number" min={ratePlanRules?.freeCancelBeforeDays?.min ?? 0} className="form-control" name="freeCancelBeforeDays" value={formData.freeCancelBeforeDays} onChange={handleFormChange} />
                        <div className="form-text">Min: {ratePlanRules?.freeCancelBeforeDays?.min ?? 0}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Payment Type</label>
                        <select className="form-select" name="paymentType" value={formData.paymentType} onChange={handleFormChange}>
                          {paymentTypeOptions.length === 0 && <option value="">No options</option>}
                          {paymentTypeOptions.map((opt) => (
                            <option key={opt.code || opt.value} value={opt.value || opt.code}>{opt.label || opt.value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 d-flex align-items-center pt-4">
                        <div className="form-check form-switch">
                          <input
                            id="rate-plan-active"
                            className="form-check-input"
                            type="checkbox"
                            checked={Boolean(formData.active)}
                            onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                          />
                          <label className="form-check-label" htmlFor="rate-plan-active">Active</label>
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

