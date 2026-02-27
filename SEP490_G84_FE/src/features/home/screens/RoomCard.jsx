import React, { useState, useEffect } from 'react';

const RoomCard = ({ room, onBooking, onViewDetail }) => {
  // Đảm bảo lấy được availableCount dù API trả về bất cứ định dạng nào
  const maxAvailable = Number(room?.availableCount ?? 0);
  const [quantity, setQuantity] = useState(0);

  // Đồng bộ quantity khi dữ liệu room thay đổi hoặc đổ về từ API
  useEffect(() => {
    setQuantity(maxAvailable > 1 ? 1 : maxAvailable);
  }, [maxAvailable]);

  const handleIncrease = () => {
    if (quantity < maxAvailable) setQuantity(prev => prev + 1);
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getPlaceholderImage = (roomName) => {
    const name = roomName?.toLowerCase() || "";
    if (name.includes("suite")) return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop";
    if (name.includes("deluxe")) return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop";
    if (name.includes("family")) return "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=300&fit=crop";
    return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop";
  };

  const imageSrc = room.image && room.image.trim() !== ""
      ? (room.image.startsWith("http") ? room.image : `/images/${room.image}`)
      : getPlaceholderImage(room.name);

  return (
      <div className="card mb-4 shadow-sm hover-card border-0 overflow-hidden">
        <div className="row g-0">
          <div className="col-md-4">
            <img
                src={imageSrc}
                className="img-fluid h-100 object-fit-cover"
                alt={room.name}
                style={{ minHeight: "250px", maxHeight: "280px", objectFit: "cover" }}
                onError={(e) => { e.target.src = getPlaceholderImage(room.name); }}
            />
          </div>

          <div className="col-md-5">
            <div className="card-body d-flex flex-column h-100 py-4 px-4">
              <h5 className="card-title mb-2 fw-bold text-uppercase" style={{ color: "#333" }}>
                {room.name}
              </h5>

              <div className="d-flex gap-3 mb-3 text-muted small">
                <span><i className="bi bi-people me-1"></i>Max: {room.maxAdult + (room.maxChildren || 0)} guests</span>
                <span><i className="bi bi-arrows-fullscreen me-1"></i>{room.area} m²</span>
              </div>

              <p className="card-text text-muted mb-3" style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                {room.description?.length > 150 ? room.description.substring(0, 150) + "..." : room.description}
              </p>

              {maxAvailable > 0 ? (
                  <div className="mt-auto">
                <span className="badge rounded-pill bg-light text-success border border-success px-3 py-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Only {maxAvailable} rooms left!
                </span>
                  </div>
              ) : (
                  <div className="mt-auto">
                <span className="badge rounded-pill bg-light text-danger border border-danger px-3 py-2">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Sold Out for these dates
                </span>
                  </div>
              )}
            </div>
          </div>

          <div className="col-md-3 bg-light border-start">
            <div className="card-body d-flex flex-column h-100 justify-content-between py-4">
              <div className="text-end">
                <div className="text-muted small mb-1">Price per night</div>
                <h3 className="mb-0 fw-bold" style={{ color: "#5C6F4E" }}>
                  {formatPrice(room.basePrice)}
                </h3>
              </div>

              <div className="mt-4">
                <label className="form-label small fw-bold text-uppercase">Quantity</label>
                <div className="input-group input-group-sm mb-3">
                  <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                  > - </button>
                  <input
                      type="text"
                      className="form-control text-center bg-white"
                      value={quantity}
                      readOnly
                  />
                  <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleIncrease}
                      disabled={quantity >= maxAvailable}
                  > + </button>
                </div>

                <div className="d-flex flex-column gap-2">
                  <button
                      className="btn btn-primary w-100 py-2 fw-bold"
                      onClick={() => onBooking(room, quantity)}
                      style={{ backgroundColor: "#5C6F4E", borderColor: "#5C6F4E" }}
                      disabled={maxAvailable <= 0}
                  >
                    {maxAvailable <= 0 ? "Fully Booked" : "Booking Now"}
                  </button>
                  <button
                      className="btn btn-outline-secondary w-100 py-2"
                      onClick={() => onViewDetail(room)}
                  >
                    View Detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default RoomCard;