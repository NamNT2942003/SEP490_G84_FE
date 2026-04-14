import React, { useState, useEffect } from 'react';
import { stayApi } from '../api/stayApi';
import { COLORS } from '@/constants';

/* ── Design tokens ── */
const C = {
  primary:      COLORS.PRIMARY,
  primaryHover: COLORS.PRIMARY_HOVER,
  primaryLight: 'rgba(70,92,71,0.09)',
  accent:       COLORS.PRIMARY,
  accentLight:  'rgba(70,92,71,0.10)',
  danger:       COLORS.ERROR,
  dangerLight:  'rgba(220,53,69,0.08)',
  border:       '#dde3dd',
  surface:      COLORS.TEXT_LIGHT,
  bg:           COLORS.SECONDARY,
  muted:        '#7a8a7b',
  text:         COLORS.TEXT_DARK,
};

const R = { sm: '6px', md: '10px', lg: '14px' };

/* ── Empty row factory ── */
const emptyItem = () => ({
  id: Date.now() + Math.random(),
  selectedServiceId: '',
  description: '',
  unitPrice: '',         // Giá nhập lúc bán (Tổng thu), luôn cho phép chỉnh
  quantity: 1,
  costAmount: '',        // Chỉ dùng cho MANUAL (Tour) — staff nhập tay Tổng chi
  costType: 'NONE',     // Lấy từ service được chọn để quyết định hiện ô Tổng chi
});

const PAYMENT_OPTIONS = [
  { value: 'pay_later', icon: 'bi-clock-history', title: 'Charge to Room',  sub: 'Settle at checkout' },
  { value: 'pay_now',   icon: 'bi-cash-coin',     title: 'Pay Now',         sub: 'Collect immediately' },
];

const PAYMENT_METHODS = [
  { value: 'CASH',     icon: 'bi-cash',                label: 'Cash' },
  { value: 'CARD',     icon: 'bi-credit-card-2-front', label: 'Card' },
  { value: 'TRANSFER', icon: 'bi-bank',                label: 'Bank Transfer' },
];

/* ── Component ── */
const AddServiceModal = ({ show, onClose, stayInfo, onSuccess }) => {
  const [items, setItems]                 = useState([emptyItem()]);
  const [paymentOption, setPaymentOption] = useState('pay_later');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [servicesList, setServicesList]   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    if (show) {
      fetchServices();
      setItems([emptyItem()]);
      setPaymentOption('pay_later');
      setError('');
    }
  }, [show]);

  const fetchServices = async () => {
    try {
      const data = await stayApi.getServices();
      setServicesList(data);
    } catch {
      setError('Failed to load services list. Please try again.');
    }
  };

  if (!show || !stayInfo) return null;

  const updateItem = (index, field, value) =>
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));

  const handleServiceChange = (index, value) => {
    if (value === 'custom') {
      setItems(prev => prev.map((item, i) =>
        i === index ? { ...item, selectedServiceId: 'custom', description: '', unitPrice: '', costAmount: '', costType: 'NONE' } : item
      ));
    } else if (value !== '') {
      const srv = servicesList.find(s => s.serviceId === parseInt(value));
      setItems(prev => prev.map((item, i) =>
        i === index ? {
          ...item,
          selectedServiceId: value,
          description: srv?.serviceName || '',
          // Pre-fill giá gợi ý nếu có basePrice, nhưng staff vẫn có thể sửa
          unitPrice: srv?.basePrice != null ? srv.basePrice : '',
          costAmount: '',
          costType: srv?.costType || 'NONE',
        } : item
      ));
    } else {
      setItems(prev => prev.map((item, i) =>
        i === index ? { ...item, selectedServiceId: '', description: '', unitPrice: '', costAmount: '', costType: 'NONE' } : item
      ));
    }
  };

  const addRow    = () => setItems(prev => [...prev, emptyItem()]);
  const removeRow = (index) => { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== index)); };

  const grandTotal = items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) || 0) * item.quantity, 0);

  // Valid: chọn service, có mô tả, giá > 0, và nếu MANUAL thì phải nhập costAmount
  const isValid = items.every(item =>
    item.selectedServiceId !== '' &&
    item.description &&
    parseFloat(item.unitPrice) > 0 &&
    item.quantity > 0 &&
    (item.costType !== 'MANUAL' || item.costAmount !== '')
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    const serviceItems = items.map(item => ({
      serviceId:   item.selectedServiceId === 'custom' ? null : parseInt(item.selectedServiceId),
      description: item.description,
      quantity:    item.quantity,
      orderPrice:  parseFloat(item.unitPrice),
      // Gửi costAmount chỉ khi MANUAL (Tour) — backend tự tính cho các loại khác
      costAmount:  item.costType === 'MANUAL' && item.costAmount !== ''
                    ? parseFloat(item.costAmount)
                    : null,
    }));
    const payload = {
      stayId:        stayInfo.stayId,
      items:         serviceItems,
      paymentOption,
      paymentMethod: paymentOption === 'pay_now' ? paymentMethod : null,
    };
    try {
      await stayApi.addServiceToStay(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1055,
      backgroundColor: 'rgba(15,20,30,0.60)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Inter', 'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        background: C.surface, borderRadius: R.lg,
        width: '100%', maxWidth: '740px',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: C.primary, padding: '20px 28px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: R.md,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-bag-plus-fill" style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <h5 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
                Add Services
              </h5>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                <i className="bi bi-door-closed me-1" />{stayInfo.roomName}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{stayInfo.primaryGuestName}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.12)', border: 'none',
            borderRadius: R.sm, width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16,
          }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: C.bg }}>

          {error && (
            <div style={{
              background: C.dangerLight, border: `1.5px solid ${C.danger}`,
              borderRadius: R.md, padding: '10px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: C.danger }} />
              <span style={{ fontSize: 13, color: C.danger, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Services table card */}
          <div style={{
            background: C.surface, borderRadius: R.md,
            border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 12,
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1.3fr 0.6fr 1.2fr 0.35fr',
              padding: '10px 16px',
              background: C.primaryLight,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {['Service', 'Description', 'Tổng thu (₫)', 'Qty', 'Subtotal', ''].map((h, i) => (
                <div key={i} style={{
                  fontSize: 11, fontWeight: 700, color: C.muted,
                  letterSpacing: '0.6px', textTransform: 'uppercase',
                  textAlign: i >= 4 ? 'right' : 'left',
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {items.map((item, index) => (
              <div key={item.id}>
                {/* Main row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1.3fr 0.6fr 1.2fr 0.35fr',
                  padding: '10px 16px',
                  alignItems: 'center',
                  borderBottom: (item.costType === 'MANUAL' || index < items.length - 1) ? `1px solid ${C.border}` : 'none',
                  gap: 8,
                }}>
                  {/* Service dropdown */}
                  <select
                    value={item.selectedServiceId}
                    onChange={e => handleServiceChange(index, e.target.value)}
                    required
                    style={{
                      padding: '7px 10px', borderRadius: R.sm, fontSize: 13,
                      border: `1.5px solid ${item.selectedServiceId ? C.primary : C.border}`,
                      background: C.surface, color: C.text, outline: 'none',
                      cursor: 'pointer', width: '100%',
                    }}
                  >
                    <option value="">— Select —</option>
                    {servicesList.map(srv => (
                      <option key={srv.serviceId} value={srv.serviceId}>{srv.serviceName}</option>
                    ))}
                    <option value="custom">✏️ Custom entry</option>
                  </select>

                  {/* Description */}
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    placeholder="Description…"
                    required
                    style={{
                      padding: '7px 10px', borderRadius: R.sm, fontSize: 13,
                      border: `1.5px solid ${C.border}`, background: C.surface,
                      color: C.text, outline: 'none', width: '100%',
                    }}
                  />

                  {/* Unit price — luôn cho nhập, basePrice chỉ là gợi ý */}
                  <input
                    type="number" min="0"
                    value={item.unitPrice}
                    onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                    placeholder="Nhập giá..."
                    required
                    style={{
                      padding: '7px 10px', borderRadius: R.sm, fontSize: 13,
                      border: `1.5px solid ${parseFloat(item.unitPrice) > 0 ? C.primary : C.border}`,
                      background: C.surface, color: C.text, outline: 'none', width: '100%',
                    }}
                  />

                  {/* Quantity */}
                  <input
                    type="number" min="1"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    required
                    style={{
                      padding: '7px 8px', borderRadius: R.sm, fontSize: 13,
                      border: `1.5px solid ${C.border}`, background: C.surface,
                      color: C.text, outline: 'none', textAlign: 'center', width: '100%',
                    }}
                  />

                  {/* Subtotal */}
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13.5, color: C.primary }}>
                    {((parseFloat(item.unitPrice) || 0) * item.quantity).toLocaleString()} ₫
                  </div>

                  {/* Remove */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={items.length === 1}
                      title="Remove row"
                      style={{
                        background: items.length === 1 ? 'transparent' : C.dangerLight,
                        border: 'none', borderRadius: R.sm,
                        width: 28, height: 28, cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                        color: items.length === 1 ? '#ccc' : C.danger,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14,
                      }}
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>

                {/* Ô nhập Tổng chi — chỉ hiện khi service có costType=MANUAL (Tour) */}
                {item.costType === 'MANUAL' && (
                  <div style={{
                    padding: '8px 16px 12px',
                    borderBottom: index < items.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: 'rgba(253,244,210,0.5)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <i className="bi bi-receipt" style={{ color: '#b45309', fontSize: 14 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e', minWidth: 100 }}>
                      Tổng chi (₫) *
                    </span>
                    <input
                      type="number" min="0"
                      value={item.costAmount}
                      onChange={e => updateItem(index, 'costAmount', e.target.value)}
                      placeholder="Nhập chi phí thực tế từ báo giá Tour..."
                      required
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: R.sm, fontSize: 13,
                        border: `1.5px solid ${item.costAmount !== '' ? '#d97706' : '#fcd34d'}`,
                        background: '#fffbeb', color: '#78350f', outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: 11, color: '#b45309', flexShrink: 0 }}>
                      Bắt buộc cho Tour
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            style={{
              background: 'transparent', border: `1.5px dashed ${C.primary}`,
              borderRadius: R.sm, color: C.primary,
              padding: '7px 16px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 20,
            }}
          >
            <i className="bi bi-plus-circle" />
            Add another service
          </button>

          {/* Grand total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13.5, color: C.muted }}>
              {items.length} service{items.length !== 1 ? 's' : ''} · Total:
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>
              {grandTotal.toLocaleString()} ₫
            </span>
          </div>

          {/* Payment section */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 14 }}>
              Payment Method
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {PAYMENT_OPTIONS.map(opt => {
                const active = paymentOption === opt.value;
                return (
                  <button
                    key={opt.value} type="button"
                    onClick={() => setPaymentOption(opt.value)}
                    style={{
                      flex: 1, padding: '12px 14px',
                      border: `2px solid ${active ? C.primary : C.border}`,
                      borderRadius: R.md, background: active ? C.primaryLight : C.surface,
                      cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className={`bi ${opt.icon}`} style={{ fontSize: 17, color: active ? C.primary : C.muted }} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: active ? C.primary : C.text }}>{opt.title}</div>
                        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{opt.sub}</div>
                      </div>
                      {active && <i className="bi bi-check-circle-fill ms-auto" style={{ color: C.primary, fontSize: 16 }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {paymentOption === 'pay_now' && (
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                {PAYMENT_METHODS.map(m => {
                  const sel = paymentMethod === m.value;
                  return (
                    <button
                      key={m.value} type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      style={{
                        flex: 1, padding: '9px 12px',
                        border: `2px solid ${sel ? C.accent : C.border}`,
                        borderRadius: R.md, background: sel ? C.accentLight : C.bg,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        fontSize: 13, fontWeight: sel ? 700 : 500,
                        color: sel ? C.accent : C.muted, transition: 'all .15s',
                      }}
                    >
                      <i className={`bi ${m.icon}`} style={{ fontSize: 15 }} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 28px', borderTop: `1px solid ${C.border}`,
          background: C.surface, display: 'flex', justifyContent: 'flex-end', gap: 10,
          flexShrink: 0,
        }}>
          <button
            type="button" onClick={onClose} disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: R.sm,
              border: `1.5px solid ${C.border}`, background: C.surface,
              color: C.text, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleSubmit}
            disabled={!isValid || loading}
            style={{
              padding: '9px 26px', borderRadius: R.sm, border: 'none',
              background: isValid && !loading ? C.primary : '#b0bec5',
              color: '#fff', fontSize: 13.5, fontWeight: 700,
              cursor: isValid && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background .15s',
            }}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm" role="status" />Processing…</>
            ) : (
              <><i className="bi bi-check2-all" />Confirm {items.length} Service{items.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;