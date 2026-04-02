import React, { useState, useEffect, useCallback } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import RoomDetailModal from "../components/RoomDetailModal";
import ReportIssueModal from "../components/ReportIssueModal";
import { useRoomIncidents, useFurnitureStatus } from "../../../hooks/useWebSocket";
import audioNotificationService from "../../../services/audioNotificationService";
import AudioTestPanel from "../../../components/AudioTestPanel";

const BRAND = "#4a5d41"; // Slightly more muted green

const STAT_CARDS = [
  {
    key: "total",
    label: "Total Rooms",
    icon: "bi-building",
    color: "#2c3e50",
    bgAlpha: "rgba(44,62,80,0.08)",
  },
  {
    key: "available",
    label: "Available",
    icon: "bi-check-circle-fill",
    color: "#27ae60",
    bgAlpha: "rgba(39,174,96,0.08)",
  },
  {
    key: "occupied",
    label: "Occupied",
    icon: "bi-person-fill-check",
    color: "#3498db",
    bgAlpha: "rgba(52,152,219,0.08)",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    icon: "bi-tools",
    color: "#e74c3c", 
    bgAlpha: "rgba(231,76,60,0.08)",
  },
];

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [equipmentBrokenFilter, setEquipmentBrokenFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [branches, setBranches] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Additional state for enhanced data
  const [statistics, setStatistics] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
  });
  const [floors, setFloors] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRoomTypes, setAvailableRoomTypes] = useState([]); // Room types filtered by branch
  const [apiStatus, setApiStatus] = useState({
    rooms: 'unknown',
    statistics: 'unknown',
    floors: 'unknown',
    types: 'unknown'
  });

  // Real-time notifications state
  const [notifications, setNotifications] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const pageSize = 20;

  // Initialize audio service on first user interaction
  const initializeAudio = useCallback(async () => {
    if (!audioNotificationService.isReady()) {
      await audioNotificationService.initialize();
      await audioNotificationService.resumeAudioContext();
    }
  }, []);

  // Call initialize audio on component mount and user interactions
  useEffect(() => {
    const handleUserInteraction = async () => {
      await initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initializeAudio]);

  // Toggle audio notifications
  const toggleAudioNotifications = useCallback(() => {
    const newMutedState = audioNotificationService.toggleMute();
    setAudioEnabled(!newMutedState);
    
    if (!newMutedState) {
      // Play test sound when unmuting
      audioNotificationService.playInfoSound();
    }
  }, []);

  // Simple toast notification function
  const showToastNotification = useCallback((message, type = 'info') => {
    // Create a simple toast element
    const toast = document.createElement('div');
    toast.className = `position-fixed top-0 end-0 m-3 p-3 rounded shadow-lg bg-${type === 'warning' ? 'warning' : 'primary'} text-white`;
    toast.style.zIndex = '9999';
    toast.style.maxWidth = '300px';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 5000);
  }, []);

  // WebSocket handlers for real-time updates - using useCallback for optimization
  const handleRoomIncident = useCallback((message) => {
    console.log('[Real-time] Room incident received:', message);
    
    // Add notification
    const notification = {
      id: Date.now(),
      type: 'incident',
      roomId: message.roomId,
      message: `Room ${message.data.roomName || message.roomId} has a new incident: ${message.data.description}`,
      timestamp: new Date(),
      data: message.data
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 recent notifications
    
    // Refresh room data to show updated status
    fetchRooms();
    fetchStatistics();
    
    // Show toast notification
    showToastNotification(`🚨 Incident reported in room ${message.data.roomName || message.roomId}`, 'warning');
    
    // Play warning sound
    if (audioEnabled) {
      initializeAudio().then(() => {
        audioNotificationService.playWarningSound();
      });
    }
  }, [showToastNotification, audioEnabled, initializeAudio]);

  const handleFurnitureStatusChange = useCallback((message) => {
    console.log('[Real-time] Furniture status change received:', message);
    
    // Add notification
    const notification = {
      id: Date.now(),
      type: 'furniture',
      roomId: message.roomId,
      furnitureId: message.furnitureId,
      message: `Room ${message.roomId} furniture status changed to: ${message.status}`,
      timestamp: new Date(),
      data: message.data
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Refresh room data to show updated furniture status
    fetchRooms();
    fetchStatistics();
    
    // Show toast notification if it's a maintenance status
    if (message.status && (message.status.toLowerCase().includes('maintenance') || 
                          message.status.toLowerCase().includes('broken') ||
                          message.status.toLowerCase().includes('broken'))) {
      showToastNotification(`Room ${message.roomId} equipment needs maintenance`, 'warning');
      
      // Play maintenance sound
      if (audioEnabled) {
        initializeAudio().then(() => {
          audioNotificationService.playMaintenanceSound();
        });
      }
    } else if (message.status && (message.status.toLowerCase().includes('good') ||
                                 message.status.toLowerCase().includes('fixed'))) {
      // Play success sound for good/fixed status
      if (audioEnabled) {
        initializeAudio().then(() => {
          audioNotificationService.playSuccessSound();
        });
      }
    }
  }, [showToastNotification, audioEnabled, initializeAudio]);

  // Use WebSocket hooks
  const { isConnected: incidentConnected } = useRoomIncidents(handleRoomIncident);
  const { isConnected: furnitureConnected } = useFurnitureStatus(handleFurnitureStatusChange);

  // Update connection status when either hook connects
  useEffect(() => {
    const connected = incidentConnected || furnitureConnected;
    setWsConnected(connected);
    if (connected) {
      console.log('[WebSocket] Connected to real-time updates');
    }
  }, [incidentConnected, furnitureConnected]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomManagementApi.listRooms(
          search,
          "", // status filter - we'll handle this in UI if needed, but here we pass empty to get all
          page,
          pageSize,
          branchFilter
      );
      console.log('🔍 Rooms from API:', data.content?.[0]); // DEBUG - show first room structure
      setRooms(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setApiStatus(prev => ({ ...prev, rooms: 'available' }));
    } catch (err) {
      console.warn("Rooms API not available:", err.response?.status);
      setError(err.response?.status === 400 || err.response?.status === 404 
        ? "Backend APIs are not ready. Please check backend connection."
        : err.message || "Error loading room data");
      setRooms([]);
      setApiStatus(prev => ({ ...prev, rooms: 'unavailable' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (branch) => {
    try {
      const stats = await roomManagementApi.getRoomStatistics(branch || branchFilter);
      setStatistics({
        totalRooms: stats.totalRooms || 0,
        availableRooms: stats.availableRooms || 0,
        occupiedRooms: stats.occupiedRooms || 0,
        maintenanceRooms: stats.maintenanceRooms || 0,
        totalEquipment: stats.totalEquipment || 0,
        brokenEquipment: stats.brokenEquipment || 0,
        totalIssues: stats.totalIssues || 0,
      });
      setApiStatus(prev => ({ ...prev, statistics: 'available' }));
    } catch (err) {
      console.warn("Statistics API not available:", err.response?.status);
      // Set default statistics when API is not available
      setStatistics({
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        totalEquipment: 0,
        brokenEquipment: 0,
        totalIssues: 0,
      });
      setApiStatus(prev => ({ ...prev, statistics: 'unavailable' }));
    }
  };

  const fetchFloors = async () => {
    try {
      const floorData = await roomManagementApi.getFloors();
      // ✅ Ensure unique keys and valid structure
      const validFloors = (floorData || []).filter(floor =>
          floor &&
          typeof floor.floor === 'number' &&
          floor.floor > 0 && // Filter out invalid floors
          floor.label &&
          typeof floor.roomCount === 'number'
      );
      setFloors(validFloors);
      setApiStatus(prev => ({ ...prev, floors: 'available' }));
    } catch (err) {
      console.warn("Floors API not available:", err.response?.status);
      setFloors([]); // Empty array when API not available
      setApiStatus(prev => ({ ...prev, floors: 'unavailable' }));
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const typeData = await roomManagementApi.getRoomTypes();
      console.log('🔍 Room Types from API:', typeData); // DEBUG
      // ✅ Ensure unique keys and valid structure
      const validTypes = (typeData || []).filter(type =>
          type &&
          type.type &&
          type.label &&
          typeof type.roomCount === 'number'
      );
      console.log('✅ Valid Room Types:', validTypes); // DEBUG
      setRoomTypes(validTypes);
      setApiStatus(prev => ({ ...prev, types: 'available' }));
    } catch (err) {
      console.warn("Room types API not available:", err.response?.status);
      setRoomTypes([]); // Empty array when API not available
      setApiStatus(prev => ({ ...prev, types: 'unavailable' }));
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await roomManagementApi.listBranches();
      setBranches(data || []);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchRooms(),
      fetchStatistics(),
      fetchFloors(),
      fetchRoomTypes(),
      fetchBranches(),
    ]);
  };

  // When branch filter changes, reset room type filter and compute available room types
  useEffect(() => {
    // Reset room type filter when branch changes
    setRoomTypeFilter('');
    
    // Compute available room types based on selected branch
    if (branchFilter && branchFilter !== '') {
      // Get unique room types from rooms that belong to the selected branch
      const branchRoomTypes = rooms
        .filter(room => room.branchId === branchFilter || room.branchId === parseInt(branchFilter))
        .map(room => ({
          type: room.roomType,
          label: room.roomTypeName,
          name: room.roomTypeName
        }))
        .filter((type, index, self) => 
          type.type && index === self.findIndex(t => t.type === type.type)
        );
      
      setAvailableRoomTypes(branchRoomTypes);
      console.log('📋 Available room types for branch:', { branchFilter, branchRoomTypes });
    } else {
      // No branch selected, show all room types
      setAvailableRoomTypes(roomTypes);
    }
    
    setPage(0); // Reset to first page when branch changes
  }, [branchFilter, rooms]);

  // Initialize available room types when roomTypes are loaded
  useEffect(() => {
    if (!branchFilter || branchFilter === '') {
      setAvailableRoomTypes(roomTypes);
    }
  }, [roomTypes, branchFilter]);
  
  useEffect(() => {
    fetchRooms();
    fetchStatistics();
  }, [page, search, branchFilter]);

  useEffect(() => {
    fetchAllData();

    // Set up periodic refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStatistics(branchFilter);
    }, 30000);

    return () => clearInterval(interval);
  }, []); // Load initial data on mount

  // Re-fetch data when page changes
  useEffect(() => {
    const fetchCurrentPageRooms = async () => {
      try {
        setLoading(true);
        const data = await roomManagementApi.listRooms(search, "", page, 12, branchFilter);

        setRooms(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentPageRooms();
  }, [page, search, branchFilter]);

  // Handle page change with smooth scroll to top of grid
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    return (
        <nav aria-label="Room navigation" className="mt-4">
          <ul className="pagination pagination-sm justify-content-center gap-1 mb-0">
            {/* First Page */}
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(0)}>
                <i className="bi bi-chevron-double-left"></i>
              </button>
            </li>

            {/* Previous Page */}
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(page - 1)}>
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>

            {/* Page Numbers */}
            {startPage > 0 && <li className="page-item disabled"><span className="page-link border-0">...</span></li>}

            {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(p => (
                <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                  <button
                      className="page-link border-0 rounded-3 px-3 fw-bold"
                      style={page === p ? { backgroundColor: BRAND, color: 'white' } : { color: BRAND }}
                      onClick={() => handlePageChange(p)}
                  >
                    {p + 1}
                  </button>
                </li>
            ))}

            {endPage < totalPages - 1 && <li className="page-item disabled"><span className="page-link border-0">...</span></li>}

            {/* Next Page */}
            <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(page + 1)}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>

            {/* Last Page */}
            <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link border-0 rounded-3 px-3" onClick={() => handlePageChange(totalPages - 1)}>
                <i className="bi bi-chevron-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
    );
  };

  // Re-fetch statistics when filters change (reset to page 0)
  useEffect(() => {
    setPage(0);
  }, [search, floorFilter, roomTypeFilter, equipmentBrokenFilter, branchFilter]);

  // Re-fetch data when user returns to tab (for better UX)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Filter rooms based on UI filters - FIXED LOGIC
  const filteredRooms = rooms.filter(room => {
    let match = true;
    
    // Search filter (client-side backup for server-side search)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      const roomName = (room.roomName || '').toLowerCase();
      const roomId = (room.roomId || '').toString().toLowerCase();
      match = match && (roomName.includes(searchLower) || roomId.includes(searchLower));
    }
    
    // Floor filter - ensure type consistency
    if (floorFilter && floorFilter !== '') {
      const roomFloor = room.floor?.toString() || '';
      match = match && roomFloor === floorFilter;
    }
    
    // Room type filter - DEBUG AND FIX field name matching
    if (roomTypeFilter && roomTypeFilter !== '') {
      console.log('🔍 Filter Debug:', {
        roomTypeFilter,
        room_roomType: room.roomType,
        room_roomTypeName: room.roomTypeName,
        room_type: room.type,
        roomId: room.roomId
      });
      
      // Try multiple possible field names to match filter value
      const roomType = room.roomType || room.roomTypeName || room.type || '';
      const filterMatch = roomType === roomTypeFilter;
      
      if (!filterMatch) {
        console.log('❌ Type filter mismatch:', { expected: roomTypeFilter, actual: roomType });
      }
      
      match = match && filterMatch;
    }
    
    // Equipment broken filter - improved null handling
    if (equipmentBrokenFilter === "true") {
      match = match && ((room.equipmentBroken || 0) > 0);
    } else if (equipmentBrokenFilter === "false") {
      match = match && ((room.equipmentBroken || 0) === 0);
    }
    
    return match;
  });

  // Sort filtered rooms - IMPROVED SORTING
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    switch(sortBy) {
      case "name":
        return (a.roomName || "").localeCompare(b.roomName || "");
      case "floor":
        return (a.floor || 0) - (b.floor || 0);
      case "type": 
        // Use correct field names for sorting
        const aType = a.roomType || a.roomTypeName || "";
        const bType = b.roomType || b.roomTypeName || "";
        return aType.localeCompare(bType);
      case "status":
        return (a.status || "").localeCompare(b.status || "");
      default: 
        return 0;
    }
  });

  const statValues = {
    total: statistics.totalRooms,
    available: statistics.availableRooms,
    occupied: statistics.occupiedRooms,
    maintenance: statistics.maintenanceRooms,
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
    setPage(0);
  };

  const handleViewRoom = (room) => {
    setSelectedRoom(room);
    setShowDetailModal(true);
  };

  const handleReportIssue = (room) => {
    setSelectedRoom(room);
    setShowReportModal(true);
  };

  const getStatusColor = (status) => {
    if (!status) return "#6c757d";
    const s = status.toUpperCase();
    switch(s) {
      case "AVAILABLE": return "#198754"; // Green - Available
      case "OCCUPIED": return "#0d6efd";  // Blue - Occupied
      case "MAINTENANCE": return "#dc3545"; // Red - Maintenance (Due to broken equipment/incidents)
      default: return "#6c757d";
    }
  };

  const getStatusText = (status) => {
    if (!status) return "Unknown";
    const s = status.toUpperCase();
    switch(s) {
      case "AVAILABLE": return "Available";
      case "OCCUPIED": return "Occupied";
      case "MAINTENANCE": return "Maintenance";
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <style>{`
        @keyframes gentleFadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtleBounce {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .room-card {
          animation: gentleFadeIn 0.4s ease forwards;
          transition: all 0.25s ease;
          border: 1px solid rgba(0,0,0,0.04);
        }
        .room-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08) !important;
        }
        .animate-count-up {
          animation: countUp 0.4s ease forwards;
        }
        .notification-slide-in {
          animation: slideInRight 0.4s ease forwards;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          transition: all 0.3s ease;
        }
        .filter-fade-in {
          animation: fadeInUp 0.5s ease forwards;
        }
        .room-card:nth-child(1) { animation-delay: 0.1s; }
        .room-card:nth-child(2) { animation-delay: 0.2s; }
        .room-card:nth-child(3) { animation-delay: 0.3s; }
        .room-card:nth-child(4) { animation-delay: 0.4s; }
        .skeleton-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <div className="container-fluid py-4 px-xl-5" style={{ backgroundColor: "#fbfbfb", minHeight: "100vh" }}>
        
        {/* API STATUS BANNER */}
        {(apiStatus.rooms === 'unavailable' || apiStatus.statistics === 'unavailable') && (
          <div className="alert alert-warning border-0 rounded-4 mb-4 d-flex align-items-center" style={{ backgroundColor: "rgba(255, 193, 7, 0.1)", borderLeft: "4px solid #ffc107" }}>
            <i className="bi bi-exclamation-triangle-fill text-warning fs-4 me-3"></i>
            <div className="flex-grow-1">
              <h6 className="alert-heading mb-1 fw-bold">Limited API Connectivity</h6>
              <p className="mb-0 small text-muted">
                Some backend services are currently unavailable. The system is running with available data and mock data where needed.
                Real-time updates and some features may be limited until full connectivity is restored.
              </p>
            </div>
            <button 
              className="btn btn-sm btn-outline-warning ms-3" 
              onClick={() => window.location.reload()}
              title="Retry connection"
            >
              <i className="bi bi-arrow-clockwise"></i> Retry
            </button>
          </div>
        )}
        
        {/* ERROR DISPLAY */}
        {error && (
          <div className="alert alert-danger border-0 rounded-4 mb-4 d-flex align-items-start" style={{ backgroundColor: "rgba(220, 53, 69, 0.1)", borderLeft: "4px solid #dc3545" }}>
            <i className="bi bi-exclamation-octagon-fill text-danger fs-4 me-3 mt-1"></i>
            <div className="flex-grow-1">
              <h6 className="alert-heading mb-2 fw-bold">Connection Error</h6>
              <p className="mb-2">{error}</p>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-outline-danger" 
                  onClick={() => {
                    setError(null);
                    fetchAllData();
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Try Again
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={() => setError(null)}
                >
                  <i className="bi bi-x-lg me-1"></i> Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        {/* HEADER SECTION */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-2" style={{ fontSize: "0.8rem" }}>
                <li className="breadcrumb-item"><a href="#" className="text-decoration-none text-muted">Admin Panel</a></li>
                <li className="breadcrumb-item active fw-medium" aria-current="page" style={{ color: BRAND }}>Room Management</li>
              </ol>
            </nav>
            <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.5px", fontSize: "1.75rem" }}>
              Room Management
            </h2>
            <div className="d-flex align-items-center gap-2 mb-1">
              <p className="text-muted mb-0 small">Monitor room status, equipment and maintenance incidents.</p>
              <span className={`badge rounded-pill px-2 py-1 ${wsConnected ? 'bg-success' : 'bg-secondary'} bg-opacity-75`} style={{ fontSize: "0.7rem" }}>
                <i className={`bi ${wsConnected ? 'bi-wifi' : 'bi-wifi-off'} me-1`}></i>
                {wsConnected ? 'Live Updates' : 'No Connection'}
              </span>
              <button 
                className={`btn btn-sm px-2 py-1 border-0 ${audioEnabled ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: "0.7rem", borderRadius: "6px" }}
                onClick={toggleAudioNotifications}
                title={audioEnabled ? 'Mute notifications' : 'Enable sound notifications'}
              >
                <i className={`bi ${audioEnabled ? 'bi-volume-up' : 'bi-volume-mute'} me-1`}></i>
                {audioEnabled ? 'Sound On' : 'Sound Off'}
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="mt-2">
                <small className="text-muted">Recent updates:</small>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {notifications.slice(0, 3).map((notification, index) => (
                    <div key={notification.id} 
                         className={`badge rounded-pill px-2 py-1 notification-slide-in ${
                           notification.type === 'incident' ? 'bg-warning' : 'bg-info'
                         } bg-opacity-75`}
                         style={{ 
                           fontSize: "0.65rem", 
                           cursor: "pointer",
                           animationDelay: `${index * 0.1}s`
                         }}
                         title={notification.message}>
                      <i className={`bi ${notification.type === 'incident' ? 'bi-exclamation-triangle' : 'bi-tools'} me-1`}></i>
                      Room {notification.roomId}
                    </div>
                  ))}
                  {notifications.length > 3 && (
                    <span className="badge bg-secondary bg-opacity-75 rounded-pill px-2 py-1" style={{ fontSize: "0.65rem" }}>
                      +{notifications.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2"
              style={{ backgroundColor: BRAND, borderRadius: "6px", fontWeight: "500", fontSize: "0.9rem" }}
            >
              <i className="bi bi-plus-lg"></i> Add Room
            </button>
          </div>
        </div>

        {/* QUICK STATS - REFACTORED */}
        <div className="row g-3 mb-4 filter-fade-in">
          {[
            { key: "total", label: "Total Rooms", value: statistics.totalRooms, icon: "bi-building", color: "#6c757d" },
            { key: "available", label: "Available", value: statistics.availableRooms, icon: "bi-check-circle-fill", color: "#198754" },
            { key: "occupied", label: "Occupied", value: statistics.occupiedRooms, icon: "bi-person-fill-check", color: "#0d6efd" },
            { key: "maintenance", label: "Maintenance", value: statistics.maintenanceRooms, icon: "bi-hammer", color: "#dc3545" },
            { key: "broken", label: "Broken Items", value: statistics.brokenEquipment, icon: "bi-exclamation-octagon-fill", color: "#fd7e14" }
          ].map((stat, idx) => (
            <div key={idx} className="col-6 col-md-4 col-lg">
              <div className="card border-0 shadow-sm h-100 overflow-hidden stat-card" 
                   style={{ borderRadius: "10px", borderBottom: `3px solid ${stat.color}` }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="text-truncate">
                      <div className="text-muted fw-bold text-uppercase mb-1 text-truncate" style={{ letterSpacing: "0.5px", fontSize: "0.65rem" }}>{stat.label}</div>
                      <h4 className="fw-bold mb-0 text-dark">
                        {loading ? (
                          <div className="d-flex align-items-center gap-2">
                            <div className="spinner-border spinner-border-sm text-muted" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <span className="text-muted small">Loading...</span>
                          </div>
                        ) : (
                          <span className="animate-count-up">{stat.value}</span>
                        )}
                      </h4>
                    </div>
                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                         style={{ backgroundColor: `${stat.color}12`, color: stat.color, width: "40px", height: "40px" }}>
                      <i className={`bi ${stat.icon} fs-5`}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS & SEARCH - PROFESSIONAL BAR */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-lg-4">
                <form onSubmit={handleSearch} className="position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input
                    type="text"
                    className="form-control ps-5 py-2 border-0 bg-light-subtle"
                    placeholder="Search room by name or code..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    style={{ borderRadius: "8px", border: "1px solid #e1e5e9" }}
                    aria-label="Search rooms by name or ID"
                    autoComplete="off"
                  />
                  {inputVal && (
                    <button
                      type="button"
                      className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-1"
                      onClick={() => { setInputVal(''); setSearch(''); }}
                      title="Clear search"
                      aria-label="Clear search input"
                    >
                      <i className="bi bi-x-circle text-muted" style={{fontSize: '1.1rem'}}></i>
                    </button>
                  )}
                </form>
              </div>
              <div className="col-lg-8">
                <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                  <select 
                    className="form-select border-0 bg-light-subtle w-auto"
                    style={{ borderRadius: "8px", border: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                  >
                    <option value="">All branches</option>
                    {branches.map((b, index) => (
                      <option key={`${b.branchId || b.id}-${index}`} value={b.branchId || b.id}>
                        {b.branchName || b.name}
                      </option>
                    ))}
                  </select>

                  <select 
                    className="form-select border-0 bg-light-subtle w-auto"
                    style={{ borderRadius: "8px", border: "1px solid #e1e5e9", fontSize: "0.9rem" }}
                    value={floorFilter}
                    onChange={(e) => setFloorFilter(e.target.value)}
                  >
                    <option value="">All floors</option>
                    {floors.map((f, index) => (
                      <option key={`floor-${f.floor}-${index}`} value={String(f.floor)}>
                        Floor {f.floor}
                      </option>
                    ))}
                  </select>

                  <select 
                    className="form-select border-0 bg-light-subtle w-auto"
                    style={{ borderRadius: "8px", border: "1px solid #e1e5e9", fontSize: "0.9rem" }}
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                  >
                    <option value="">All types</option>
                    {availableRoomTypes.map((t, index) => {
                      console.log('🔍 Room Type Option:', t); // DEBUG
                      return (
                        <option key={`${t.type || t.name || t.id}-${index}`} value={t.type || t.name || t.id}>
                          {t.label || t.name || t.type}
                        </option>
                      );
                    })}
                  </select>

                  <div className="btn-group shadow-sm ms-lg-2" style={{ borderRadius: "10px", overflow: "hidden" }}>
                    <button 
                      className={`btn btn-sm px-3 ${viewMode === "grid" ? "btn-dark" : "btn-light"}`}
                      onClick={() => setViewMode("grid")}
                      title="Grid View"
                    >
                      <i className="bi bi-grid-fill"></i>
                    </button>
                    <button 
                      className={`btn btn-sm px-3 ${viewMode === "list" ? "btn-dark" : "btn-light"}`}
                      onClick={() => setViewMode("list")}
                      title="List View"
                    >
                      <i className="bi bi-list-task"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Audio Test Panel - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <AudioTestPanel />
        )}

        {/* LOADING & ERROR - MODERN OVERLAY */}
        {loading && page === 0 && (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-grow text-primary mb-3" style={{ color: BRAND }} role="status">
              <span className="visually-hidden">Loading rooms...</span>
            </div>
            <h6 className="text-muted fw-medium">Syncing Room Data...</h6>
            <p className="text-muted small mb-0">This may take a few seconds</p>
          </div>
        )}

        {/* ROOM CARDS GRID - PREMIUM DESIGN */}
        {!loading && (
          <>
            {sortedRooms.length === 0 ? (
              <div className="text-center py-5 bg-white shadow-sm rounded-4">
                <i className="bi bi-inbox text-muted display-1 mb-3"></i>
                <h4 className="text-muted">No rooms found</h4>
                <p className="text-muted small mb-3">Try adjusting search keywords or filters</p>
                <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                  <button 
                    className="btn btn-outline-primary btn-sm" 
                    onClick={() => { setSearch(''); setInputVal(''); setBranchFilter(''); setFloorFilter(''); setRoomTypeFilter(''); setEquipmentBrokenFilter(''); setPage(0); }}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Clear filters
                  </button>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => window.location.reload()}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i> Refresh
                  </button>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                {sortedRooms.map((room, index) => (
                  <div key={room.roomId || room.id || `room-${index}`} className="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div className="card border-0 shadow-sm h-100 room-card position-relative" 
                         style={{ borderRadius: "20px", overflow: "hidden", transition: "all 0.3s ease" }}>
                      
                      {/* Status Indicator Bar */}
                      <div style={{ height: "6px", backgroundColor: getStatusColor(room.status) }}></div>
                      
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="badge bg-light text-muted smallest text-uppercase mb-1" style={{ letterSpacing: "1px" }}>
                              {room.roomTypeName || "Standard"}
                            </span>
                            <h4 className="fw-bold mb-0" style={{ color: "#1a1a2e" }}>{room.roomName}</h4>
                          </div>
                          <span
                            className="badge px-3 py-2 rounded-pill shadow-sm"
                            style={{
                              backgroundColor: `${getStatusColor(room.status)}`,
                              color: "#fff",
                              fontSize: "0.7rem",
                              fontWeight: "700"
                            }}
                          >
                            {getStatusText(room.status)}
                          </span>
                        </div>

                        <div className="d-flex align-items-center text-muted smallest mb-4">
                          <i className="bi bi-layers-fill me-1"></i> Floor {room.floor}
                          <span className="mx-2">•</span>
                          <i className="bi bi-geo-alt-fill me-1"></i> {room.branchName || room.branch?.branchName || room.branch?.name || "Central Branch"}
                        </div>

                        {/* Visual Metrics */}
                        <div className="bg-light rounded-4 p-3 mb-4">
                          <div className="row g-0 align-items-center">
                            <div className="col-4 border-end border-white text-center">
                              <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Equip</div>
                              <div className="fw-bold text-dark mt-1" style={{ fontSize: "1rem" }}>{room.totalEquipment || 0}</div>
                            </div>
                            <div className="col-4 border-end border-white text-center">
                              <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Broken</div>
                              <div className={`fw-bold mt-1 ${(room.equipmentBroken || 0) > 0 ? "text-danger" : "text-dark"}`} style={{ fontSize: "1rem" }}>
                                {room.equipmentBroken || 0}
                              </div>
                            </div>
                            <div className="col-4 text-center">
                              <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Issues</div>
                              <div className={`fw-bold mt-1 ${(room.totalIssues || 0) > 0 ? "text-danger" : "text-dark"}`} style={{ fontSize: "1rem" }}>
                                {room.totalIssues || 0}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-grid">
                          <button
                            className="btn btn-outline-dark py-2 fw-normal d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleViewRoom(room)}
                            style={{ borderRadius: "8px", fontSize: "0.85rem", borderColor: "#6c757d" }}
                            aria-label={`Manage details for ${room.roomName || 'room'}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleViewRoom(room);
                              }
                            }}
                          >
                            <i className="bi bi-gear" aria-hidden="true"></i> Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>

          {/* FILTERS & SEARCH - PROFESSIONAL BAR */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px" }}>
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                <div className="col-lg-4">
                  <form onSubmit={handleSearch} className="position-relative">
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input
                        type="text"
                        className="form-control ps-5 py-2 border-0 bg-light-subtle"
                        placeholder="Search by Room Name or ID..."
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0" }}
                    />
                  </form>
                </div>
                <div className="col-lg-8">
                  <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                    <select
                        className="form-select border-0 bg-light-subtle w-auto"
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                    >
                      <option value="">All Branches</option>
                      {branches.map((b, index) => (
                          <option key={`${b.branchId || b.id}-${index}`} value={b.branchId || b.id}>
                            {b.branchName || b.name}
                          </option>
                      ))}
                    </select>

                    <select
                        className="form-select border-0 bg-light-subtle w-auto"
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                        value={floorFilter}
                        onChange={(e) => setFloorFilter(e.target.value)}
                    >
                      <option value="">All Floors</option>
                      {floors.map((f, index) => (
                          <option key={`floor-${f.floor}-${index}`} value={String(f.floor)}>
                            Floor {f.floor}
                          </option>
                      ))}
                    </select>

                    <select
                        className="form-select border-0 bg-light-subtle w-auto"
                        style={{ borderRadius: "10px", border: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                        value={roomTypeFilter}
                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {roomTypes.map((t, index) => (
                          <option key={`${t.type}-${index}`} value={t.type}>
                            {t.label}
                          </option>
                      ))}
                    </select>

                    <div className="btn-group shadow-sm ms-lg-2" style={{ borderRadius: "10px", overflow: "hidden" }}>
                      <button
                          className={`btn btn-sm px-3 ${viewMode === "grid" ? "btn-dark" : "btn-light"}`}
                          onClick={() => setViewMode("grid")}
                          title="Grid View"
                      >
                        <i className="bi bi-grid-fill"></i>
                      </button>
                      <button
                          className={`btn btn-sm px-3 ${viewMode === "list" ? "btn-dark" : "btn-light"}`}
                          onClick={() => setViewMode("list")}
                          title="List View"
                      >
                        <i className="bi bi-list-task"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LOADING & ERROR - MODERN OVERLAY */}
          {loading && page === 0 && (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <div className="spinner-grow text-primary mb-3" style={{ color: BRAND }} role="status"></div>
                <h6 className="text-muted fw-medium">Syncing Room Data...</h6>
              </div>
          )}

          {/* ROOM CARDS GRID - PREMIUM DESIGN */}
          {!loading && (
              <>
                {sortedRooms.length === 0 ? (
                    <div className="text-center py-5 bg-white shadow-sm rounded-4">
                      <i className="bi bi-inbox text-muted display-1 mb-3"></i>
                      <h4 className="text-muted">No rooms found matching your criteria</h4>
                      <button className="btn btn-link link-primary" onClick={() => { setSearch(''); setBranchFilter(''); setPage(0); }}>Clear All Filters</button>
                    </div>
                ) : (
                    <div className="row g-4">
                      {sortedRooms.map((room, index) => (
                          <div key={room.roomId || room.id || `room-${index}`} className="col-12 col-md-6 col-lg-4 col-xl-3">
                            <div className="card border-0 shadow-sm h-100 room-card position-relative"
                                 style={{ borderRadius: "20px", overflow: "hidden", transition: "all 0.3s ease" }}>

                              {/* Status Indicator Bar */}
                              <div style={{ height: "6px", backgroundColor: getStatusColor(room.status) }}></div>

                              <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                            <span className="badge bg-light text-muted smallest text-uppercase mb-1" style={{ letterSpacing: "1px" }}>
                              {room.roomTypeName || "Standard"}
                            </span>
                                    <h4 className="fw-bold mb-0" style={{ color: "#1a1a2e" }}>{room.roomName}</h4>
                                  </div>
                                  <span
                                      className="badge px-3 py-2 rounded-pill shadow-sm"
                                      style={{
                                        backgroundColor: `${getStatusColor(room.status)}`,
                                        color: "#fff",
                                        fontSize: "0.7rem",
                                        fontWeight: "700"
                                      }}
                                  >
                            {getStatusText(room.status)}
                          </span>
                                </div>

                                <div className="d-flex align-items-center text-muted smallest mb-4">
                                  <i className="bi bi-layers-fill me-1"></i> Floor {room.floor}
                                  <span className="mx-2">•</span>
                                  <i className="bi bi-geo-alt-fill me-1"></i> {room.branchName || room.branch?.branchName || room.branch?.name || "Central Branch"}
                                </div>

                                {/* Visual Metrics */}
                                <div className="bg-light rounded-4 p-3 mb-4">
                                  <div className="row g-0 align-items-center">
                                    <div className="col-4 border-end border-white text-center">
                                      <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Equip</div>
                                      <div className="fw-bold text-dark mt-1" style={{ fontSize: "1rem" }}>{room.totalEquipment || 0}</div>
                                    </div>
                                    <div className="col-4 border-end border-white text-center">
                                      <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Broken</div>
                                      <div className={`fw-bold mt-1 ${(room.equipmentBroken || 0) > 0 ? "text-danger" : "text-dark"}`} style={{ fontSize: "1rem" }}>
                                        {room.equipmentBroken || 0}
                                      </div>
                                    </div>
                                    <div className="col-4 text-center">
                                      <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", fontWeight: "600", letterSpacing: "0.5px" }}>Issues</div>
                                      <div className={`fw-bold mt-1 ${(room.totalIssues || 0) > 0 ? "text-danger" : "text-dark"}`} style={{ fontSize: "1rem" }}>
                                        {room.totalIssues || 0}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="d-grid">
                                  <button
                                      className="btn btn-dark shadow-sm py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                      onClick={() => handleViewRoom(room)}
                                      style={{ borderRadius: "12px", fontSize: "0.85rem", letterSpacing: "0.5px" }}
                                  >
                                    <i className="bi bi-sliders"></i> Manage Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                )}

                {/* FOOTER & PAGINATION */}
                {sortedRooms.length > 0 && (
                    <div className="d-flex flex-column align-items-center mt-5 mb-5">
                      <p className="text-muted small">
                        Showing <strong>{sortedRooms.length}</strong> of <strong>{totalElements}</strong> rooms
                      </p>
                      {renderPagination()}
                    </div>
                )}
              </>
          )}
        </div>

        {/* MODALS */}
        {showDetailModal && selectedRoom && (
            <RoomDetailModal
                show={showDetailModal}
                room={selectedRoom}
                onHide={() => {
                  setShowDetailModal(false);
                  setSelectedRoom(null);
                }}
                onReportIssue={(room) => {
                  setShowDetailModal(false);
                  handleReportIssue(room);
                }}
                onRoomUpdated={() => {
                  fetchAllData();
                }}
            />
        )}

      {/* MODALS */}
      {showDetailModal && selectedRoom && (
        <RoomDetailModal
          show={showDetailModal}
          room={selectedRoom}
          onHide={() => {
            setShowDetailModal(false);
            setSelectedRoom(null);
          }}
          onReportIssue={(room) => {
            setShowDetailModal(false);
            handleReportIssue(room);
          }}
          onRoomUpdated={() => {
            fetchAllData();
          }}
        />
      )}

      {showReportModal && selectedRoom && (
        <ReportIssueModal
          show={showReportModal}
          room={selectedRoom}
          onHide={() => {
            setShowReportModal(false);
            // Go back to detail modal instead of closing everything
            setShowDetailModal(true);
          }}
          onSuccess={() => {
            setShowReportModal(false);
            // After successful report, go back to room detail modal
            setShowDetailModal(true);
            fetchAllData();
          }}
        />
      )}
    </AdminLayout>
  );
}

export default RoomManagement;
