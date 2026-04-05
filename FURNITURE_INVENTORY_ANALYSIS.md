# Furniture Inventory - Component Analysis

## 🎯 Summary

Tìm thấy component **FurnitureInventory.jsx** hiển thị danh sách Furniture và modal chi tiết. Hiện tại component sử dụng **mock data** (hardcoded), chưa kết nối thực tế API backend.

---

## 📄 1. Frontend Component: FurnitureInventory.jsx

**Vị trí**: [src/features/inventory/screens/FurnitureInventory.jsx](src/features/inventory/screens/FurnitureInventory.jsx)

### A. Cấu trúc dữ liệu Furniture (Mock Data)

```javascript
const initialData = [
    {
        id: 1,
        facility: 'Branch 1 - Floor 1',
        branch: 'Branch 1',
        name: 'King Bed',
        quantity: 50,           // ✅ Tổng số lượng
        price: 5000000,
        inUse: 42,             // ✅ Số lượng đang sử dụng trong phòng
        inStock: 8,            // ✅ Tồn kho = quantity - inUse
        broken: 1,             // ✅ Số lượng hỏng
        roomsUsing: ['Room 101', 'Room 102', 'Room 103'],    // ✅ Phòng đang sử dụng
        roomsBroken: ['Room 102'],  // ✅ Phòng có item hỏng
    },
    // ... more items
];
```

### B. Bảng hiển thị Furniture List

**Columns**:
- ID
- Furniture (Name)
- Branch
- Quantity (tổng)
- Price
- In use (đang sử dụng)
- In stock (tồn kho)
- Broken (hỏng)
- Action (View detail button)

```jsx
<table className="inventory-table">
    <thead>
        <tr>
            <th>ID</th>
            <th>Furniture</th>
            <th>Branch</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>In use</th>
            <th>In stock</th>
            <th>Broken</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
        {pagedRows.map((row) => (
            <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.branch}</td>
                <td>{row.quantity}</td>
                <td>{formatVND(row.price)}</td>
                <td>{row.inUse}</td>
                <td>{row.inStock}</td>
                <td>{row.broken}</td>
                <td>
                    <button
                        className="btn-detail"
                        onClick={() => setDetailItem(row)}
                        disabled={selectedBranch === 'all'}
                        title={selectedBranch === 'all' ? 'Please select a branch first' : 'View detail'}
                    >
                        View detail
                    </button>
                </td>
            </tr>
        ))}
    </tbody>
</table>
```

### C. Detail Modal - Furniture Detail

**Trigger**: Click "View detail" button

```jsx
{detailItem && (
    <div className="furniture-modal-overlay">
        <div className="modal-content furniture-modal">
            <div className="modal-header">
                <h3>Furniture detail</h3>
                <button className="close-btn" onClick={() => setDetailItem(null)}>✖</button>
            </div>
            <div className="furniture-detail-body">
                {/* Furniture Info Grid */}
                <div className="furniture-detail-grid">
                    <div><strong>ID:</strong> {detailItem.id}</div>
                    <div><strong>Branch / Area:</strong> {detailItem.facility}</div>
                    <div><strong>Name:</strong> {detailItem.name}</div>
                    <div><strong>Quantity:</strong> {detailItem.quantity}</div>
                    <div><strong>Price:</strong> {formatVND(detailItem.price)}</div>
                    <div><strong>In use:</strong> {detailItem.inUse}</div>
                    <div><strong>In stock:</strong> {detailItem.inStock}</div>
                    <div><strong>Broken:</strong> {detailItem.broken}</div>
                </div>

                {/* Rooms using this item */}
                <div className="furniture-detail-section">
                    <div className="furniture-detail-section-title">Rooms using this item</div>
                    <div className="furniture-detail-list">
                        {(detailItem.roomsUsing || []).length ? (
                            (detailItem.roomsUsing || []).map((name) => (
                                <div key={name} className="chip">
                                    {name}
                                </div>
                            ))
                        ) : (
                            <div className="muted">No rooms</div>
                        )}
                    </div>
                </div>

                {/* Rooms with broken items */}
                <div className="furniture-detail-section">
                    <div className="furniture-detail-section-title furniture-detail-section-title--danger">
                        Rooms with broken items
                    </div>
                    <div className="furniture-detail-list">
                        {(detailItem.roomsBroken || []).length ? (
                            (detailItem.roomsBroken || []).map((name) => (
                                <div key={name} className="chip chip--danger">
                                    {name}
                                </div>
                            ))
                        ) : (
                            <div className="muted">No broken rooms</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="furniture-modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetailItem(null)}>Close</button>
            </div>
        </div>
    </div>
)}
```

---

## 🔧 2. Backend Architecture

### A. Entity: Furniture

**File**: [src/main/java/sep490/entities/Furniture.java](../../../../Program%20Files/SEP490_G84/src/main/java/sep490/entities/Furniture.java)

```java
@Entity
@Table(name = "Furniture")
@Getter
@Setter
public class Furniture {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FurnitureId")
    private int furnitureId;

    @Column(name = "FacilityName")
    private String facilityName;  // e.g., "King Bed", "Working Desk"

    @Column(name = "Quality")
    private String quality;  // e.g., "Premium", "Standard"
}
```

### B. Entity: Room_Furniture (Relationship)

**File**: [src/main/java/sep490/entities/Room_Furniture.java](../../../../Program%20Files/SEP490_G84/src/main/java/sep490/entities/Room_Furniture.java)

```java
@Entity
@Table(name = "Room_Furniture")
@Getter
@Setter
public class Room_Furniture {
    @EmbeddedId
    private RoomFurnitureId id;  // Composite key: roomId + furnitureId

    @ManyToOne
    @MapsId("roomId")
    @JoinColumn(name = "RoomId")
    private Room room;

    @ManyToOne
    @MapsId("furnitureId")
    @JoinColumn(name = "FurnitureId")
    private Furniture furniture;

    @Column(name = "Quantity")
    private int quantity;  // Số lượng của furniture này trong phòng

    @Column(name = "Status")
    private String status;  // e.g., "GOOD", "BROKEN", "NEED_REPAIR"
}
```

### C. DTO: FurnitureListDTO

**File**: [src/main/java/sep490/dto/FurnitureListDTO.java](../../../../Program%20Files/SEP490_G84/src/main/java/sep490/dto/FurnitureListDTO.java)

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FurnitureListDTO {
    private Integer furnitureId;
    private String furnitureCode;      // Format: "F00001"
    private String furnitorName;       // Furniture name
    private String type;               // Quality type
    private String condition;          // Status
    private Integer quantity;          // Tổng số lượng trong branch
    private Integer totalRoomsWithThis;  // Số phòng chứa furniture này
}
```

---

## 📡 3. API Endpoints & Backend Logic

### A. List Furniture by Branch

**Endpoint**: 
```
GET /api/rooms-detail/furniture/branch/{branchId}?page=0&size=10
```

**Backend Method**: [RoomDetailController.listFurnitureByBranch()](../../../../Program%20Files/SEP490_G84/src/main/java/sep490/controller/RoomDetailController.java#L94)

```java
@GetMapping("/furniture/branch/{branchId}")
public ResponseEntity<?> listFurnitureByBranch(
        @PathVariable int branchId,
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "10") int size
) {
    Pageable pageable = PageRequest.of(page, size);
    Page<FurnitureListDTO> furniture = furnitureService.listFurnitureByBranch(branchId, pageable);
    return ResponseEntity.ok(furniture);
}
```

### B. Service Implementation

**File**: [src/main/java/sep490/service/impl/FurnitureServiceImpl.java](../../../../Program%20Files/SEP490_G84/src/main/java/sep490/service/impl/FurnitureServiceImpl.java)

```java
@Override
public Page<FurnitureListDTO> listFurnitureByBranch(Integer branchId, Pageable pageable) {
    // Get all furniture used in this branch
    List<Furniture> branchFurnitures = furnitureRepository.findFurnitureByBranch(branchId);
    
    List<FurnitureListDTO> dtoList = branchFurnitures.stream()
            .map(furniture -> buildFurnitureDTOWithBranchData(furniture, branchId))
            .collect(Collectors.toList());

    // Manually handle pagination
    int start = (int) pageable.getOffset();
    int end = Math.min((start + pageable.getPageSize()), dtoList.size());
    List<FurnitureListDTO> pageContent = dtoList.subList(start, end);

    return new PageImpl<>(pageContent, pageable, dtoList.size());
}

/**
 * Build FurnitureListDTO with branch-specific data
 */
private FurnitureListDTO buildFurnitureDTOWithBranchData(Furniture furniture, Integer branchId) {
    FurnitureListDTO dto = new FurnitureListDTO();
    dto.setFurnitureId(furniture.getFurnitureId());
    dto.setFurnitureCode("F" + String.format("%05d", furniture.getFurnitureId()));
    dto.setFurnitorName(furniture.getFacilityName());
    dto.setType(furniture.getQuality());
    dto.setCondition("");
    
    // 🔑 KEY LOGIC: Get all Room_Furniture records for this furniture in this branch
    List<Room_Furniture> roomFurnitures = roomFurnitureRepository
            .findByFurnitureAndBranch(furniture.getFurnitureId(), branchId);
    
    // Calculate total quantity
    Integer totalQuantity = roomFurnitures.stream()
            .mapToInt(Room_Furniture::getQuantity)
            .sum();
    
    // Calculate number of rooms containing this furniture
    Set<Integer> uniqueRooms = new HashSet<>();
    for (Room_Furniture rf : roomFurnitures) {
        uniqueRooms.add(rf.getRoom().getRoomId());
    }
    
    dto.setQuantity(totalQuantity);
    dto.setTotalRoomsWithThis(uniqueRooms.size());
    
    return dto;
}
```

### C. Repository Query

**File**: [src/main/java/sep490/repository/RoomFurnitureRepository.java](../../../../Program%20Files/SEP490_G84/src/main/java/sep490/repository/RoomFurnitureRepository.java)

```java
@Query("SELECT rf FROM Room_Furniture rf " +
       "WHERE rf.furniture.furnitureId = :furnitureId " +
       "AND rf.room.roomType.branch.branchId = :branchId")
List<Room_Furniture> findByFurnitureAndBranch(@Param("furnitureId") Integer furnitureId,
                                               @Param("branchId") Integer branchId);
```

---

## 🧮 4. Logic Tính Toán "In Use", "In Stock", "Broken"

### A. Định nghĩa các trường

Dựa trên code và testing guide:

| Field | Tính toán | Ví dụ |
|-------|-----------|-------|
| **Quantity** | Tổng số lượng furniture trong branch | 50 |
| **In Use** | Tổng quantity của trên Room_Furniture với status = GOOD hay sử dụng | 42 |
| **In Stock** | quantity - inUse | 50 - 42 = 8 |
| **Broken** | Tổng quantity của items status = BROKEN | 1 |
| **Rooms using this item** | Unique list các Room có furniture này | ['Room 101', 'Room 102', 'Room 103'] |
| **Rooms with broken items** | Unique list các Room có furniture này với status = BROKEN | ['Room 102'] |

### B. Validation Logic

**Kiểm tra quan hệ**:
```
Quantity = In Use + In Stock + (có thể có Broken riêng)
hay
Quantity = In Use + In Stock + Broken
```

**Ví dụ**:
- Branch 1 - King Bed: 
  - Quantity = 50
  - In Use = 42 (42 items ở trạng thái GOOD trong phòng)
  - In Stock = 8 (chưa được sử dụng)
  - Broken = 1 (hỏng)
  - **Kiểm tra**: 42 + 8 = 50 ✅ (Broken là subset của In Use hoặc ngoài)

**Mối quan hệ với Rooms**:
- Số phòng từ `roomsUsing` phải <= Số phòng có quantity > 0
- Số phòng từ `roomsBroken` phải là subset của `roomsUsing`

---

## 🔌 5. Frontend - Backend Connection

### A. Current Status: ❌ Using Mock Data

**File**: [src/features/inventory/screens/FurnitureInventory.jsx](src/features/inventory/screens/FurnitureInventory.jsx)

- ❌ **Không gọi API** - Sử dụng hardcoded `initialData`
- ❌ Không có `useEffect` để fetch data
- ✅ Có permission checking (Admin & Manager only)
- ✅ Có branch filtering
- ✅ Có pagination & search

### B. Expected API Call (Cần implement)

```javascript
// roomManagementApi.js
export const roomManagementApi = {
  // Existing method
  listFurniture: async (page = 0, size = 10) => {
    const response = await apiClient.get(`/rooms/furniture/list?page=${page}&size=${size}`);
    return response.data;
  },

  // Need to implement or use this:
  listFurnitureByBranch: async (branchId, page = 0, size = 10) => {
    const response = await apiClient.get(
      `/rooms-detail/furniture/branch/${branchId}?page=${page}&size=${size}`
    );
    return response.data;
  },
};
```

### C. Integration in Component

```javascript
const FurnitureInventory = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedBranch !== 'all') {
            fetchFurnitureByBranch(selectedBranch);
        }
    }, [selectedBranch]);

    const fetchFurnitureByBranch = async (branch) => {
        setLoading(true);
        try {
            const branchId = extractBranchId(branch); // "Branch 1" -> 1
            const data = await roomManagementApi.listFurnitureByBranch(branchId, page, pageSize);
            // Transform API data to match initialData structure
            const transformedData = data.content.map(item => ({
                id: item.furnitureId,
                facility: item.facilityCode,
                branch: branch,
                name: item.furnitorName,
                quantity: item.quantity,
                price: item.price || 0,
                inUse: calculateInUse(item), // Need backend support
                inStock: calculateInStock(item),
                broken: calculateBroken(item),
                roomsUsing: item.roomsUsing || [],
                roomsBroken: item.roomsBroken || [],
            }));
            setRows(transformedData);
        } catch (error) {
            console.error('Failed to fetch furniture:', error);
        } finally {
            setLoading(false);
        }
    };
};
```

---

## 📌 6. Current Issues & Improvements Needed

| Issue | Status | Solution |
|-------|--------|----------|
| Using mock data | ❌ Mock | Connect to real API |
| Missing fields in DTO | ❌ Incomplete | Add `inUse`, `inStock`, `broken`, `roomsUsing`, `roomsBroken` to FurnitureListDTO |
| No price field in API | ❌ Missing | Add `price` to FurnitureListDTO |
| No room details in API | ❌ Missing | Enhance API response with room information |
| Validation logic | ⚠️ Unclear | Define rules: quantity = inUse + inStock + broken? |
| API documentation | ⚠️ Incomplete | Document expected response format |

---

## 🎨 7. Component Structure

```
FurnitureInventory.jsx (Main Component)
├── Header
│   ├── Title: "Furniture Inventory"
│   ├── Branch Filter Dropdown
│   └── Name Search Input
├── Table
│   ├── Headers: ID, Furniture, Branch, Quantity, Price, In use, In stock, Broken, Action
│   ├── Rows: Mapped from filteredRows
│   └── Action: "View detail" button (disabled if branch = 'all')
├── Pagination
│   ├── Previous Button
│   ├── Page Info
│   └── Next Button
└── DetailModal (when detailItem is set)
    ├── Header: "Furniture detail"
    ├── Detail Grid: ID, Branch/Area, Name, Quantity, Price, In use, In stock, Broken
    ├── Rooms using this item (list of room names)
    ├── Rooms with broken items (highlighted list)
    └── Close Button
```

---

## 📚 Files Referenced

- **Frontend**: `SEP490_G84_FE/src/features/inventory/screens/FurnitureInventory.jsx`
- **Backend Controller**: `SEP490_G84/src/main/java/sep490/controller/RoomDetailController.java`
- **Backend Service**: `SEP490_G84/src/main/java/sep490/service/impl/FurnitureServiceImpl.java`
- **Backend Repository**: `SEP490_G84/src/main/java/sep490/repository/RoomFurnitureRepository.java`
- **DTOs**: 
  - `SEP490_G84/src/main/java/sep490/dto/FurnitureListDTO.java`
  - `SEP490_G84/src/main/java/sep490/dto/FurnitureInRoomDTO.java`
- **Entities**: 
  - `SEP490_G84/src/main/java/sep490/entities/Furniture.java`
  - `SEP490_G84/src/main/java/sep490/entities/Room_Furniture.java`
- **Testing Guide**: `SEP490_G84/FURNITURE_MULTIBRAINCH_TEST_GUIDE.md`

---

## 🚀 Next Steps

1. **Extend FurnitureListDTO** với các fields: `inUse`, `inStock`, `broken`, `price`, `roomsUsing`, `roomsBroken`
2. **Enhance FurnitureServiceImpl** để calculate các fields này từ Room_Furniture data
3. **Connect FurnitureInventory.jsx** với real API endpoint `/rooms-detail/furniture/branch/{branchId}`
4. **Add validation logic** để kiểm tra tính consistency của data
5. **Add unit tests** để test calculations

