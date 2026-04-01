import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { priceModifierApi } from "@/features/price-modifiers/api/priceModifierApi";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import PriceModifierFormModal from "./PriceModifierFormModal";

const PriceModifierManagement = () => {
    const { roomTypeId } = useParams();
    const navigate = useNavigate();
    
    const [modifiers, setModifiers] = useState([]);
    const [roomTypeInfo, setRoomTypeInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModifier, setEditingModifier] = useState(null);

    const [alert, setAlert] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await priceModifierApi.getModifiersByRoomType(roomTypeId);
            setModifiers(data);
            
            // Also try to get RoomType info just for the title
            try {
                const rtData = await roomTypeManagementApi.getRoomTypeById(roomTypeId);
                setRoomTypeInfo(rtData);
            } catch(e) { /* ignore */ }
            
        } catch (error) {
            showAlert("error", "Failed to load price modifiers: " + (error?.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (roomTypeId) {
            loadData();
        }
    }, [roomTypeId]);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    const handleToggleActive = async (id) => {
        try {
            await priceModifierApi.toggleModifier(id);
            showAlert("success", "Status updated successfully.");
            loadData();
        } catch (error) {
            showAlert("error", "Failed to update status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this price modifier?")) return;
        try {
            await priceModifierApi.deleteModifier(id);
            showAlert("success", "Deleted successfully.");
            loadData();
        } catch (error) {
            showAlert("error", "Failed to delete modifier.");
        }
    };

    const handleSave = async (payload) => {
        try {
            payload.roomTypeId = parseInt(roomTypeId, 10);
            if (editingModifier) {
                await priceModifierApi.updateModifier(editingModifier.priceModifierId, payload);
                showAlert("success", "Price modifier updated.");
            } else {
                await priceModifierApi.createModifier(payload);
                showAlert("success", "Price modifier created.");
            }
            setIsModalOpen(false);
            setEditingModifier(null);
            loadData();
        } catch (error) {
            showAlert("error", "Save failed: " + (error?.response?.data?.error || error?.response?.data?.message || error.message));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatAdjustment = (type, value) => {
        if (type === 'PERCENT') return `${value > 0 ? '+' : ''}${value}%`;
        return `${value > 0 ? '+' : ''}${formatCurrency(value)}`;
    };

    const formatMetadataPreview = (type, meta) => {
        if (!meta) return "N/A";
        switch (type) {
            case 'DATE_RANGE': return `${meta.start} to ${meta.end}`;
            case 'DAY_OF_WEEK': return meta.days ? meta.days.join(", ") : "N/A";
            case 'ADVANCE_BOOKING': return `Min ${meta.minDaysBefore || 0}D, Max ${meta.maxDaysBefore || '∞'}D before`;
            case 'LENGTH_OF_STAY': return `Min ${meta.minNights || 1}N, Max ${meta.maxNights || '∞'}N`;
            case 'OCCUPANCY': return `Min ${meta.minRooms || 1} Rm, Max ${meta.maxRooms || '∞'} Rm`;
            case 'AVAILABILITY': return `Min ${meta.minAvailableRooms || 0} Avail, Max ${meta.maxAvailableRooms || '∞'} Avail`;
            case 'POLICY': return `Policy ID: ${meta.policyId}`;
            default: return JSON.stringify(meta);
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left me-1"></i> Back
                    </button>
                    <h2 className="mb-0 fw-bold" style={{ color: '#5C6F4E' }}>
                        Price Modifiers <span className="text-muted fs-5">| {roomTypeInfo?.name || `Room Type ID: ${roomTypeId}`}</span>
                    </h2>
                </div>
                <button
                    className="btn px-4 fw-bold shadow-sm"
                    style={{ backgroundColor: '#D4AF37', color: '#fff' }}
                    onClick={() => { setEditingModifier(null); setIsModalOpen(true); }}
                >
                    <i className="bi bi-plus-lg me-2"></i> Add Rule
                </button>
            </div>

            {alert && (
                <div className={`alert alert-${alert.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`} role="alert">
                    {alert.type === 'error' ? <i className="bi bi-exclamation-triangle-fill me-2"></i> : <i className="bi bi-check-circle-fill me-2"></i>}
                    {alert.message}
                    <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
                </div>
            )}

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="py-3">Name</th>
                                    <th className="py-3">Type</th>
                                    <th className="py-3">Rule Limits</th>
                                    <th className="py-3">Adjustment</th>
                                    <th className="py-3">Status</th>
                                    <th className="px-4 py-3 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan="7" className="text-center py-4">Loading rules...</td></tr>
                                )}
                                {!loading && modifiers.length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-5 text-muted">No pricing rules configured for this room type.</td></tr>
                                )}
                                {!loading && modifiers.map((mod) => (
                                    <tr key={mod.priceModifierId} className={!mod.active ? "opacity-75" : ""}>
                                        <td className="px-4 fw-bold text-muted">#{mod.priceModifierId}</td>
                                        <td className="fw-semibold">{mod.name}</td>
                                        <td><span className="badge bg-light text-dark border">{mod.type}</span></td>
                                        <td className="small text-secondary">{formatMetadataPreview(mod.type, mod.metadata)}</td>
                                        <td>
                                            <span className={`fw-bold ${mod.adjustmentValue > 0 ? 'text-danger' : (mod.adjustmentValue < 0 ? 'text-success' : 'text-muted')}`}>
                                                {formatAdjustment(mod.adjustmentType, mod.adjustmentValue)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="form-check form-switch cursor-pointer" title="Toggle active status">
                                                <input 
                                                    className="form-check-input cursor-pointer" 
                                                    type="checkbox" 
                                                    checked={mod.active}
                                                    onChange={() => handleToggleActive(mod.priceModifierId)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 text-end">
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => { setEditingModifier(mod); setIsModalOpen(true); }}
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(mod.priceModifierId)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <PriceModifierFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingModifier}
                />
            )}
        </div>
    );
};

export default PriceModifierManagement;