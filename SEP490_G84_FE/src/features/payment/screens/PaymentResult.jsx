import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentResult = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Bắt query param trên URL để biết thành công hay thất bại
    // Ví dụ: http://localhost:5173/payment/result?status=success
    const status = searchParams.get('status') || 'success';

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="card shadow-sm p-5 text-center" style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }}>
                {status === 'success' ? (
                    <>
                        <div className="text-success mb-3" style={{ fontSize: '64px' }}>✅</div>
                        <h3 className="mb-3">Thanh toán thành công!</h3>
                        <p className="text-muted mb-4">Cảm ơn bạn đã sử dụng dịch vụ. Đơn hàng của bạn đã được ghi nhận.</p>
                    </>
                ) : (
                    <>
                        <div className="text-danger mb-3" style={{ fontSize: '64px' }}>❌</div>
                        <h3 className="mb-3">Thanh toán thất bại</h3>
                        <p className="text-muted mb-4">Đã có lỗi xảy ra hoặc bạn đã hủy giao dịch. Vui lòng thử lại.</p>
                    </>
                )}

                <button
                    className="btn btn-primary w-100 py-2"
                    onClick={() => navigate('/')} // Quay về trang chủ hoặc trang quản lý đơn
                >
                    Quay lại trang chủ
                </button>
            </div>
        </div>
    );
};

export default PaymentResult;