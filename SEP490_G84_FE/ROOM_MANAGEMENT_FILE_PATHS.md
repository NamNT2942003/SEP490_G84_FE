# Room Management Component File Paths

## Quick Reference

### Main Component
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/screens/RoomManagement.jsx](../../src/features/roomManagement/screens/RoomManagement.jsx)** 
  - Primary admin dashboard (1100+ lines)
  - Statistics, filtering, pagination, grid view
  - WebSocket real-time updates
  - Main entry point for room management

### Modal Components
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/RoomDetailModal.jsx](../../src/features/roomManagement/components/RoomDetailModal.jsx)**
  - Equipment management modal
  - Equipment list with repair actions
  - Issue viewing tab
  - "Mark broken" functionality

- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/AdminRoomDetailModal.jsx](../../src/features/roomManagement/components/AdminRoomDetailModal.jsx)**
  - Advanced admin modal (not used in main RoomManagement)
  - Furniture detail table
  - Incident reporting

- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/ReportIssueModal.jsx](../../src/features/roomManagement/components/ReportIssueModal.jsx)**
  - Report issue form modal
  - Description & reason fields
  - Form validation

- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/ReportIncidentModal.jsx](../../src/features/roomManagement/components/ReportIncidentModal.jsx)**
  - Related incident modal

### Display Components
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/RoomList.jsx](../../src/features/roomManagement/components/RoomList.jsx)**
  - Table/List view component (NOT INTEGRATED)
  - Shows rooms in table format
  - Has: #, Room, Type, Floor, Status, Detail columns
  - Status indicator pills

- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/RoomFurnitureTable.jsx](../../src/features/roomManagement/components/RoomFurnitureTable.jsx)**
  - Equipment/furniture table
  - Used by AdminRoomDetailModal

### Supporting Components
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/ReplaceFromInventoryModal.jsx](../../src/features/roomManagement/components/ReplaceFromInventoryModal.jsx)**
  - Replace broken equipment from inventory
  - Inventory selection modal

- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/components/ConfirmChangeModal.jsx](../../src/features/roomManagement/components/ConfirmChangeModal.jsx)**
  - Generic confirmation dialog

### API Layer
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/api/roomManagementApi.js](../../src/features/roomManagement/api/roomManagementApi.js)**
  - API wrapper for all room operations
  - Methods:
    - `listRooms()` - Get paginated rooms
    - `getRoomStatistics()` - 6 metrics
    - `getRoomDetail()` - Full room data
    - `getRoomEquipment()` - Equipment list
    - `getRoomIssues()` - Issues/incidents
    - `getFloors()` - Floor list
    - `getRoomTypes()` - Room types
    - `updateRoomStatus()` - Change status
    - `updateRoomFurniture()` - Equipment status
    - `reportIssue()` / `createIncident()` - Report issue
    - `listBranches()` - Branches
    - `replaceFromInventory()` - Equipment replacement

### Styling
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/css/RoomManagement.css](../../src/features/roomManagement/css/RoomManagement.css)**
  - Currently: Bootstrap-only (no custom CSS)
  - Comment: "Bootstrap-only — custom CSS removed"

### Backup
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/screens/RoomManagement_backup.jsx](../../src/features/roomManagement/screens/RoomManagement_backup.jsx)**
  - Previous version backup (for reference)

### Related Screens
- **[SEP490_G84_FE/SEP490_G84_FE/src/features/roomManagement/screens/FurnitureManagement.jsx](../../src/features/roomManagement/screens/FurnitureManagement.jsx)**
  - Separate furniture management screen

---

## Component Hierarchy

```
RoomManagement.jsx (Main Page)
├── MainLayout
├── Statistics Cards (inline)
├── Filter Section (inline)
├── Grid View (inline - PRIMARY)
│   ├── Room Cards
│   ├── Status Bar
│   ├── Equipment Metrics
│   └── Action Buttons
├── Pagination (inline)
├── RoomDetailModal
│   └── RoomFurnitureTable
├── ReportIssueModal
│   └── Form fields
└── WebSocket Service (via imported service)

RoomList.jsx (Unused List View)
└── AdminRoomDetailModal (can be opened from list)

AdminRoomDetailModal.jsx (Not used by main component)
├── RoomFurnitureTable
├── ReportIncidentModal
└── ReplaceFromInventoryModal
```

---

## API Endpoints Called

Base Routes:
- `/rooms` - Room list & details
- `/rooms/statistics` - Statistics
- `/rooms/floors` - Floors
- `/rooms/types` - Room types  
- `/branches` - Branches
- `/admin/rooms` - Admin operations

Specific Endpoints:
```
GET    /rooms                          - List rooms (paginated, searchable)
GET    /rooms/statistics?branchId=...  - 6 metrics
GET    /rooms/{roomId}/detail          - Full room data
GET    /rooms/{roomId}/equipment       - Equipment list
GET    /rooms/floors                   - Available floors
GET    /rooms/types                    - Room types
GET    /branches                       - All branches

PUT    /admin/rooms/{roomId}/status           - Update status
PUT    /admin/rooms/{roomId}/furniture/{fid}  - Update furniture
POST   /admin/rooms/{roomId}/incidents        - Report issue
POST   /admin/rooms/{roomId}/furniture/{fid}/replace - Replace equipment

GET    /admin/rooms/{roomId}/incidents - Issues list
```

---

## Documentation Files

Additional documentation in the project:
- `SEP490_G84_FE/SEP490_G84_FE/ROOM_MANAGEMENT_ANALYSIS.md` - This detailed analysis

