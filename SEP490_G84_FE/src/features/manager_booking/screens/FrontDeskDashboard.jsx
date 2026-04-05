import React, { useState, useEffect, useMemo } from 'react';
import BookingTable from '../component/BookingTable';
import CheckInModal from '../component/CheckInModal';
import BookingDetailModal from '../component/BookingDetailModal';
import CheckoutModal from '../component/CheckoutModal';
import { checkInApi } from '../api/checkInApi';
import { useSelector } from 'react-redux';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(d) {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Pivot date: arrival for check-in mode, departure for checkout/inhouse
function pivotDate(booking, mode) {
  return parseDate(mode === 'checkin' ? booking.checkIn : booking.checkOut);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FrontDeskDashboard() {
  const [mode, setMode] = useState('checkin'); // 'checkin' | 'checkout' | 'inhouse'
  const [timeFilter, setTimeFilter] = useState('today');
  const [cardFilter, setCardFilter] = useState(null);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const authUser = useSelector((state) => state.auth.user);
  const currentBranchId = authUser?.branchId || Number(localStorage.getItem('branchId')) || 1;

  // ── Load branches ──────────────────────────────────────────────────────────
  useEffect(() => {
    checkInApi.getMyBranches()
      .then(data => {
        setBranches(data || []);
        const def = (data || []).find(b => b.branchId === currentBranchId) || (data || [])[0];
        setSelectedBranch(def ? def.branchId : currentBranchId);
      })
      .catch(() => setSelectedBranch(currentBranchId));
  }, [currentBranchId]);

  // ── Fetch bookings ────────────────────────────────────────────────────────
  const fetchBookings = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      // checkin  → fetch all active, filter CONFIRMED + ARRIVED client-side
      // checkout → fetch CHECKED_IN only
      // inhouse  → fetch CHECKED_IN only (same data as checkout, different UI/context)
      const statusParam = (mode === 'checkout' || mode === 'inhouse') ? 'CHECKED_IN' : '';
      const raw = await checkInApi.getDashboardBookings(selectedBranch, statusParam);

      const data = mode === 'checkin'
        ? raw.filter(b => b.status === 'CONFIRMED' || b.status === 'ARRIVED')
        : raw; // checkout + inhouse: all CHECKED_IN

      setBookings(data);
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = async () => {
    if (!selectedBranch) return;
    setStatsLoading(true);
    try {
      const data = await checkInApi.getDashboardStats(selectedBranch);
      setStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const refreshAll = () => { fetchBookings(); fetchStats(); };

  useEffect(() => {
    if (selectedBranch) {
      fetchBookings();
      fetchStats();
      setCardFilter(null);
      // In-House mode: hiện hết tất cả khách đang ở, không lọc theo ngày departure
      // Check-in/out: về Today vì quan tâm đến ngày đến/đi hôm nay
      setTimeFilter(mode === 'inhouse' ? 'all' : 'today');
    }
  }, [mode, selectedBranch]);


  // ── Time-tab filter ────────────────────────────────────────────────────────
  const filteredByTime = useMemo(() => {
    const t = today();
    return bookings.filter(b => {
      const d = pivotDate(b, mode);
      if (!d) return timeFilter === 'all';
      if (timeFilter === 'today') return d <= t;
      if (timeFilter === 'week') {
        const sw = startOfWeek(t);
        return d >= sw && d <= new Date(sw.getTime() + 6 * 86400000);
      }
      if (timeFilter === 'month') return d >= startOfMonth(t) && d <= endOfMonth(t);
      return true;
    });
  }, [bookings, timeFilter, mode]);

  const countForTab = useMemo(() => {
    const t = today();
    const count = (filter) => bookings.filter(b => {
      const d = pivotDate(b, mode);
      if (!d) return filter === 'all';
      if (filter === 'today') return d <= t;
      if (filter === 'week') {
        const sw = startOfWeek(t);
        return d >= sw && d <= new Date(sw.getTime() + 6 * 86400000);
      }
      if (filter === 'month') return d >= startOfMonth(t) && d <= endOfMonth(t);
      return true;
    }).length;
    return { today: count('today'), week: count('week'), month: count('month'), all: count('all') };
  }, [bookings, mode]);

  // ── Card filter ────────────────────────────────────────────────────────────
  const displayBookings = useMemo(() => {
    if (!cardFilter) return filteredByTime;
    const t = today();
    return filteredByTime.filter(b => {
      const d = pivotDate(b, mode);
      if (!d) return false;
      const diff = Math.round((d - t) / 86400000);
      if (cardFilter === 'overdue') return diff < 0;
      if (cardFilter === 'today_action') return diff === 0;
      if (cardFilter === 'upcoming') return diff > 0;
      return true;
    });
  }, [filteredByTime, cardFilter, mode]);

  const toggleCardFilter = (key) => setCardFilter(prev => prev === key ? null : key);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const handleOpenCheckIn = (b) => { setSelectedBooking(b); setShowModal(true); };
  const handleOpenDetails = (b) => { setSelectedBooking(b); setShowDetailsModal(true); };
  const handleOpenCheckout = (b) => { setSelectedBooking(b); setShowCheckoutModal(true); };

  // ── Theme ─────────────────────────────────────────────────────────────────
  const isCheckin = mode === 'checkin';
  const isInhouse = mode === 'inhouse';
  const accent = isCheckin ? '#2e7d32' : isInhouse ? '#1565c0' : '#c62828';

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const s = stats || {};

  const statCards = isInhouse
    ? [
      { key: null, label: 'Currently In-House', value: s.totalCheckout ?? '–', sub: 'guests staying now' },
      { key: null, label: 'Checkout Today', value: s.todayCheckout ?? '–', sub: 'due for check-out today' },
      { key: null, label: 'Overdue Check-out', value: s.overdueCheckout ?? '–', sub: 'need immediate action' },
      { key: null, label: 'Upcoming Departures', value: s.upcomingCheckout ?? '–', sub: 'future check-outs' },
    ]
    : [
      { key: 'overdue', label: isCheckin ? 'Overdue Check-in' : 'Overdue Check-out', value: isCheckin ? (s.overdueCheckin ?? '–') : (s.overdueCheckout ?? '–'), sub: 'need immediate action' },
      { key: 'today_action', label: isCheckin ? 'Check-in Today' : 'Check-out Today', value: isCheckin ? (s.todayCheckin ?? '–') : (s.todayCheckout ?? '–'), sub: 'arrivals / departures' },
      { key: null, label: 'Checkout Today', value: s.todayCheckout ?? '–', sub: 'due for check-out today' },
      { key: null, label: 'Currently In-House', value: s.totalCheckout ?? '–', sub: 'guests staying now' },
      { key: 'upcoming', label: isCheckin ? 'Upcoming Arrivals' : 'Upcoming Departures', value: isCheckin ? (s.upcomingCheckin ?? '–') : (s.upcomingCheckout ?? '–'), sub: 'future bookings' },
      { key: null, label: isCheckin ? 'Total Check-ins' : 'Total Check-outs', value: isCheckin ? (s.totalCheckin ?? '–') : (s.totalCheckout ?? '–'), sub: 'all statuses' },
    ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-0" style={{ background: '#f4f6f9', minHeight: '100vh' }}>

      {/* Scoped styles */}
      <style>{`
        .fd-toggle-btn {
          padding: 9px 24px;
          font-weight: 700;
          font-size: 0.88rem;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: #666;
        }
        .fd-toggle-btn.active-checkin  { background:#e8f5e9; border-color:#2e7d32; color:#2e7d32; }
        .fd-toggle-btn.active-checkout { background:#ffebee; border-color:#c62828; color:#c62828; }
        .fd-toggle-btn.active-inhouse  { background:#e3f2fd; border-color:#1565c0; color:#1565c0; }
        .fd-toggle-btn:not(.active-checkin):not(.active-checkout):not(.active-inhouse):hover {
          background:#f0f0f0; color:#333;
        }
        .fd-time-tab {
          padding: 8px 18px;
          border: none;
          border-bottom: 3px solid transparent;
          background: transparent;
          font-weight: 600;
          font-size: 0.85rem;
          color: #888;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fd-time-tab.active      { border-bottom-color: var(--fd-accent); color: var(--fd-accent); }
        .fd-time-tab:hover:not(.active) { color:#444; background:#f0f0f0; }
        .fd-stat-card {
          background: #fff;
          border-radius: 12px;
          border: 2px solid transparent;
          padding: 16px 18px;
          transition: all 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
          user-select: none;
        }
        .fd-stat-card.clickable { cursor: pointer; }
        .fd-stat-card.clickable:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.13); transform: translateY(-2px); }
        .fd-stat-card.selected  { border-color: var(--fd-accent) !important; }
        .fd-stat-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #999; letter-spacing: .05em; }
        .fd-stat-num   { font-size: 2rem; font-weight: 800; line-height: 1.1; color: #222; }
        .fd-stat-sub   { font-size: 0.75rem; color: #aaa; margin-top: 2px; }
        .fd-section    { background: #fff; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
      `}</style>

      {/* ── Header / mode toggle ── */}
      <div className="fd-section mb-3 px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-3"
        style={{ '--fd-accent': accent }}>

        <div className="d-flex align-items-center gap-4">
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
              <i className="bi bi-reception-4 me-2" style={{ color: accent }}></i>
              Front Desk
            </div>
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>Manage check-ins, check-outs &amp; in-house</div>
          </div>

          <div className="d-flex gap-2 p-1 rounded-3" style={{ background: '#f0f0f0' }}>
            <button id="btn-mode-checkin"
              className={`fd-toggle-btn ${mode === 'checkin' ? 'active-checkin' : ''}`}
              onClick={() => setMode('checkin')}>
              <i className="bi bi-box-arrow-in-right me-2"></i>Check-in
            </button>
            <button id="btn-mode-checkout"
              className={`fd-toggle-btn ${mode === 'checkout' ? 'active-checkout' : ''}`}
              onClick={() => setMode('checkout')}>
              <i className="bi bi-box-arrow-right me-2"></i>Check-out
            </button>
            <button id="btn-mode-inhouse"
              className={`fd-toggle-btn ${mode === 'inhouse' ? 'active-inhouse' : ''}`}
              onClick={() => setMode('inhouse')}>
              <i className="bi bi-house-door-fill me-2"></i>In-House
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {branches.length > 1 && (
            <select id="select-branch" className="form-select form-select-sm shadow-sm"
              style={{ minWidth: 160, borderColor: '#ddd' }}
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(Number(e.target.value))}>
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
              ))}
            </select>
          )}
          <button id="btn-refresh" className="btn btn-sm fw-bold px-3 shadow-sm"
            style={{ background: accent, color: '#fff', border: 'none' }}
            onClick={refreshAll}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
      </div>

      {/* ── Time-filter tabs ── */}
      <div className="fd-section mb-3 px-4" style={{ '--fd-accent': accent }}>
        <div className="d-flex border-bottom">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All' },
          ].map(({ key, label }) => (
            <button key={key} id={`tab-time-${key}`}
              className={`fd-time-tab ${timeFilter === key ? 'active' : ''}`}
              onClick={() => { setTimeFilter(key); setCardFilter(null); }}>
              {label}
              <span className="ms-2 badge rounded-pill"
                style={{
                  background: timeFilter === key ? accent : '#e0e0e0',
                  color: timeFilter === key ? '#fff' : '#555',
                  fontSize: '0.7rem',
                }}>
                {countForTab[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="row g-3 mb-3" style={{ '--fd-accent': accent }}>
        {statCards.map((card, idx) => (
          <div key={idx} className="col-6 col-md">
            <div
              id={card.key ? `card-stat-${card.key}` : `card-stat-info-${idx}`}
              className={`fd-stat-card h-100 ${card.key ? 'clickable' : ''} ${card.key && cardFilter === card.key ? 'selected' : ''}`}
              style={{ '--fd-accent': accent }}
              onClick={() => card.key && toggleCardFilter(card.key)}
            >
              <span className="fd-stat-label">{card.label}</span>
              <div className="fd-stat-num mt-2" style={{ color: statsLoading ? '#ccc' : '#222' }}>
                {statsLoading ? '…' : card.value}
              </div>
              <div className="fd-stat-sub">{card.sub}</div>
              {card.key && cardFilter === card.key && (
                <div className="mt-2" style={{ fontSize: '0.7rem', color: accent, fontWeight: 600 }}>
                  Filtering — click again to clear
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Booking table ── */}
      <div className="fd-section p-3">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border me-2" style={{ color: accent }} role="status"></div>
            Loading bookings…
          </div>
        ) : (
          <BookingTable
            bookings={displayBookings}
            mode={mode}
            emptyMessage={timeFilter === 'today' ? 'No bookings for today.' : 'No bookings found.'}
            onCheckInClick={handleOpenCheckIn}
            onDetailsClick={handleOpenDetails}
            onCheckoutClick={handleOpenCheckout}
            onRefresh={refreshAll}
            accent={accent}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <CheckInModal key={selectedBooking?.id} show={showModal}
          onClose={() => setShowModal(false)}
          booking={selectedBooking} branchId={selectedBranch}
          onSuccess={refreshAll} />
      )}
      {showDetailsModal && (
        <BookingDetailModal key={`details-${selectedBooking?.id}`} show={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          booking={selectedBooking} onRefresh={refreshAll} />
      )}
      {showCheckoutModal && (
        <CheckoutModal key={`checkout-${selectedBooking?.id}`} show={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          booking={selectedBooking} onSuccess={refreshAll} branchId={selectedBranch} />
      )}
    </div>
  );
}