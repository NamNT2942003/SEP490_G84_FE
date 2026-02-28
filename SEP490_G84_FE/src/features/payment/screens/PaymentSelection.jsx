import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Hứng dữ liệu từ GuestInformation
    const { bookingId, totalAmount } = location.state || { bookingId: null, totalAmount: 0 };

    // State lưu phương thức khách chọn (Mặc định chọn Stripe)
    const [selectedMethod, setSelectedMethod] = useState('STRIPE');
    const [isLoading, setIsLoading] = useState(false);

    if (!bookingId) {
        return (
            <div className="text-center mt-5">
                <h3>Không tìm thấy thông tin đơn hàng!</h3>
                <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>Về trang chủ</button>
            </div>
        );
    }

    const handleProcessPayment = async () => {
        setIsLoading(true);
        try {
            // Chú ý: Đổi port 8080 thành 8081 nếu Backend của bạn đang chạy ở 8081 nhé!
            const response = await fetch(`http://localhost:8081/api/payment/create?bookingId=${bookingId}&amount=${totalAmount}&method=${selectedMethod}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                if (selectedMethod === 'STRIPE' && data.payUrl) {
                    // Chuyển hướng trình duyệt sang cổng quẹt thẻ của Stripe
                    window.location.href = data.payUrl;
                } else if (selectedMethod === 'SEPAY') {
                    // Logic xử lý Sepay (ví dụ: chuyển sang màn hiện mã QR của bạn)
                    // navigate('/payment/sepay-qr', { state: { ...data } });
                    alert('Tính năng chuyển khoản Sepay đang được tích hợp!');
                    setIsLoading(false);
                }
            } else {
                alert('Lỗi tạo thanh toán: ' + (data.message || 'Vui lòng thử lại.'));
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            alert('Lỗi kết nối đến server!');
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="bg-light vh-100 d-flex justify-content-center pt-5">
            <div className="bg-white p-4 rounded-3 shadow-sm" style={{ maxWidth: '600px', width: '100%', height: 'fit-content' }}>
                <h4 className="fw-bold mb-4 text-center" style={{ color: '#5C6F4E' }}>Chọn phương thức thanh toán</h4>

                <div className="bg-light p-3 rounded-3 mb-4 text-center">
                    <p className="text-muted mb-1">Tổng tiền thanh toán</p>
                    <h3 className="fw-bold m-0" style={{ color: '#D4AF37' }}>{formatCurrency(totalAmount)}</h3>
                </div>

                {/* Khung chọn phương thức */}
                <div className="mb-4">
                    {/* Lựa chọn 1: Stripe */}
                    <div
                        className={`p-3 mb-3 border rounded-3 cursor-pointer d-flex align-items-center ${selectedMethod === 'STRIPE' ? 'border-2 shadow-sm' : ''}`}
                        style={{ borderColor: selectedMethod === 'STRIPE' ? '#5C6F4E' : '#dee2e6', cursor: 'pointer' }}
                        onClick={() => setSelectedMethod('STRIPE')}
                    >
                        <input
                            type="radio"
                            className="form-check-input me-3 mt-0"
                            checked={selectedMethod === 'STRIPE'}
                            onChange={() => setSelectedMethod('STRIPE')}
                        />
                        <div>
                            <h6 className="mb-0 fw-bold">Thanh toán bằng thẻ quốc tế</h6>
                            <small className="text-muted">Visa, Mastercard, Amex (qua Stripe)</small>
                        </div>
                        <i className="fa-brands fa-stripe ms-auto fs-2" style={{ color: '#635bff' }}></i>
                    </div>

                    {/* Lựa chọn 2: Sepay */}
                    <div
                        className={`p-3 border rounded-3 cursor-pointer d-flex align-items-center ${selectedMethod === 'SEPAY' ? 'border-2 shadow-sm' : ''}`}
                        style={{ borderColor: selectedMethod === 'SEPAY' ? '#5C6F4E' : '#dee2e6', cursor: 'pointer' }}
                        onClick={() => setSelectedMethod('SEPAY')}
                    >
                        <input
                            type="radio"
                            className="form-check-input me-3 mt-0"
                            checked={selectedMethod === 'SEPAY'}
                            onChange={() => setSelectedMethod('SEPAY')}
                        />
                        <div>
                            <h6 className="mb-0 fw-bold">Chuyển khoản ngân hàng (QR)</h6>
                            <small className="text-muted">Quét mã QR qua ứng dụng ngân hàng</small>
                        </div>
                        <i className="fa-solid fa-qrcode ms-auto fs-3 text-secondary"></i>
                    </div>
                </div>

                <button
                    className="btn w-100 py-3 fw-bold rounded-3 text-white fs-5"
                    style={{ backgroundColor: '#D4AF37' }}
                    onClick={handleProcessPayment}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang xử lý...' : 'Thanh Toán Ngay'}
                </button>
                <button className="btn btn-link text-muted w-100 mt-2 text-decoration-none" onClick={() => navigate(-1)}>
                    Quay lại
                </button>
            </div>
        </div>
    );
};

export default PaymentSelection;