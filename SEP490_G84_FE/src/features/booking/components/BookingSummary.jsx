import React from 'react';

const BookingSummary = ({ selectedRooms = [], checkIn, checkOut }) => {

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

    const calculateNights = (start, end) => {
        if (!start || !end) return 0;
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '--';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const getUnitPrice = (room) =>
        room.selectedPrice ?? room.selectedPricingOption?.finalPrice ?? room.appliedPrice ?? room.basePrice ?? room.price ?? 0;

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const nights = calculateNights(checkIn, checkOut);
    const totalRooms = selectedRooms.reduce((sum, r) => sum + (r.quantity || 1), 0);
    const subtotal = selectedRooms.reduce(
        (sum, room) => sum + (getUnitPrice(room) * (room.quantity || 1)),
        0,
    );

    return (
        <div className="bg-white rounded-3 p-3 border custom-shadow">
            <img
                alt="Resort Room"
                className="img-fluid rounded-3 mb-3"
                src={selectedRooms[0]?.image || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"}
                style={{ height: '160px', width: '100%', objectFit: 'cover' }}
            />

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Booking Overview
                </p>
                <p className="fw-bold text-olive-dark mb-0 fs-6">Grand Heritage Resort</p>
            </div>

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Selected Rooms
                </p>
                {selectedRooms.length > 0 ? (
                    selectedRooms.map((room, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                            <div>
                                <p className="fw-semibold text-dark mb-0 small">{room.quantity}x {room.name}</p>
                                {room.selectedPricingOption?.mode && <p className="text-muted mb-0" style={{ fontSize: '11px' }}>Mode: {room.selectedPricingOption.mode}</p>}
                                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                    {(room.quantity || 1)} room(s) for selected stay
                                </p>
                                <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                                    {getCancellationText(room.cancellationType, room.freeCancelBeforeDays)} · {getPaymentText(room.paymentType)}
                                </p>
                            </div>
                            <span className="text-muted small">
                {formatCurrency(getUnitPrice(room))}
              </span>
                        </div>
                    ))
                ) : (
                    <p className="text-danger small">No rooms selected</p>
                )}
            </div>

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Stay Dates
                </p>
                <div className="d-flex align-items-center gap-2 fw-semibold text-dark small">
                    <i className="fa-solid fa-calendar text-olive"></i>
                    <span>
            {formatDateDisplay(checkIn)} - {formatDateDisplay(checkOut)} ({nights} {nights > 1 ? 'Nights' : 'Night'})
          </span>
                </div>
            </div>

            <div className="pt-3 border-top mt-2">
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark">Subtotal</span>
                    <span className="fw-bold text-olive">{formatCurrency(subtotal)}</span>
                </div>
                <div className="mt-2">
                    <p className="text-muted small mb-1">
                        <i className="fa-solid fa-info-circle me-1"></i>
                        {nights} {nights > 1 ? 'nights' : 'night'} stay · {totalRooms} {totalRooms > 1 ? 'rooms' : 'room'}
                    </p>
                </div>
                <small className="text-muted" style={{ fontSize: '11px' }}>*Taxes and fees included</small>
            </div>
        </div>
    );
};

export default BookingSummary;