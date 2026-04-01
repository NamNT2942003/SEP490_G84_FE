/**
 * SAMPLE API RESPONSE DATA - Frontend Testing
 * 
 * BÀI TOÁN: 2 branches có cùng 1 loại furniture (King Bed)
 * KIỂM THỬ: 
 *   1. Khi chọn "All branches" -> View detail button disabled
 *   2. Khi chọn "Branch 1" -> Chi tiết chỉ hiển thị phòng của Branch 1
 *   3. Khi chọn "Branch 2" -> Chi tiết chỉ hiển thị phòng của Branch 2
 */

// ========================================================
// API Response: GET /api/rooms-detail/furniture/branch/{branchId}
// ========================================================

/**
 * Branch 1 - Furniture List
 */
const BRANCH_1_FURNITURE = [
    {
        furnitureId: 1,
        furnitureCode: "F00001",
        furnitorName: "King Bed",
        type: "Premium",
        quantity: 3,           // Total quantity: Room 101, 102, 202
        totalRoomsWithThis: 3, // 3 rooms
        roomsUsing: [
            { roomId: 1, roomName: "Room 101", quantity: 1, condition: "GOOD" },
            { roomId: 2, roomName: "Room 102", quantity: 1, condition: "NEED_REPAIR" },
            { roomId: 5, roomName: "Room 202", quantity: 1, condition: "BROKEN" }
        ],
        roomsBrokenStatus: [
            { roomId: 2, roomName: "Room 102", condition: "NEED_REPAIR" },
            { roomId: 5, roomName: "Room 202", condition: "BROKEN" }
        ]
    },
    {
        furnitureId: 2,
        furnitureCode: "F00002",
        furnitorName: "Working Desk",
        type: "Standard",
        quantity: 3,
        totalRoomsWithThis: 3,
        roomsUsing: [
            { roomId: 1, roomName: "Room 101", quantity: 1, condition: "GOOD" },
            { roomId: 2, roomName: "Room 102", quantity: 1, condition: "GOOD" },
            { roomId: 4, roomName: "Room 201", quantity: 1, condition: "GOOD" }
        ],
        roomsBrokenStatus: []
    },
    {
        furnitureId: 4,
        furnitureCode: "F00004",
        furnitorName: "Sofa Set",
        type: "Standard",
        quantity: 3,
        totalRoomsWithThis: 2,
        roomsUsing: [
            { roomId: 3, roomName: "Room 103", quantity: 2, condition: "GOOD" },
            { roomId: 4, roomName: "Room 201", quantity: 1, condition: "GOOD" }
        ],
        roomsBrokenStatus: []
    }
];

/**
 * Branch 2 - Furniture List
 */
const BRANCH_2_FURNITURE = [
    {
        furnitureId: 1,
        furnitureCode: "F00001",
        furnitorName: "King Bed",        // CÓ CÙNG FURNITURE ID VỚI BRANCH 1!
        type: "Premium",
        quantity: 3,                    // Nhưng số lượng khác (Room 301, 302, 304)
        totalRoomsWithThis: 3,
        roomsUsing: [
            { roomId: 6, roomName: "Room 301", quantity: 1, condition: "GOOD" },
            { roomId: 7, roomName: "Room 302", quantity: 1, condition: "GOOD" },
            { roomId: 9, roomName: "Room 304", quantity: 1, condition: "GOOD" }
        ],
        roomsBrokenStatus: []
    },
    {
        furnitureId: 2,
        furnitureCode: "F00002",
        furnitorName: "Working Desk",    // CÓ CÙNG FURNITURE ID VỚI BRANCH 1!
        type: "Standard",
        quantity: 2,
        totalRoomsWithThis: 2,
        roomsUsing: [
            { roomId: 6, roomName: "Room 301", quantity: 1, condition: "GOOD" },
            { roomId: 8, roomName: "Room 303", quantity: 1, condition: "GOOD" }
        ],
        roomsBrokenStatus: []
    },
    {
        furnitureId: 3,
        furnitureCode: "F00003",
        furnitorName: "Wardrobe",
        type: "Premium",
        quantity: 3,
        totalRoomsWithThis: 3,
        roomsUsing: [
            { roomId: 8, roomName: "Room 303", quantity: 1, condition: "NEED_REPAIR" },
            { roomId: 9, roomName: "Room 304", quantity: 1, condition: "GOOD" },
            { roomId: 10, roomName: "Room 305", quantity: 1, condition: "BROKEN" }
        ],
        roomsBrokenStatus: [
            { roomId: 8, roomName: "Room 303", condition: "NEED_REPAIR" },
            { roomId: 10, roomName: "Room 305", condition: "BROKEN" }
        ]
    }
];

// ========================================================
// FRONTEND TEST SCENARIOS
// ========================================================

/**
 * SCENARIO 1: User chọn "All branches"
 * Expected: View detail button DISABLED (greyed out, not clickable)
 * Message: "Please select a branch first"
 */
const SCENARIO_1 = {
    selectedBranch: "all",
    displayedFurniture: [
        ...BRANCH_1_FURNITURE,
        ...BRANCH_2_FURNITURE
    ],
    expectedBehavior: "View detail buttons are DISABLED",
    cursorStyle: "not-allowed",
    cssOpacity: 0.5
};

/**
 * SCENARIO 2: User chọn "Branch 1"
 * Expected: 
 *   - Table hiển thị: King Bed (qty 3), Working Desk (qty 3), Sofa Set (qty 3)
 *   - Click View detail trên King Bed
 *   - Modal hiển thị CHỈ phòng của Branch 1: Room 101, 102, 202
 */
const SCENARIO_2 = {
    selectedBranch: "Branch 1",
    displayedFurniture: BRANCH_1_FURNITURE,
    clickDetail: {
        furnitureId: 1,
        furnitorName: "King Bed"
    },
    modalContent: {
        id: 1,
        name: "King Bed",
        facility: "BRANCH 1",
        quantity: 3,
        inUse: 2,    // Room 101, 102
        inStock: 1,  // Room 202 (broken)
        broken: 1,
        roomsUsing: ["Room 101", "Room 102", "Room 202"],
        roomsBrokenStatus: {
            "NEED_REPAIR": ["Room 102"],
            "BROKEN": ["Room 202"]
        }
    }
};

/**
 * SCENARIO 3: User chọn "Branch 2"
 * Expected:
 *   - Table hiển thị: King Bed (qty 3), Working Desk (qty 2), Wardrobe (qty 3)
 *   - Click View detail trên King Bed
 *   - Modal hiển thị CHỈ phòng của Branch 2: Room 301, 302, 304
 *   - Lưu ý: King Bed id=1 ở cả 2 branch nhưng phòng khác!
 */
const SCENARIO_3 = {
    selectedBranch: "Branch 2",
    displayedFurniture: BRANCH_2_FURNITURE,
    clickDetail: {
        furnitureId: 1,
        furnitorName: "King Bed"  // CÙNG FURNITURE NHƯ SCENARIO 2 ĐÓ!
    },
    modalContent: {
        id: 1,
        name: "King Bed",
        facility: "BRANCH 2",
        quantity: 3,
        inUse: 3,    // Room 301, 302, 304 (all GOOD)
        inStock: 0,
        broken: 0,
        roomsUsing: ["Room 301", "Room 302", "Room 304"],
        roomsBrokenStatus: {
            "NEED_REPAIR": [],
            "BROKEN": []
        }
    }
};

// ========================================================
// COMPARISON: King Bed ở 2 Branch - KHÁC NHAU!
// ========================================================

const KING_BED_COMPARISON = {
    "furnitureId": 1,
    "furnitorName": "King Bed",
    "type": "Premium",
    
    "Branch 1": {
        "quantity": 3,
        "inUse": 2,
        "inStock": 1,
        "broken": 1,
        "roomsUsing": [
            "Room 101 (GOOD)",
            "Room 102 (NEED_REPAIR)",
            "Room 202 (BROKEN)"
        ]
    },
    
    "Branch 2": {
        "quantity": 3,
        "inUse": 3,
        "inStock": 0,
        "broken": 0,
        "roomsUsing": [
            "Room 301 (GOOD)",
            "Room 302 (GOOD)",
            "Room 304 (GOOD)"
        ]
    },
    
    "note": "Cùng furniture nhưng tập hợp phòng khác -> cần select branch trước!"
};

// ========================================================
// EXPORT CHO TESTING
// ========================================================

module.exports = {
    BRANCH_1_FURNITURE,
    BRANCH_2_FURNITURE,
    SCENARIO_1,
    SCENARIO_2,
    SCENARIO_3,
    KING_BED_COMPARISON
};

// ========================================================
// Testing Steps:
// ========================================================
/*
1. ✅ Setup database: Run testing_data_furniture_multibreath.sql
2. ✅ Check API Response:
   - GET /api/rooms-detail/furniture/branch/1
   - GET /api/rooms-detail/furniture/branch/2
3. ✅ Test Frontend UI:
   a) Chọn "All branches" -> Verify View detail button DISABLED
   b) Chọn "Branch 1" -> Click King Bed detail -> Verify only Branch 1 rooms (101, 102, 202)
   c) Chọn "Branch 2" -> Click King Bed detail -> Verify only Branch 2 rooms (301, 302, 304)
   d) Compare: King Bed có cùng ID nhưng khác phòng và số lượng 
4. ✅ Test Search:
   - Chọn "Branch 1" + search "King" -> Hiển thị King Bed của Branch 1 chỉ
   - Chọn "Branch 2" + search "King" -> Hiển thị King Bed của Branch 2 chỉ
*/
