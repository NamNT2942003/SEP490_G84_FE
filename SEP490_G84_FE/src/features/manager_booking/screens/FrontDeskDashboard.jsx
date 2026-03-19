import React, { useState, useEffect } from 'react';
import FilterBar from '../component/FilterBar';
import BookingTable from '../component/BookingTable';
import CheckInModal from '../component/CheckInModal';
import BookingDetailModal from '../component/BookingDetailModal';
import CheckoutModal from '../component/CheckoutModal'; // 1. THÊM IMPORT NÀY
import { checkInApi } from '../api/checkInApi';

export default function FrontDeskDashboard() {
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [selectedBranch, setSelectedBranch] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // 2. THÊM STATE CHO CHECKOUT MODAL
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const currentUserRole = localStorage.getItem('userRole') || 'STAFF'; 
  const currentBranchId = Number(localStorage.getItem('branchId')) || 1;

  useEffect(() => {
    if (currentUserRole !== 'MANAGER' && currentUserRole !== 'ADMIN') {
      setSelectedBranch(currentBranchId);
    }
  }, [currentUserRole, currentBranchId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let statusParam = '';
      if (activeTab === 'ARRIVALS') statusParam = 'CONFIRMED';
      if (activeTab === 'DEPARTURES') statusParam = 'CHECKED_IN';
      
      const data = await checkInApi.getDashboardBookings(selectedBranch, statusParam);
      setBookings(data);
    } catch (error) {
      console.error("Fetch bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    setSearchTerm(''); 
    setCurrentPage(1);
  }, [activeTab, selectedBranch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenCheckIn = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleOpenDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // 3. THÊM HÀM XỬ LÝ MỞ MODAL CHECKOUT
  const handleOpenCheckout = (booking) => {
    setSelectedBooking(booking);
    setShowCheckoutModal(true);
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    const matchName = b.guestName?.toLowerCase().includes(lowerTerm);
    const matchCode = b.bookingCode?.toLowerCase().includes(lowerTerm);
    const matchRoom = b.assignedRooms?.some(room => room.toLowerCase().includes(lowerTerm));
    return matchName || matchCode || matchRoom;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="fw-bold text-dark mb-0"><i className="bi bi-laptop me-2"></i>Front Desk Dashboard</h4>
          <div className="text-muted small">Manage Check-ins, Check-outs, and In-house status</div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              
              <div className="d-flex mb-4 border-bottom pb-2">
                <div className="btn-group shadow-sm">
                  <button className={`btn fw-bold px-4 ${activeTab === 'ALL' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('ALL')}>All Bookings</button>
                  <button className={`btn fw-bold px-4 ${activeTab === 'ARRIVALS' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('ARRIVALS')}>Arrivals</button>
                  <button className={`btn fw-bold px-4 ${activeTab === 'DEPARTURES' ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('DEPARTURES')}>In-House</button>
                </div>
              </div>

              <FilterBar 
                selectedBranch={selectedBranch} 
                setSelectedBranch={setSelectedBranch} 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onRefresh={fetchBookings}
                userRole={currentUserRole} 
              />

              {loading ? (
                <div className="text-center p-5 text-muted">
                  <div className="spinner-border text-primary me-2" role="status"></div>
                  Loading data...
                </div>
              ) : (
                <>
                  <BookingTable 
                    bookings={currentItems} 
                    emptyMessage={`No matching results found for "${searchTerm}".`} 
                    onCheckInClick={handleOpenCheckIn}
                    onDetailsClick={handleOpenDetails} 
                    onCheckoutClick={handleOpenCheckout} /* 4. TRUYỀN HÀM NÀY XUỐNG BẢNG */
                    onRefresh={fetchBookings}
                  />

                  {filteredBookings.length > itemsPerPage && (
                    <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
                      <div className="small text-muted">
                        Showing <span className="fw-bold text-dark">{indexOfFirstItem + 1}</span> to <span className="fw-bold text-dark">{Math.min(indexOfLastItem, filteredBookings.length)}</span> of <span className="fw-bold text-dark">{filteredBookings.length}</span> bookings
                      </div>
                      
                      <nav>
                        <ul className="pagination pagination-sm mb-0 shadow-sm">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>
                              Previous
                            </button>
                          </li>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => setCurrentPage(page)}>
                                {page}
                              </button>
                            </li>
                          ))}

                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showModal && (
        <CheckInModal 
          key={selectedBooking?.id} 
          show={showModal} 
          onClose={() => setShowModal(false)} 
          booking={selectedBooking} 
          branchId={selectedBranch}
          onSuccess={fetchBookings} 
        />
      )}

      {showDetailsModal && (
        <BookingDetailModal 
          key={`details-${selectedBooking?.id}`} 
          show={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          booking={selectedBooking} 
          onRefresh={fetchBookings}
        />
      )}

     {/* 5. GẮN COMPONENT CHECKOUT MODAL VÀO DƯỚI CÙNG */}
      {showCheckoutModal && (
        <CheckoutModal 
          key={`checkout-${selectedBooking?.id}`} 
          show={showCheckoutModal} 
          onClose={() => setShowCheckoutModal(false)} 
          booking={selectedBooking} 
          onSuccess={fetchBookings} 
          branchId={selectedBranch} /* <--- THÊM ĐÚNG DÒNG NÀY */
        />
      )}
    </div>
  );
}