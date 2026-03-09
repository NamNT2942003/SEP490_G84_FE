import React, {useState} from 'react';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Input from '@/components/ui/Input';
import {useLocation, useNavigate} from "react-router-dom";

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
        guestFullName: "",
        guestEmail: "",
        guestPhone: "",
        specialRequests: "",
        breakfast: false,
        earlyCheckIn: false
    });

    const [isBookingForSomeone, setIsBookingForSomeone] = useState(false);
    const [rooms, setRooms] = useState(selectedRooms || []);

    // Hàm cập nhật số lượng phòng
    const handleQuantityChange = (roomTypeId, newQuantity) => {
        console.log('🔍 handleQuantityChange called:', {roomTypeId, newQuantity});

        if (newQuantity <= 0) {
            handleRemoveRoom(roomTypeId);
            return;
        }

        // Tìm phòng để lấy availableCount
        const room = rooms.find(r => r.roomTypeId === roomTypeId);
        console.log('🏠 Found room:', room);

        if (room) {
            const maxAvailable = room.availableCount || 999;
            console.log(`✅ Max available: ${maxAvailable}, Requested: ${newQuantity}`);

            if (newQuantity > maxAvailable) {
                alert(`Only ${maxAvailable} room(s) available for ${room.name}`);
                console.log('❌ Blocked: Quantity exceeds available count');
                return;
            }
        }

        setRooms(prev => prev.map(room =>
            room.roomTypeId === roomTypeId ? { ...room, quantity: newQuantity } : room
        ));
        console.log('✅ Quantity updated successfully');
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
        const {id, name, value, type, checked} = e.target;
        const targetId = id || name; // Đảm bảo lấy được ID
        setFormData(prev => ({
            ...prev,
            [targetId]: type === 'checkbox' ? checked : value
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
            otaReservationId: "WEB-" + Date.now(),
            arrival_date: checkIn,
            departure_date: checkOut,
            rooms: rooms.map(room => ({
                room_type_id: String(room.roomTypeId),
                price: room.basePrice || room.price,
                rate_plan_id: "1",
                quantity: room.quantity || 1
            })),
            customer: {
                name: isBookingForSomeone ? formData.guestFullName : formData.fullName,
                email: isBookingForSomeone ? formData.guestEmail : formData.email,
                phone: isBookingForSomeone ? formData.guestPhone : formData.phone
            },
            special_requests: formData.specialRequests
        };

        try {
            console.log("Sending Payload to Backend:", bookingPayload);

            // 2. GỌI API THẬT ĐẾN CONTROLLER BACKEND
            // Sử dụng branchId lấy từ location.state (mặc định là 1 nếu null)
            const currentBranchId = branchId || 1;

            const response = await fetch(`http://localhost:8081/api/bookings/create-from-frontend?branchId=${currentBranchId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingPayload)
            });

            // Nếu Backend trả về lỗi (mã 400, 500...)
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            // 3. ĐỌC DỮ LIỆU JSON BACKEND TRẢ VỀ
            const data = await response.json();
            console.log("Backend response:", data);

            if (data.bookingId) {

                navigate('/payment-selection', {
                    state: {
                        bookingId: data.bookingId,
                        totalAmount: calculateTotalPrice() // Tính lại tổng giá chính xác
                    }
                });
            } else {
                throw new Error("Không nhận được mã đặt phòng từ Backend.");
            }

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
                .booking-type-btn {
                    padding: 16px;
                    border: 2px solid #ddd;
                    border-radius: 12px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    background: white;
                }
                .booking-type-btn:hover {
                    border-color: #5C6F4E;
                    box-shadow: 0 4px 12px rgba(92,111,78,0.1);
                }
                .booking-type-btn.active {
                    border-color: #5C6F4E;
                    border-width: 2.5px;
                    background: #f0f4ec;
                    box-shadow: 0 4px 16px rgba(92,111,78,0.15);
                }
                .booking-type-btn i {
                    font-size: 1.8rem;
                    display: block;
                    margin-bottom: 8px;
                    color: #5C6F4E;
                }
                .booking-type-btn .label {
                    font-weight: 600;
                    font-size: 0.95rem;
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
                        {/* Booking Type Selection */}
                        <div className="row g-2 mb-4">
                            <div className="col-sm-6">
                                <div
                                    className={`booking-type-btn ${!isBookingForSomeone ? 'active' : ''}`}
                                    onClick={() => setIsBookingForSomeone(false)}
                                >
                                    <i className="bi bi-person"></i>
                                    <div className="label">Booking for myself</div>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div
                                    className={`booking-type-btn ${isBookingForSomeone ? 'active' : ''}`}
                                    onClick={() => setIsBookingForSomeone(true)}
                                >
                                    <i className="bi bi-people"></i>
                                    <div className="label">Booking for someone else</div>
                                </div>
                            </div>
                        </div>

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
                                {isBookingForSomeone ? "Booker Details" : "Your Details"}
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

                        {/* Someone Else Details */}
                        {isBookingForSomeone && (
                            <div className="bg-white p-4 rounded-3 custom-shadow mb-4">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className="bi bi-people text-olive"></i>
                                    <h5 className="fw-bold mb-0">Stay Guest Information</h5>
                                </div>
                                <div className="row">
                                    <div className="col-12">
                                        <Input id="guestFullName" label="Guest Full Name" icon="bi-person"
                                               placeholder="Enter guest's full name" type="text"
                                               value={formData.guestFullName} onChange={handleInputChange}/>
                                    </div>
                                    <div className="col-md-6">
                                        <Input id="guestEmail" label="Guest Email Address" icon="bi-envelope"
                                               placeholder="guest@example.com" type="email"
                                               value={formData.guestEmail} onChange={handleInputChange}/>
                                    </div>
                                    <div className="col-md-6">
                                        <Input id="guestPhone" label="Guest Phone Number" icon="bi-telephone"
                                               placeholder="0123 456 789" type="tel"
                                               value={formData.guestPhone} onChange={handleInputChange}/>
                                    </div>
                                </div>
                            </div>
                        )}

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