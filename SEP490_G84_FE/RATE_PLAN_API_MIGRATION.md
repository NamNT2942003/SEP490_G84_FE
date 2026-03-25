# Rate Plan Conditions API - Migration Update

**Date**: March 25, 2026  
**Status**: ✅ COMPLETED

## Overview

API endpoints cho Rate Plan Conditions đã được cập nhật theo tài liệu mới, phân tách rõ 2 mục đích:
- **Management APIs**: Quản lý/tổ chức điều kiện của 1 rate plan
- **Booking APIs**: Tìm rate plan applicable theo ngày/số khách

---

## 1. Files Modified

### 1.1 `src/features/rate-plan-management/api/ratePlanConditionApi.js`

**Thay đổi:**
- ✅ Thêm constants: `MANAGEMENT_BASE` = `/management/rate-plans`, `BOOKING_BASE` = `/booking/rate-plans`
- ✅ Thêm function `normalizeRatePlan()` để parse rate plan response
- ✅ Thêm `listByRatePlanManagement(ratePlanId)` - NEW Management API
- ✅ Thêm `getApplicableRatePlans(queryParams)` - NEW Booking API
- ✅ Keep legacy methods (`listByRatePlan`, `listActiveByRatePlan`) để backward compatibility

**Response Format - Management:**
```javascript
// GET /api/management/rate-plans/{ratePlanId}/conditions
{
  success: true,
  viewType: "MANAGEMENT_CONDITION_LIST",
  ratePlanId: 1,
  conditions: [
    {
      conditionId: 10,
      conditionType: "ADVANCE_BOOKING",
      conditionMinValue: 7,
      conditionMaxValue: 14,
      dayOfWeek: null,
      startDate: null,
      endDate: null,
      occupancyCount: null,
      priorityOrder: 1,
      isActive: true
    }
  ],
  count: 1
}
```

**Response Format - Booking:**
```javascript
// GET /api/booking/rate-plans/applicable
{
  success: true,
  viewType: "BOOKING_APPLICABLE_RATE_PLANS",
  roomTypeId: 9,
  checkInDate: "2026-03-24",
  checkOutDate: "2026-03-25",
  guestCount: 1,
  strictMatching: false,
  ratePlans: [
    {
      ratePlanId: 1,
      name: "Standard Flexible",
      price: 1200000,
      cancellationType: "FLEXIBLE",
      freeCancelBeforeDays: 1,
      paymentType: "PAY_AT_HOTEL",
      priorityOrder: 1,
      conditionCount: 2
    }
  ],
  count: 1
}
```

---

### 1.2 `src/features/rate-plan-management/screens/RatePlanConditionManagement.jsx`

**Thay đổi:**
- ✅ `loadConditions()` function: Thay `ratePlanConditionApi.listByRatePlan()` → `ratePlanConditionApi.listByRatePlanManagement()`
- ✅ Tự động parse từ nested `conditions` field trong response

---

### 1.3 `src/constants/apiConfig.js`

**Thay đổi:**
- ✅ Thêm `RATE_PLAN_CONDITIONS.MANAGEMENT_CONDITIONS` = `/management/rate-plans/:ratePlanId/conditions`
- ✅ Thêm `RATE_PLAN_CONDITIONS.BOOKING_APPLICABLE` = `/booking/rate-plans/applicable`
- ✅ Keep legacy `RATE_PLAN_CONDITIONS.AVAILABLE` và `RATE_PLAN_CONDITIONS.BY_RATE_PLAN` (deprecated)

```javascript
RATE_PLAN_CONDITIONS: {
  // NEW: Management APIs
  MANAGEMENT_CONDITIONS: "/management/rate-plans/:ratePlanId/conditions",
  // NEW: Booking APIs
  BOOKING_APPLICABLE: "/booking/rate-plans/applicable",
  // LEGACY: deprecated endpoints (for backward compatibility)
  AVAILABLE: "/rate-plan-conditions/available",
  BASE: "/rate-plan-conditions",
  BY_RATE_PLAN: "/rate-plan-conditions/rate-plan",
},
```

---

### 1.4 `src/features/booking/api/roomService.js`

**Thay đổi:**
- ✅ `getAvailableRatePlans()` function: Thay `API_ENDPOINTS.RATE_PLAN_CONDITIONS.AVAILABLE` → `API_ENDPOINTS.RATE_PLAN_CONDITIONS.BOOKING_APPLICABLE`
- ✅ Thêm query param `strictMatching: false` (cho booking preview/management use case)
- ✅ Tự động parse từ nested `ratePlans` field trong response

---

## 2. API Endpoints Reference

### 2.1 Management - Get All Conditions of Rate Plan

```
GET /api/management/rate-plans/{ratePlanId}/conditions
```

**Path Params:**
- `ratePlanId` (int, required)

**Response:**
```javascript
{
  success: true,
  viewType: "MANAGEMENT_CONDITION_LIST",
  ratePlanId: 1,
  conditions: [...],
  count: 1
}
```

**Use Case:**
- Hiển thị danh sách condition trong trang quản lý
- Chỉnh sửa/xóa condition
- Drag-drop reorder priority

---

### 2.2 Booking - Get Applicable Rate Plans

```
GET /api/booking/rate-plans/applicable
```

**Query Params:**
- `roomTypeId` (int, required)
- `checkInDate` (string, required, format: yyyy-MM-dd)
- `checkOutDate` (string, required, format: yyyy-MM-dd)
- `guestCount` (int, optional, default: 1)
- `strictMatching` (boolean, optional, default: true)

**Response:**
```javascript
{
  success: true,
  viewType: "BOOKING_APPLICABLE_RATE_PLANS",
  roomTypeId: 9,
  checkInDate: "2026-03-24",
  checkOutDate: "2026-03-25",
  guestCount: 1,
  strictMatching: false,
  ratePlans: [...],
  count: 1
}
```

**Error Response (400):**
```javascript
{
  success: false,
  error: "INVALID_DATE_FORMAT",
  message: "checkInDate/checkOutDate phải theo định dạng yyyy-MM-dd"
}
```

**Use Case:**
- Tìm rate plan phù hợp theo ngày check-in/out và số khách
- `strictMatching=false`: Preview mode (trang quản lý)
- `strictMatching=true`: Booking mode (user booking page)

---

## 3. Curl Examples

### Management - List Conditions

```bash
curl -X GET "http://localhost:8081/api/management/rate-plans/1/conditions" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Booking - Get Applicable Rate Plans

```bash
curl -X GET "http://localhost:8081/api/booking/rate-plans/applicable?roomTypeId=9&checkInDate=2026-03-24&checkOutDate=2026-03-25&guestCount=1&strictMatching=false" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

## 4. Legacy Endpoints (Deprecated)

Các endpoint sau vẫn được hỗ trợ nhưng khuyến nghị migrate sang endpoint mới:

```
GET /api/rate-plan-conditions/rate-plan/{ratePlanId}      [DEPRECATED]
GET /api/rate-plan-conditions/available?...               [DEPRECATED]
GET /api/rate-plan-conditions/rate-plan/{ratePlanId}/active [DEPRECATED]
```

**Tại sao?**
- Cũ không rõ namespace (management vs booking)
- Response format khác (root array vs nested object)
- Khó maintain và extend cho tương lai

---

## 5. Frontend Code Migration Checklist

- [x] Update `ratePlanConditionApi.js` với Management & Booking APIs
- [x] Update `RatePlanConditionManagement.jsx` dùng `listByRatePlanManagement()`
- [x] Update `roomService.js` dùng `BOOKING_APPLICABLE`
- [x] Update `apiConfig.js` thêm endpoint constants mới
- [x] Test Management page (quản lý điều kiện)
- [x] Test Booking page (tìm kiếm phòng)
- [ ] Remove/deprecate legacy endpoint calls (if any)
- [ ] Update API documentation

---

## 6. Testing Checklist

### Management Page (/admin/rate-plan-conditions)

1. Chọn Branch → Room Type → Rate Plan
2. Verify GET request:
   ```
   GET /api/management/rate-plans/{ratePlanId}/conditions
   ```
3. Verify response parse từ `conditions` field
4. Verify hiển thị condition list, count, priority order

### Booking Page (/search-room)

1. Nhập check-in, check-out, guests
2. Verify GET request:
   ```
   GET /api/booking/rate-plans/applicable?roomTypeId=...&checkInDate=...&checkOutDate=...&guestCount=...&strictMatching=false
   ```
3. Verify response parse từ `ratePlans` field
4. Verify hiển thị applicable rate plans

### Error Handling

1. Test invalid date format → 400 error
2. Test missing roomTypeId → 400 error
3. Test network timeout → friendly error message
4. Test empty results → no rate plans message

---

## 7. Notes

- **Response Parsing**: FE tự động parse từ nested `conditions`/`ratePlans` field, không phải root array
- **Date Format**: ALWAYS use `yyyy-MM-dd` (ISO 8601) khi gửi/nhận date
- **Backward Compatibility**: Legacy methods vẫn hoạt động, có thể migrate dần
- **strictMatching**: 
  - `false` = ưu tiên hiển thị (preview mode, trang quản lý)
  - `true` = đủ điều kiện mới hiển thị (booking mode, user page)

---

## 8. Related Documents

- Rate Plan Conditions - FE API Contract
- ADMIN_REFACTOR_SUMMARY.md
- Search Room Implementation

---

**Status**: Ready for QA & Testing  
**Next Steps**: Verify with backend team API response format

