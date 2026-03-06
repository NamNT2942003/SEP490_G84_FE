import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Hứng ĐÚNG tên biến từ GuestInformation truyền sang
    const { bookingId, totalAmount } = location.state || { bookingId: null, totalAmount: 0 };

    const [isLoading, setIsLoading] = useState(false);

    // Bắt lỗi nếu ai đó tự gõ URL /payment mà không đi qua bước đặt phòng
    if (!bookingId) {
        return (
            <div className="container text-center" style={{ marginTop: '100px' }}>
                <i className="fa-solid fa-circle-exclamation text-warning" style={{ fontSize: '4rem' }}></i>
                <h3 className="mt-3">No booking information found!</h3>
                <button className="btn btn-outline-secondary mt-3" onClick={() => navigate('/')}>
                    Return to Home
                </button>
            </div>
        );
    }

    const handleStripePayment = async () => {
        setIsLoading(true);
        try {
            // Truyền bookingId và totalAmount xuống Backend
            const response = await fetch(`http://localhost:8080/api/payment/create?bookingId=${bookingId}&amount=${totalAmount}&method=STRIPE`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (response.ok && data.payUrl) {
                // Có link Stripe -> Bế khách hàng sang trang quẹt thẻ!
                window.location.href = data.payUrl;
            } else {
                alert('Payment creation failed: ' + (data.message || 'Please try again.'));
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Payment API Error:', error);
            alert('Cannot connect to the server!');
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="bg-light" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
            <header className="bg-olive p-3 shadow-sm sticky-top" style={{ zIndex: 1030, backgroundColor: '#5C6F4E' }}>
                <div className="container text-center text-white">
                    <h5 className="mb-0 fw-semibold">Payment Confirmation</h5>
                </div>
            </header>

            <main className="container mt-5" style={{ maxWidth: '600px' }}>
                <div className="bg-white p-5 rounded-3 shadow-sm text-center">
                    <div className="mb-4">
                        <i className="fa-regular fa-credit-card text-olive mb-3" style={{ fontSize: '3rem', color: '#5C6F4E' }}></i>
                        <h4 className="fw-bold">Booking #{bookingId}</h4>
                        <p className="text-muted">Please review your total amount and proceed to payment.</p>
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-4 d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-muted text-uppercase">Total Amount</span>
                        <span className="fs-3 fw-bold" style={{ color: '#D4AF37' }}>{formatCurrency(totalAmount)}</span>
                    </div>

                    <button
                        className="btn btn-gold w-100 py-3 fw-bold rounded-3 fs-5"
                        onClick={handleStripePayment}
                        disabled={isLoading}
                        style={{ backgroundColor: '#D4AF37', color: 'white', border: 'none' }}
                    >
                        {isLoading ? (
                            <span><i className="fa-solid fa-spinner fa-spin me-2"></i> Connecting to Stripe...</span>
                        ) : (
                            <span><i className="fa-brands fa-stripe me-2 fs-4 align-middle"></i> Pay with Stripe</span>
                        )}
                    </button>

                    <button
                        className="btn btn-link text-muted mt-3 text-decoration-none"
                        onClick={() => navigate(-1)}
                        disabled={isLoading}
                    >
                        <i className="fa-solid fa-arrow-left me-2"></i> Go Back
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Payment;