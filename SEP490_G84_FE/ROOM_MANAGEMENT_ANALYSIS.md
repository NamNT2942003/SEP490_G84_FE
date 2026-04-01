# Room Management Page Component Analysis

## Overview
The Room Management system is a comprehensive admin interface for managing hotel room status, equipment, maintenance, and real-time updates.

---

## 1. FILE STRUCTURE & PATHS

### Main Components
```
SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/
├── screens/
│   ├── RoomManagement.jsx (Main page component)
│   ├── RoomManagement_backup.jsx
│   └── FurnitureManagement.jsx
├── components/
│   ├── RoomDetailModal.jsx (Equipment & issues modal)
│   ├── AdminRoomDetailModal.jsx (Advanced admin modal)
│   ├── RoomList.jsx (Table display component)
│   ├── RoomFurnitureTable.jsx (Equipment list table)
│   ├── ReportIssueModal.jsx (Report issue form)
│   ├── ReportIncidentModal.jsx (Incident management)
│   ├── ConfirmChangeModal.jsx
│   └── ReplaceFromInventoryModal.jsx
├── api/
│   └── roomManagementApi.js (API client wrapper)
└── css/
    └── RoomManagement.css (Bootstrap-only, minimal custom CSS)
```

### Key Import Files
- **Layout**: `MainLayout` (from `components/layout/MainLayout`)
- **Services**: 
  - `webSocketService` (real-time updates)
  - `apiClient` (HTTP requests)

---

## 2. MAIN COMPONENT: RoomManagement.jsx

### Purpose
Central admin dashboard for:
- Real-time room status monitoring
- Equipment health tracking
- Maintenance incident management
- Multi-branch filtering
- Live WebSocket notifications

### State Management
```javascript
// Room data
const [rooms, setRooms] = useState([]); // Current page rooms
const [page, setPage] = useState(0); // Pagination
const [totalPages, setTotalPages] = useState(0);
const [totalElements, setTotalElements] = useState(0);

// Filters
const [search, setSearch] = useState(""); // Room name/ID search
const [branchFilter, setBranchFilter] = useState("");
const [floorFilter, setFloorFilter] = useState("");
const [roomTypeFilter, setRoomTypeFilter] = useState("");
const [equipmentBrokenFilter, setEquipmentBrokenFilter] = useState("");

// UI Control
const [viewMode, setViewMode] = useState("grid"); // grid | list
const [sortBy, setSortBy] = useState("name");

// Data
const [statistics, setStatistics] = useState({ // 6 key metrics
  totalRooms, availableRooms, occupiedRooms, 
  cleaningRooms, maintenanceRooms, totalEquipment,
  brokenEquipment, totalIssues
});
const [floors, setFloors] = useState([]);
const [roomTypes, setRoomTypes] = useState([]);
const [branches, setBranches] = useState([]);

// Real-time
const [notification, setNotification] = useState(null);
const [wsConnected, setWsConnected] = useState(false);

// Modals
const [selectedRoom, setSelectedRoom] = useState(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [showReportModal, setShowReportModal] = useState(false);

// Status tracking
const [apiStatus, setApiStatus] = useState({
  rooms: 'unknown', statistics: 'unknown', 
  floors: 'unknown', types: 'unknown'
});
```

### Key Features

#### 1. **Statistics Display Component** (Cards)
- 6 stat cards showing:
  - Total Rooms
  - Available Rooms (Green #198754)
  - Occupied Rooms (Blue #0d6efd)
  - Cleaning (Orange #fd7e14)
  - Maintenance (Red #dc3545)
  - Broken Items (Yellow #ffc107)
- **Design**: Cards with colored left border, icon badge
- **Issue**: Loading spinner shows during initial data fetch
- **Auto-refresh**: Every 30 seconds for real-time updates

#### 2. **Filter Section**
- **Search Bar**: Room name or ID text input
- **Filters** (Dropdowns):
  - Branch (multi-branch support)
  - Floor (populated from `/rooms/floors` API)
  - Room Type (populated from `/rooms/types` API)
  - View Mode Toggle (Grid | List buttons)
- **Active Filter Tags**: Visual pills showing applied filters with quick clear
- **Clear All Button**: Resets all filters and search

#### 3. **Grid/Card View** (Primary Display)
- **Layout**: Responsive grid (1-4 columns based on screen size)
- **Card Components** per room:
  - Status color bar (top, 6px height)
  - Room type badge
  - Room name (bold heading)
  - Floor and branch info
  - Metrics panel:
    - Equipment count
    - Broken items count (red if > 0)
    - Issues count (red if > 0)
  - Action buttons:
    - "Manage Details" (always visible)
    - "Mark as Cleaning" (if OCCUPIED)
    - "Cleaning Complete" (if CLEANING)

#### 4. **Table/List View**
- **Component**: `RoomList.jsx` (alternative display)
- **Not actively rendered** in main component (grid mode is default)
- **Available but not integrated** in current flow
- **Table columns**: #, Room, Type, Floor, Status, Detail button

#### 5. **Pagination Controls**
- Smart page navigation: First, Previous, Page Numbers, Next, Last
- Shows max 5 visible page numbers with ellipsis (...)
- Active page highlighted with BRAND color
- Disabled states for first/last page
- Smooth scroll to top on page change

#### 6. **WebSocket Integration**
- **Service**: `webSocketService`
- **Subscribes to**: All room events (`subscribeToAllRooms`)
- **Handles**: `ROOM_STATUS_CHANGE` events
- **Action**: Auto-refreshes all data and shows in-app notification
- **Notification**: Styled fixed overlay (top-right, 5s auto-hide)
- **Status Badge**: Shows "Live" (green) or "Offline" (gray) in header

### Data Fetching

#### Fetch Functions
```javascript
fetchRooms() // Paginated room list with search/branch filter
fetchStatistics() // 6 room metrics
fetchFloors() // Available floors list
fetchRoomTypes() // Available room types
fetchBranches() // Available branches
fetchAllData() // Parallel Promise.all() for all above
```

#### API Endpoints Called
- `GET /rooms` (with search, status, page, size, branchId)
- `GET /rooms/statistics` (with optional branchId)
- `GET /rooms/floors`
- `GET /rooms/types`
- `GET /branches`
- `GET /rooms/{roomId}/detail`
- `PUT /admin/rooms/{roomId}/status` (mark cleaning/available)
- `POST /admin/rooms/{roomId}/incidents` (report issue)

#### Error Handling
- Graceful fallback when APIs unavailable (400/404 status)
- Console warnings for failed API calls
- `apiStatus` object tracks availability per endpoint
- Displays error message to user: "Backend APIs chưa sẵn sàng"
- Sets empty data when APIs fail

### Data Filtering & Sorting
```javascript
// Client-side filtering (after API fetch)
filteredRooms = rooms.filter(room => {
  - floor (if floorFilter set)
  - roomType (if roomTypeFilter set)
  - equipmentBroken (boolean check)
})

// Sorting options: name | floor | type
```

### Lifecycle & Refresh

#### Initial Load (on mount)
1. `fetchAllData()` in parallel
2. Setup 30-second stats refresh interval
3. Connect WebSocket for real-time events
4. Setup visibility change listener (refresh on tab show)

#### On Dependency Change
- Filter change → reset page to 0
- Page change → re-fetch rooms
- Search input → debounced in form handler

#### Manual Actions
- Mark as Cleaning → API call + notification + refresh
- Cleaning Complete → API call + notification + refresh
- Report Issue → Opens modal (handled by child component)

---

## 3. STATISTICS DISPLAY COMPONENT

**Location**: Inline in RoomManagement.jsx (lines ~700-750)

### Structure
```jsx
<div className="row g-3 mb-4">
  {[total, available, occupied, cleaning, maintenance, broken].map(stat => (
    <StatCard stat={stat} />
  ))}
</div>
```

### Design Details
- **Grid**: 6 columns on lg, 4 columns on md, 6 columns on mobile
- **Card styling**:
  - No border, shadow-sm
  - Rounded corners (16px)
  - Colored bottom border (4px)
  - Padding: 3 (12px)
  
### Content per Card
- **Top section**: Label (uppercase, small) + Value (large number)
- **Right section**: Colored icon badge (circle, 40x40px)
- **Loading state**: Spinner replaces value during load

### Colors & Icons
| Stat | Color | Icon |
|------|-------|------|
| Total | Gray (#6c757d) | bi-building |
| Available | Green (#198754) | bi-check-circle-fill |
| Occupied | Blue (#0d6efd) | bi-person-fill-check |
| Cleaning | Orange (#fd7e14) | bi-arrow-clockwise |
| Maintenance | Red (#dc3545) | bi-hammer |
| Broken | Yellow (#ffc107) | bi-exclamation-octagon-fill |

---

## 4. TABLE/GRID DISPLAY COMPONENT

### Grid View (Primary)
**Component**: Inline in RoomManagement.jsx (lines ~900-1050)

**Structure per Card**:
```
┌─ Status Color Bar (6px) ─────────────┐
│ ┌─ Card Body ─────────────────────┐ │
│ │ [Type Badge] [Room Name]    [Status]
│ │ Floor N • Central Branch         │
│ │ ┌─ Equipment Metrics ─────────┐ │
│ │ │ Equip: N | Broken: N | Issues: N
│ │ └─────────────────────────────┘ │
│ │ [Manage Details] [Mark/Complete] │
│ └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Responsive Grid**:
- lg: 4 columns (col-lg-3)
- md: 2 columns (col-md-6)
- sm: 1 column (col-12)

**Empty State**:
- Large inbox icon
- "No rooms found matching your criteria"
- "Clear All Filters" button link

### List View (Secondary - Not Used)
**Component**: `RoomList.jsx` (available but not rendered)

Structure:
- Header row with columns: #, Room, Type, Floor, Status, Detail
- Table body rows with room data
- Not integrated in current RoomManagement flow

---

## 5. FILTER SECTION COMPONENT

**Location**: RoomManagement.jsx (lines ~650-850)

### Visual Structure
```
┌─ Search Bar ─────────────────────────────────┐
│ 🔍 [Find room by name or ID...] |            │
├─ Filters Row ────────────────────────────────┤
│ [Branch ▼] [Floor ▼] [Type ▼] [🔘 Grid|List]
├─ Active Filter Tags (if filters applied) ───┤
│ [🔍 "search"] [📍 Branch] [📐 Floor] [🚪 Type]
│ [✓ Clear All]                               │
└──────────────────────────────────────────────┘
```

### Individual Filter Options

#### Search Input
- Placeholder: "Find room by name or ID..."
- Icon: Search (bi-search)
- Styling: 
  - Background: #f9f9f9
  - On focus: white bg + BRAND color border + shadow
  - Rounded: 8px
  - Font: 0.9rem

#### Branch Dropdown
- Options: "All Branches" + list from API
- Icon: bi-building (BRAND color)
- Default: Empty string (all branches)

#### Floor Dropdown
- Options: "All Floors" + dynamic list from `/rooms/floors`
- Format: "Floor {number}"
- Icon: bi-diagram-3 (blue)
- Data validation: Only valid floors (> 0)

#### Room Type Dropdown
- Options: "All Types" + dynamic list from `/rooms/types`
- Format: Uses `.label` property
- Icon: bi-door-closed (green)
- Data validation: Must have type, label, and roomCount fields

#### View Mode Toggle
- 2 buttons: Grid | List
- Icons: bi-grid-fill | bi-list-task
- Active style: BRAND background + white text
- Inactive: Gray text
- Layout: Contained group with background #f5f5f5

### Filter Tags (Active Filters Display)
- Shows when any filter applied
- **Format**: [Icon] [Value]
- **Colors**: Light green background, BRAND text
- **Clear functionality**: Each tag removable
- **Clear All**: Separate tag with red styling (removes all filters)

### Styling Details
```css
.search-input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f9f9f9;
  transition: all 0.3s;
}

.filter-item select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s;
}

.view-toggle-group {
  display: flex;
  gap: 6px;
  background: #f5f5f5;
  padding: 6px;
  border-radius: 8px;
  width: fit-content;
}
```

---

## 6. UI ISSUES & PROBLEMS

### ✅ Current Implementation Status
- **Grid view**: Fully functional and primary display
- **List view**: Component exists but NOT used in main component
- **Filters**: All working (search, branch, floor, type)
- **Statistics**: All 6 metrics displaying correctly
- **Pagination**: Working with smart page number display
- **WebSocket**: Connected with live status updates

### ⚠️ Potential Issues/Areas for Review

#### 1. **ViewMode State Not Used**
- **Issue**: `viewMode` state exists (grid | list) but never actually switches rendering
- **Line**: State set at line ~60, but JSX always renders grid (lines ~900+)
- **Impact**: List view toggle button is non-functional
- **Fix needed**: Add conditional rendering based on viewMode, or remove unused state

#### 2. **RoomList Component Not Integrated**
- **Issue**: `RoomList.jsx` exists but never imported or used
- **File**: Component accepts rooms, onRefresh props but never called
- **Impact**: List view not available despite UI toggle
- **Fix needed**: Implement conditional rendering: `{viewMode === 'list' ? <RoomList /> : gridView}`

#### 3. **Deprecated/Unused State Variables**
```javascript
const [equipmentBrokenFilter, setEquipmentBrokenFilter] = useState(""); // Defined but never used
const [sortBy, setSortBy] = useState("name"); // Sorting works but UI selector missing
```
- **Impact**: Code maintenance issue, confusing for developers

#### 4. **Equipment Broken Filter UI Missing**
- **Issue**: Filter logic exists in code but no UI dropdown for it
- **Line**: Client filtering at line ~475
- **Impact**: Users can't filter by broken equipment via UI

#### 5. **Sort Option UI Missing**
- **Issue**: Sorting by name/floor/type works but no UI selector
- **Impact**: Users can't change sort order

#### 6. **Console Warnings on API Failure**
- **Pattern**: Uses `console.warn()` instead of proper error boundary
- **Example**: "Rooms API not available:", "Statistics API not available:"
- **Impact**: May show in production, unclear to users

#### 7. **Modal Auto-Close on Data Update**
- **Issue**: Modals (`RoomDetailModal`) stay open when data refreshes
- **Flow**: User clicks "Mark as Cleaning" → refreshes data → modal still visible
- **UX Impact**: User sees old data or jarring state change
- **Fix**: Consider auto-close modal on successful action or refresh state within modal

#### 8. **WebSocket Connection Cleanup**
```javascript
// Line ~450: window.wsCleanup pattern
window.wsCleanup = cleanupFn; // Global reference - not ideal
```
- **Issue**: Using global window object for state
- **Better approach**: Use useRef or proper cleanup in useEffect

#### 9. **Loading State During Pagination**
- **Issue**: Shows full "Syncing Room Data..." spinner during page fetch
- **Line**: ~845
- **Impact**: No visual feedback for pagination-only loads
- **Fix**: Could show subtle loading indicator instead

#### 10. **API Response Data Mapping Edge Cases**
```javascript
// Line ~26-35 in roomManagementApi.js
// Backend varies response format - multiple mappings needed
roomId: room.roomId,
roomType: room.type,
// What if these fields are missing or misspelled?
```
- **Issue**: Defensive coding exists but could be more robust
- **Impact**: Silent failures if API changes

#### 11. **Missing Error Notification for Failed Actions**
- **When errors occur** (mark cleaning, report issue), notification shows
- **But**: No error modal or detailed error message
- **Impact**: Users see "Failed" but not why it failed

#### 12. **Breadcrumb Link Non-Functional**
```javascript
// Line ~605
<a href="#" className="text-decoration-none text-muted">Admin Panel</a>
// href="#" does nothing
```
- **Impact**: Non-navigational breadcrumb element

---

## 7. COMPONENT DEPENDENCIES & IMPORTS

### RoomManagement.jsx Dependencies
```javascript
import React, { useState, useEffect } from "react";
import { roomManagementApi } from "../api/roomManagementApi";
import MainLayout from "../../../components/layout/MainLayout";
import RoomDetailModal from "../components/RoomDetailModal";
import ReportIssueModal from "../components/ReportIssueModal";
import webSocketService from "../../../services/webSocketService";
```

### Child Components Used
1. **RoomDetailModal** - Equipment management & issue viewing
2. **ReportIssueModal** - Issue reporting form
3. **MainLayout** - Page wrapper with navigation
4. **webSocketService** - Real-time updates

### Related Components (Not Imported)
1. **RoomList.jsx** - Alternative table view (not used)
2. **AdminRoomDetailModal.jsx** - Advanced admin modal (not imported)
3. **RoomFurnitureTable.jsx** - Used by AdminRoomDetailModal
4. **ReportIncidentModal.jsx** - Alternative incident form
5. **ReplaceFromInventoryModal.jsx** - Inventory replacement
6. **ConfirmChangeModal.jsx** - Confirmation dialog

### API Client
```javascript
// roomManagementApi.js defines:
- listRooms() - Paginated list with filters
- getRoomStatistics() - 6 metrics
- getRoomDetail() - Full room with equipment & issues
- getRoomEquipment() - Equipment list
- getRoomIssues() - Incident list
- getFloors() - Floor options
- getRoomTypes() - Room type options
- updateRoomStatus() - Change status (available/cleaning/maintenance)
- updateRoomFurniture() - Mark equipment broken/good
- reportIssue() / createIncident() - Report new issue
- listBranches() - Branch options
```

### Styling
- **CSS File**: `RoomManagement.css` (Bootstrap-only, no custom styles)
- **Inline Styles**: Extensive inline styling for card colors, gradients, responsive design
- **Bootstrap Classes**: Heavy use of Bootstrap utilities (row, col, btn, card, etc.)
- **Brand Color**: `#5C6F4E` (sage green) used throughout

---

## 8. API STATUS TRACKING

Component monitors API availability via `apiStatus` object:
```javascript
apiStatus = {
  rooms: 'unknown' | 'available' | 'unavailable',
  statistics: 'unknown' | 'available' | 'unavailable',
  floors: 'unknown' | 'available' | 'unavailable',
  types: 'unknown' | 'available' | 'unavailable'
}
```

- **Purpose**: Handle graceful degradation when backend is down
- **Display**: No visual indicator to user currently (could be shown)
- **Console**: Logs warnings for each failed API call
- **Data**: Sets empty arrays/zeros when API unavailable

---

## 9. REAL-TIME FEATURES

### WebSocket Integration
- **Service**: `webSocketService`
- **Connection**: Auto-connects on component mount
- **Subscription**: All room status changes (`subscribeToAllRooms`)
- **Event Type**: `ROOM_STATUS_CHANGE`
- **Payload**: `{ type, roomName, oldStatus, newStatus }`

### Live Notification
- **Position**: Fixed top-right corner
- **Animation**: Slide-in from right (0.3s)
- **Auto-close**: 5 seconds
- **Manual dismiss**: X button
- **Styling**: Blue background, check icon, dark text
- **Message format**: "Room {name} status changed from {old} to {new}"

### In-App Notification System
- Custom notification state (not using toast/alert library)
- Appears on:
  - Room status changes (from WebSocket)
  - Equipment marked broken (from modal action)
  - Mark cleaning complete (from action)
  - Issue reported successfully (from modal)
- **Design**: Styled div with dismissible close button

---

## 10. PERFORMANCE CONSIDERATIONS

### Data Fetching
- **Page size**: 12 rooms per page (hardcoded)
- **Refresh interval**: 30-second auto-refresh for statistics
- **Visibility listener**: Only refreshes when tab becomes visible
- **Parallel loading**: Uses Promise.all() for initial data

### Rendering Performance
- **Grid**: 12 cards per page max (responsive columns)
- **Pagination**: Smart page number limiting (max 5 visible)
- **Filter operations**: Client-side filtering (after API fetch)
- **Sort operations**: Client-side sorting (lightweight)

### Network Optimization
- **Combined endpoints**: Uses `/rooms/detail` for full room data
- **Separate endpoints**: Statistics, floors, types fetched separately
- **Pagination**: Backend handles, frontend just renders

---

## 11. QUICK FEATURE CHECKLIST

- ✅ Real-time statistics display (6 metrics)
- ✅ Search by room name/ID
- ✅ Filter by branch, floor, room type
- ✅ View mode toggle (Grid/List) - **UI present but non-functional**
- ✅ Pagination with smart page numbers
- ✅ Room detail modal (equipment & issues)
- ✅ Mark room as cleaning (OCCUPIED → CLEANING)
- ✅ Complete cleaning (CLEANING → AVAILABLE)
- ✅ Report issue modal
- ✅ WebSocket real-time updates
- ✅ Live connection status badge
- ⚠️ Equipment broken filter (logic exists, no UI)
- ⚠️ Sort by floor/type (logic exists, no UI)
- ⚠️ List view toggle (UI exists, not implemented)

---

## 12. SUMMARY

The Room Management page is a **well-structured, feature-rich admin dashboard** with:

**Strengths:**
- Clean, modern UI with Bootstrap styling
- Comprehensive room management features
- Real-time WebSocket integration
- Graceful API error handling
- Responsive design
- Pagination and filtering support

**Areas needing attention:**
1. List view not functional (state/UI mismatch)
2. Missing UI for equipment broken filter
3. Missing UI for sort controls
4. Console warnings on API failures
5. Global window object usage for WebSocket cleanup
6. Modal state management during data refresh
7. Breadcrumb navigation non-functional

