# Quick Reference - Rate Plan Conditions API

## 📋 Before vs After

| Purpose | OLD Endpoint | NEW Endpoint | Namespace |
|---------|-------------|-------------|-----------|
| Quản lý condition | `/rate-plan-conditions/rate-plan/{ratePlanId}` | `/management/rate-plans/{ratePlanId}/conditions` | Management |
| Tìm rate plan | `/rate-plan-conditions/available?...` | `/booking/rate-plans/applicable?...` | Booking |

---

## 🎯 API Endpoints Cheat Sheet

### Management: List Conditions of 1 Rate Plan

```
GET /api/management/rate-plans/1/conditions
```

**Response:**
```json
{
  "success": true,
  "viewType": "MANAGEMENT_CONDITION_LIST",
  "ratePlanId": 1,
  "conditions": [
    {
      "conditionId": 10,
      "conditionType": "ADVANCE_BOOKING",
      "conditionMinValue": 7,
      "conditionMaxValue": 14,
      "priorityOrder": 1,
      "isActive": true
    }
  ],
  "count": 1
}
```

---

### Booking: Get Applicable Rate Plans

```
GET /api/booking/rate-plans/applicable?roomTypeId=9&checkInDate=2026-03-24&checkOutDate=2026-03-25&guestCount=1&strictMatching=false
```

**Response:**
```json
{
  "success": true,
  "viewType": "BOOKING_APPLICABLE_RATE_PLANS",
  "roomTypeId": 9,
  "checkInDate": "2026-03-24",
  "checkOutDate": "2026-03-25",
  "guestCount": 1,
  "strictMatching": false,
  "ratePlans": [
    {
      "ratePlanId": 1,
      "name": "Standard Flexible",
      "price": 1200000,
      "cancellationType": "FLEXIBLE",
      "freeCancelBeforeDays": 1,
      "paymentType": "PAY_AT_HOTEL",
      "priorityOrder": 1,
      "conditionCount": 2
    }
  ],
  "count": 1
}
```

---

## 🔧 FE Code Usage

### Management Page (Trang quản lý condition)

```javascript
// OLD WAY (deprecated):
const conditions = await ratePlanConditionApi.listByRatePlan(ratePlanId);

// NEW WAY:
const conditions = await ratePlanConditionApi.listByRatePlanManagement(ratePlanId);
// FE tự động parse từ response.data.conditions
```

### Booking Page (Tìm phòng)

```javascript
// OLD WAY (deprecated):
const result = await roomService.getAvailableRatePlans({ roomTypeId, checkInDate, checkOutDate, guestCount });

// NEW WAY: (tự động update)
// Sử dụng strictMatching=false cho preview/management
const result = await roomService.getAvailableRatePlans({ roomTypeId, checkInDate, checkOutDate, guestCount });
// FE tự động parse từ response.data.ratePlans
```

---

## 📝 Query Parameters

| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `roomTypeId` | int | ✅ | - | Loại phòng |
| `checkInDate` | string | ✅ | - | Format: `yyyy-MM-dd` |
| `checkOutDate` | string | ✅ | - | Format: `yyyy-MM-dd` |
| `guestCount` | int | ❌ | 1 | Số khách |
| `strictMatching` | boolean | ❌ | true | false=preview, true=booking |

---

## ✅ Response Parsing

### Management Response

```javascript
// Backend returns:
{
  "success": true,
  "ratePlanId": 1,
  "conditions": [ ... ],  // ← NESTED in "conditions" field
  "count": 1
}

// FE automatically gets:
conditions = response.data.conditions  // ← listByRatePlanManagement() handles this
```

### Booking Response

```javascript
// Backend returns:
{
  "success": true,
  "ratePlans": [ ... ],  // ← NESTED in "ratePlans" field
  "count": 1
}

// FE automatically gets:
ratePlans = response.data.ratePlans  // ← roomService.getAvailableRatePlans() handles this
```

---

## 🚨 Common Errors

### 400 - Invalid Date Format
```json
{
  "success": false,
  "error": "INVALID_DATE_FORMAT",
  "message": "checkInDate/checkOutDate phải theo định dạng yyyy-MM-dd"
}
```
**Fix**: Ensure dates are in `YYYY-MM-DD` format (ISO 8601)

### 400 - Missing Required Param
**Fix**: Verify all required params are provided (roomTypeId, checkInDate, checkOutDate)

### 404 - Rate Plan Not Found
**Fix**: Verify ratePlanId exists in database

---

## 🔄 strictMatching Parameter

| Value | Use Case | Behavior |
|-------|----------|----------|
| `false` | Preview/Management trang | Ưu tiên hiển thị nhiều rate plan hơn |
| `true` | User Booking page | Chỉ hiển thị rate plan đủ điều kiện |

---

## 📂 Files Updated

```
src/features/rate-plan-management/api/ratePlanConditionApi.js
  └─ Added: listByRatePlanManagement()
  └─ Added: getApplicableRatePlans()

src/features/rate-plan-management/screens/RatePlanConditionManagement.jsx
  └─ Updated: loadConditions() uses listByRatePlanManagement()

src/constants/apiConfig.js
  └─ Added: RATE_PLAN_CONDITIONS.MANAGEMENT_CONDITIONS
  └─ Added: RATE_PLAN_CONDITIONS.BOOKING_APPLICABLE

src/features/booking/api/roomService.js
  └─ Updated: getAvailableRatePlans() uses BOOKING_APPLICABLE endpoint
```

---

## 🧪 Quick Test

### Terminal Test (Curl)

```bash
# Test Management API
curl "http://localhost:8081/api/management/rate-plans/1/conditions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Booking API
curl "http://localhost:8081/api/booking/rate-plans/applicable?roomTypeId=9&checkInDate=2026-03-24&checkOutDate=2026-03-25&strictMatching=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Browser DevTools Test

1. Open Network tab (F12)
2. Go to Admin Rate Plan Condition page
3. Check requests for: `/management/rate-plans/*/conditions`
4. Go to Booking/Search page
5. Check requests for: `/booking/rate-plans/applicable?...`

---

## 📞 Support

**Issues?**
- Check request URL in DevTools Network tab
- Verify date format is `yyyy-MM-dd`
- Ensure Authorization token is valid
- Verify backend is returning nested response format

**Documentation:**
- RATE_PLAN_API_MIGRATION.md (full reference)
- Rate Plan Conditions - FE API Contract (backend spec)

