import React, {useState} from 'react';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Input from '@/components/ui/Input';
import {useLocation, useNavigate} from "react-router-dom";
import { API_BASE_URL } from "@/constants/apiConfig";

const GuestInformation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy dữ liệu từ trang chọn phòng truyền sang
    const {selectedRooms, checkIn, checkOut, branchId} = location.state || {
        selectedRooms: [],
        checkIn: "",
        checkOut: "",
        branchId: null
    };

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        specialRequests: ""
    });

    const [rooms, setRooms] = useState(selectedRooms || []);

    // Hàm cập nhật số lượng phòng
    const handleQuantityChange = (roomTypeId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveRoom(roomTypeId);
            return;
        }

        const room = rooms.find(r => r.roomTypeId === roomTypeId);

        if (room) {
            const maxAvailable = room.availableCount || 999;
            if (newQuantity > maxAvailable) {
                alert(`Only ${maxAvailable} room(s) available for ${room.name}`);
                return;
            }
        }

        setRooms(prev => prev.map(room =>
            room.roomTypeId === roomTypeId ? { ...room, quantity: newQuantity } : room
        ));
    };

    // Hàm xóa phòng khỏi giỏ hàng
    const handleRemoveRoom = (roomTypeId) => {
        setRooms(prev => prev.filter(room => room.roomTypeId !== roomTypeId));
    };

    // Tính lại tổng giá khi số phòng thay đổi
    const calculateTotalPrice = () => {
        const nights = calculateNights(checkIn, checkOut);
        return rooms.reduce((sum, room) =>
            sum + ((room.basePrice || room.price) * (room.quantity || 1) * nights), 0
        );
    };

    const calculateNights = (start, end) => {
        if (!start || !end) return 1;
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Hàm cập nhật dữ liệu cho Input thường và Checkbox/Switch
    const handleInputChange = (e) => {
        const {id, name, value} = e.target;
        const targetId = id || name;
        setFormData(prev => ({
            ...prev,
            [targetId]: value
        }));
    };

    const handleContinue = async () => {
        // Kiểm tra validation cơ bản
        if (!formData.fullName || !formData.email || !formData.phone) {
            alert("Please fill in all required guest details.");
            return;
        }

        if (rooms.length === 0) {
            alert("Please select at least one room.");
            return;
        }

        // 1. SỬA LẠI TÊN BIẾN CHO KHỚP 100% VỚI BACKEND DTO (camelCase)
        const bookingPayload = {
            otaReservationId: `WEB-${(formData.phone || "guest").replace(/\s+/g, "")}-${checkIn}-${checkOut}`,
            arrival_date: checkIn,
            departure_date: checkOut,
            rooms: rooms.map(room => ({
                room_type_id: String(room.roomTypeId),
                price: room.basePrice || room.price,
                rate_plan_id: "1",
                quantity: room.quantity || 1
            })),
            customer: {
                full_name: formData.fullName,
                email: formData.email,
                phone: formData.phone
            },
            special_requests: formData.specialRequests
        };

        try {
            const currentBranchId = branchId || 1;

            const response = await fetch(`${API_BASE_URL}/bookings/create-from-frontend?branchId=${currentBranchId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingPayload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(`Loi dat phong: ${errorText || "Khong the tao booking"}`);
                return;
            }

            const data = await response.json();

            if (!data.bookingId) {
                alert("Loi dat phong: Khong nhan duoc ma dat phong tu backend.");
                return;
            }

            navigate('/payment-selection', {
                state: {
                    bookingId: data.bookingId,
                    totalAmount: calculateTotalPrice()
                }
            });

        } catch (error) {
            console.error("Booking Error:", error);
            alert("Lỗi đặt phòng: " + error.message);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(amount);
    };

    return (
        <div className="bg-light" style={{minHeight: '100vh', paddingBottom: '120px'}}>
            <style>{`
                .guest-section {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                    border-left: 4px solid #5C6F4E;
                    transition: all 0.3s ease;
                }
                .guest-section:hover {
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                }
                .guest-section h5 {
                    color: #5C6F4E;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 18px;
                    font-weight: 700;
                }
                .room-item {
                    background: linear-gradient(135deg, #fafbf8 0%, #f5f7f2 100%);
                    border: 1px solid #e8ede5;
                    border-radius: 12px;
                    padding: 14px;
                    margin-bottom: 12px;
                    transition: all 0.3s ease;
                }
                .room-item:hover {
                    box-shadow: 0 4px 12px rgba(92,111,78,0.08);
                    border-color: #5C6F4E;
                }
                .room-name {
                    font-weight: 700;
                    color: #5C6F4E;
                    font-size: 1rem;
                    margin-bottom: 6px;
                }
                .room-price {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 10px;
                }
                .qty-control {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #f0f4ec;
                    border-radius: 8px;
                    padding: 4px;
                    width: fit-content;
                }
                .qty-control button {
                    background: white;
                    border: 1px solid #ddd;
                    color: #5C6F4E;
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }
                .qty-control button:hover:not(:disabled) {
                    background: #5C6F4E;
                    color: white;
                    border-color: #5C6F4E;
                    transform: scale(1.05);
                }
                .qty-control button:disabled {
                    background: #f5f5f5;
                    color: #ccc;
                    border-color: #e5e5e5;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                .qty-input {
                    width: 50px !important;
                    text-align: center;
                    border: none !important;
                    background: transparent !important;
                    font-weight: 700;
                    font-size: 1.1rem !important;
                    color: #5C6F4E !important;
                    padding: 0 !important;
                    line-height: 28px !important;
                    height: 28px !important;
                }
                .qty-input:focus {
                    outline: none !important;
                    box-shadow: none !important;
                }
                /* Ẩn spinner arrows */
                .qty-input::-webkit-outer-spin-button,
                .qty-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .qty-input[type=number] {
                    -moz-appearance: textfield;
                }
                .delete-btn {
                    background: #ff4757;
                    color: white;
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    font-size: 0.9rem;
                }
                .delete-btn:hover {
                    background: #ff3838;
                    transform: scale(1.05);
                }
                .room-total {
                    color: #5C6F4E;
                    font-weight: 700;
                    font-size: 0.95rem;
                }
            `}</style>
            <header className="bg-olive p-3 sticky-top shadow-sm" style={{zIndex: 1030}}>
                <div className="container d-flex align-items-center">
                    <button className="btn text-white p-0 me-3 fs-5" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h5 className="mb-0 mx-auto text-white fw-semibold">
                        <i className="bi bi-person-badge me-2"></i>Guest Information
                    </h5>
                </div>
            </header>

            <main className="container mt-4">
                <div className="row g-4">
                    <div className="col-lg-8">
                        {/* Selected Rooms Management */}
                        {rooms.length > 0 && (
                            <div className="guest-section">
                                <h5>
                                    <i className="bi bi-door-open"></i>
                                    Your Rooms ({rooms.length})
                                </h5>
                                {rooms.map((room, index) => (
                                    <div key={index} className="room-item">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div style={{flex: 1}}>
                                                <div className="room-name">{room.name}</div>
                                                <div className="room-price">
                                                    💰 {new Intl.NumberFormat('vi-VN').format(room.basePrice || room.price)}₫/night
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() => handleRemoveRoom(room.roomTypeId)}
                                                title="Remove room"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>

                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <div className="qty-control">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(room.roomTypeId, (room.quantity || 1) - 1)}
                                                    title="Decrease quantity"
                                                >
                                                    <i className="bi bi-dash"></i>
                                                </button>
                                                <input
                                                    type="number"
                                                    value={room.quantity || 1}
                                                    onChange={(e) => handleQuantityChange(room.roomTypeId, parseInt(e.target.value) || 1)}
                                                    className="qty-input"
                                                    min="1"
                                                    max={room.availableCount || 999}
                                                    title={`Max ${room.availableCount || 999} available`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(room.roomTypeId, (room.quantity || 1) + 1)}
                                                    title="Increase quantity"
                                                    disabled={(room.quantity || 1) >= (room.availableCount || 999)}
                                                >
                                                    <i className="bi bi-plus"></i>
                                                </button>
                                            </div>
                                            <div className="room-total">
                                                {new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(
                                                    (room.basePrice || room.price) * (room.quantity || 1) * calculateNights(checkIn, checkOut)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Booker Details Form */}
                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-clipboard-person"></i>
                                Your Details
                            </h5>
                            <div className="row">
                                <div className="col-12">
                                    <Input id="fullName" label="Full Name" icon="bi-person" placeholder="John Doe"
                                           type="text"
                                           value={formData.fullName} onChange={handleInputChange}/>
                                </div>
                                <div className="col-md-6">
                                    <Input id="email" label="Email Address" icon="bi-envelope"
                                           placeholder="john.doe@example.com" type="email"
                                           value={formData.email} onChange={handleInputChange}/>
                                </div>
                                <div className="col-md-6">
                                    <Input id="phone" label="Phone Number" icon="bi-telephone" placeholder="0123 456 789"
                                           type="tel"
                                           value={formData.phone} onChange={handleInputChange}/>
                                </div>
                            </div>
                        </div>

                        {/* Special Requests */}
                        <div className="guest-section">
                            <h5>
                                <i className="bi bi-star"></i>
                                Special Requests (Optional)
                            </h5>
                            <textarea
                                id="specialRequests"
                                className="form-control"
                                rows="4"
                                value={formData.specialRequests}
                                onChange={handleInputChange}
                                placeholder="e.g. high floor, extra pillows, late checkout..."
                                style={{borderRadius: '8px', borderColor: '#ddd'}}
                            ></textarea>
                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="col-lg-4">
                        <div className="sticky-top d-none d-lg-block" style={{top: '90px', zIndex: 1020}}>
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <div className="bg-white rounded-3 custom-shadow overflow-hidden">
                                <BookingSummary selectedRooms={rooms} checkIn={checkIn} checkOut={checkOut}/>
                            </div>
                        </div>
                        <div className="d-lg-none mt-4">
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <BookingSummary selectedRooms={rooms} checkIn={checkIn} checkOut={checkOut}/>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="fixed-bottom bg-white border-top p-3 shadow-lg" style={{zIndex: 1031}}>
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted small fw-bold text-uppercase">Total Price</small>
                        <h4 className="mb-0 fw-bold" style={{color: '#5C6F4E'}}>{formatCurrency(calculateTotalPrice())}</h4>
                    </div>
                    <button
                        className="btn btn-gold px-4 py-2 fw-bold rounded-3"
                        onClick={handleContinue}
                        disabled={rooms.length === 0}
                    >
                        Continue to Payment <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default GuestInformation;

