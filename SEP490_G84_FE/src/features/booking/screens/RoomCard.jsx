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

  const imageSrc = room?.image && !room.image.includes(".jpg") ? `/images/${room.image}` : getPlaceholderImage(room.name);

  return (
    <div className="card mb-4 shadow-sm border-0 room-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
      <div style={{ position: 'relative' }}>
        <img
          src={imageSrc}
          alt={room.name}
          style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.target.src = getPlaceholderImage(room.name); }}
        />

        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', padding: '6px 10px', borderRadius: 8, fontWeight:700, color:'#0f172a' }}>
          {room.beds ? `${room.beds} Bed` : ''}
        </div>

        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <div style={{ background: 'linear-gradient(180deg,#2563eb,#1e40af)', color:'#fff', padding: '8px 12px', borderRadius: 10, fontWeight:700 }}>
            {formatPrice(room.basePrice)} <span style={{ fontSize: 12, fontWeight: 600 }}> / night</span>
          </div>
        </div>
      </div>

      <div className="card-body d-flex flex-column gap-2" style={{ padding: '18px' }}>
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="mb-1 fw-bold" style={{ fontSize: 18 }}>{room.name}</h5>
          <div className="text-muted small">{room.rating ? `${room.rating} ★` : ''}</div>
        </div>

        <p className="text-muted mb-2" style={{ lineHeight: 1.4, maxHeight: 54, overflow: 'hidden' }}>{room.description}</p>

        <div className="d-flex gap-2" style={{ flexWrap: 'wrap' }}>
          {(room.amenities || ['Free WiFi','Breakfast']).slice(0,4).map((a, i) => (
            <span key={i} className="badge bg-light text-dark" style={{ borderRadius: 8, padding: '6px 8px', border: '1px solid #eef2f7' }}>{a}</span>
          ))}
        </div>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-outline-secondary" style={{ borderRadius: 8, borderColor:'#e6eef6' }} onClick={() => onViewDetail(room)}>View details</button>
          <button className="btn" style={{ backgroundColor:'#5C6F4E', color:'#fff', borderRadius: 8 }} onClick={() => onBooking(room)}>Book now</button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
