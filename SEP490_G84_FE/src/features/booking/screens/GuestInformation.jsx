import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Input from '@/components/ui/Input';
import bookingService from '@/features/booking/api/bookingService';
import './GuestInformation.css';

// ─── Helpers ───────────────────────────────────────────────────────────────

const calculateNights = (start, end) => {
    if (!start || !end) return 1;
    const diffMs = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const getCancellationText = (cancellationType, freeCancelBeforeDays) => {
    if (cancellationType === 'NON_REFUNDABLE') return 'Khong hoan tien';
    if (cancellationType === 'REFUNDABLE' && freeCancelBeforeDays > 0) {
        return `Mien phi huy truoc ${freeCancelBeforeDays} ngay`;
    }
    if (cancellationType === 'REFUNDABLE') return 'Mien phi huy';
    return 'Chinh sach huy theo phong';
};

const getPaymentText = (paymentType) => {
    if (paymentType === 'PREPAID') return 'Thanh toan truoc';
    if (paymentType === 'PAY_AT_HOTEL') return 'Thanh toan tai khach san';
    return 'Hinh thuc thanh toan theo phong';
};

const calculateRoomUnitPrice = (room) => {
    const baseOptPrice = room.selectedPrice ?? room.selectedPricingOption?.finalPrice ?? room.appliedPrice ?? room.basePrice ?? room.price ?? 0;
    if (!room.selectedManualPromotion) return baseOptPrice;

    const promo = room.selectedManualPromotion;
    let delta = 0;
    if (promo.adjustmentType === 'PERCENT' || promo.adjustmentType === 'PERCENTAGE') {
        delta = (room.basePrice * promo.adjustmentValue) / 100;
    } else {
        delta = promo.adjustmentValue;
    }
    const finalPrice = baseOptPrice + delta;
    return finalPrice > 0 ? finalPrice : 0;
};

const getAppliedModifierId = (room) => {
    if (room.selectedManualPromotion) return room.selectedManualPromotion.priceModifierId;
    if (room.selectedPricingOption?.modifiers) {
        const policyMod = room.selectedPricingOption.modifiers.find(m => m.type === 'POLICY');
        if (policyMod) return policyMod.priceModifierId;
    }
    return room.appliedPriceModifierId;
};

const buildBookingPayload = (formData, rooms, checkIn, checkOut) => ({
    otaReservationId: `WEB-${formData.phone.replace(/\s+/g, '')}-${checkIn}-${checkOut}`,
    arrivalDate: checkIn,
    departureDate: checkOut,
    rooms: rooms.map((room) => ({
        roomTypeId: room.roomTypeId,
        price: calculateRoomUnitPrice(room),
        quantity: room.quantity || 1,
        priceModifierId: getAppliedModifierId(room)
    })),
    customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
    },
    specialRequests: formData.specialRequests,
});

// ─── RoomItem ──────────────────────────────────────────────────────────────

const RoomItem = ({ room, checkIn, checkOut, onQuantityChange, onRemove, onSelectPromo }) => {
    const nights = calculateNights(checkIn, checkOut);
    const unitPrice = calculateRoomUnitPrice(room);
    const qty = room.quantity || 1;
    const maxQty = room.availableCount || 999;

    return (
        <div className="room-item shadow-sm border-0 rounded-4 overflow-hidden mb-4" style={{background: '#fff', transition: 'all 0.3s'}}>
            <style>{`
                .promo-container { padding: 20px 24px; background: #fafbf8; border-top: 1px solid #f0f4ec; }
                .promo-title { font-size: 0.95rem; font-weight: 700; color: #2d3748; letter-spacing: 0.5px; }
                .promo-list { display: flex; flex-direction: column; gap: 12px; }
                .promo-card { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fff; border: 1.5px solid #edf2f7; border-radius: 12px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                .promo-card:hover { border-color: #cbd5e0; background: #f8fafc; }
                .promo-card.active { border-color: #5C6F4E; background: #f2f7ec; box-shadow: 0 4px 12px rgba(92,111,78,0.1); }
                .promo-card.no-promo.active { border-color: #a0aec0; background: #fdfdfd; }
                .promo-radio { font-size: 1.2rem; line-height: 1; margin-top: 2px; }
                .promo-content { flex: 1; display:flex; flex-direction: column; }
                .promo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
                .promo-name { font-weight: 700; font-size: 0.95rem; color: #2d3748; }
                .promo-badge { font-weight: 800; font-size: 0.8rem; background: linear-gradient(135deg, #D4AF37, #b8962c); color: #fff; padding: 4px 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(212,175,55,0.3); }
                .promo-reason { font-size: 0.8rem; color: #718096; line-height: 1.5; }
                .room-item-body { padding: 24px; }
                .room-total { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>
            <div className="room-item-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div className="room-name fs-5 fw-bold text-dark mb-1" style={{fontFamily: "'Playfair Display', serif"}}>{room.name}</div>
                        <div className="room-price fw-semibold text-secondary mb-2" style={{fontSize: '0.9rem'}}>
                            💵 {new Intl.NumberFormat('vi-VN').format(unitPrice)} ₫ <span className="fw-normal">/ đêm</span>
                        </div>
                        <div className="d-flex gap-3">
                            <div className="small px-2 py-1 rounded" style={{background: '#ebf4ff', color: '#3182ce', fontWeight: 600}}>
                                <i className="bi bi-shield-check me-1" />
                                {getCancellationText(room.cancellationType, room.freeCancelBeforeDays)}
                            </div>
                            <div className="small px-2 py-1 rounded" style={{background: '#e6fffa', color: '#319795', fontWeight: 600}}>
                                <i className="bi bi-credit-card me-1" />
                                {getPaymentText(room.paymentType)}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm rounded-circle p-2 lh-1"
                        onClick={() => onRemove(room.roomTypeId)}
                        title="Remove room"
                    >
                        <i className="bi bi-trash" />
                    </button>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="qty-control shadow-sm border rounded-pill d-flex align-items-center p-1 bg-white">
                        <button
                            type="button"
                            className="btn btn-sm btn-light rounded-circle"
                            onClick={() => onQuantityChange(room.roomTypeId, qty - 1)}
                            style={{width: '32px', height: '32px', padding: 0}}
                        >
                            <i className="bi bi-dash fw-bold" />
                        </button>
                        <input
                            type="number"
                            className="form-control border-0 text-center text-dark fw-bold"
                            value={qty}
                            min="1"
                            max={maxQty}
                            onChange={(e) =>
                                onQuantityChange(room.roomTypeId, parseInt(e.target.value) || 1)
                            }
                            style={{width: '50px', background: 'transparent'}}
                        />
                        <button
                            type="button"
                            className="btn btn-sm btn-light rounded-circle"
                            onClick={() => onQuantityChange(room.roomTypeId, qty + 1)}
                            disabled={qty >= maxQty}
                            style={{width: '32px', height: '32px', padding: 0}}
                        >
                            <i className="bi bi-plus fw-bold" />
                        </button>
                    </div>
                    <div className="room-total fs-4 fw-bold" style={{color: '#5C6F4E'}}>
                        {formatVND(unitPrice * qty * nights)}
                    </div>
                </div>
            </div>

            {room.manualSelectPromotions?.length > 0 && (
                <div className="promo-container">
                    <h6 className="promo-title mb-3"><i className="bi bi-gift-fill me-2" style={{color: '#D4AF37'}}></i>Khuyến Mãi Đặc Quyền</h6>
                    <div className="promo-list">
                        {room.manualSelectPromotions.map((promo, idx) => {
                            const isChecked = room.selectedManualPromotion?.priceModifierId === promo.priceModifierId;
                            return (
                                <div className={`promo-card ${isChecked ? 'active' : ''}`} key={`${room.roomTypeId}-promo-${idx}`} onClick={() => onSelectPromo(room.roomTypeId, promo)}>
                                    <div className="promo-radio">
                                        <i className={`bi ${isChecked ? 'bi-check-circle-fill' : 'bi-circle'}`} style={{color: isChecked ? '#5C6F4E' : '#cbd5e0'}}></i>
                                    </div>
                                    <div className="promo-content">
                                        <div className="promo-header">
                                            <span className="promo-name">{promo.name}</span>
                                            <span className="promo-badge">{promo.adjustmentType === 'PERCENT' ? `-${promo.adjustmentValue}%` : `-${formatVND(promo.adjustmentValue)}`}</span>
                                        </div>
                                        <div className="promo-reason"><i className="bi bi-arrow-return-right me-1"></i>{promo.reason}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className={`promo-card no-promo ${!room.selectedManualPromotion ? 'active' : ''}`} onClick={() => onSelectPromo(room.roomTypeId, null)}>
                            <div className="promo-radio">
                                <i className={`bi ${!room.selectedManualPromotion ? 'bi-check-circle-fill text-secondary' : 'bi-circle'}`} style={{color: !room.selectedManualPromotion ? '' : '#cbd5e0'}}></i>
                            </div>
                            <div className="promo-content justify-content-center">
                                <span className="text-secondary fw-semibold">Không sử dụng ưu đãi ngay lúc này</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────

const GuestInformation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        selectedRooms = [],
        checkIn = '',
        checkOut = '',
        branchId = null,
    } = location.state || {};

    const [rooms, setRooms] = useState(selectedRooms);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        specialRequests: '',
    });

    const handleInputChange = (e) => {
        const { id, name, value } = e.target;
        setFormData((prev) => ({ ...prev, [id || name]: value }));
    };

    const handleQuantityChange = (roomTypeId, newQty) => {
        if (newQty <= 0) {
            handleRemoveRoom(roomTypeId);
            return;
        }
        const room = rooms.find((r) => r.roomTypeId === roomTypeId);
        if (room && newQty > (room.availableCount || 999)) {
            alert(`Only ${room.availableCount} room(s) available for ${room.name}`);
            return;
        }
        setRooms((prev) =>
            prev.map((r) => (r.roomTypeId === roomTypeId ? { ...r, quantity: newQty } : r))
        );
    };

    const handleRemoveRoom = (roomTypeId) => {
        setRooms((prev) => prev.filter((r) => r.roomTypeId !== roomTypeId));
    };

    const handleSelectPromo = (roomTypeId, promo) => {
        setRooms((prev) =>
            prev.map((r) => (r.roomTypeId === roomTypeId ? { ...r, selectedManualPromotion: promo } : r))
        );
    };

    const calculateTotalPrice = () => {
        const nights = calculateNights(checkIn, checkOut);
        return rooms.reduce(
            (sum, room) => sum + calculateRoomUnitPrice(room) * (room.quantity || 1) * nights,
            0
        );
    };

    const handleContinue = async () => {
        if (!formData.fullName || !formData.email || !formData.phone) {
            alert('Vui lòng điền đầy đủ thông tin khách hàng.');
            return;
        }
        if (rooms.length === 0) {
            alert('Vui lòng chọn ít nhất một phòng.');
            return;
        }

        if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
            alert('Ngay khong hop le. Vui long chon check-out sau check-in (yyyy-MM-dd).');
            return;
        }

        try {
            const payload = buildBookingPayload(formData, rooms, checkIn, checkOut);
            const currentBranchId = branchId || 1;
            const data = await bookingService.createFromFrontend(currentBranchId, payload);
            const createdBookingId = data?.bookingId ?? data?.id;

            if (!createdBookingId) {
                alert('Lỗi đặt phòng: Không nhận được mã đặt phòng từ server.');
                return;
            }

            navigate('/payment-selection', {
                state: {
                    bookingId: createdBookingId,
                    totalAmount: calculateTotalPrice(),
                    rooms,
                    checkIn,
                    checkOut,
                    branchId: currentBranchId,
                },
            });
        } catch (error) {
            console.error('Booking error:', error);
            const message = error?.response?.data?.message || error?.friendlyMessage || error.message || 'Không thể tạo booking';
            alert('Lỗi đặt phòng: ' + message);
        }
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
            {/* Header */}
            <header className="bg-olive p-3 sticky-top shadow-sm" style={{ zIndex: 1030 }}>
                <div className="container d-flex align-items-center">
                    <button className="btn text-white p-0 me-3 fs-5" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left" />
                    </button>
                    <h5 className="mb-0 mx-auto text-white fw-semibold">
                        <i className="bi bi-person-badge me-2" />
                        Guest Information
                    </h5>
                </div>
            </header>

            {/* Content */}
            <main className="container mt-4">
                <div className="row g-4">
                    {/* Left column */}
                    <div className="col-lg-8">
                        {rooms.length > 0 && (
                            <div className="guest-section">
                                <h5>
                                    <i className="bi bi-door-open" />
                                    Your Rooms ({rooms.length})
                                </h5>
                                {rooms.map((room) => (
                                    <RoomItem
                                        key={room.roomTypeId}
                                        room={room}
                                        checkIn={checkIn}
                                        checkOut={checkOut}
                                        onQuantityChange={handleQuantityChange}
                                        onRemove={handleRemoveRoom}
                                        onSelectPromo={handleSelectPromo}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-clipboard-person" />
                                Your Details
                            </h5>
                            <div className="row">
                                <div className="col-12">
                                    <Input
                                        id="fullName"
                                        label="Full Name"
                                        icon="bi-person"
                                        placeholder="Nguyen Van A"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Input
                                        id="email"
                                        label="Email Address"
                                        icon="bi-envelope"
                                        placeholder="example@email.com"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Input
                                        id="phone"
                                        label="Phone Number"
                                        icon="bi-telephone"
                                        placeholder="0123 456 789"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-star" />
                                Special Requests (Optional)
                            </h5>
                            <textarea
                                id="specialRequests"
                                className="form-control"
                                rows="4"
                                value={formData.specialRequests}
                                onChange={handleInputChange}
                                placeholder="e.g. high floor, extra pillows, late checkout..."
                            />
                        </div>
                    </div>

                    {/* Right column – Booking Summary */}
                    <div className="col-lg-4">
                        <div className="sticky-top d-none d-lg-block" style={{ top: '90px', zIndex: 1020, maxHeight: 'calc(100vh - 120px)' }}>
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <div className="bg-white rounded-3 custom-shadow" style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                                <BookingSummary selectedRooms={rooms} checkIn={checkIn} checkOut={checkOut} />
                            </div>
                        </div>
                        <div className="d-lg-none mt-4">
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <BookingSummary selectedRooms={rooms} checkIn={checkIn} checkOut={checkOut} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="fixed-bottom bg-white border-top p-3 shadow-lg" style={{ zIndex: 1031 }}>
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted fw-bold text-uppercase">Total Price</small>
                        <h4 className="mb-0 fw-bold" style={{ color: '#5C6F4E' }}>
                            {formatVND(calculateTotalPrice())}
                        </h4>
                    </div>
                    <button
                        className="btn btn-gold px-4 py-2 fw-bold rounded-3"
                        onClick={handleContinue}
                        disabled={rooms.length === 0}
                    >
                        Continue to Payment <i className="bi bi-arrow-right ms-2" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default GuestInformation;
