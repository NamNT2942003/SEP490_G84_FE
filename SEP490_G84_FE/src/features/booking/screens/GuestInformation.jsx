import React, {useState} from 'react';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Input from '@/components/ui/Input';
import {useLocation, useNavigate} from "react-router-dom";

const GuestInformation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy dữ liệu từ trang chọn phòng truyền sang
    const {selectedRooms, checkIn, checkOut, branchId, totalPrice} = location.state || {
        selectedRooms: [],
        totalPrice: 0,
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

        const bookingPayload = {
            ota_reservation_id: "WEB-" + Date.now(),
            arrival_date: checkIn,
            departure_date: checkOut,
            status: "NEW",
            rooms: selectedRooms.map(room => ({
                room_type_id: String(room.roomTypeId),
                price: room.basePrice,
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
            // Link API: /api/bookings/create-from-frontend?branchId={branchId}
            // const response = await bookingService.createBooking(bookingPayload, branchId);

            alert("Booking submitted! Redirecting to Stripe...");
            // navigate("/payment", { state: { bookingId: response.id } });
        } catch (error) {
            console.error("Booking Error:", error);
            alert("Lỗi: " + error.message);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(amount);
    };

    return (
        <div className="bg-light" style={{minHeight: '100vh', paddingBottom: '120px'}}>
            <header className="bg-olive p-3 sticky-top shadow-sm" style={{zIndex: 1030}}>
                <div className="container d-flex align-items-center">
                    <button className="btn text-white p-0 me-3 fs-5" onClick={() => navigate(-1)}>
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <h5 className="mb-0 mx-auto text-white fw-semibold">Guest Information</h5>
                </div>
            </header>

            <main className="container mt-4">
                <div className="row g-4">
                    <div className="col-lg-8">
                        {/* Booking Type Selection */}
                        <div className="d-flex gap-3 mb-4">
                            <div
                                className={`flex-fill p-3 border rounded-3 text-center cursor-pointer bg-white ${!isBookingForSomeone ? 'border-2 border-olive shadow-sm' : 'border-1'}`}
                                onClick={() => setIsBookingForSomeone(false)}
                            >
                                <i className={`fa-solid fa-user mb-1 ${!isBookingForSomeone ? 'text-olive' : 'text-muted'}`}></i>
                                <div
                                    className={`fw-semibold small ${!isBookingForSomeone ? 'text-dark' : 'text-muted'}`}>Booking
                                    for myself
                                </div>
                            </div>
                            <div
                                className={`flex-fill p-3 border rounded-3 text-center cursor-pointer bg-white ${isBookingForSomeone ? 'border-2 border-olive shadow-sm' : 'border-1'}`}
                                onClick={() => setIsBookingForSomeone(true)}
                            >
                                <i className={`fa-solid fa-users mb-1 ${isBookingForSomeone ? 'text-olive' : 'text-muted'}`}></i>
                                <div
                                    className={`fw-semibold small ${isBookingForSomeone ? 'text-dark' : 'text-muted'}`}>Booking
                                    for someone else
                                </div>
                            </div>
                        </div>

                        {/* Booker Details Form */}
                        <div className="bg-white p-4 rounded-3 custom-shadow mb-4">
                            <h5 className="fw-bold mb-3">{isBookingForSomeone ? "Booker Details" : "Guest Details"}</h5>
                            <div className="row">
                                <div className="col-12">
                                    <Input id="fullName" label="Full Name" icon="fa-user" placeholder="John Doe"
                                           type="text"
                                           value={formData.fullName} onChange={handleInputChange}/>
                                </div>
                                <div className="col-md-6">
                                    <Input id="email" label="Email Address" icon="fa-envelope"
                                           placeholder="john.doe@example.com" type="email"
                                           value={formData.email} onChange={handleInputChange}/>
                                </div>
                                <div className="col-md-6">
                                    <Input id="phone" label="Phone Number" icon="fa-phone" placeholder="0123 456 789"
                                           type="tel"
                                           value={formData.phone} onChange={handleInputChange}/>
                                </div>
                            </div>
                        </div>

                        {/* Someone Else Details */}
                        {isBookingForSomeone && (
                            <div className="bg-white p-4 rounded-3 custom-shadow mb-4">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <i className="fa-solid fa-users text-olive"></i>
                                    <h5 className="fw-bold mb-0">Stay Guest Information</h5>
                                </div>
                                <div className="row">
                                    <div className="col-12">
                                        <Input id="guestFullName" label="Guest Full Name" icon="fa-user"
                                               placeholder="Enter guest's full name" type="text"
                                               value={formData.guestFullName} onChange={handleInputChange}/>
                                    </div>
                                    <div className="col-md-6">
                                        <Input id="guestEmail" label="Guest Email Address" icon="fa-envelope"
                                               placeholder="guest@example.com" type="email"
                                               value={formData.guestEmail} onChange={handleInputChange}/>
                                    </div>
                                    <div className="col-md-6">
                                        <Input id="guestPhone" label="Guest Phone Number" icon="fa-phone"
                                               placeholder="0123 456 789" type="tel"
                                               value={formData.guestPhone} onChange={handleInputChange}/>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Special Requests */}
                        <div className="bg-white p-4 rounded-3 custom-shadow">
                            <h5 className="fw-bold mb-3">Special Requests</h5>
                            <textarea
                                id="specialRequests"
                                className="form-control"
                                rows="4"
                                value={formData.specialRequests}
                                onChange={handleInputChange}
                                placeholder="e.g. high floor, extra pillows..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="col-lg-4">
                        <div className="sticky-top d-none d-lg-block" style={{top: '90px', zIndex: 1020}}>
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <div className="bg-white rounded-3 custom-shadow overflow-hidden">
                                <BookingSummary selectedRooms={selectedRooms} checkIn={checkIn} checkOut={checkOut}/>
                            </div>
                        </div>
                        <div className="d-lg-none mt-4">
                            <h5 className="fw-bold mb-3">Your Booking</h5>
                            <BookingSummary selectedRooms={selectedRooms} checkIn={checkIn} checkOut={checkOut}/>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="fixed-bottom bg-white border-top p-3 shadow-lg" style={{zIndex: 1031}}>
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted small fw-bold text-uppercase">Total Price</small>
                        <h4 className="mb-0 fw-bold" style={{color: '#5C6F4E'}}>{formatCurrency(totalPrice)}</h4>
                    </div>
                    <button
                        className="btn btn-gold px-4 py-2 fw-bold rounded-3"
                        onClick={handleContinue}
                    >
                        Continue to Payment <i className="fa-solid fa-arrow-right ms-2"></i>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default GuestInformation;