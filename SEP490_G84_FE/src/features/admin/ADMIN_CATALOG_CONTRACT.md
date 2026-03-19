# Admin Catalog FE Contract

## Base API
- Branch: `/api/branches`
- Room Type: `/api/room-types`
- Rate Plan: `/api/admin/rate-plans`
- Inventory: `/api/admin/room-type-inventories`

## Dependency Flow
1. Load branches
2. Select branch -> load room types by branch
3. Select room type -> load rate plans by room type
4. Select room type (+ optional rate plan) -> load inventories

## Validation Rules (FE)
- Branch: `branchName` required
- Room Type: `branchId`, `name` required
- Rate Plan: `roomTypeId`, `name` required
- Inventory:
  - `roomTypeId` required
  - if `workDate` empty, `fromDate` and `toDate` required
  - `toDate >= fromDate`

## Error Handling
- API error shape supported:
  - `{ "error": "..." }`
  - `{ "message": "..." }`
  - plain string body
- FE utility: `src/utils/apiError.js`

