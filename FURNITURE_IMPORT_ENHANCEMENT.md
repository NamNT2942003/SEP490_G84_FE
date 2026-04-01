# Furniture Inventory - Import Enhancement Analysis

## 📋 Overview
Integrate import functionality from **ImportHistory** screen into **FurnitureInventory** screen, allowing direct inventory imports without navigating to a separate page. Import quantities will directly increase the "In Stock" column.

---

## 🔍 Current State Analysis

### 1. ImportHistory Screen (Source)
**File:** `src/features/inventory/screens/ImportHistory.jsx`

**Key Features:**
- ✅ Create new import receipts with date filtering (Month/Year)
- ✅ Add items (existing or new)
- ✅ Specify unit price and quantity for each item
- ✅ View import history grouped by receipt
- ✅ Edit existing import receipts
- ✅ API: `POST /inventory/import` (create import)
- ✅ API: `GET /inventory/branch/{branchId}/items` (load available items)
- ✅ Items auto-update with price when selected from existing inventory

**Data Structure:**
```javascript
importList = [
  {
    isNew: false,
    inventoryId: 'id',
    inventoryName: '',
    price: 0,
    quantity: 1,
    unit: 'Cái'
  }
]
```

### 2. FurnitureInventory Screen (Target)
**File:** `src/features/inventory/screens/FurnitureInventory.jsx`

**Current Columns:**
- ID | Furniture | Branch | Quantity | Price | In use | **In stock** | Broken | Action

**Current Features:**
- ✅ Branch selection
- ✅ Search by furniture name
- ✅ View detail modal
- ✅ Pagination

**Missing:**
- ❌ Import button
- ❌ Import modal
- ❌ Direct stock increase

---

## 🎯 Implementation Plan

### Phase 1: Add "Import Furniture" Button
**Location:** Next to branch selector in inventory-header
**Style:** Orange button matching "Import furniture" button in screenshot

```jsx
<button 
  onClick={openImportModal}
  className="btn-import"
  disabled={selectedBranch === 'all'}
  style={{ backgroundColor: '#FFA500' }}
>
  Import furniture
</button>
```

### Phase 2: Create Import Modal Component
**Reuse Logic From:** ImportHistory
**Modal Features:**
- Modal triggered from "Import furniture" button
- Load available items from `/inventory/branch/{branchId}/items`
- Support adding multiple items in one import
- Toggle between existing items and new items
- Auto-fill price/unit when selecting existing item
- Submit button sends to `/inventory/import` endpoint

### Phase 3: Update Data Flow
**When Import Succeeds:**
1. Show success message: "Import successfully! Item prices have been updated."
2. Refresh furniture inventory table
3. **In Stock** column values will increase by the imported quantity
4. Close modal automatically

### Phase 4: State Management
**New States to Add:**
```javascript
const [isImportModalOpen, setIsImportModalOpen] = useState(false);
const [availableItems, setAvailableItems] = useState([]);
const [importList, setImportList] = useState([
  { isNew: false, inventoryId: '', inventoryName: '', price: '', quantity: 1, unit: '' }
]);
```

---

## 🔄 Data Flow Diagram

```
User clicks "Import Furniture" button
  ↓
Modal opens + Load available items from API
  ↓
User adds items (select existing or create new)
  ├─ If existing: auto-fill price & unit
  └─ If new: enter name, price, unit manually
  ↓
User enters quantities for each item
  ↓
Submit button → POST /inventory/import
  ├─ branchId
  ├─ items[]
  └─ userId
  ↓
Backend processes import:
  ├─ Create ImportReceipt
  ├─ Create ImportDetail records
  └─ Update Inventory.stock (In Stock increases)
  ↓
API returns success
  ↓
Close modal + Refresh furniture table
  ↓
User sees "In Stock" column updated ✅
```

---

## 📝 Code Implementation Components

### 1. API Calls (Already exist in ImportHistory, will reuse)
```javascript
// Load available items for a branch
GET /inventory/branch/{branchId}/items?userId={userId}

// Create import receipt
POST /inventory/import
{
  branchId: number,
  items: [
    {
      inventoryId: number | null,      // null if new item
      inventoryName: string | null,    // only if new item
      price: number,                   // unit price
      quantity: number,                // import quantity
      unit: string                     // e.g., "Cái", "Set"
    }
  ],
  userId: number
}
```

### 2. Modal Structure
**Header:**
- Title: "Import Furniture"
- Close button

**Content:**
- Dynamic form rows for each import item
- Each row has:
  - Toggle: "Existing item" / "New item"
  - Dropdown (if existing) or Text input (if new)
  - Unit field
  - Unit price field (green border as in ImportHistory)
  - Quantity field
  - Delete button
- "+ Add another item" button

**Footer:**
- Cancel button
- Confirm Import button

### 3. Integration Points
```
FurnitureInventory.jsx
  ├─ Add Button: onClick → openImportModal()
  ├─ New States: isImportModalOpen, availableItems, importList
  ├─ New Function: openImportModal()
  ├─ New Function: closeImportModal()
  ├─ New Function: handleImportChange()
  ├─ New Function: submitImport()
  ├─ New Component: ImportFurnitureModal
  └─ API Integration: apiClient.post('/inventory/import')
```

---

## ✅ Acceptance Criteria

1. **Button Placement:** "Import furniture" button visible in header (disabled when "All branches" selected)
2. **Modal Opens:** Click button → modal appears with empty import list
3. **Add Items:** Can add multiple rows, toggle between existing/new
4. **Existing Items:** Auto-populate price & unit when selected
5. **New Items:** Require name, price, unit input
6. **Submit:** POST request succeeds → modal closes
7. **Refresh:** Table refreshes → "In Stock" values updated
8. **Error Handling:** Show alert with error message if import fails
9. **User Experience:** Matches ImportHistory screen design/UX

---

## 📊 Benefits
- ✅ Users can import directly from furniture inventory page (no navigation)
- ✅ Faster workflow for frequent imports
- ✅ Consolidated inventory management in one screen
- ✅ Immediate visibility of stock updates
- ✅ Reuses proven ImportHistory logic
- ✅ Minimal UI duplication (modal-based)

---

## 🛠️ Implementation Steps
1. Add state variables to FurnitureInventory.jsx
2. Add "Import Furniture" button to header
3. Create import modal component
4. Implement openImportModal() and handler functions
5. Integrate API calls for import submission
6. Add refresh logic after successful import
7. Add error handling with user feedback
8. Test with existing and new items
9. Verify "In Stock" column updates correctly

---

## 📌 UI Mockup
```
┌─────────────────────────────────────────────────────────────┐
│  Furniture Inventory                                        │
│  ┌──────────────────┐  ┌────────────────┐  ┌──────────────┐│
│  │ Khách san Grand  │  │ Search by name │  │ Import       ││
│  │     ▼            │  │                │  │ furniture    ││
│  └──────────────────┘  └────────────────┘  └──────────────┘│
├─────────────────────────────────────────────────────────────┤
│ ID | Furniture | Branch | Qty | Price | In use | Stock|...  │
│────┼───────────┼────────┼─────┼───────┼────────┼──────┼──── │
│  1 │ King Bed  │ Branch │  1  │ 5M đ  │   1    │  0   │ ... │
│────┼───────────┼────────┼─────┼───────┼────────┼──────┼──── │
```

---

**Status:** ✅ Analysis Complete | Ready for Implementation
**Estimated Effort:** 2-3 hours
**Risk Level:** Low (reusing proven code from ImportHistory)
