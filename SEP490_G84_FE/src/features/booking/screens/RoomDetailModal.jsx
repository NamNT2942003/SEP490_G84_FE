import { useState, useEffect } from "react";
import { roomService } from "../api/roomService.js";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import apiClient from "@/services/apiClient";

const toAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("/api/")) {
        const baseUrl = apiClient.defaults.baseURL.replace(/\/api$/, "");
        return baseUrl + url;
    }
    return url;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop";

const RoomDetailModal = ({ room, show, onClose }) => {
    const [roomDetail, setRoomDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Gallery images
    const [galleryImages, setGalleryImages] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        if (show && room?.roomTypeId) {
            fetchRoomDetail(room.roomTypeId);
            fetchGallery(room.roomTypeId);
        }
    }, [show, room?.roomTypeId]);

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

    const fetchGallery = async (roomTypeId) => {
        try {
            const images = await roomTypeManagementApi.getGallery(roomTypeId);
            setGalleryImages(images || []);
            setCurrentSlide(0);
        } catch (err) {
            console.error("Failed to load gallery:", err);
            setGalleryImages([]);
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

    const roomData = roomDetail?.roomType || room;
    const amenities = roomDetail?.amenities || [];

    // Build slides: cover image first, then gallery images
    const allSlides = [];
    const coverUrl = roomData.image ? toAbsoluteImageUrl(roomData.image) : FALLBACK_IMAGE;
    allSlides.push({ url: coverUrl, label: "Cover" });
    galleryImages.forEach((img, i) => {
        if (img.imageUrl) {
            allSlides.push({ url: toAbsoluteImageUrl(img.imageUrl), label: `Photo ${i + 1}` });
        }
    });

    const goToPrev = () => setCurrentSlide((prev) => (prev === 0 ? allSlides.length - 1 : prev - 1));
    const goToNext = () => setCurrentSlide((prev) => (prev === allSlides.length - 1 ? 0 : prev + 1));

    return (
        <>
            <style>{`
                .rdm-carousel { position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #1a1a2e; margin-bottom: 20px; }
                .rdm-carousel-inner { position: relative; width: 100%; height: 420px; }
                .rdm-carousel-slide { width: 100%; height: 100%; object-fit: cover; display: block; cursor: pointer; transition: filter 0.2s; }
                .rdm-carousel-slide:hover { filter: brightness(0.92); }
                .rdm-carousel-zoom-hint { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.55); color: #fff; font-size: 0.72rem; font-weight: 600; padding: 4px 10px; border-radius: 16px; backdrop-filter: blur(4px); pointer-events: none; display: flex; align-items: center; gap: 4px; }
                .rdm-carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(0,0,0,0.5); color: #fff; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; backdrop-filter: blur(4px); }
                .rdm-carousel-btn:hover { background: rgba(0,0,0,0.75); }
                .rdm-carousel-btn.prev { left: 12px; }
                .rdm-carousel-btn.next { right: 12px; }
                .rdm-carousel-counter { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.75rem; font-weight: 600; padding: 4px 12px; border-radius: 20px; backdrop-filter: blur(4px); letter-spacing: 0.5px; }
                .rdm-carousel-dots { display: flex; justify-content: center; gap: 6px; padding: 10px 0 4px; }
                .rdm-carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: #ced4da; border: none; cursor: pointer; transition: all 0.2s; padding: 0; }
                .rdm-carousel-dot.active { background: #465c47; width: 20px; border-radius: 4px; }

                /* Lightbox */
                .rdm-lightbox-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; animation: rdmFadeIn 0.2s ease; }
                @keyframes rdmFadeIn { from { opacity: 0; } to { opacity: 1; } }
                .rdm-lightbox-img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 8px; user-select: none; }
                .rdm-lightbox-close { position: absolute; top: 18px; right: 22px; width: 42px; height: 42px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); color: #fff; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; backdrop-filter: blur(6px); }
                .rdm-lightbox-close:hover { background: rgba(255,255,255,0.3); }
                .rdm-lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; border: none; background: rgba(255,255,255,0.12); color: #fff; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; backdrop-filter: blur(6px); }
                .rdm-lightbox-nav:hover { background: rgba(255,255,255,0.25); }
                .rdm-lightbox-nav.prev { left: 20px; }
                .rdm-lightbox-nav.next { right: 20px; }
                .rdm-lightbox-counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.7); font-size: 0.85rem; font-weight: 600; }
            `}</style>
            <div
                className={`modal fade ${show ? "show" : ""}`}
                style={{ display: show ? "block" : "none" }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <div
                            className="modal-header"
                            style={{ backgroundColor: "#465c47" }}
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
                                        style={{ color: "#465c47" }}
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
                                    {/* Image Carousel */}
                                    <div className="rdm-carousel">
                                        <div className="rdm-carousel-inner">
                                            <img
                                                className="rdm-carousel-slide"
                                                src={allSlides[currentSlide]?.url || FALLBACK_IMAGE}
                                                alt={allSlides[currentSlide]?.label || "Room"}
                                                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                                                onClick={() => setLightboxOpen(true)}
                                                title="Click to enlarge"
                                            />
                                            <div className="rdm-carousel-zoom-hint">
                                                <i className="bi bi-arrows-fullscreen" /> Click to enlarge
                                            </div>
                                            {allSlides.length > 1 && (
                                                <>
                                                    <button className="rdm-carousel-btn prev" onClick={goToPrev} type="button">
                                                        <i className="bi bi-chevron-left" />
                                                    </button>
                                                    <button className="rdm-carousel-btn next" onClick={goToNext} type="button">
                                                        <i className="bi bi-chevron-right" />
                                                    </button>
                                                </>
                                            )}
                                            <div className="rdm-carousel-counter">
                                                {currentSlide + 1} / {allSlides.length}
                                            </div>
                                        </div>
                                        {allSlides.length > 1 && (
                                            <div className="rdm-carousel-dots">
                                                {allSlides.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        className={`rdm-carousel-dot${idx === currentSlide ? " active" : ""}`}
                                                        onClick={() => setCurrentSlide(idx)}
                                                        type="button"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

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
                                style={{ backgroundColor: "#465c47", borderColor: "#465c47" }}
                            >
                                Book This Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {show && <div className="modal-backdrop fade show"></div>}

            {/* Lightbox overlay */}
            {lightboxOpen && (
                <div className="rdm-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
                    <button className="rdm-lightbox-close" onClick={() => setLightboxOpen(false)} type="button">
                        <i className="bi bi-x-lg" />
                    </button>
                    {allSlides.length > 1 && (
                        <>
                            <button
                                className="rdm-lightbox-nav prev"
                                type="button"
                                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                            >
                                <i className="bi bi-chevron-left" />
                            </button>
                            <button
                                className="rdm-lightbox-nav next"
                                type="button"
                                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            >
                                <i className="bi bi-chevron-right" />
                            </button>
                        </>
                    )}
                    <img
                        className="rdm-lightbox-img"
                        src={allSlides[currentSlide]?.url || FALLBACK_IMAGE}
                        alt={allSlides[currentSlide]?.label || "Room"}
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    <div className="rdm-lightbox-counter">
                        {currentSlide + 1} / {allSlides.length}
                    </div>
                </div>
            )}
        </>
    );
};

export default RoomDetailModal;