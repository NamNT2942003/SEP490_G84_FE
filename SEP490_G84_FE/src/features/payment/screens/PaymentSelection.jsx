import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentService from '@/features/payment/api/paymentService';

const PaymentSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Hứng dữ liệu từ GuestInformation
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

    // =========================================================================
    // TÍNH NĂNG POLLING: TỰ ĐỘNG KIỂM TRA TRẠNG THÁI THANH TOÁN 3 GIÂY/LẦN
    // =========================================================================
    useEffect(() => {
        let intervalId;

        // Chỉ bắt đầu kiểm tra khi qrData có tồn tại và có paymentId
        if (qrData && qrData.paymentId) {
            intervalId = setInterval(async () => {
                try {
                    // Gọi API get status mà chúng ta vừa viết ở Backend
                    const data = await paymentService.getPaymentStatus(qrData.paymentId);

                    if (data && data.status === 'COMPLETED') {
                        // Tiền đã vào -> Dừng kiểm tra ngay lập tức
                        clearInterval(intervalId);

                        // Chuyển hướng sang trang thành công (Giống với luồng Stripe)
                        navigate(`/payment/result?status=success&paymentId=${qrData.paymentId}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
                }
            }, 3000); // 3000ms = 3 giây
        }

        // Cleanup function: Tự động dọn dẹp bộ đếm khi component bị hủy hoặc người dùng bấm quay lại
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [qrData, navigate]);

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
            const data = await paymentService.createPayment({
                bookingId,
                amount: totalAmount,
                method: selectedMethod,
            });

            if (data?.type === 'REDIRECT' && data.payUrl) {
                window.location.href = data.payUrl;
                return;
            }

            if (data?.type === 'QR' && data.qrImg) {
                setQrData({
                    imgUrl: data.qrImg,
                    content: data.content,
                    paymentId: data.paymentId,
                });
                setIsLoading(false);
                return;
            }

            alert('Lỗi tạo thanh toán: Không nhận được hướng dẫn thanh toán.');
            setIsLoading(false);
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            const message = error?.response?.data?.message || error?.friendlyMessage || error.message || 'Lỗi kết nối đến server!';
            alert('Lỗi tạo thanh toán: ' + message);
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="bg-light vh-100 d-flex justify-content-center pt-5">
            <div className="bg-white p-4 rounded-3 shadow-sm" style={{ maxWidth: '600px', width: '100%', height: 'fit-content' }}>

                {/* ĐIỀU KIỆN: NẾU ĐÃ CÓ QR DATA THÌ HIỂN THỊ MÃ QR */}
                {qrData ? (
                    <div className="text-center">
                        <h4 className="fw-bold mb-3 text-success">Mã QR Thanh Toán</h4>
                        <p className="text-muted mb-4">Vui lòng mở ứng dụng ngân hàng và quét mã dưới đây để thanh toán.</p>

                        <div className="bg-light p-3 rounded-3 mb-4 text-center">
                            <p className="text-muted mb-1">Total Payment</p>
                            <h3 className="fw-bold m-0" style={{ color: '#D4AF37' }}>{formatCurrency(totalAmount)}</h3>
                        </div>

                        {hasStayDetails && (
                            <div className="alert alert-light border rounded-3 text-start">
                                <div className="small text-muted mb-1">Booking snapshot</div>
                                {rooms.length > 0 && (
                                    <div className="fw-semibold">Rooms: {rooms.length}</div>
                                )}
                                {(checkIn || checkOut) && (
                                    <div>
                                        <span className="fw-semibold">Stay:</span> {checkIn || '?'} → {checkOut || '?'}
                                    </div>
                                )}
                                {branchId && <div>Branch ID: {branchId}</div>}
                            </div>
                        )}

                        <div className="position-relative d-inline-block">
                            <img
                                src={qrData.imgUrl}
                                alt="QR Code Thanh Toán"
                                className="img-fluid border rounded p-2 mb-3 shadow-sm"
                                style={{ maxWidth: '300px' }}
                            />
                            {/* Hiệu ứng loading quay vòng nhỏ góc ảnh QR để khách biết hệ thống đang lắng nghe */}
                            <div className="spinner-border text-success position-absolute top-0 start-100 translate-middle" role="status" style={{width: '1.5rem', height: '1.5rem'}}>
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>

                        <div className="alert alert-info" role="alert">
                            <strong>Nội dung chuyển khoản (Bắt buộc ghi đúng): </strong> <br/>
                            <span className="fs-4 fw-bold text-danger">{qrData.content}</span>
                            <p className="mb-0 mt-2 small text-dark">
                                Đang chờ thanh toán... Hệ thống sẽ tự động chuyển trang khi nhận được tiền.
                            </p>
                        </div>

                        <button
                            className="btn btn-outline-secondary w-100 mt-3 fw-bold"
                            onClick={() => setQrData(null)}
                        >
                            Quay lại chọn phương thức khác
                        </button>
                    </div>
                ) : (
                    /* ĐIỀU KIỆN: NẾU CHƯA CÓ QR DATA THÌ HIỂN THỊ FORM CHỌN PHƯƠNG THỨC */
                    <>
                        <h4 className="fw-bold mb-4 text-center" style={{ color: '#5C6F4E' }}>Chọn phương thức thanh toán</h4>

                        <div className="bg-light p-3 rounded-3 mb-4 text-center">
                            <p className="text-muted mb-1">Total Payment</p>
                            <h3 className="fw-bold m-0" style={{ color: '#D4AF37' }}>{formatCurrency(totalAmount)}</h3>
                        </div>

                        {hasStayDetails && (
                            <div className="alert alert-secondary bg-white border rounded-3 small text-muted mb-4">
                                {rooms.length > 0 && <div><strong>Rooms:</strong> {rooms.length}</div>}
                                {(checkIn || checkOut) && (
                                    <div>
                                        <strong>Stay:</strong> {checkIn || '?'} → {checkOut || '?'}
                                    </div>
                                )}
                                {branchId && <div><strong>Branch ID:</strong> {branchId}</div>}
                            </div>
                        )}

                        <div className="mb-4">
                            <div
                                className={`p-3 mb-3 border rounded-3 d-flex align-items-center ${selectedMethod === 'STRIPE' ? 'border-2 shadow-sm' : ''}`}
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
                                    <h6 className="mb-0 fw-bold">Pay with VISA CARD</h6>
                                    <small className="text-muted">Visa, Mastercard, Amex (qua Stripe)</small>
                                </div>
                                <i className="fa-brands fa-stripe ms-auto fs-2" style={{ color: '#635bff' }}></i>
                            </div>

                            <div
                                className={`p-3 border rounded-3 d-flex align-items-center ${selectedMethod === 'SEPAY' ? 'border-2 shadow-sm' : ''}`}
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
                                    <h6 className="mb-0 fw-bold">Pay through banking (QR)</h6>
                                    <small className="text-muted">Scan QR to pay via banking app</small>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSelection;

