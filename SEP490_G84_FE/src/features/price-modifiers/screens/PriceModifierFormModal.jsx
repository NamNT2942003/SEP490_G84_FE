import React, { useState, useEffect } from 'react';

const PriceModifierFormModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'DATE_RANGE',
        adjustmentType: 'PERCENT',
        adjustmentValue: 0,
        active: true,
        metadata: {}
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                type: initialData.type || 'DATE_RANGE',
                adjustmentType: initialData.adjustmentType || 'PERCENT',
                adjustmentValue: initialData.adjustmentValue || 0,
                active: initialData.active ?? true,
                metadata: initialData.metadata || {}
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMetaChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [key]: value
            }
        }));
    };

    const handleDayToggle = (day) => {
        const currentDays = formData.metadata.days || [];
        if (currentDays.includes(day)) {
            handleMetaChange('days', currentDays.filter(d => d !== day));
        } else {
            handleMetaChange('days', [...currentDays, day]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation format
        const payload = {
            name: formData.name,
            type: formData.type,
            adjustmentType: formData.adjustmentType,
            adjustmentValue: parseFloat(formData.adjustmentValue) || 0,
            active: formData.active,
            metadata: { ...formData.metadata }
        };
        onSave(payload);
    };

    const renderMetadataFields = () => {
        const t = formData.type;
        const m = formData.metadata;

        if (t === 'DATE_RANGE') {
            return (
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Start Date (yyyy-MM-dd)</label>
                        <input type="date" className="form-control" value={m.start || ''} onChange={(e) => handleMetaChange('start', e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small text-muted">End Date (yyyy-MM-dd)</label>
                        <input type="date" className="form-control" value={m.end || ''} onChange={(e) => handleMetaChange('end', e.target.value)} required />
                    </div>
                </div>
            );
        }
        
        if (t === 'DAY_OF_WEEK') {
            const allDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
            const checkedDays = m.days || [];
            return (
                <div>
                    <label className="form-label small text-muted">Apply on specific days of week:</label>
                    <div className="d-flex flex-wrap gap-2">
                        {allDays.map(day => (
                            <div key={day} className="form-check form-check-inline">
                                <input className="form-check-input" type="checkbox" id={`day-${day}`} checked={checkedDays.includes(day)} onChange={() => handleDayToggle(day)} />
                                <label className="form-check-label" htmlFor={`day-${day}`}>{day.substring(0,3)}</label>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (t === 'ADVANCE_BOOKING') {
            return (
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Min Days Before Check-in</label>
                        <input type="number" min="0" className="form-control" value={m.minDaysBefore ?? ''} onChange={(e) => handleMetaChange('minDaysBefore', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Max Days Before Check-in</label>
                        <input type="number" min="0" className="form-control" value={m.maxDaysBefore ?? ''} onChange={(e) => handleMetaChange('maxDaysBefore', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                </div>
            );
        }

        if (t === 'LENGTH_OF_STAY') {
            return (
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Min Nights</label>
                        <input type="number" min="0" className="form-control" value={m.minNights ?? ''} onChange={(e) => handleMetaChange('minNights', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Max Nights</label>
                        <input type="number" min="0" className="form-control" value={m.maxNights ?? ''} onChange={(e) => handleMetaChange('maxNights', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                </div>
            );
        }

        if (t === 'OCCUPANCY') {
            return (
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Min Rooms Booked</label>
                        <input type="number" min="0" className="form-control" value={m.minRooms ?? ''} onChange={(e) => handleMetaChange('minRooms', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Max Rooms Booked</label>
                        <input type="number" min="0" className="form-control" value={m.maxRooms ?? ''} onChange={(e) => handleMetaChange('maxRooms', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                </div>
            );
        }
        
        if (t === 'AVAILABILITY') {
            return (
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Min Available Rooms Pending</label>
                        <input type="number" min="0" className="form-control" value={m.minAvailableRooms ?? ''} onChange={(e) => handleMetaChange('minAvailableRooms', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small text-muted">Max Available Rooms Pending</label>
                        <input type="number" min="0" className="form-control" value={m.maxAvailableRooms ?? ''} onChange={(e) => handleMetaChange('maxAvailableRooms', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                </div>
            );
        }

        if (t === 'POLICY') {
            return (
                <div>
                    <label className="form-label small text-muted">Policy ID</label>
                    <input type="number" min="1" className="form-control" value={m.policyId || ''} onChange={(e) => handleMetaChange('policyId', parseInt(e.target.value))} required />
                </div>
            );
        }

        return <div className="text-muted small">No extra metadata required for this type.</div>;
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold" style={{ color: '#5C6F4E' }}>{initialData ? 'Edit Modifier' : 'New Price Modifier'}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4 pt-3">
                            <div className="row g-3 mb-4">
                                <div className="col-12">
                                    <label className="form-label text-muted small fw-semibold">Display Name</label>
                                    <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Early Bird 10% Off" required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small fw-semibold">Adjustment Type</label>
                                    <select className="form-select" name="adjustmentType" value={formData.adjustmentType} onChange={handleChange}>
                                        <option value="PERCENT">Phần trăm (%)</option>
                                        <option value="AMOUNT">Số tiền cố định (₫)</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small fw-semibold">
                                        Giá trị điều chỉnh{' '}
                                        <span className="text-muted fw-normal">
                                            {formData.adjustmentType === 'PERCENT' ? '(− giảm / + tăng %)' : '(− giảm VNĐ / + tăng VNĐ)'}
                                        </span>
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            step={formData.adjustmentType === 'PERCENT' ? '0.01' : '1000'}
                                            min={formData.adjustmentType === 'PERCENT' ? '-100' : undefined}
                                            max={formData.adjustmentType === 'PERCENT' ? '100' : undefined}
                                            className="form-control"
                                            name="adjustmentValue"
                                            value={formData.adjustmentValue}
                                            onChange={handleChange}
                                            placeholder={formData.adjustmentType === 'PERCENT' ? '-10 (giảm 10%)' : '-50000 (giảm 50k₫)'}
                                            required
                                        />
                                        <span className="input-group-text">
                                            {formData.adjustmentType === 'PERCENT' ? '%' : '₫'}
                                        </span>
                                    </div>
                                    <div className="form-text" style={{ fontSize: '0.75rem' }}>
                                        {formData.adjustmentType === 'PERCENT'
                                            ? 'VD: -20 (giảm 20% giá gốc), +15 (tăng 15%)'
                                            : 'VD: -50000 (giảm 50.000₫), 100000 (phụ thu 100k)'}
                                    </div>
                                </div>
                            </div>

                            <hr style={{ opacity: 0.1 }} />

                            <div className="row g-3 mb-4">
                                <div className="col-12">
                                    <label className="form-label fw-bold text-dark">Rule Condition</label>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-muted small fw-semibold">Condition Type</label>
                                    <select className="form-select" name="type" value={formData.type} onChange={(e) => {
                                        const newType = e.target.value;
                                        // Atomic update: change type AND clear metadata together
                                        setFormData(p => ({ ...p, type: newType, metadata: {} }));
                                    }}>
                                        <option value="DATE_RANGE">Date Range</option>
                                        <option value="DAY_OF_WEEK">Day of Week</option>
                                        <option value="ADVANCE_BOOKING">Advance Booking</option>
                                        <option value="LENGTH_OF_STAY">Length of Stay</option>
                                        <option value="OCCUPANCY">Occupancy</option>
                                        <option value="AVAILABILITY">Availability Inventory</option>
                                        <option value="POLICY">Cancellation Policy</option>
                                    </select>
                                </div>
                                <div className="col-md-8">
                                    <div className="p-3 bg-light rounded border">
                                        {renderMetadataFields()}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-check form-switch pt-2">
                                <input className="form-check-input" type="checkbox" name="active" checked={formData.active} onChange={handleChange} id="activeCheck" />
                                <label className="form-check-label text-muted fw-semibold" htmlFor="activeCheck">Active Rule</label>
                            </div>
                        </div>
                        <div className="modal-footer border-top-0 pt-0 px-4 pb-4">
                            <button type="button" className="btn btn-light border" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn fw-bold px-4 text-white" style={{ backgroundColor: '#5C6F4E' }}>Save Modifier</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PriceModifierFormModal;