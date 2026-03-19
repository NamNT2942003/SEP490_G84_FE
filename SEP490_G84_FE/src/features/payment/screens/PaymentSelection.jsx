// src/features/payment/screens/PaymentSelection.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentSelection.css'; // Import giao diện mới

const PaymentSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Hứng dữ liệu từ GuestInformation
    const { bookingId, totalAmount } = location.state || { bookingId: null, totalAmount: 0 };

    const [selectedMethod, setSelectedMethod] = useState('STRIPE');
    const [isLoading, setIsLoading] = useState(false);
    const [qrData, setQrData] = useState(null);

    // =========================================================================
    // TÍNH NĂNG POLLING: TỰ ĐỘNG KIỂM TRA TRẠNG THÁI THANH TOÁN 3 GIÂY/LẦN
    // =========================================================================
    useEffect(() => {
        let intervalId;

        if (qrData && qrData.paymentId) {
            intervalId = setInterval(async () => {
                try {
                    const res = await fetch(`http://localhost:8081/api/payment/status/${qrData.paymentId}`);
                    const data = await res.json();

                    if (res.ok && data.status === 'COMPLETED') {
                        clearInterval(intervalId);
                        navigate(`/payment/result?status=success&paymentId=${qrData.paymentId}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
                }
            }, 3000); // 3000ms = 3 giây
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [qrData, navigate]);

    if (!bookingId) {
        return (
            <div className="payment-selection-wrapper">
                <div className="payment-selection-card text-center">
                    <h4 className="mb-3">Booking Information Missing</h4>
                    <p className="text-muted mb-4">We couldn't find your booking details.</p>
                    <button className="btn btn-dark w-100" onClick={() => navigate('/')}>Return to Homepage</button>
                </div>
            </div>
        );
    }

    const handleProcessPayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:8081/api/payment/create?bookingId=${bookingId}&amount=${totalAmount}&method=${selectedMethod}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                if (data.type === 'REDIRECT' && data.payUrl) {
                    window.location.href = data.payUrl;
                } else if (data.type === 'QR' && data.qrImg) {
                    setQrData({
                        imgUrl: data.qrImg,
                        content: data.content,
                        paymentId: data.paymentId
                    });
                    setIsLoading(false);
                }
            } else {
                alert('Payment creation failed: ' + (data.message || 'Please try again.'));
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            alert('Server connection error!');
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="payment-selection-wrapper">
            <div className="payment-selection-card">
                
                {/* Header Branding */}
                <div className="hotel-brand">AN NGUYEN</div>
                <div className="hotel-subtitle">Payment Gateway</div>

                {qrData ? (
                    /* =========================================
                       QR CODE VIEW
                    ========================================= */
                    <div className="qr-container fade-in">
                        <h4 className="fw-bold mb-2" style={{ color: '#333' }}>Scan to Pay</h4>
                        <p className="text-muted mb-4 fs-6">Open your banking app and scan the QR code below.</p>

                        <div className="amount-display">
                            <div className="amount-label">Total Amount</div>
                            <div className="amount-value">{formatCurrency(totalAmount)}</div>
                        </div>

                        <div className="qr-frame">
                            <img src={qrData.imgUrl} alt="Payment QR Code" />
                        </div>

                        <div className="qr-instruction">
                            <div className="mb-1 text-muted small">Transfer Content (Required):</div>
                            <div className="fs-5 fw-bold text-dark mb-3">{qrData.content}</div>
                            
                            <div className="d-flex align-items-center mt-3 pt-3 border-top">
                                <span className="polling-indicator"></span>
                                <span className="small text-muted fw-medium">Awaiting payment confirmation...</span>
                            </div>
                        </div>

                        <button 
                            className="btn btn-outline-secondary w-100 py-2 rounded-3 mt-2" 
                            onClick={() => setQrData(null)}
                        >
                            Choose another method
                        </button>
                    </div>
                ) : (
                    /* =========================================
                       PAYMENT SELECTION VIEW
                    ========================================= */
                    <div className="fade-in">
                        <h4 className="fw-bold mb-4 text-center" style={{ color: '#333' }}>Select Payment Method</h4>

                        <div className="amount-display">
                            <div className="amount-label">Total Amount</div>
                            <div className="amount-value">{formatCurrency(totalAmount)}</div>
                        </div>

                        <div className="mb-4">
                            {/* Option 1: Stripe (Cards) */}
                            <div 
                                className={`payment-method-card ${selectedMethod === 'STRIPE' ? 'selected' : ''}`}
                                onClick={() => setSelectedMethod('STRIPE')}
                            >
                                <div className="custom-radio"></div>
                                <div className="method-details">
                                    <h6>Credit / Debit Card</h6>
                                    <small>Visa, Mastercard, Amex</small>
                                </div>
                                <i className="fa-brands fa-stripe method-icon" style={{ color: '#635bff' }}></i>
                            </div>

                            {/* Option 2: SEPAY (Banking QR) */}
                            <div 
                                className={`payment-method-card ${selectedMethod === 'SEPAY' ? 'selected' : ''}`}
                                onClick={() => setSelectedMethod('SEPAY')}
                            >
                                <div className="custom-radio"></div>
                                <div className="method-details">
                                    <h6>Banking App (QR)</h6>
                                    <small>Instant bank transfer</small>
                                </div>
                                <i className="fa-solid fa-qrcode method-icon" style={{ color: '#888' }}></i>
                            </div>
                        </div>

                        <button
                            className="btn-gold w-100 mb-3"
                            onClick={handleProcessPayment}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                        
                        <div className="text-center">
                            <button className="btn btn-link text-muted text-decoration-none" onClick={() => navigate(-1)}>
                                Cancel & Return
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSelection;