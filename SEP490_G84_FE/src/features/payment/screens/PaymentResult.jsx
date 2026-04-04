// src/features/payment/screens/PaymentResult.jsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentResult.css';

const PaymentResult = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const status = searchParams.get('status') || 'success';
    const isSuccess = status === 'success';

    // Current date for the receipt
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const SuccessIcon = () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );

    const ErrorIcon = () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

    return (
        <div className="payment-result-wrapper">
            <div className={`payment-ticket ${isSuccess ? 'status-success' : 'status-error'}`}>
                
                {/* Branding */}
                <div className="hotel-brand">AN NGUYEN</div>
                <div className="hotel-subtitle">Hotel & Serviced Apartment</div>

                {/* Animated Icon */}
                <div className={`status-icon-circle ${isSuccess ? 'success' : 'error'}`}>
                    {isSuccess ? <SuccessIcon /> : <ErrorIcon />}
                </div>

                {/* Status Message */}
                <h3 className="status-title">
                    {isSuccess ? 'Payment Successful' : 'Transaction Failed'}
                </h3>
                <p className="status-message">
                    {isSuccess 
                        ? 'Your reservation is confirmed. We look forward to hosting you.' 
                        : 'Your payment could not be processed. Please verify your payment details.'}
                </p>

                {/* Digital Receipt Box - Only show if successful */}
                {isSuccess && (
                    <div className="receipt-box">
                        <div className="receipt-row">
                            <span className="receipt-label">Booking Ref</span>
                            <span className="receipt-value">#AN-84BMS</span>
                        </div>
                        <div className="receipt-row">
                            <span className="receipt-label">Date</span>
                            <span className="receipt-value">{today}</span>
                        </div>
                        <div className="receipt-row">
                            <span className="receipt-label">Payment Method</span>
                            <span className="receipt-value">Credit Card</span>
                        </div>
                        <div className="receipt-row">
                            <span className="receipt-label">Total Amount</span>
                            <span className="receipt-value total">VND 2,500,000</span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <button 
                    className="btn btn-luxury w-100"
                    onClick={() => navigate('/')} 
                >
                    {isSuccess ? 'View My Booking' : 'Try Again'}
                </button>
                
                {isSuccess && (
                    <button 
                        className="btn btn-outline-luxury w-100"
                        onClick={() => window.print()} 
                    >
                        Download Receipt
                    </button>
                )}

                {/* Footer */}
                <div className="footer-info">
                    <div>Securely processed. Protected by SSL encryption.</div>
                </div>
            </div>
        </div>
    );
};

export default PaymentResult;