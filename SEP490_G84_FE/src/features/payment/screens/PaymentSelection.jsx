import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../api/paymentApi';

const PaymentSelection = () => {
    const [selectedMethod, setSelectedMethod] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedMethod) {
            setError('Vui lòng chọn một phương thức thanh toán!');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            // TODO: Truyền dữ liệu đơn hàng thực tế của bạn vào đây (ví dụ: bookingId, amount...)
            const orderPayload = {
                amount: 500000,
                orderInfo: "Thanh toán phòng khách sạn"
            };

            if (selectedMethod === 'STRIPE') {
                // 1. Gọi API Spring Boot để lấy link Stripe
                const response = await paymentApi.createStripePayment(orderPayload);

                // 2. Lấy URL từ response (Giả sử backend trả về { stripeUrl: "https://checkout.stripe.com/..." })
                const checkoutUrl = response.data.stripeUrl || response.data;

                // 3. Chuyển hướng người dùng sang trang của Stripe
                window.location.href = checkoutUrl;

            } else if (selectedMethod === 'COD') {
                // 1. Gọi API xử lý COD
                await paymentApi.createCodPayment(orderPayload);

                // 2. Chuyển sang màn hình thành công của nội bộ React
                navigate('/payment/success');
            }
        } catch (err) {
            const msg = err.response?.data || "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '500px', borderRadius: '12px' }}>
                <h3 className="text-center mb-4">Phương thức thanh toán</h3>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Lựa chọn Stripe */}
                    <div
                        className={`card mb-3 cursor-pointer ${selectedMethod === 'STRIPE' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        onClick={() => setSelectedMethod('STRIPE')}
                        style={{ cursor: 'pointer', transition: '0.2s' }}
                    >
                        <div className="card-body d-flex align-items-center">
                            <div className="fs-2 me-3">💳</div>
                            <div>
                                <h6 className="mb-1 fw-bold">Thẻ tín dụng / Ghi nợ</h6>
                                <small className="text-muted">Thanh toán an toàn qua Stripe</small>
                            </div>
                            <div className="ms-auto">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    checked={selectedMethod === 'STRIPE'}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lựa chọn COD */}
                    <div
                        className={`card mb-4 cursor-pointer ${selectedMethod === 'COD' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        onClick={() => setSelectedMethod('COD')}
                        style={{ cursor: 'pointer', transition: '0.2s' }}
                    >
                        <div className="card-body d-flex align-items-center">
                            <div className="fs-2 me-3">💵</div>
                            <div>
                                <h6 className="mb-1 fw-bold">Thanh toán khi nhận phòng (COD)</h6>
                                <small className="text-muted">Trả tiền mặt khi đến nơi</small>
                            </div>
                            <div className="ms-auto">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    checked={selectedMethod === 'COD'}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : null}
                        {isLoading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentSelection;