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
            // TODO: Truyền invoiceId (Mã hóa đơn) thực tế vào đây
            // Hiện tại gán tạm = 1 để test luồng gọi API
            const invoiceId = 15; // Lấy theo ID đang test trong ảnh của bạn hoặc đổi thành 1

            // Gọi API Spring Boot (truyền theo dạng params: ?invoiceId=...&method=...)
            const response = await paymentApi.createPayment(invoiceId, selectedMethod);

            if (selectedMethod === 'STRIPE') {
                // 1. Lấy đúng biến payUrl từ response như trong tab Preview/Response của bạn
                const checkoutUrl = response.data.payUrl;

                if (checkoutUrl) {
                    // 2. Cấu hình kích thước và vị trí để mở Popup ở giữa màn hình
                    const width = 500;
                    const height = 600;
                    const left = (window.innerWidth - width) / 2;
                    const top = (window.innerHeight - height) / 2;

                    // Mở cửa sổ nhỏ popup
                    window.open(
                        checkoutUrl,
                        'StripeCheckout',
                        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
                    );
                } else {
                    setError("Lỗi: Không lấy được đường link thanh toán từ hệ thống.");
                }

            } else if (selectedMethod === 'COD') {
                // Chuyển sang màn hình thông báo thành công
                navigate('/payment/result?status=success');
            }
        } catch (err) {
            console.error("Lỗi khi thanh toán:", err);

            // Lấy nội dung lỗi an toàn từ backend trả về
            let msg = err.response?.data?.message || err.response?.data || "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.";
            if (typeof msg === 'object') {
                msg = JSON.stringify(msg);
            }

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