import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './checkout-print.css';
import { checkoutApi } from '../api/checkoutApi';

// TỪ ĐIỂN CHI NHÁNH (Tương lai có thể lấy từ API Backend trả về)
const BRANCH_CONFIG = {
  1: {
    name: "AN HOTEL & RESORT - HANOI",
    address: "123 Trang Tien, Hoan Kiem, Hanoi",
    phone: "024.1234.5678"
  },
  2: {
    name: "AN HOTEL & RESORT - DANANG",
    address: "456 Vo Nguyen Giap, Son Tra, Danang",
    phone: "0236.9876.5432"
  }
};

export default function CheckoutModal({ show, onClose, booking, onSuccess, branchId }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const [loadingBill, setLoadingBill] = useState(true);

  // Lấy thông tin chi nhánh hiện tại (Nếu không có thì lấy mặc định)
  const currentBranch = BRANCH_CONFIG[branchId] || {
    name: "AN Nguyen HOTEL & RESORT",
    address: "Ha Noi, Vietnam",
    phone: "0123.456.789"
  };

  useEffect(() => {
    const fetchBillingInfo = async () => {
      if (show && booking) {
        setLoadingBill(true);
        try {
          // Gọi API thật lên Backend để lấy thông tin kết toán
          const data = await checkoutApi.getBillingInfo(booking.id);
          setBillDetails(data);
        } catch (error) {
          console.error("Lỗi lấy dữ liệu hóa đơn:", error);
          alert("Không thể tải chi tiết hóa đơn. Vui lòng thử lại!");
        } finally {
          setLoadingBill(false);
        }
      }
    };
    fetchBillingInfo();
  }, [show, booking]);

  if (!show || !booking) return null;

  // Render màn hình Loading tạm trong lúc chờ API trả về
  if (loadingBill || !billDetails) return (
    <>
      <div className="modal-backdrop fade show no-print" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block no-print" tabIndex="-1" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-5 text-center border-0 shadow-lg">
            <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
            <h5 className="text-secondary">Loading Billing Details...</h5>
            <small className="text-muted">Đang kết toán dịch vụ, vui lòng chờ!</small>
          </div>
        </div>
      </div>
    </>
  );

  const roomCharge      = billDetails.roomCharge || 0;
  const roomChargePaid  = billDetails.roomChargePaid || false;
  const servicesList    = billDetails.services || [];
  const discount        = billDetails.discount || 0;
  const grandTotal      = billDetails.grandTotal || 0;
  const alreadyPaid     = billDetails.alreadyPaidTotal || 0;
  const amountDue       = billDetails.amountDue || 0;

  const methodLabel = (m) => m === 'CARD' ? 'Card' : m === 'TRANSFER' ? 'Transfer' : 'Cash';

  // Cấu hình VietQR
  const BANK_BIN = "970436"; // Mã BIN ngân hàng (VD: Vietcombank)
  const BANK_ACCOUNT = "0123456789"; 
  const ACCOUNT_NAME = "KHACH SAN AN"; 
  // Template gen VietQR theo chuẩn Napas
  const qrString = `00020101021238580010A00000072701280006${BANK_BIN}0110${BANK_ACCOUNT}0208QRIBFTTA5303704540${amountDue.toString().length}${amountDue}5802VN59${ACCOUNT_NAME.length < 10 ? '0' + ACCOUNT_NAME.length : ACCOUNT_NAME.length}${ACCOUNT_NAME}62220818THANHTOAN ${booking.bookingCode}6304`;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmCheckout = async () => {
    if (window.confirm("Xác nhận khách đã thanh toán đủ và tiến hành Trả phòng (Check-out)?")) {
      setIsSubmitting(true);
      try {
        const response = await checkoutApi.processCheckout(booking.id);
        alert(response.message || "Check-out thành công! Các phòng đã được chuyển sang trạng thái chờ dọn dẹp.");
        if (onSuccess) onSuccess(); 
        onClose();   
      } catch (error) {
        console.error("Lỗi Check-out:", error);
        alert(error.response?.data?.error || "Có lỗi xảy ra khi Check-out!");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show no-print" style={{ zIndex: 1040 }}></div>
      <div className="modal fade show d-block no-print" tabIndex="-1" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg overflow-hidden">
            
            <div className="modal-header bg-dark text-white border-0">
              <div>
                <h5 className="modal-title fw-bold"><i className="bi bi-receipt me-2"></i>Checkout & Billing</h5>
                <small className="text-secondary">Booking: {booking.bookingCode} | Guest: {booking.guestName}</small>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isSubmitting}></button>
            </div>

            <div className="modal-body bg-light p-0">
              <div className="row g-0">
                {/* CỘT TRÁI: CHI TIẾT HÓA ĐƠN */}
                <div className="col-md-8 p-4">
                  <h6 className="fw-bold text-secondary mb-3">BILLING SUMMARY</h6>
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                      <table className="table table-hover mb-0">
                        <thead className="table-light text-muted small">
                          <tr>
                            <th>Description</th>
                            <th className="text-center">Qty</th>
                            <th className="text-center">Status</th>
                            <th className="text-end">Amount (VND)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="fw-medium">Accommodation (Room Charge)</td>
                            <td className="text-center">{booking.nights} nights</td>
                            <td className="text-center">
                              {roomChargePaid
                                ? <span className="text-success fw-semibold" style={{fontSize:'12px'}}>Paid</span>
                                : <span className="text-danger fw-semibold" style={{fontSize:'12px'}}>Unpaid</span>}
                            </td>
                            <td className="text-end">{Number(roomCharge).toLocaleString()}</td>
                          </tr>
                          {servicesList.map((svc, idx) => (
                            <tr key={idx}>
                              <td>
                                <i className="bi bi-arrow-return-right me-2 text-muted"></i>
                                {svc.name}
                              </td>
                              <td className="text-center">{svc.quantity || 1}</td>
                              <td className="text-center">
                                {svc.paid
                                  ? <span className="text-success fw-semibold" style={{fontSize:'12px'}}>Paid ({methodLabel(svc.paymentMethod)})</span>
                                  : <span className="text-danger fw-semibold" style={{fontSize:'12px'}}>Unpaid</span>
                                }
                              </td>
                              <td className="text-end">{Number(svc.amount || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan="3" className="text-end fw-bold text-dark">GRAND TOTAL:</td>
                            <td className="text-end fw-bold text-dark fs-5">{Number(grandTotal).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end fw-bold text-success">Already Paid (room + services):</td>
                            <td className="text-end fw-bold text-success">- {Number(alreadyPaid).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end fw-bold text-danger">AMOUNT DUE (CẦN THU):</td>
                            <td className="text-end fw-bold text-danger fs-4">{amountDue > 0 ? Number(amountDue).toLocaleString() : '0'}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: THANH TOÁN & NÚT ACTION */}
                <div className="col-md-4 p-4 bg-white border-start d-flex flex-column align-items-center justify-content-center">
                  <h6 className="fw-bold text-primary mb-1">SCAN TO PAY (VIETQR)</h6>
                  <p className="small text-muted mb-4 text-center">Open your Banking App to scan</p>
                  
                  {amountDue > 0 ? (
                    <div className="p-3 bg-white border rounded shadow-sm mb-4 text-center">
                      <QRCodeCanvas value={qrString} size={200} level={"H"} />
                      <div className="mt-3 fw-bold fs-5 text-danger">{amountDue.toLocaleString()} VND</div>
                    </div>
                  ) : (
                    <div className="p-4 bg-success bg-opacity-10 rounded text-center mb-4 border border-success w-100">
                      <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                      <h5 className="text-success fw-bold mt-2 mb-0">FULLY PAID</h5>
                      <div className="small text-success mt-1">No outstanding balance</div>
                    </div>
                  )}

                  <div className="d-grid gap-2 w-100 mt-auto">
                    <button className="btn btn-outline-dark fw-bold py-2" onClick={handlePrint}>
                      <i className="bi bi-printer-fill me-2"></i> Print K80 Receipt
                    </button>
                    <button 
                      className="btn btn-danger fw-bold shadow-sm py-2" 
                      onClick={handleConfirmCheckout} 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...</>
                      ) : (
                        <><i className="bi bi-check2-all me-2"></i> Confirm Payment & Check-out</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- KHỐI ẨN IN MÁY IN NHIỆT (Chỉ hiển thị khi bấm Print) --- */}
      <div id="printable-receipt" className="bg-white text-dark p-2 d-none d-print-block">
        <div className="text-center mb-3">
          <h2 className="mb-0 fw-bold" style={{ fontSize: '18px' }}>{currentBranch.name}</h2>
          <div style={{ fontSize: '12px' }}>{currentBranch.address}</div>
          <div style={{ fontSize: '12px' }}>Tel: {currentBranch.phone}</div>
          <div className="mt-2 fw-bold" style={{ fontSize: '16px', borderBottom: '1px dashed #000', paddingBottom: '5px' }}>
            GUEST RECEIPT
          </div>
        </div>

        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          <div><strong>Booking:</strong> {booking.bookingCode}</div>
          <div><strong>Guest:</strong> {booking.guestName}</div>
          <div><strong>In:</strong> {booking.checkIn} | <strong>Out:</strong> {booking.checkOut}</div>
          <div><strong>Printed:</strong> {new Date().toLocaleString()}</div>
        </div>

        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed #000', borderTop: '1px dashed #000' }}>
              <th style={{ textAlign: 'left', padding: '5px 0' }}>Item</th>
              <th style={{ textAlign: 'right', padding: '5px 0' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '5px 0' }}>Room Charge ({booking.nights}N)</td>
              <td style={{ textAlign: 'right' }}>{roomCharge.toLocaleString()}</td>
            </tr>
            {servicesList.map((svc, idx) => (
              <tr key={idx}>
                <td style={{ padding: '2px 0' }}>- {svc.name}</td>
                <td style={{ textAlign: 'right' }}>{svc.amount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <strong>GRAND TOTAL:</strong>
            <strong>{grandTotal.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Paid:</span>
            <span>- {Number(alreadyPaid).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
            <span>DUE:</span>
            <span>{amountDue > 0 ? amountDue.toLocaleString() : '0'}</span>
          </div>
        </div>

        {amountDue > 0 && (
          <div className="text-center mt-4">
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>Scan to Pay (VietQR)</div>
            <QRCodeCanvas value={qrString} size={150} />
            <div style={{ fontSize: '11px', marginTop: '5px' }}>{BANK_ACCOUNT} - {ACCOUNT_NAME}</div>
          </div>
        )}

        <div className="text-center mt-4" style={{ fontSize: '12px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
          Thank you for staying with us!<br/>
          See you again.
        </div>
      </div>
    </>
  );
}