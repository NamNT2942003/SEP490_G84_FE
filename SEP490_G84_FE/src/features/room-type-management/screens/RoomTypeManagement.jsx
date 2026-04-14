import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import branchManagementApi from "@/features/branch-management/api/branchManagementApi";
import enumOptionsApi from "@/features/common/api/enumOptionsApi";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import { parseApiError } from "@/utils/apiError";
import Buttons from "@/components/ui/Buttons";
import Swal from "sweetalert2";
import apiClient from "@/services/apiClient";
import "./RoomTypeManagement.css";

const EMPTY_FORM = {
  name: "",
  maxAdult: 2,
  maxChildren: 0,
  basePrice: 0,
  image: "",
  description: "",
  area: "",
  bedType: "",
  bedCount: "",
  branchId: "",
};

/** Convert a backend image path like /api/profile/avatar/xxx to a full URL */
const toAbsoluteImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/api/")) {
    const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, "");
    return baseUrl + url;
  }
  return url;
};

export default function RoomTypeManagement() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [bedTypeOptions, setBedTypeOptions] = useState([]);
  const [roomTypeRules, setRoomTypeRules] = useState({});

  // Cover image upload in create/edit form
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const coverInputRef = useRef(null);

  // Image gallery modal state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryRoomType, setGalleryRoomType] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryFileRef = useRef(null);
  const galleryCoverFileRef = useRef(null);

  /* ======================== Data loading ======================== */

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
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await roomTypeManagementApi.listRoomTypesByBranch(selectedBranchId);
      setRoomTypes(data || []);
    } catch (err) {
      setRoomTypes([]);
      setError(parseApiError(err, "Failed to load room types."));
    } finally {
      setLoading(false);
    }
  };

  const loadMetaData = async () => {
    try {
      const [bedTypes, rules] = await Promise.all([
        enumOptionsApi.getRoomTypeBedTypes(),
        enumOptionsApi.getRoomTypeInputRules(),
      ]);
      setBedTypeOptions(bedTypes || []);
      setRoomTypeRules(rules || {});
    } catch (err) {
      console.error("Load room type metadata failed:", err);
    }
  };

  useEffect(() => {
    loadBranches();
    loadMetaData();
  }, []);

  useEffect(() => {
    loadRoomTypes(branchId);
  }, [branchId]);

  const selectedBranchName = useMemo(() => {
    const found = branches.find((b) => String(b.branchId) === String(branchId));
    return found?.branchName || "";
  }, [branches, branchId]);

  /* ======================== Create / Edit Modal ======================== */

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, branchId: branchId || "" });
    setFormError("");
    setCoverFile(null);
    setCoverPreview(null);
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      maxAdult: item.maxAdult || 0,
      maxChildren: item.maxChildren || 0,
      basePrice: item.basePrice || 0,
      image: item.image || "",
      description: item.description || "",
      area: item.area || "",
      bedType: item.bedType || "",
      bedCount: item.bedCount ?? "",
      branchId: item.branchId || "",
    });
    setFormError("");
    setCoverFile(null);
    setCoverPreview(item.image ? toAbsoluteImageUrl(item.image) : null);
    setShowFormModal(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setShowFormModal(false);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const maxAdult = Number(formData.maxAdult);
    const maxChildren = Number(formData.maxChildren);
    const basePrice = Number(formData.basePrice);
    const bedCount = Number(formData.bedCount);
    const area = Number(formData.area);

    const maxNameLength = Number(roomTypeRules?.name?.maxLength || 255);
    const minMaxAdult = Number(roomTypeRules?.maxAdult?.min ?? 1);
    const minMaxChildren = Number(roomTypeRules?.maxChildren?.min ?? 0);
    const minBasePrice = Number(roomTypeRules?.basePrice?.minExclusive ?? roomTypeRules?.basePrice?.min ?? 1);

    if (!formData.branchId) {
      setFormError("Branch is required.");
      return;
    }

    if (!formData.name.trim()) {
      setFormError("Room type name is required.");
      return;
    }

    if (formData.name.trim().length > maxNameLength) {
      setFormError(`Room type name cannot exceed ${maxNameLength} characters.`);
      return;
    }

    if (!Number.isFinite(maxAdult) || maxAdult < minMaxAdult) {
      setFormError(`Max adult must be greater than or equal to ${minMaxAdult}.`);
      return;
    }

    if (!Number.isFinite(maxChildren) || maxChildren < minMaxChildren) {
      setFormError(`Max children must be greater than or equal to ${minMaxChildren}.`);
      return;
    }

    if (!Number.isFinite(basePrice) || basePrice < minBasePrice) {
      setFormError(`Base price must be greater than ${Math.max(minBasePrice - 1, 0)}.`);
      return;
    }

    if (formData.area !== "" && formData.area !== null && formData.area !== undefined) {
      if (!Number.isFinite(area) || area <= 0) {
        setFormError("Area must be greater than 0 if provided.");
        return;
      }
    }

    if (formData.bedCount !== "" && formData.bedCount !== null && formData.bedCount !== undefined) {
      if (!Number.isFinite(bedCount) || bedCount <= 0) {
        setFormError("Bed count must be greater than 0 if provided.");
        return;
      }
    }

    if (formData.bedType && bedTypeOptions.length > 0) {
      const valid = bedTypeOptions.some((opt) => opt.value === formData.bedType || opt.code === formData.bedType);
      if (!valid) {
        setFormError("Bed type is not valid.");
        return;
      }
    }

    try {
      setSubmitLoading(true);
      setFormError("");

      let savedRoomType;
      if (editingItem?.roomTypeId) {
        savedRoomType = await roomTypeManagementApi.updateRoomType(editingItem.roomTypeId, formData);
      } else {
        savedRoomType = await roomTypeManagementApi.createRoomType(formData);
      }

      // Upload cover image if a new file was selected
      if (coverFile && savedRoomType?.roomTypeId) {
        try {
          await roomTypeManagementApi.uploadCoverImage(savedRoomType.roomTypeId, coverFile);
        } catch (uploadErr) {
          console.error("Cover upload failed:", uploadErr);
          // Don't block the save - room type is already created/updated
        }
      }

      setShowFormModal(false);
      setCoverFile(null);
      setCoverPreview(null);
      await loadRoomTypes(formData.branchId);
      if (!branchId) setBranchId(String(formData.branchId));
    } catch (err) {
      setFormError(parseApiError(err, "Save room type failed."));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (roomTypeId) => {
    const result = await Swal.fire({
      title: 'Delete Room Type?',
      text: "This room type will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete it'
    });
    if (!result.isConfirmed) return;

    try {
      await roomTypeManagementApi.deleteRoomType(roomTypeId);
      await loadRoomTypes(branchId);
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: parseApiError(err, "Delete room type failed.") });
    }
  };

  /* ======================== Gallery Modal ======================== */

  const openGalleryModal = async (item) => {
    setGalleryRoomType(item);
    setShowGalleryModal(true);
    setGalleryImages([]);
    setGalleryLoading(true);
    try {
      const images = await roomTypeManagementApi.getGallery(item.roomTypeId);
      setGalleryImages(images);
    } catch (err) {
      console.error("Load gallery failed:", err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const closeGalleryModal = () => {
    if (coverUploading || galleryUploading) return;
    setShowGalleryModal(false);
    setGalleryRoomType(null);
    setGalleryImages([]);
  };

  const handleGalleryCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !galleryRoomType) return;
    try {
      setCoverUploading(true);
      const result = await roomTypeManagementApi.uploadCoverImage(galleryRoomType.roomTypeId, file);
      setGalleryRoomType((prev) => ({ ...prev, image: result.imageUrl }));
      // Also update the table list
      setRoomTypes((prev) =>
        prev.map((rt) =>
          rt.roomTypeId === galleryRoomType.roomTypeId ? { ...rt, image: result.imageUrl } : rt
        )
      );
      Swal.fire({ icon: 'success', title: 'Cover updated!', timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: parseApiError(err, "Cover upload failed.") });
    } finally {
      setCoverUploading(false);
      if (galleryCoverFileRef.current) galleryCoverFileRef.current.value = "";
    }
  };

  const handleGalleryAdd = async (e) => {
    const file = e.target.files[0];
    if (!file || !galleryRoomType) return;
    try {
      setGalleryUploading(true);
      const newImage = await roomTypeManagementApi.addGalleryImage(galleryRoomType.roomTypeId, file);
      setGalleryImages((prev) => [...prev, newImage]);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Upload failed', text: parseApiError(err, "Gallery upload failed.") });
    } finally {
      setGalleryUploading(false);
      if (galleryFileRef.current) galleryFileRef.current.value = "";
    }
  };

  const handleGalleryDelete = async (imageId) => {
    if (!galleryRoomType) return;
    const result = await Swal.fire({
      title: 'Delete this photo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Delete'
    });
    if (!result.isConfirmed) return;
    try {
      await roomTypeManagementApi.deleteGalleryImage(galleryRoomType.roomTypeId, imageId);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: parseApiError(err, "Delete image failed.") });
    }
  };

  /* ======================== Render ======================== */

  return (
    <div className="rt-page">
      <div className="rt-title-row">
        <div>

          <h4 className="mb-0">Room Type Management</h4>
        </div>
        <Buttons variant="primary" className="btn-sm" icon={<i className="bi bi-plus-circle me-1" />} onClick={openCreateModal}>
          Add Room Type
        </Buttons>
      </div>

      <div className="rt-card card">
        <div className="rt-toolbar">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 fw-semibold">Branch</label>
            <select className="form-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
              ))}
            </select>
          </div>
          <span className="text-muted small">{selectedBranchName || "No branch selected"}</span>
        </div>

        {error && <div className="alert alert-danger rounded-0 mb-0">{error}</div>}

        <div className="table-responsive">
          <table className="table rt-table mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Occupancy</th>
                <th>Base Price</th>
                <th>Bed</th>
                <th>Area</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
              )}
              {!loading && roomTypes.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No room type data.</td></tr>
              )}
              {!loading && roomTypes.map((item) => (
                <tr key={item.roomTypeId}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {item.image ? (
                        <img
                          src={toAbsoluteImageUrl(item.image)}
                          alt={item.name}
                          className="rt-row-thumb"
                        />
                      ) : (
                        <div className="rt-row-thumb-placeholder">
                          <i className="bi bi-image" />
                        </div>
                      )}
                      <div>
                        <div className="fw-semibold">{item.name || "-"}</div>
                        <div className="small text-muted">{item.channelRoomTypeId || "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.maxAdult} Adult / {item.maxChildren} Children</td>
                  <td>{Number(item.basePrice || 0).toLocaleString("vi-VN")}</td>
                  <td>{item.bedType || "-"} x {item.bedCount || 0}</td>
                  <td>{item.area || "-"}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info me-1"
                      style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                      onClick={() => openGalleryModal(item)}
                      title="Manage Images"
                    >
                      <i className="bi bi-images me-1" />Images
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success me-1"
                      style={{ fontSize: "0.78rem", padding: "3px 10px" }}
                      onClick={() => navigate(`/admin/room-types/${item.roomTypeId}/price-modifiers`)}
                      title="Manage Pricing Rules"
                    >
                      <i className="bi bi-tag-fill me-1" />Pricing
                    </button>
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
                      onClick={() => handleDelete(item.roomTypeId)}
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

      {/* ==================== Create / Edit Modal ==================== */}
      {showFormModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingItem ? "Update Room Type" : "Create Room Type"}</h5>
                    <button type="button" className="btn-close" onClick={closeModal} disabled={submitLoading} />
                  </div>
                  <div className="modal-body">
                    {formError && <div className="alert alert-danger py-2">{formError}</div>}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Branch *</label>
                        <select className="form-select" name="branchId" value={formData.branchId} onChange={handleFormChange}>
                          <option value="">Select branch</option>
                          {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Name *</label>
                        <input className="form-control" name="name" value={formData.name} onChange={handleFormChange} />
                        <div className="form-text">Max {roomTypeRules?.name?.maxLength || 255} characters.</div>
                      </div>
                      {editingItem?.channelRoomTypeId && (
                        <div className="col-md-6">
                          <label className="form-label">Channel Room Type ID</label>
                          <input className="form-control" value={editingItem.channelRoomTypeId} readOnly />
                          <div className="form-text">Read-only. Managed by backend sync.</div>
                        </div>
                      )}
                      <div className="col-md-3">
                        <label className="form-label">Max Adult</label>
                        <input type="number" min={roomTypeRules?.maxAdult?.min ?? 1} className="form-control" name="maxAdult" value={formData.maxAdult} onChange={handleFormChange} />
                        <div className="form-text">Min: {roomTypeRules?.maxAdult?.min ?? 1}</div>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Max Children</label>
                        <input type="number" min={roomTypeRules?.maxChildren?.min ?? 0} className="form-control" name="maxChildren" value={formData.maxChildren} onChange={handleFormChange} />
                        <div className="form-text">Min: {roomTypeRules?.maxChildren?.min ?? 0}</div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Base Price</label>
                        <input type="number" min={roomTypeRules?.basePrice?.min ?? 1} className="form-control" name="basePrice" value={formData.basePrice} onChange={handleFormChange} />
                        <div className="form-text">Must be greater than 0.</div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Bed Type</label>
                        <select className="form-select" name="bedType" value={formData.bedType} onChange={handleFormChange}>
                          <option value="">Select bed type</option>
                          {bedTypeOptions.map((opt) => (
                            <option key={opt.code || opt.value} value={opt.value || opt.code}>{opt.label || opt.value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Bed Count</label>
                        <input type="number" min="1" className="form-control" name="bedCount" value={formData.bedCount} onChange={handleFormChange} />
                        <div className="form-text">Optional, but must be greater than 0 if provided.</div>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Area</label>
                        <input type="number" min="1" className="form-control" name="area" value={formData.area} onChange={handleFormChange} />
                        <div className="form-text">Optional, but must be greater than 0 if provided.</div>
                      </div>

                      {/* Cover Image Upload */}
                      <div className="col-md-8">
                        <label className="form-label">Cover Image</label>
                        <div className="rt-cover-upload-zone" onClick={() => coverInputRef.current?.click()}>
                          {coverPreview ? (
                            <img src={coverPreview} alt="Cover preview" className="rt-cover-preview" />
                          ) : (
                            <div className="rt-cover-placeholder">
                              <i className="bi bi-cloud-arrow-up" style={{ fontSize: "1.5rem" }} />
                              <span>Click to select cover image</span>
                            </div>
                          )}
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleCoverSelect}
                          />
                        </div>
                        {coverFile && (
                          <div className="form-text text-success">
                            <i className="bi bi-check-circle me-1" />
                            {coverFile.name} selected — will upload on save.
                          </div>
                        )}
                        {!coverFile && coverPreview && (
                          <div className="form-text">Current cover image. Select a new file to replace.</div>
                        )}
                      </div>

                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea className="form-control" rows={3} name="description" value={formData.description} onChange={handleFormChange} />
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

      {/* ==================== Gallery Modal ==================== */}
      {showGalleryModal && galleryRoomType && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-images me-2" />
                    Images — {galleryRoomType.name}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeGalleryModal} disabled={coverUploading || galleryUploading} />
                </div>
                <div className="modal-body">
                  {/* Cover section */}
                  <div className="rt-gallery-section">
                    <h6 className="rt-gallery-label">Cover Image (Main)</h6>
                    <div className="rt-gallery-cover-row">
                      <div
                        className="rt-gallery-cover"
                        onClick={() => !coverUploading && galleryCoverFileRef.current?.click()}
                        title="Click to change cover"
                      >
                        {coverUploading ? (
                          <div className="rt-gallery-cover-loading">
                            <span className="spinner-border spinner-border-sm" />
                            <span>Uploading...</span>
                          </div>
                        ) : galleryRoomType.image ? (
                          <img src={toAbsoluteImageUrl(galleryRoomType.image)} alt="Cover" />
                        ) : (
                          <div className="rt-gallery-cover-empty">
                            <i className="bi bi-cloud-arrow-up" />
                            <span>No cover image — click to upload</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={galleryCoverFileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleGalleryCoverUpload}
                      />
                    </div>
                  </div>

                  <hr />

                  {/* Gallery section */}
                  <div className="rt-gallery-section">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="rt-gallery-label mb-0">Gallery Photos ({galleryImages.length})</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={galleryUploading}
                        onClick={() => galleryFileRef.current?.click()}
                      >
                        {galleryUploading ? (
                          <><span className="spinner-border spinner-border-sm me-1" />Uploading...</>
                        ) : (
                          <><i className="bi bi-plus-lg me-1" />Add Photo</>
                        )}
                      </button>
                      <input
                        ref={galleryFileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleGalleryAdd}
                      />
                    </div>

                    {galleryLoading && (
                      <div className="text-center py-4">
                        <span className="spinner-border spinner-border-sm me-2" />Loading gallery...
                      </div>
                    )}

                    {!galleryLoading && galleryImages.length === 0 && (
                      <div className="text-center py-4 text-muted">
                        <i className="bi bi-image" style={{ fontSize: "2rem" }} />
                        <p className="mt-1 mb-0">No gallery photos yet. Click "Add Photo" to upload.</p>
                      </div>
                    )}

                    {!galleryLoading && galleryImages.length > 0 && (
                      <div className="rt-gallery-grid">
                        {galleryImages.map((img) => (
                          <div key={img.id} className="rt-gallery-item">
                            <img src={toAbsoluteImageUrl(img.imageUrl)} alt={`Gallery #${img.displayOrder}`} />
                            <button
                              type="button"
                              className="rt-gallery-item-delete"
                              title="Delete this photo"
                              onClick={() => handleGalleryDelete(img.id)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <Buttons variant="outline" className="btn-sm" onClick={closeGalleryModal} disabled={coverUploading || galleryUploading}>
                    Close
                  </Buttons>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}
