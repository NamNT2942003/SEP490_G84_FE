import PropTypes from "prop-types";

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

    if (roomNameLower.includes("suite")) {
      return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop";
    } else if (roomNameLower.includes("deluxe")) {
      return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop";
    } else if (roomNameLower.includes("family")) {
      return "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=300&fit=crop";
    } else {
      return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop";
    }
  };

  const imageSrc =
    room.image && !room.image.includes(".jpg")
      ? `/images/${room.image}`
      : getPlaceholderImage(room.name);

  return (
    <div className="card mb-3 shadow-sm hover-card">
      <div className="row g-0">
        <div className="col-md-4">
          <img
            src={imageSrc}
            className="img-fluid rounded-start h-100 object-fit-cover"
            alt={room.name}
            style={{
              minHeight: "250px",
              maxHeight: "250px",
              objectFit: "cover",
            }}
            onError={(e) => {
              e.target.src = getPlaceholderImage(room.name);
            }}
          />
        </div>
        <div className="col-md-5">
          <div className="card-body d-flex flex-column h-100 py-4">
            <h5 className="card-title mb-3 fw-bold">{room.name}</h5>
            <p className="card-text text-muted mb-3">{room.description}</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-body d-flex flex-column h-100 justify-content-between py-4">
            <div className="text-end">
              <h4 className="mb-0 fw-bold" style={{ color: "#5C6F4E" }}>
                {formatPrice(room.basePrice)}
              </h4>
              <div className="text-muted small mb-1">PER NIGHT</div>
            </div>
            <div className="d-flex flex-column gap-2 mt-3">
              <button
                className="btn btn-primary w-100"
                onClick={() => onBooking(room)}
                style={{ backgroundColor: "#5C6F4E", borderColor: "#5C6F4E" }}
              >
                Booking
              </button>
              <button
                className="btn btn-outline-secondary w-100"
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

RoomCard.propTypes = {
  room: PropTypes.object.isRequired,
  onBooking: PropTypes.func.isRequired,
  onViewDetail: PropTypes.func.isRequired,
};

export default RoomCard;
