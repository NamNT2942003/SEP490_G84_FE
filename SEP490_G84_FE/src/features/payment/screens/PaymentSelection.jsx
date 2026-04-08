import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentService from '@/features/payment/api/paymentService';
import BookingSummary from '@/features/booking/components/BookingSummary';
import Swal from 'sweetalert2';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

// TODO: Thay thế bằng Publishable Key MỚI TỪ STRIPE DASHBOARD (Bắt đầu bằng pk_test_...)
const stripePromise = loadStripe('pk_test_XXX_THAY_MA_CUA_BAN_VAO_DAY_XXX');

const normalizePolicyType = (value) => String(value || '').trim().toUpperCase();

const getPolicyLabel = (policyType) => {
    switch (normalizePolicyType(policyType)) {
        case 'FREE_CANCEL':
            return 'Free cancellation';
        case 'PARTIAL_REFUND':
            return 'Partial refund';
        case 'NON_REFUND':
            return 'Non-refundable';
        case 'PAY_AT_HOTEL':
            return 'Pay at hotel';
        default:
            return 'Policy-based payment';
    }
};

const getPolicyRate = (room) => {
    const option = room?.selectedPricingOption || {};
    const rawRate = option?.prepaidRate ?? option?.prepaidPercent ?? room?.prepaidRate;
    const rate = Number(rawRate);

    if (Number.isFinite(rate) && rate >= 0) {
        return Math.min(100, rate);
    }

    const policyType = normalizePolicyType(option?.cancellationPolicyType || room?.paymentType || room?.cancellationType);
    if (policyType === 'PAY_AT_HOTEL') return 0;
    return 100;
};

const getPolicyAmountForRoom = (room) => {
    const unitPrice = Number(
        room?.selectedPrice
            ?? room?.selectedPricingOption?.finalPrice
            ?? room?.appliedPrice
            ?? room?.basePrice
            ?? room?.price
            ?? 0,
    );
    const quantity = Number(room?.quantity || 1);
    const policyRate = getPolicyRate(room);
    return Math.max(0, Math.round(unitPrice * quantity * policyRate / 100));
};

const getRoomPolicyType = (room) => {
    return normalizePolicyType(
        room?.selectedPricingOption?.cancellationPolicyType
        || room?.selectedPricingOption?.policyType
        || room?.paymentType
        || room?.cancellationType,
    );
};

const PaymentSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        bookingId,
        totalAmount,
        rooms = [],
        checkIn = '',
        checkOut = '',
        branchId = null,
    } = location.state || { bookingId: null, totalAmount: 0 };
    const hasStayDetails = rooms.length > 0 || checkIn || checkOut || branchId;

    const [selectedMethod, setSelectedMethod] = useState('STRIPE');
    const [isLoading, setIsLoading] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [clientSecret, setClientSecret] = useState('');

    const policyAmount = rooms.reduce((sum, room) => sum + getPolicyAmountForRoom(room), 0);
    const effectiveAmount = policyAmount > 0 || rooms.some((room) => getRoomPolicyType(room) === 'PAY_AT_HOTEL')
        ? policyAmount
        : Number(totalAmount || 0);
    const hasPolicyBasedPayment = rooms.some((room) => Boolean(room?.selectedPricingOption?.prepaidRate || room?.selectedPricingOption?.cancellationPolicyType));
    const policyLabels = [...new Set(rooms.map((room) => getRoomPolicyType(room)).filter(Boolean))];

    useEffect(() => {
        if (effectiveAmount <= 0) {
            setSelectedMethod('CASH');
            return;
        }

        if (selectedMethod === 'CASH') {
            setSelectedMethod('STRIPE');
        }
    }, [effectiveAmount]);

    useEffect(() => {
        let intervalId;
        if (qrData && qrData.paymentId) {
            intervalId = setInterval(async () => {
                try {
                    const data = await paymentService.getPaymentStatus(qrData.paymentId);
                    if (data && data.status === 'COMPLETED') {
                        clearInterval(intervalId);
                        navigate(`/payment/result?status=success&paymentId=${qrData.paymentId}`);
                    }
                } catch (error) {
                    console.error("Error polling payment status:", error);
                }
            }, 3000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [qrData, navigate]);

    if (!bookingId) {
        return (
            <div className="text-center mt-5">
                <h3>Booking information not found!</h3>
                <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    const handleProcessPayment = async () => {
        if (selectedMethod === 'CASH' && effectiveAmount <= 0) {
            Swal.fire({
                icon: 'success',
                title: 'Booking confirmed',
                text: 'This booking follows a pay-at-hotel policy. No online payment is required.',
                confirmButtonColor: '#465c47',
            }).then(() => navigate('/guest/bookings'));
            return;
        }

        setIsLoading(true);
        try {
            const data = await paymentService.createPayment({
                bookingId,
                amount: effectiveAmount,
                method: selectedMethod,
            });

            if (data?.type === 'OFFLINE') {
                navigate(`/payment/result?status=success&paymentId=${data.paymentId}`);
                return;
            }

            if (data?.type === 'REDIRECT' && data.payUrl) {
                window.location.href = data.payUrl;
                return;
            }

            // Trường hợp Stripe Embedded Checkout (Trả về clientSecret)
            if (data?.clientSecret) {
                setClientSecret(data.clientSecret);
                setIsLoading(false);
                return;
            }

            // Trường hợp SEPAY/Bank Transfer (Trả về QR)
            if (data?.type === 'QR' && data.qrImg) {
                setQrData({
                    imgUrl: data.qrImg,
                    content: data.content,
                    paymentId: data.paymentId,
                });
                setIsLoading(false);
                return;
            }

            Swal.fire({ icon: 'error', title: 'Payment Error', text: 'Did not receive payment instructions from the server.', confirmButtonColor: '#465c47' });
            setIsLoading(false);
        } catch (error) {
            console.error('Connection error:', error);
            const message = error?.response?.data?.message || error?.friendlyMessage || error.message || 'Error connecting to the server!';
            Swal.fire({ icon: 'error', title: 'Payment Error', text: message, confirmButtonColor: '#465c47' });
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const renderMethodCard = (value, title, description, icon, accentColor) => (
        <div
            className={`p-3 border rounded-3 d-flex align-items-center ${selectedMethod === value ? 'shadow-sm' : ''}`}
            style={{ borderColor: selectedMethod === value ? '#465c47' : '#dee2e6', backgroundColor: selectedMethod === value ? '#fcfdfa' : '#fff', borderWidth: selectedMethod === value ? '2px' : '1px', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setSelectedMethod(value)}
        >
            <input
                type="radio"
                className="form-check-input me-3 mt-0"
                checked={selectedMethod === value}
                onChange={() => setSelectedMethod(value)}
                style={{ cursor: 'pointer' }}
            />
            <div>
                <h6 className="mb-0 fw-bold">{title}</h6>
                <small className="text-muted">{description}</small>
            </div>
            <i className={`${icon} ms-auto fs-3`} style={{ color: accentColor }}></i>
        </div>
    );

    return (
        <div className="bg-light" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
            {/* Header */}
            <header className="p-3 sticky-top shadow-sm" style={{ backgroundColor: '#465c47', zIndex: 1030 }}>
                <div className="container d-flex align-items-center">
                    <button className="btn text-white p-0 me-3 fs-5" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left" />
                    </button>
                    <h5 className="mb-0 mx-auto text-white fw-semibold">
                        <i className="bi bi-credit-card me-2" />
                        Complete Your Payment
                    </h5>
                </div>
            </header>

            <main className="container mt-4">
                <div className="row g-4">
                    {/* Left Column - Payment Details */}
                    <div className="col-lg-8">
                        <div className="bg-white rounded-3 shadow-sm p-4">
                            {clientSecret ? (
                                <div id="stripe-checkout" className="text-center">
                                    <h4 className="fw-bold mb-3" style={{ color: '#465c47' }}><i className="bi bi-shield-check me-2"></i>Secure Stripe Payment</h4>
                                    <p className="text-muted mb-4">Your payment is encrypted and safely processed by Stripe.</p>

                                    {/* Màn hình Embedded Checkout Form */}
                                    <div className="mb-4 text-start">
                                        <EmbeddedCheckoutProvider
                                            stripe={stripePromise}
                                            options={{clientSecret}}
                                        >
                                            <EmbeddedCheckout />
                                        </EmbeddedCheckoutProvider>
                                    </div>

                                    <button
                                        className="btn btn-outline-secondary w-100 mt-2 fw-bold rounded-3"
                                        onClick={() => setClientSecret('')}
                                    >
                                        <i className="bi bi-arrow-left me-2"></i>Choose Another Method
                                    </button>
                                </div>
                            ) : qrData ? (
                                <div className="text-center">
                                    <h4 className="fw-bold mb-3" style={{ color: '#465c47' }}><i className="bi bi-qr-code-scan me-2"></i>QR Code Payment</h4>
                                    <p className="text-muted mb-4">Please open your banking app and scan the QR code below to pay.</p>

                                    <div className="bg-light p-3 rounded-3 mb-4 text-center">
                                        <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '1px' }}>Total Amount</p>
                                        <h3 className="fw-bold m-0" style={{ color: '#D4AF37' }}>{formatCurrency(totalAmount)}</h3>
                                    </div>

                                    <div className="position-relative d-inline-block">
                                        <img
                                            src={qrData.imgUrl}
                                            alt="Payment QR Code"
                                            className="img-fluid border rounded p-2 mb-3 shadow-sm bg-white"
                                            style={{ maxWidth: '300px' }}
                                        />
                                        <div className="spinner-border position-absolute top-0 start-100 translate-middle" role="status" style={{width: '1.5rem', height: '1.5rem', color: '#465c47'}}>
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>

                                    <div className="alert mt-3 text-start" role="alert" style={{ backgroundColor: '#f0f4ec', color: '#465c47', border: '1px solid #d1e2c9' }}>
                                        <div className="fw-bold mb-2"><i className="bi bi-info-circle-fill me-2"></i>Transfer Note/Memo (Required):</div>
                                        <div className="text-center bg-white p-2 rounded border shadow-sm" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc3545', letterSpacing: '1px' }}>
                                            {qrData.content}
                                        </div>
                                        <p className="mb-0 mt-3 small text-muted text-center fw-semibold">
                                            Awaiting payment... The system will redirect automatically upon success.
                                        </p>
                                    </div>

                                    <button
                                        className="btn btn-outline-secondary w-100 mt-3 fw-bold rounded-3"
                                        onClick={() => setQrData(null)}
                                    >
                                        <i className="bi bi-arrow-left me-2"></i>Choose Another Method
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h4 className="fw-bold mb-4 border-bottom pb-3" style={{ color: '#465c47' }}>
                                        <i className="bi bi-wallet2 me-2"></i>Select Payment Method
                                    </h4>

                                    <div className="bg-light p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center gap-3 flex-wrap">
                                        <div>
                                            <p className="text-muted mb-0 fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>Amount due by policy</p>
                                            <div className="text-muted small mt-1">
                                                {hasPolicyBasedPayment ? (
                                                    <>
                                                        {policyLabels.map((label) => label).join(' · ')}
                                                    </>
                                                ) : 'Standard booking payment'}
                                            </div>
                                        </div>
                                        <h3 className="fw-bold m-0" style={{ color: '#465c47' }}>{formatCurrency(effectiveAmount)}</h3>
                                    </div>

                                    {hasPolicyBasedPayment && rooms.length > 0 && (
                                        <div className="mb-4">
                                            {rooms.map((room, index) => {
                                                const roomAmount = getPolicyAmountForRoom(room);
                                                const roomPolicy = getPolicyLabel(getRoomPolicyType(room));
                                                return (
                                                    <div key={`${room.roomTypeId || index}-policy`} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                        <div>
                                                            <div className="fw-semibold">{room.name || `Room ${index + 1}`}</div>
                                                            <small className="text-muted">{roomPolicy} · {room.selectedPricingOption?.prepaidRate != null ? `${room.selectedPricingOption.prepaidRate}% payable now` : 'Policy rate applied'}</small>
                                                        </div>
                                                        <div className="fw-bold" style={{ color: '#465c47' }}>{formatCurrency(roomAmount)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        {effectiveAmount > 0 ? (
                                            <>
                                                {renderMethodCard('STRIPE', 'Pay with VISA / MasterCard', 'Secure payment via Stripe gateway', 'fa-brands fa-cc-visa', '#1a1f71')}
                                                <div className="my-3" />
                                                {renderMethodCard('SEPAY', 'Bank Transfer (QR Code)', 'Quick payment using banking app', 'fa-solid fa-qrcode', '#465c47')}
                                            </>
                                        ) : (
                                            renderMethodCard('CASH', 'Pay at hotel', 'No online payment required for this policy', 'bi bi-building-check', '#0f766e')
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right column – Booking Summary */}
                    <div className="col-lg-4">
                        <div className="sticky-top d-none d-lg-block" style={{ top: '90px', zIndex: 1020 }}>
                            <h5 className="fw-bold mb-3" style={{ color: '#465c47' }}>Your Booking</h5>
                            <BookingSummary selectedRooms={rooms} checkIn={checkIn} checkOut={checkOut} />
                        </div>
                        <div className="d-lg-none mt-4">
                            <h5 className="fw-bold mb-3" style={{ color: '#465c47' }}>Your Booking</h5>
                            <BookingSummary selectedRooms={rooms} checkIn={checkIn} checkOut={checkOut} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer with actions (only when QR or Stripe is not active) */}
            {!qrData && !clientSecret && (
                <footer className="fixed-bottom bg-white border-top p-3 shadow-lg" style={{ zIndex: 1031 }}>
                    <div className="container d-flex justify-content-between align-items-center">
                        <div>
                            <small className="text-muted fw-bold text-uppercase">Total Price</small>
                            <h4 className="mb-0 fw-bold" style={{ color: '#465c47' }}>
                                {formatCurrency(effectiveAmount)}
                            </h4>
                        </div>
                        <button
                            className="btn px-4 py-2 fw-bold rounded-3"
                            style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFC700 100%)', color: '#333', border: 'none', transition: 'all 0.2s' }}
                            onClick={handleProcessPayment}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Processing...</>
                            ) : (
                                <>{selectedMethod === 'CASH' ? 'Confirm pay at hotel' : 'Access Payment Gateway'} <i className="bi bi-shield-lock-fill ms-2" /></>
                            )}
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default PaymentSelection;
