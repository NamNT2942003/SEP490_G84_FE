import {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import SearchForm from "./SearchForm.jsx";
import RoomCard from "./RoomCard.jsx";
import FilterSidebar from "./FilterSidebar.jsx";
import RoomDetailModal from "./RoomDetailModal.jsx";
import Pagination from "../../../components/layout/Pagination.jsx";
import {roomService} from "../../booking/api/roomService.js";

const SearchRoom = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [filters, setFilters] = useState({
        branchId: undefined, // Default to "All Locations"
        roomTypeIds: undefined,
        sortPrice: "priceAsc",
        page: 0,
        size: 5,
        checkIn: "", // Add checkIn/checkOut to filters state
        checkOut: ""
    });

    const [searchParams, setSearchParams] = useState(null);

    // Helper function to calculate nights
    const calculateNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 1;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return nights > 0 ? nights : 1;
    };

    const searchRooms = async (searchFormParams) => {
        setLoading(true);
        setError(null);
        setSearchParams(searchFormParams);
        // Also update filters state with new dates
        setFilters(prev => ({ ...prev, checkIn: searchFormParams.checkIn, checkOut: searchFormParams.checkOut, page: 0 }));

        try {
            if (searchFormParams.checkIn && searchFormParams.checkOut) {
                const checkInDate = new Date(searchFormParams.checkIn);
                const checkOutDate = new Date(searchFormParams.checkOut);
                if (checkOutDate < checkInDate) {
                    setError("\u26a0\ufe0f Check-out date must be after check-in date. Please select valid dates.");
                    setLoading(false);
                    return;
                }
            }

            const params = { ...filters, ...searchFormParams };
            const response = await roomService.searchRooms(params);
            setRooms(response.content || []);
            setTotalElements(response.totalElements || 0);
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            setError(err.message || "Failed to search rooms");
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };

    const refetchRooms = async () => {
        if (!searchParams) return;
        setLoading(true);
        setError(null);
        try {
            if (searchParams.checkIn && searchParams.checkOut) {
                const checkInDate = new Date(searchParams.checkIn);
                const checkOutDate = new Date(searchParams.checkOut);
                if (checkOutDate < checkInDate) {
                    setError("\u26a0\ufe0f Check-out date must be after check-in date. Please select valid dates.");
                    setLoading(false);
                    return;
                }
            }
            const params = { ...filters, ...searchParams };
            const response = await roomService.searchRooms(params);
            setRooms(response.content || []);
            setTotalElements(response.totalElements || 0);
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            setError(err.message || "Failed to search rooms");
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleBooking = (room, selectedQuantity) => {
        // Ensure quantity is a number
        const qty = Number(selectedQuantity) || 1;
        const price = Number(room.basePrice) || 0;
        
        navigate("/guest-information", {
            state: {
                selectedRooms: [{
                    roomTypeId: room.roomTypeId,
                    name: room.name,
                    basePrice: price,
                    quantity: qty,
                    image: room.image
                }],
                checkIn: filters.checkIn,
                checkOut: filters.checkOut,
                branchId: room.branchId, // Get directly from your new DTO
                totalPrice: price * qty * calculateNights(filters.checkIn, filters.checkOut)
            }
        });
    };

    const handleFilterChange = (newFilters) => {
        setFilters((prev) => ({...prev, ...newFilters, page: 0}));
    };

    const handleSortChange = (e) => {
        const sortValue = e.target.value;
        setFilters((prev) => ({...prev, sortPrice: sortValue, page: 0}));
    };

    const handlePageChange = (page) => {
        setFilters((prev) => ({...prev, page}));
    };

    const handleViewDetail = (room) => {
        setSelectedRoom(room);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRoom(null);
    };

    useEffect(() => {
        const formatYmdLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const today = formatYmdLocal(now);
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(now.getDate() + 1);
        const tomorrow = formatYmdLocal(tomorrowDate);

        searchRooms({
            checkIn: today,
            checkOut: tomorrow,
            adults: 1,
            children: 0,
        });
    }, []);

    useEffect(() => {
        if (searchParams) {
            refetchRooms();
        }
    }, [filters.branchId, filters.roomTypeIds, filters.sortPrice, filters.page]);

    return (
        <div className="search-room-page">
            <div className="container mt-4">
                <SearchForm onSearch={searchRooms} loading={loading}/>
            </div>

            <div className="container mt-3">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <a href="/public" style={{color: "#5C6F4E"}}>
                                Home
                            </a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                            Search Results
                        </li>
                    </ol>
                </nav>
            </div>

            <div className="container mb-5">
                <div className="row">
                    <div className="col-md-3">
                        <FilterSidebar
                            onFilterChange={handleFilterChange}
                            selectedRoomTypes={filters.roomTypeIds}
                            selectedBranchId={filters.branchId}
                        />
                    </div>

                    <div className="col-md-9">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Available Rooms ({totalElements})</h5>
                            <div className="d-flex align-items-center gap-2">
                                <label className="mb-0 small text-muted">Sort by</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{width: "auto"}}
                                    value={filters.sortPrice}
                                    onChange={handleSortChange}
                                >
                                    <option value="priceAsc">Price: Low to High</option>
                                    <option value="priceDesc">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {loading && (
                            <div className="text-center py-5">
                                <div
                                    className="spinner-border"
                                    role="status"
                                    style={{color: "#5C6F4E"}}
                                >
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2 text-muted">
                                    Searching for available rooms...
                                </p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="alert alert-danger border-0 shadow-sm" role="alert" style={{ backgroundColor: "#fff5f5", borderLeft: "4px solid #dc3545" }}>
                                <div className="d-flex align-items-start">
                                    <i className="bi bi-info-circle me-3" style={{ fontSize: "1.25rem", color: "#dc3545", marginTop: "0.2rem" }}></i>
                                    <div>
                                        <h6 className="mb-1" style={{ color: "#721c24" }}>Unable to load rooms</h6>
                                        <p className="mb-0" style={{ color: "#856404", fontSize: "0.95rem" }}>{error}</p>
                                        <p className="mb-0 small mt-2" style={{ color: "#999" }}>Please try adjusting your search criteria or try again.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && !error && rooms.length === 0 && (
                            <div className="text-center py-5" style={{ backgroundColor: "#fafafa", borderRadius: "8px", border: "1px dashed #ddd" }}>
                                <i
                                    className="bi bi-inbox"
                                    style={{fontSize: "3.5rem", color: "#ccc"}}
                                ></i>
                                <h5 className="mt-4 mb-2" style={{ color: "#333" }}>No rooms found</h5>
                                <p className="text-muted mb-3">
                                    We couldn't find any rooms matching your criteria.
                                </p>
                                <p className="text-muted small">
                                    <i className="bi bi-lightbulb me-1"></i>
                                    Try clicking the 'Search' button again or try different dates.
                                </p>
                            </div>
                        )}

                        {!loading && !error && rooms.length > 0 && (
                            <div>
                                {rooms.map((roomType) => (
                                    <RoomCard
                                        key={roomType.roomTypeId}
                                        room={roomType}
                                        onBooking={handleBooking}
                                        onViewDetail={handleViewDetail}
                                    />
                                ))}

                                <Pagination
                                    currentPage={filters.page}
                                    totalPages={totalPages}
                                    totalElements={totalElements}
                                    pageSize={filters.size}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <RoomDetailModal
                room={selectedRoom}
                show={showModal}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default SearchRoom;
