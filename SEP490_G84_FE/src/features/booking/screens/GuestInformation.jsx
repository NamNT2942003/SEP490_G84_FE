import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Input from '@/components/ui/Input';
import { API_BASE_URL } from '@/constants/apiConfig';
import './GuestInformation.css';

// ─── Helpers ───────────────────────────────────────────────────────────────

const calculateNights = (start, end) => {
    if (!start || !end) return 1;
    const diffMs = Math.abs(new Date(end) - new Date(start));
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const buildBookingPayload = (formData, rooms, checkIn, checkOut) => ({
    otaReservationId: `WEB-${formData.phone.replace(/\s+/g, '')}-${checkIn}-${checkOut}`,
    arrival_date: checkIn,
    departure_date: checkOut,
    rooms: rooms.map((room) => ({
        room_type_id: String(room.roomTypeId),
        price: room.basePrice || room.price,
        rate_plan_id: '1',
        quantity: room.quantity || 1,
    })),
    customer: {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
    },
    special_requests: formData.specialRequests,
});

// ─── RoomItem ──────────────────────────────────────────────────────────────

const RoomItem = ({ room, checkIn, checkOut, onQuantityChange, onRemove }) => {
    const nights = calculateNights(checkIn, checkOut);
    const unitPrice = room.basePrice || room.price;
    const qty = room.quantity || 1;
    const maxQty = room.availableCount || 999;

    return (
        <div className="room-item">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div className="room-name">{room.name}</div>
                    <div className="room-price">
                        💰 {new Intl.NumberFormat('vi-VN').format(unitPrice)}₫/night
                    </div>
                </div>
                <button
                    type="button"
                    className="delete-btn"
                    onClick={() => onRemove(room.roomTypeId)}
                    title="Remove room"
                >
                    <i className="bi bi-trash" />
                </button>
            </div>

            <div className="d-flex justify-content-between align-items-center">
                <div className="qty-control">
                    <button
                        type="button"
                        onClick={() => onQuantityChange(room.roomTypeId, qty - 1)}
                        title="Decrease"
                    >
                        <i className="bi bi-dash" />
                    </button>
                    <input
                        type="number"
                        className="qty-input"
                        value={qty}
                        min="1"
                        max={maxQty}
                        onChange={(e) =>
                            onQuantityChange(room.roomTypeId, parseInt(e.target.value) || 1)
                        }
                    />
                    <button
                        type="button"
                        onClick={() => onQuantityChange(room.roomTypeId, qty + 1)}
                        disabled={qty >= maxQty}
                        title="Increase"
                    >
                        <i className="bi bi-plus" />
                    </button>
                </div>
                <div className="room-total">{formatVND(unitPrice * qty * nights)}</div>
            </div>
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

    const calculateTotalPrice = () => {
        const nights = calculateNights(checkIn, checkOut);
        return rooms.reduce(
            (sum, room) => sum + (room.basePrice || room.price) * (room.quantity || 1) * nights,
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

        try {
            const payload = buildBookingPayload(formData, rooms, checkIn, checkOut);
            const currentBranchId = branchId || 1;

            const response = await fetch(
                `${API_BASE_URL}/bookings/create-from-frontend?branchId=${currentBranchId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                alert(`Lỗi đặt phòng: ${errorText || 'Không thể tạo booking'}`);
                return;
            }

            const data = await response.json();

            if (!data.bookingId) {
                alert('Lỗi đặt phòng: Không nhận được mã đặt phòng từ server.');
                return;
            }

            navigate('/payment-selection', {
                state: { bookingId: data.bookingId, totalAmount: calculateTotalPrice() },
            });
        } catch (error) {
            console.error('Booking error:', error);
            alert('Lỗi đặt phòng: ' + error.message);
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
                        <div className="sticky-top d-none d-lg-block" style={{ top: '90px', zIndex: 1020 }}>
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <div className="bg-white rounded-3 custom-shadow overflow-hidden">
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

