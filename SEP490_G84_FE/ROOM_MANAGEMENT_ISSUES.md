# Room Management - Issues & Bugs Found

## Priority: HIGH

### 1. ❌ List View Toggle Non-Functional
**Severity**: High  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~60, ~800)  
**Issue**: 
- State `viewMode` is defined but never used in JSX
- View toggle buttons (Grid/List) exist but clicking doesn't change view
- Grid view hardcoded in render (always shows)

**Code**:
```javascript
const [viewMode, setViewMode] = useState("grid"); // Defined but unused

// Later in JSX (~800):
<button onClick={() => setViewMode("grid")}>Grid</button>  // Changes state
<button onClick={() => setViewMode("list")}>List</button>

// But rendering is always:
<div className="row g-4">  // Always grid, never checks viewMode
  {sortedRooms.map(...)}  // No conditional based on viewMode
</div>
```

**Fix**:
```javascript
{viewMode === 'grid' ? (
  <div className="row g-4">
    {sortedRooms.map(room => <RoomCard key={room.roomId} room={room} />)}
  </div>
) : (
  <RoomList rooms={sortedRooms} onRefresh={fetchAllData} />
)}
```

**Impact**: Users expect list view but it doesn't work, confusing UI

---

### 2. ❌ RoomList Component Never Imported
**Severity**: High  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (top imports)  
**Issue**:
- Component exists at `./components/RoomList.jsx`
- Never imported in main component
- Will cause error if viewMode conditional is added: "RoomList is not defined"

**Current imports**:
```javascript
import RoomDetailModal from "../components/RoomDetailModal";
import ReportIssueModal from "../components/ReportIssueModal";
// RoomList NOT imported
```

**Fix**:
```javascript
import RoomList from "../components/RoomList";
import RoomDetailModal from "../components/RoomDetailModal";
import ReportIssueModal from "../components/ReportIssueModal";
```

---

### 3. ⚠️ Equipment Broken Filter UI Missing
**Severity**: Medium  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~50, ~475)  
**Issue**:
- State exists: `const [equipmentBrokenFilter, setEquipmentBrokenFilter]`
- Filter logic works: Checks `room.equipmentBroken > 0`
- **BUT**: No UI dropdown to select this filter (users can't use it)

**Current code (works)**:
```javascript
const filteredRooms = rooms.filter(room => {
  if (equipmentBrokenFilter === "true") match = match && (room.equipmentBroken > 0);
  if (equipmentBrokenFilter === "false") match = match && (room.equipmentBroken === 0);
  return match;
});
```

**Missing UI** (should be in filters section ~800):
```javascript
{/* This dropdown is missing: */}
<div className="filter-item">
  <label><i className="bi bi-tools me-1"></i>Equipment Status</label>
  <select 
    value={equipmentBrokenFilter}
    onChange={(e) => setEquipmentBrokenFilter(e.target.value)}
  >
    <option value="">All</option>
    <option value="true">Has Broken Items</option>
    <option value="false">No Broken Items</option>
  </select>
</div>
```

**Impact**: Feature exists but users can't access it

---

### 4. ⚠️ Sort By UI Missing
**Severity**: Medium  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~59, ~485)  
**Issue**:
- State: `const [sortBy, setSortBy] = useState("name")`
- Sorting logic works (lines ~485-494):
  ```javascript
  switch(sortBy) {
    case "name": return (a.roomName || "").localeCompare(b.roomName || "");
    case "floor": return (a.floor || 0) - (b.floor || 0);
    case "type": return (a.roomType || "").localeCompare(b.roomType || "");
  }
  ```
- **BUT**: No UI control to change it (always sorts by name)

**Missing UI** (should be in filters section):
```javascript
{/* Missing sort dropdown */}
<div className="filter-item">
  <label><i className="bi bi-sort-down me-1"></i>Sort By</label>
  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
    <option value="name">Room Name</option>
    <option value="floor">Floor</option>
    <option value="type">Type</option>
  </select>
</div>
```

**Impact**: Can't sort by floor or type, only hardcoded name sorting

---

## Priority: MEDIUM

### 5. ⚠️ Global Window Object Used for WebSocket Cleanup
**Severity**: Medium  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~445)  
**Issue**:
```javascript
window.wsCleanup = cleanupFn;  // Anti-pattern: global state
```

**Problem**: 
- Pollutes global namespace
- Can cause conflicts with other code
- Not guaranteed to clean up if component unmounts quickly
- Hard to test

**Better approach**:
```javascript
const wsCleanupRef = useRef(null);

useEffect(() => {
  const connectWebSocket = async () => {
    const cleanupFn = () => { /* ... */ };
    wsCleanupRef.current = cleanupFn;  // Use useRef instead
    // ...
  };

  return () => {
    if (wsCleanupRef.current) wsCleanupRef.current();
    webSocketService.disconnect();
  };
}, []);
```

---

### 6. ⚠️ API Error Messages Shown in Console, Not User-Friendly
**Severity**: Medium  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~100-200)  
**Issue**:
```javascript
console.warn("Rooms API not available:", err.response?.status);
console.warn("Statistics API not available:", err.response?.status);
console.warn("Floors API not available:", err.response?.status);
```

**Problem**:
- Error shown in console, not visible to users
- Generic message "Backend APIs chưa sẵn sàng"
- No clear guidance what to do

**Better**:
```javascript
// Show specific error to user
const handleApiError = (context, error) => {
  const status = error.response?.status;
  let message = "Lỗi tải dữ liệu";
  
  if (status === 403) message = "Bạn không có quyền truy cập";
  else if (status === 404) message = "Dữ liệu không tìm thấy";
  else if (status === 500) message = "Lỗi máy chủ, vui lòng thử lại sau";
  
  setError({ context, message });
};
```

---

### 7. ⚠️ Modal Stays Open During Data Refresh
**Severity**: Medium  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~520)  
**Issue**:
```javascript
const handleMarkCleaning = async (room) => {
  await roomManagementApi.updateRoomStatus(room.roomId, 'CLEANING');
  // ... show notification
  await fetchAllData();  // Data refreshes but modal might still show old data
};
```

**Problem**:
- If modal is open showing room details
- User clicks "Mark as Cleaning"
- Data refreshes but modal still open
- Modal might show stale room status
- Jarring UX

**Better**:
- Auto-close modal on success: `setShowDetailModal(false)`
- Or: Pass refresh callback to modal to update its internal state
- Or: Show loading spinner in modal during update

---

### 8. ⚠️ Breadcrumb Navigation Non-Functional
**Severity**: Low  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~605)  
**Issue**:
```javascript
<a href="#" className="text-decoration-none text-muted">Admin Panel</a>
```

**Problem**:
- `href="#"` doesn't navigate anywhere
- Breadcrumb is just decorative, not functional

**Fix**:
```javascript
<a href="/admin" className="text-decoration-none text-muted">Admin Panel</a>
// Or use routing:
<Link to="/admin" className="text-decoration-none text-muted">Admin Panel</Link>
```

---

## Priority: LOW

### 9. ℹ️ Unused State Variables Create Confusion
**Severity**: Low  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~50-80)  
**Issue**:
```javascript
const [equipmentBrokenFilter, setEquipmentBrokenFilter] = useState(""); // Unused by UI
const [sortBy, setSortBy] = useState("name"); // Unused by UI
const [inputVal, setInputVal] = useState(""); // This is fine - search input
```

**Problem**:
- Developers see these states and think features work
- Code is confusing for new developers
- Dead code smell

**Fix**: 
- Either implement UI controls for these
- Or remove the unused states and just use inline default values

---

### 10. ⚠️ Page Size Mismatch
**Severity**: Low  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~98, ~250)  
**Issue**:
```javascript
const pageSize = 20;  // Line 98

// But in pagination fetch, uses 12:
const data = await roomManagementApi.listRooms(search, "", page, 12, branchFilter);
```

**Problem**: 
- Says page size is 20 but uses 12
- Grid shows 12 cards per page: `col-lg-4` = 3 columns, so ~3-4 rows = 12 items
- Inconsistency

**Fix**: Make consistent:
```javascript
const pageSize = 12;  // Match actual usage
```

---

### 11. ℹ️ Statistics Update Interval
**Severity**: Low  
**File**: [RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx) (~230)  
**Issue**:
```javascript
const interval = setInterval(() => {
  fetchStatistics(branchFilter);
}, 30000);  // 30 seconds
```

**Consideration**: 
- 30 seconds may be too frequent (network usage)
- Or could be too slow for real-time use
- No config option to adjust

**Suggestion**: 
- Make configurable: `const STATS_REFRESH_INTERVAL = 30000`
- Consider WebSocket stats instead of polling

---

### 12. ℹ️ RoomList Component May Have Duplicate Admin Modal
**Severity**: Low  
**File**: [RoomList.jsx](../../src/features/roomManagement/components/RoomList.jsx)  
**Issue**:
```javascript
import AdminRoomDetailModal from "./AdminRoomDetailModal";
```

**Context**: 
- RoomList.jsx is not used in main component
- It imports AdminRoomDetailModal but never renders it
- Main component uses RoomDetailModal instead

**Concern**: If RoomList ever gets integrated, might show the wrong modal

---

## Summary by Category

### UI/UX Issues (3)
1. List view toggle broken
2. Equipment filter UI missing
3. Sort UI missing

### Code Quality Issues (4)
4. Global window object usage
5. API errors only in console
6. Modal stale data on refresh
7. Unused state variables

### Navigation Issues (1)
8. Non-functional breadcrumb

### Data Issues (2)
9. Page size inconsistency
10. Stats refresh timing

### Integration Issues (2)
11. RoomList component not imported
12. RoomList has unused modal import

---

## Quick Fix Priority

### MUST FIX (Blocks functionality)
- [ ] List view toggle not working (Issues #1, #2)
- [ ] Equipment filter UI missing (Issue #3)
- [ ] Sort UI missing (Issue #4)

### SHOULD FIX (Improves quality)
- [ ] Remove global window usage (Issue #5)
- [ ] Show user-friendly error messages (Issue #6)
- [ ] Auto-close modal on success (Issue #7)
- [ ] Fix breadcrumb navigation (Issue #8)

### NICE TO FIX (Polish)
- [ ] Clean up unused state (Issue #9)
- [ ] Fix page size inconsistency (Issue #10)
- [ ] Make stats interval configurable (Issue #11)
- [ ] Clean up RoomList imports (Issue #12)

