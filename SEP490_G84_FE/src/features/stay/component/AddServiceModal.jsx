import React, { useState, useEffect } from 'react';
import { stayApi } from '../api/stayApi';
import { COLORS } from '@/constants';

// Row trống mặc định cho 1 dòng dịch vụ
const emptyItem = () => ({
  id: Date.now() + Math.random(),
  selectedServiceId: '',
  description: '',
  unitPrice: 0,
  quantity: 1,
});

const AddServiceModal = ({ show, onClose, stayInfo, onSuccess }) => {
  const [items, setItems] = useState([emptyItem()]);
  const [paymentOption, setPaymentOption] = useState('pay_later');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchServices();
      setItems([emptyItem()]);
      setPaymentOption('pay_later');
    }
  }, [show]);

  const fetchServices = async () => {
    try {
      const data = await stayApi.getServices();
      setServicesList(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  if (!show || !stayInfo) return null;

  // Cập nhật 1 field của 1 item theo index
  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Khi chọn service từ dropdown → auto-fill description & unitPrice
  const handleServiceChange = (index, value) => {
    if (value === 'custom') {
      setItems(prev => prev.map((item, i) => i === index
        ? { ...item, selectedServiceId: 'custom', description: '', unitPrice: 0 }
        : item
      ));
    } else if (value !== '') {
      const srv = servicesList.find(s => s.serviceId === parseInt(value));
      setItems(prev => prev.map((item, i) => i === index
        ? { ...item, selectedServiceId: value, description: srv?.serviceName || '', unitPrice: srv?.basePrice || 0 }
        : item
      ));
    } else {
      setItems(prev => prev.map((item, i) => i === index
        ? { ...item, selectedServiceId: '', description: '', unitPrice: 0 }
        : item
      ));
    }
  };

  const addRow = () => setItems(prev => [...prev, emptyItem()]);

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const isValid = items.every(item =>
    item.selectedServiceId !== '' && item.description && item.unitPrice > 0 && item.quantity > 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);

    const serviceItems = items.map(item => ({
      serviceId: item.selectedServiceId === 'custom' ? null : parseInt(item.selectedServiceId),
      description: item.description,
      quantity: item.quantity,
      orderPrice: item.unitPrice,
    }));

    const payload = {
      stayId: stayInfo.stayId,
      items: serviceItems,
      paymentOption,
      paymentMethod: paymentOption === 'pay_now' ? paymentMethod : null,
    };

    try {
      await stayApi.addServiceToStay(payload);
      const names = serviceItems.map(i => i.description).join(', ');
      alert(`✅ Đã thêm ${serviceItems.length} dịch vụ thành công: ${names}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('❌ Lỗi khi thêm dịch vụ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12 }}>

          {/* Header */}
          <div className="modal-header" style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.TEXT_LIGHT, borderRadius: '12px 12px 0 0' }}>
            <div>
              <h5 className="modal-title mb-0">🛎️ Thêm Dịch Vụ</h5>
              <small style={{ opacity: 0.85 }}>
                Phòng: <strong>{stayInfo.roomName}</strong> — {stayInfo.primaryGuestName}
              </small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3" style={{ backgroundColor: '#f8f9fa' }}>

              {/* Bảng danh sách dịch vụ */}
              <div className="card shadow-sm mb-3 border-0">
                <div className="card-body p-0">
                  <table className="table table-borderless mb-0" style={{ fontSize: 14 }}>
                    <thead style={{ backgroundColor: COLORS.PRIMARY + '18' }}>
                      <tr>
                        <th style={{ width: '32%', padding: '8px 6px' }}>Dịch vụ</th>
                        <th style={{ width: '26%', padding: '8px 6px' }}>Mô tả</th>
                        <th style={{ width: '15%', padding: '8px 6px' }}>Đơn giá</th>
                        <th style={{ width: '8%', padding: '8px 6px' }}>SL</th>
                        <th style={{ width: '15%', padding: '8px 6px', textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ width: '4%', padding: '8px 6px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          {/* Dropdown dịch vụ */}
                          <td style={{ padding: '6px 4px 6px 6px' }}>
                            <select
                              className="form-select form-select-sm"
                              value={item.selectedServiceId}
                              onChange={e => handleServiceChange(index, e.target.value)}
                              required
                              style={{ borderColor: COLORS.PRIMARY }}
                            >
                              <option value="">-- Chọn --</option>
                              {servicesList.map(srv => (
                                <option key={srv.serviceId} value={srv.serviceId}>
                                  {srv.serviceName}
                                </option>
                              ))}
                              <option value="custom">✏️ Tự nhập</option>
                            </select>
                          </td>

                          {/* Mô tả */}
                          <td style={{ padding: '6px 4px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.description}
                              onChange={e => updateItem(index, 'description', e.target.value)}
                              placeholder="Mô tả..."
                              required
                              style={{ borderColor: COLORS.PRIMARY }}
                            />
                          </td>

                          {/* Đơn giá */}
                          <td style={{ padding: '6px 4px' }}>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min="0"
                              value={item.unitPrice}
                              onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              readOnly={item.selectedServiceId !== '' && item.selectedServiceId !== 'custom'}
                              style={{ borderColor: COLORS.PRIMARY }}
                            />
                          </td>

                          {/* Số lượng */}
                          <td style={{ padding: '6px 4px' }}>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min="1"
                              value={item.quantity}
                              onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              required
                              style={{ borderColor: COLORS.PRIMARY }}
                            />
                          </td>

                          {/* Thành tiền */}
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600, color: COLORS.PRIMARY, whiteSpace: 'nowrap' }}>
                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} ₫
                          </td>

                          {/* Xoá dòng */}
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-sm p-0"
                              style={{ color: '#dc3545', fontSize: 20, lineHeight: 1, border: 'none', background: 'none' }}
                              onClick={() => removeRow(index)}
                              disabled={items.length === 1}
                              title="Xoá dòng"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nút thêm dòng */}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary mb-3"
                onClick={addRow}
                style={{ borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY }}
              >
                + Thêm dịch vụ khác
              </button>

              {/* Grand Total */}
              <div className="d-flex justify-content-end align-items-center mb-3">
                <span className="text-muted me-3">Tổng cộng ({items.length} dịch vụ):</span>
                <span className="fs-5 fw-bold" style={{ color: COLORS.PRIMARY }}>
                  {grandTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {/* Hình thức thanh toán */}
              <div className="card border-0 shadow-sm p-3" style={{ backgroundColor: '#fff' }}>
                <label className="form-label fw-semibold mb-2" style={{ color: COLORS.TEXT_DARK }}>
                  Hình thức thanh toán
                </label>
                <div className="d-flex gap-4 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input" type="radio" name="paymentOption" value="pay_later"
                      checked={paymentOption === 'pay_later'} onChange={e => setPaymentOption(e.target.value)}
                    />
                    <label className="form-check-label">💳 Ghi nợ – thu khi Checkout</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input" type="radio" name="paymentOption" value="pay_now"
                      checked={paymentOption === 'pay_now'} onChange={e => setPaymentOption(e.target.value)}
                    />
                    <label className="form-check-label">💵 Thanh toán ngay</label>
                  </div>
                </div>
                {paymentOption === 'pay_now' && (
                  <select
                    className="form-select form-select-sm mt-1"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ maxWidth: 220, borderColor: COLORS.PRIMARY }}
                  >
                    <option value="CASH">💵 Tiền mặt</option>
                    <option value="CARD">💳 Thẻ</option>
                    <option value="TRANSFER">🏦 Chuyển khoản</option>
                  </select>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 px-4 pb-3">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Huỷ
              </button>
              <button
                type="submit"
                className="btn text-white"
                style={{ backgroundColor: isValid ? COLORS.PRIMARY : '#6c757d', minWidth: 160 }}
                disabled={!isValid || loading}
              >
                {loading ? '⏳ Đang xử lý...' : `✅ Xác nhận (${items.length} dịch vụ)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;