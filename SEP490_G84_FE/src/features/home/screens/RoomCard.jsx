const RoomCard = ({ room, onBooking, onViewDetail }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPlaceholderImage = (roomName) => {
    const roomNameLower = roomName?.toLowerCase() || "";
    if (roomNameLower.includes("suite")) return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop";
    if (roomNameLower.includes("deluxe")) return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop";
    if (roomNameLower.includes("family")) return "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=300&fit=crop";
    return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop";
  };

  const imageSrc = room.image && !room.image.includes(".jpg")
      ? `/images/${room.image}`
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
                onError={(e) => {
                  e.target.src = getPlaceholderImage(room.name);
                }}
            />
          </div>

          <div className="col-md-5">
            <div className="card-body d-flex flex-column h-100 py-4 px-4">
              <h5 className="card-title mb-2 fw-bold text-uppercase" style={{ color: "#333" }}>
                {room.name}
              </h5>

              {/* Sức chứa & Diện tích dùng Bootstrap Icons */}
              <div className="d-flex gap-3 mb-3 text-muted small">
              <span>
                <i className="bi bi-people me-1"></i>
                Max: {room.maxAdult + (room.maxChildren || 0)} guests
              </span>
                <span>
                <i className="bi bi-arrows-fullscreen me-1"></i>
                  {room.area} m²
              </span>
              </div>

              <p className="card-text text-muted mb-3" style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                {room.description?.length > 150
                    ? room.description.substring(0, 150) + "..."
                    : room.description}
              </p>

              {/* Hiển thị số phòng trống (availableCount) */}
              {room.availableCount > 0 && (
                  <div className="mt-auto">
                <span className="badge rounded-pill bg-light text-success border border-success px-3 py-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Only {room.availableCount} rooms left!
                </span>
                  </div>
              )}
            </div>
          </div>

          <div className="col-md-3 bg-light border-start">
            <div className="card-body d-flex flex-column h-100 justify-content-between py-4">
              <div className="text-end">
                <div className="text-muted small mb-1">Start from</div>
                <h3 className="mb-0 fw-bold" style={{ color: "#5C6F4E" }}>
                  {formatPrice(room.basePrice)}
                </h3>
                <div className="text-muted small">/ night</div>
              </div>

              <div className="d-flex flex-column gap-2 mt-4">
                <button
                    className="btn btn-primary w-100 py-2 fw-bold"
                    onClick={() => onBooking(room)}
                    style={{ backgroundColor: "#5C6F4E", borderColor: "#5C6F4E" }}
                    disabled={room.availableCount <= 0}
                >
                  {room.availableCount <= 0 ? "Fully Booked" : "Booking Now"}
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
  );
};

export default RoomCard;