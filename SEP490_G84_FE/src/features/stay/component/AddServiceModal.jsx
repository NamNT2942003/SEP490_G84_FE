import React, { useState, useEffect } from 'react';
import { stayApi } from '../api/stayApi';
import { COLORS } from '@/constants';

const AddServiceModal = ({ show, onClose, stayInfo, onSuccess }) => {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentOption, setPaymentOption] = useState('pay_later');
  
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [servicesList, setServicesList] = useState([]);

  useEffect(() => {
    if (show) {
      fetchServices();
    }
  }, [show]);

  const fetchServices = async () => {
    try {
      const data = await stayApi.getServices();
      setServicesList(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  if (!show || !stayInfo) return null;

  const handleServiceChange = (e) => {
    const value = e.target.value;
    setSelectedServiceId(value);

    if (value === 'custom') {
      setDescription('');
      setUnitPrice(0);
    } else if (value !== '') {
      const srv = servicesList.find((s) => s.serviceId === parseInt(value));
      if (srv) {
        setDescription(srv.serviceName);
        setUnitPrice(srv.basePrice);
      }
    } else {
      setDescription('');
      setUnitPrice(0);
    }
  };

  const totalPrice = unitPrice * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const orderData = {
      stayId: stayInfo.stayId, 
      serviceId: selectedServiceId === 'custom' ? null : parseInt(selectedServiceId),
      description: description,
      quantity: quantity,
      orderPrice: totalPrice, 
      paymentOption: paymentOption, 
    };
    
    try {
      await stayApi.addServiceToStay(orderData);
      alert(`Successfully added service: ${description} for room ${stayInfo.roomName}!`);
      
      setSelectedServiceId('');
      setQuantity(1);
      setDescription('');
      setUnitPrice(0);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error adding service. Please try again!');
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header" style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.TEXT_LIGHT }}>
            <h5 className="modal-title">Add Service - {stayInfo.roomName}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          
          <div className="modal-body" style={{ backgroundColor: COLORS.TEXT_LIGHT }}>
            <p style={{ color: COLORS.TEXT_DARK, marginBottom: '1rem' }}>
              Primary Guest: <strong>{stayInfo.primaryGuestName}</strong>
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" style={{ color: COLORS.TEXT_DARK }}>Select Service</label>
                <select 
                  className="form-select" 
                  value={selectedServiceId} 
                  onChange={handleServiceChange}
                  style={{ borderColor: COLORS.PRIMARY }}
                  required
                >
                  <option value="">-- Please select --</option>
                  {servicesList.map((srv) => (
                    <option key={srv.serviceId} value={srv.serviceId}>
                      {srv.serviceName} - {srv.basePrice?.toLocaleString('en-US')} VND
                    </option>
                  ))}
                  <option value="custom" style={{ color: COLORS.PRIMARY, fontWeight: 'bold' }}>
                    + Custom (Manual)
                  </option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ color: COLORS.TEXT_DARK }}>Service Description</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed description..."
                  style={{ borderColor: COLORS.PRIMARY }}
                  required
                ></textarea>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label" style={{ color: COLORS.TEXT_DARK }}>Unit Price (VND)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                    readOnly={selectedServiceId !== 'custom'} 
                    style={{ borderColor: COLORS.PRIMARY }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={{ color: COLORS.TEXT_DARK }}>Quantity</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1" 
                    value={quantity} 
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    style={{ borderColor: COLORS.PRIMARY }}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ color: COLORS.TEXT_DARK }}>Total Amount:</label>
                <input 
                  type="text" 
                  className="form-control fw-bold" 
                  value={`${totalPrice.toLocaleString('en-US')} VND`} 
                  style={{ color: COLORS.ERROR, borderColor: COLORS.PRIMARY, backgroundColor: COLORS.SECONDARY }}
                  readOnly 
                />
              </div>

              <div className="mb-4">
                <label className="form-label d-block" style={{ color: COLORS.TEXT_DARK }}>Payment Method</label>
                <div className="form-check form-check-inline">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="paymentOption" 
                    value="pay_later"
                    checked={paymentOption === 'pay_later'}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  />
                  <label className="form-check-label" style={{ color: COLORS.TEXT_DARK }}>Pay Later (at Check-out)</label>
                </div>
                <div className="form-check form-check-inline">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="paymentOption" 
                    value="pay_now"
                    checked={paymentOption === 'pay_now'}
                    onChange={(e) => setPaymentOption(e.target.value)}
                  />
                  <label className="form-check-label" style={{ color: COLORS.TEXT_DARK }}>Pay Now</label>
                </div>
              </div>

              <div className="modal-footer px-0 pb-0 border-0">
                <button 
                  type="button" 
                  className="btn border" 
                  style={{ backgroundColor: COLORS.TEXT_LIGHT, color: COLORS.TEXT_DARK }} 
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn text-white" 
                  style={{ backgroundColor: (!selectedServiceId || !description) ? '#6c757d' : COLORS.PRIMARY }}
                  disabled={!selectedServiceId || !description}
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;