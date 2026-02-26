import {useState, useEffect} from "react";
import SearchForm from "./SearchForm.jsx";
import RoomCard from "./RoomCard.jsx";
import FilterSidebar from "./FilterSidebar.jsx";
import RoomDetailModal from "./RoomDetailModal.jsx";
import Pagination from "../../../components/layout/Pagination.jsx";
import {roomService} from "../../booking/api/roomService.js";

const SearchRoom = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [filters, setFilters] = useState({
        branchId: 1,
        roomTypeIds: undefined,
        sortPrice: "priceAsc",
        page: 0,
        size: 5,
    });

    const [searchParams, setSearchParams] = useState(null);

    const searchRooms = async (searchFormParams) => {
        setLoading(true);
        setError(null);
        setSearchParams(searchFormParams);
        try {
            const params = {
                ...filters,
                ...searchFormParams,
            };

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
            const params = {
                ...filters,
                ...searchParams,
            };

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

    const handleBooking = (room) => {
        alert(`Booking ${room.name} - Feature coming soon!`);
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
                            <div className="alert alert-danger" role="alert">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        {!loading && !error && rooms.length === 0 && (
                            <div className="text-center py-5">
                                <i
                                    className="bi bi-inbox"
                                    style={{fontSize: "3rem", color: "#ccc"}}
                                ></i>
                                <p className="mt-3 text-muted">
                                    No rooms available for your search criteria.
                                </p>
                                <p className="text-muted small">
                                    Try adjusting your dates or filters.
                                </p>
                            </div>
                        )}

                        {!loading && !error && rooms.length > 0 && (
                            <div>
                                {rooms.map((roomType) => ( // Đổi tên từ room thành roomType để rõ nghĩa
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
