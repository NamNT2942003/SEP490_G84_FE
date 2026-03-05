import {useState, useEffect} from "react";
import SearchForm from "./SearchForm.jsx";
import RoomCard from "./RoomCard.jsx";
import FilterSidebar from "./FilterSidebar.jsx";
import RoomDetailModal from "./RoomDetailModal.jsx";
import SmartPagination from "./SmartPagination.jsx";
import {roomService} from "../api/roomService.js";
import {branchService} from "../api/branchService.js";

const SearchRoom = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [branches, setBranches] = useState([]);
    const [filters, setFilters] = useState({
        branchId: 1,
        roomTypeIds: undefined,
        sortPrice: "priceAsc",
        page: 0,
        size: 5,
    });
    const [searchParams, setSearchParams] = useState(null);

    // fetch branches once
    useEffect(() => {
        (async () => {
            try {
                const data = await branchService.getAllBranches();
                setBranches(data);
                if (data.length > 0 && !filters.branchId) setFilters(p => ({ ...p, branchId: data[0].branchId }));
            } catch (e) { console.error("Branches:", e); }
        })();
    }, []);

    const searchRooms = async (sp) => {
        setLoading(true); setError(null); setSearchParams(sp);
        try {
            if (sp.checkIn && sp.checkOut) {
                if (new Date(sp.checkOut) < new Date(sp.checkIn)) {
                    setError("Check-out date must be after check-in date.");
                    setLoading(false); return;
                }
            }
            const params = { branchId: filters.branchId ?? 1, ...filters, ...sp };
            const res = await roomService.searchRooms(params);
            setRooms(res.content || []);
            setTotalElements(res.totalElements || 0);
            setTotalPages(res.totalPages || 0);
        } catch (err) {
            setError(err.message || "Failed to search rooms");
        } finally { setLoading(false); }
    };

    const refetchRooms = async () => {
        if (!searchParams) return;
        setLoading(true); setError(null);
        try {
            if (searchParams.checkIn && searchParams.checkOut && new Date(searchParams.checkOut) < new Date(searchParams.checkIn)) {
                setError("Check-out date must be after check-in date.");
                setLoading(false); return;
            }
            const params = { branchId: filters.branchId ?? 1, ...filters, ...searchParams };
            const res = await roomService.searchRooms(params);
            setRooms(res.content || []);
            setTotalElements(res.totalElements || 0);
            setTotalPages(res.totalPages || 0);
        } catch (err) {
            setError(err.message || "Failed to search rooms");
        } finally { setLoading(false); }
    };

    const handleFilterChange = (nf) => setFilters(p => ({ ...p, ...nf, page: 0 }));
    const handleSortChange = (e) => setFilters(p => ({ ...p, sortPrice: e.target.value, page: 0 }));
    const handlePageChange = (page) => setFilters(p => ({ ...p, page }));
    const handleBooking = (room) => alert(`Booking ${room.name} — Feature coming soon!`);
    const handleViewDetail = (room) => { setSelectedRoom(room); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setSelectedRoom(null); };

    useEffect(() => {
        const fmtYmd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const now = new Date(); now.setHours(0,0,0,0);
        const tom = new Date(now); tom.setDate(now.getDate()+1);
        searchRooms({ checkIn: fmtYmd(now), checkOut: fmtYmd(tom), adults: 1, children: 0 });
    }, []);

    useEffect(() => { if (searchParams) refetchRooms(); }, [filters.branchId, filters.roomTypeIds, filters.sortPrice, filters.page]);

    return (
        <div style={{ background: '#f5f6f8', minHeight: '100vh' }}>
            <style>{`
                .hero{background:linear-gradient(135deg,#5C6F4E 0%,#3d4a33 100%);padding:36px 0 48px;margin-bottom:-22px;position:relative;z-index:10;overflow:visible}
                .hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:36px;background:#f5f6f8;border-radius:20px 20px 0 0;z-index:-1;pointer-events:none}
                .hero-txt{text-align:center;margin-bottom:20px;color:#fff}
                .hero-txt h2{font-weight:800;font-size:1.5rem;margin-bottom:4px}
                .hero-txt p{color:rgba(255,255,255,.7);font-size:.9rem;margin:0}
                .res-hdr{background:#fff;border-radius:14px;padding:14px 18px;box-shadow:0 2px 8px rgba(0,0,0,.04);border:1px solid #eee;margin-bottom:16px}
                .res-cnt{font-size:1rem;font-weight:700;color:#333}
                .res-cnt span{color:#5C6F4E}
                .sort-sel{border:1px solid #dee2e6;border-radius:10px;padding:7px 12px;font-size:.84rem;color:#555;background:#fafafa;cursor:pointer}
                .sort-sel:focus{border-color:#5C6F4E;box-shadow:0 0 0 3px rgba(92,111,78,.1)}
                .empty-st{background:#fff;border-radius:16px;padding:50px 30px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.04)}
                .empty-st i{font-size:3.5rem;color:#ddd;margin-bottom:12px}
                .load-st{background:#fff;border-radius:16px;padding:50px 30px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.04)}
                .err-c{background:#fff;border-radius:14px;border-left:4px solid #dc3545;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
                .bc-bar{padding:12px 0 0}
                .bc-bar .breadcrumb{margin-bottom:0;font-size:.85rem}
                .bc-bar .breadcrumb a{color:#5C6F4E;text-decoration:none;font-weight:500}
                .bc-bar .breadcrumb a:hover{text-decoration:underline}
            `}</style>

            <div className="hero">
                <div className="container position-relative" style={{ zIndex: 2 }}>
                    <div className="hero-txt">
                        <h2><i className="bi bi-stars me-2" style={{ fontSize: '1.2rem' }}></i>Find Your Perfect Room</h2>
                        <p>Book quickly — enjoy an exceptional experience</p>
                    </div>
                    <SearchForm
                        onSearch={searchRooms}
                        loading={loading}
                        branches={branches}
                        branchId={filters.branchId}
                        onBranchChange={(id) => handleFilterChange({ branchId: id || undefined })}
                    />
                </div>
            </div>

            <div className="container bc-bar" style={{ position: 'relative', zIndex: 1 }}>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="/public"><i className="bi bi-house-door me-1"></i>Home</a></li>
                        <li className="breadcrumb-item active">Search Results</li>
                    </ol>
                </nav>
            </div>

            <div className="container pb-5">
                <div className="row g-4">
                    <div className="col-lg-3 col-md-4">
                        <FilterSidebar onFilterChange={handleFilterChange} selectedRoomTypes={filters.roomTypeIds} selectedBranchId={filters.branchId} />
                    </div>
                    <div className="col-lg-9 col-md-8" style={{ position: 'relative', zIndex: 0 }}>
                        <div className="res-hdr d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="res-cnt"><i className="bi bi-building me-2" style={{ color: '#5C6F4E' }}></i>Available Rooms: <span>{totalElements}</span></div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted" style={{ fontSize: '.82rem' }}><i className="bi bi-sort-down me-1"></i>Sort by:</span>
                                <select className="sort-sel" value={filters.sortPrice} onChange={handleSortChange}>
                                    <option value="priceAsc">Price: Low → High</option>
                                    <option value="priceDesc">Price: High → Low</option>
                                </select>
                            </div>
                        </div>

                        {loading && (
                            <div className="load-st">
                                <div className="spinner-border mb-3" role="status" style={{ color: '#5C6F4E', width: '2.5rem', height: '2.5rem' }}><span className="visually-hidden">Loading...</span></div>
                                <p className="text-muted mb-0">Searching for available rooms...</p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="err-c">
                                <div className="d-flex align-items-start gap-3">
                                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.3rem', color: '#dc3545' }}></i>
                                    <div>
                                        <h6 className="mb-1 fw-bold" style={{ color: '#dc3545' }}>Unable to load rooms</h6>
                                        <p className="mb-1 text-muted" style={{ fontSize: '.9rem' }}>{error}</p>
                                        <p className="mb-0 text-muted" style={{ fontSize: '.8rem' }}>Please try again or adjust your search criteria.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && !error && rooms.length === 0 && (
                            <div className="empty-st">
                                <i className="bi bi-inbox d-block"></i>
                                <h5 className="fw-bold mb-2" style={{ color: '#333' }}>No rooms found</h5>
                                <p className="text-muted mb-3">No rooms match your search criteria.</p>
                                <p className="text-muted small mb-0"><i className="bi bi-lightbulb me-1"></i>Try changing dates, branch, or filters.</p>
                            </div>
                        )}

                        {!loading && !error && rooms.length > 0 && (
                            <div>
                                {rooms.map((rt) => (
                                    <RoomCard key={rt.roomTypeId} room={rt} onBooking={handleBooking} onViewDetail={handleViewDetail} />
                                ))}
                                <SmartPagination
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

            <RoomDetailModal room={selectedRoom} show={showModal} onClose={handleCloseModal} />
        </div>
    );
};

export default SearchRoom;
