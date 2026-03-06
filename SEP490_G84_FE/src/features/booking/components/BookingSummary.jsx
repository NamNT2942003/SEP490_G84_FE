import React from 'react';

const BookingSummary = ({ selectedRooms = [], checkIn, checkOut }) => {

    // Hàm tính số đêm lưu trú
    const calculateNights = (start, end) => {
        if (!start || !end) return 0;
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Hàm định dạng ngày hiển thị (VD: 27 Feb)
    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "...";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const nights = calculateNights(checkIn, checkOut);

    return (
        <div className="bg-white rounded-3 p-3 border custom-shadow">
            {/* Ảnh minh họa - Lấy ảnh của phòng đầu tiên nếu có */}
            <img
                alt="Resort Room"
                className="img-fluid rounded-3 mb-3"
                src={selectedRooms[0]?.image || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"}
                style={{ height: '160px', width: '100%', objectFit: 'cover' }}
            />

            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Resort Name
                </p>
                <p className="fw-bold text-olive-dark mb-0 fs-6">Grand Heritage Resort</p>
            </div>

            {/* Hiển thị danh sách các loại phòng đã chọn */}
            <div className="mb-3">
                <p className="text-uppercase fw-bold text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                    Selected Rooms
                </p>
                {selectedRooms.length > 0 ? (
                    selectedRooms.map((room, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                            <p className="fw-semibold text-dark mb-0 small">
                                {room.quantity}x {room.name}
                            </p>
                            <span className="text-muted small">
                {new Intl.NumberFormat('vi-VN').format(room.basePrice)}₫
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
                    <span className="fw-bold text-olive">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    selectedRooms.reduce((sum, room) => sum + (room.basePrice * (room.quantity || 1)), 0) * nights
                )}
            </span>
                </div>
                <small className="text-muted" style={{ fontSize: '11px' }}>*Taxes and fees included</small>
            </div>
        </div>
    );
};

export default BookingSummary;