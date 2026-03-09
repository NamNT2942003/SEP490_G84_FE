import { useState, useEffect } from "react";
import { roomService } from "../api/roomService.js";

const RoomDetailModal = ({ room, show, onClose }) => {
  const [roomDetail, setRoomDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && room?.roomId) {
      fetchRoomDetail(room.roomId);
    }
  }, [show, room?.roomId]);

  const fetchRoomDetail = async (roomId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomService.getRoomDetail(roomId);
      setRoomDetail(data);
    } catch (err) {
      setError(err.message || "Failed to load room details");
      console.error("Error fetching room detail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!show || !room) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCancellationText = (ratePlan) => {
    if (ratePlan.cancellationType === "NonRefundable") {
      return "Non-refundable";
    }
    if (ratePlan.freeCancelBeforeDays) {
      return `Free cancellation up to ${ratePlan.freeCancelBeforeDays} days before check-in`;
    }
    return "Free cancellation available";
  };

  const getPaymentText = (paymentType) => {
    switch (paymentType) {
      case "PayNow":
        return "Pay now";
      case "PayLater":
        return "Pay at hotel";
      default:
        return "All major credit cards accepted";
    }
  };

  const roomData = roomDetail?.roomType || room;
  const amenities = roomDetail?.amenities || [];
  const ratePlans = roomDetail?.ratePlans || [];

  return (
    <>
      <div
        className={`modal fade ${show ? "show" : ""}`}
        style={{ display: show ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div
              className="modal-header"
              style={{ backgroundColor: "#5C6F4E" }}
            >
              <h5 className="modal-title text-white">{roomData.name}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              {loading && (
                <div className="text-center py-4">
                  <div
                    className="spinner-border"
                    role="status"
                    style={{ color: "#5C6F4E" }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading room details...</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Room Description</h6>
                    <p className="text-muted">{roomData.description}</p>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Room Details</h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <i className="bi bi-people-fill me-2 text-primary"></i>
                        <strong>Maximum Occupancy:</strong> {roomData.maxAdult}{" "}
                        Adults, {roomData.maxChildren} Children
                      </div>
                      <div className="col-md-6 mb-2">
                        <i className="bi bi-coin me-2 text-warning"></i>
                        <strong>Base Price:</strong>{" "}
                        {formatPrice(roomData.basePrice)}
                        /night
                      </div>
                      <div className="col-md-6 mb-2">
                        <i className="bi bi-rulers me-2 text-info"></i>
                        <strong>Room Size:</strong>{" "}
                        {roomData.area ? `${roomData.area} m²` : "N/A"}
                      </div>
                      {roomData.bedType && (
                        <div className="col-md-6 mb-2">
                          <i className="bi bi-house-door me-2 text-success"></i>
                          <strong>Bed:</strong> {roomData.bedCount} x{" "}
                          {roomData.bedType}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Amenities & Features</h6>
                    {amenities.length > 0 ? (
                      <div className="row">
                        {amenities.map((amenity, index) => (
                          <div
                            className="col-md-6 mb-2"
                            key={amenity.amenityId || index}
                          >
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            {amenity.amenityName}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">
                        No amenities information available.
                      </p>
                    )}
                  </div>

                  {ratePlans.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Rate Plans</h6>
                      {ratePlans.map((ratePlan, index) => (
                        <div
                          className="card mb-2"
                          key={ratePlan.ratePlanId || index}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{ratePlan.name}</strong>
                                <div className="small text-muted">
                                  <i className="bi bi-x-circle me-1"></i>
                                  {getCancellationText(ratePlan)}
                                </div>
                                {ratePlan.paymentType && (
                                  <div className="small text-muted">
                                    <i className="bi bi-credit-card me-1"></i>
                                    {getPaymentText(ratePlan.paymentType)}
                                  </div>
                                )}
                              </div>
                              <div className="text-end">
                                <span className="h5 text-success mb-0">
                                  {formatPrice(ratePlan.price)}
                                </span>
                                <div className="small text-muted">/night</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Hotel Policies</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="bi bi-clock me-2"></i>
                        <strong>Check-in:</strong> From 14:00
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-clock-history me-2"></i>
                        <strong>Check-out:</strong> Until 12:00
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-ban me-2"></i>
                        <strong>No Smoking:</strong> This is a non-smoking room
                      </li>
                    </ul>
                  </div>

                  <div className="alert alert-info">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <strong>Note:</strong> All rates are subject to 10% service
                    charge and applicable taxes.
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: "#5C6F4E", borderColor: "#5C6F4E" }}
              >
                Book This Room
              </button>
            </div>
          </div>
        </div>
      </div>
      {show && <div className="modal-backdrop fade show"></div>}
    </>
  );
};

export default RoomDetailModal;
