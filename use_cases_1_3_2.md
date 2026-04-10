# 1.3.2 Use Cases (UC)

> Dựa trên phân tích toàn bộ source code FE (React) và BE (Spring Boot) của hệ thống AN-IHBMS.

---

## A. Authentication & Account Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-01 | Log In with Username/Password | Authentication | Staff, Manager, or Admin enters their username and password. The system verifies credentials, checks account status (Active/Deactive), and issues a JWT token containing role, branch, and permission claims used for all subsequent requests. |
| UC-02 | Log In with Google Account | Authentication | Staff, Manager, or Admin authenticates using their Google account via OAuth2. The system verifies the Google ID token, finds the matching registered user in the database, and issues a JWT session token if the account is active. |
| UC-03 | Log Out | Authentication | An authenticated user terminates their session. The client-side JWT token is cleared and the user is redirected to the login page. |
| UC-04 | Request Password Reset | Password Reset | A user who has forgotten their password enters their registered email address. The system generates a time-limited (15-minute) reset token and sends a reset link to the user's email via Email Service. |
| UC-05 | Reset Password via Email Link | Password Reset | A user clicks the password reset link from their email, enters a new password, and submits. The system validates the token's validity and expiry, updates the hashed password in the database, and invalidates the token. |
| UC-06 | View All Staff Accounts | Account Management | Admin or Manager views the paginated list of all system user accounts, with the ability to filter by branch, status (Active/Deactive), and full name. |
| UC-07 | Create Staff Account | Account Management | Admin or Manager creates a new user account by specifying the full name, username, email, role, assigned branch(es), and initial password. The system persists the new account with a BCrypt-hashed password. |
| UC-08 | Update Staff Account Information | Account Management | Admin or Manager edits the details of an existing staff account (e.g., full name, role, branch assignments). Changes are saved without modifying the existing password hash. |
| UC-09 | Activate / Deactivate Staff Account | Account Management | Admin or Manager toggles the status of a user account between Active and Deactive to grant or revoke system access without deleting the account record. |
| UC-10 | Delete Staff Account | Account Management | Admin or Manager permanently removes a staff account from the system. The operation is a soft delete (IsDeleted flag), preventing the account from logging in. |
| UC-11 | View & Update Personal Profile | Profile Management | Any authenticated user views their own profile information (full name, email, phone, avatar) and submits updates. Changes are persisted immediately. |
| UC-12 | Change Own Password | Profile Management | Any authenticated user changes their own password by providing the current password for verification and entering a new password. The system re-hashes and saves the new credential. |
| UC-13 | Upload Profile Avatar | Profile Management | Any authenticated user uploads a profile picture. The image is stored on Google Drive, and the drive file ID is saved in the user's profile record for retrieval via a proxy endpoint. |

---

## B. Branch Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-14 | View All Branches | Branch Management | Admin or Manager views the list of all hotel branches registered in the system, including branch name, address, and contact details. |
| UC-15 | Create Branch | Branch Management | Admin creates a new hotel branch by providing its name, address, and other details. The new branch is synchronized with the Channex.io channel manager to enable OTA integration. |
| UC-16 | Update Branch Information | Branch Management | Admin or Manager edits the details of an existing branch (name, address, contact). Changes are reflected across the system. |
| UC-17 | Delete Branch | Branch Management | Admin removes a hotel branch from the system. The operation also triggers a deletion sync with Channex.io. If the branch has active related data, deletion is blocked with a conflict error. |

---

## C. Room & Room Type Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-18 | View All Rooms | Room Management | Admin or Manager views the full paginated list of rooms across branches, filterable by status (Available, Occupied, Cleaning, Maintenance, Out of Order), branch, and search keyword. |
| UC-19 | View Room Details | Room Management | Admin or Manager opens the detail view for a specific room, displaying its current physical status, floor, room type, assigned furniture items with their statuses, and open incident reports. |
| UC-20 | Update Room Information | Room Management | Admin or Manager edits a room's basic information such as room name, floor number, or room type assignment. |
| UC-21 | Update Room Status | Room Management | Admin or Manager manually changes the operational status of a specific room (e.g., from Available to Maintenance). The change triggers a real-time event notification and syncs room-type inventory counts. |
| UC-22 | View Room Statistics | Room Management | Admin or Manager views an aggregated dashboard showing total rooms, counts per status, occupancy rate, total equipment count, and broken equipment count, optionally filtered by branch. |
| UC-23 | View All Room Types | Room Type Management | Admin or Manager views the list of all configured room types for a branch, including name, base price, bed type, capacity, and area. |
| UC-24 | Create Room Type | Room Type Management | Admin or Manager creates a new room type by specifying its name, base price, bed configuration, maximum adult/children capacity, area, description, and branch. The room type is also synced to Channex.io. |
| UC-25 | Update Room Type | Room Type Management | Admin or Manager modifies the details of an existing room type. Changes are persisted and optionally synced with OTA channels. |
| UC-26 | Delete Room Type | Room Type Management | Admin or Manager removes a room type. If rooms are still assigned to this type, the deletion is blocked. |
| UC-27 | Manage Price Modifiers | Price Management | Admin or Manager creates, edits, toggles, or deletes price adjustment rules (discounts, surcharges) for a specific room type, which dynamically affect the displayed booking price for guests. |

---

## D. Guest-Facing Booking Flow

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-28 | Search Available Rooms | Room Search | A Guest browses the hotel website and enters check-in/check-out dates, number of adults/children, and optionally selects room type filters. The system returns a paginated list of available room types with pricing calculated from base price and active price modifiers. |
| UC-29 | Create Online Booking | Online Booking | A Guest selects a room type and submits a booking request with personal details (name, email, phone) and stay dates. The system creates a booking record in "Pending Payment" status and returns a booking ID. |
| UC-30 | Pay for Booking Online | Payment | A Guest proceeds to payment for their confirmed booking. The system initiates a Stripe or SePay payment session. Upon successful payment (via webhook), the booking status transitions to "Confirmed." |
| UC-31 | View Booking History (Guest Portal) | Guest Booking Inquiry | A Guest enters their email to receive an OTP via email. After verifying the OTP, the guest receives a session token and can view their booking history, including status, dates, and branch information. |

---

## E. Staff / Front-Desk Booking Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-32 | View Front-Desk Booking Dashboard | Front Desk | Staff, Manager, or Admin opens the front-desk dashboard to see all bookings for a selected branch, filterable by status (Confirmed, Checked-In, etc.) and including a summary statistics panel (arrivals today, in-house guests, departures, etc.). |
| UC-33 | Create Walk-In Booking | Staff Booking | Staff creates a direct booking for a walk-in guest by entering guest details, selecting dates and room type. The system creates the booking in "Confirmed" status, bypassing the online payment flow. |
| UC-34 | Search Booking List | Booking Management | Staff, Manager, or Admin searches and filters the full booking list by status, branch, date range, or guest keyword, with paginated and sortable results. |
| UC-35 | View Booking Details | Booking Management | Staff, Manager, or Admin opens the detail view of a specific booking, showing guest information, room assignments, service orders, payment status, and a full booking timeline. |
| UC-36 | Update Booking Status | Booking Management | Admin or Manager manually changes a booking's workflow status (e.g., from Confirmed to Cancelled) to handle exception scenarios. |
| UC-37 | Cancel Booking | Booking Management | Staff, Manager, or Admin cancels a booking, transitioning it to "Cancelled" status. If applicable, the cancellation policy (e.g., no-refund window) is applied and communicated to the guest. |
| UC-38 | Search Guest by Phone | Guest Lookup | Staff searches for an existing guest profile by phone number to pre-fill booking information during walk-in booking creation. |

---

## F. Check-In Process

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-39 | Process Check-In | Check-In | Staff selects a confirmed booking from the front-desk dashboard and performs check-in. During check-in, the system assigns physical rooms, handles early check-in fees (distributed proportionally per room), updates booking status to "Checked-In," and decrements room-type inventory. |
| UC-40 | Upgrade Room During Check-In | Check-In | Staff selects a different (higher-tier) room type for a guest during check-in. The system verifies inventory availability for the new room type across all stay nights before confirming the upgrade. |
| UC-41 | Mark Guest as Arrived | Check-In | Staff records that a guest has physically arrived at the hotel and optionally logs a luggage storage note. Booking status is updated to "Arrived." |
| UC-42 | Update Guest Information | Check-In | Staff edits a guest's profile data (name, ID number, phone, email) after check-in to correct or supplement their reservation details. |
| UC-43 | Undo Check-In | Check-In | Staff reverses a completed check-in, restoring the booking to its prior state, releasing room assignments, and restoring inventory counts. |
| UC-44 | Mark Booking as No-Show | No-Show Management | Staff marks a booking as "No-Show" for guests who did not arrive. The booking status is updated accordingly. |
| UC-45 | Send No-Show Notification Email | No-Show Management | Staff triggers the system to send a no-show warning email to the guest via Email Service, informing them of their booking status without changing the booking status outright. |

---

## G. In-Stay Service Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-46 | View In-House Guests | In-Stay Management | Staff, Manager, or Admin views all bookings with "Checked-In" status (currently in-house) for a branch, used as the primary dashboard for managing active stays. |
| UC-47 | Add Service to Active Stay | In-Stay Management | Staff adds a service (e.g., laundry, spa, room service) to a guest's active stay. A service order is created and linked to the booking, generating a charge that will be included in the final invoice. |
| UC-48 | Cancel Service Order | In-Stay Management | Staff cancels a previously placed service order during the guest's stay (soft delete). The order is marked as cancelled and excluded from the final billing. |
| UC-49 | Change Guest's Room | In-Stay Management | Staff performs an in-stay room transfer by selecting a new available room. The system creates a room change record, adjusts nightly charges for each room period, and releases the original room. |
| UC-50 | Report Asset Damage | In-Stay Management | Staff records asset damage caused by a guest during their stay. A damage charge (specified amount) is added to the service order for inclusion in the final checkout invoice. |
| UC-51 | Send Checkout Reminder Email | Notification | Staff triggers the system to send a checkout reminder email to a guest (via Email Service) on or before their scheduled departure date. |

---

## H. Check-Out Process

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-52 | View Billing Summary | Check-Out | Staff opens the checkout billing screen for a specific booking, displaying a consolidated summary of all charges: room nights, services ordered, damage charges, early check-in fees, and any applicable late checkout fees. |
| UC-53 | View Room-Level Billing | Check-Out | Staff views a per-room breakdown of all charges within a booking, useful for split-payment or multiple-room scenarios. |
| UC-54 | Process Check-Out | Check-Out | Staff confirms checkout for a guest, selecting the payment method (Cash or Card). The system marks the booking as "Checked-Out," records the final payment transaction, and transitions all assigned rooms to "Cleaning" status for housekeeping. |

---

## I. Housekeeping

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-55 | View Housekeeping Room List | Housekeeping | Housekeeping staff, Staff, Manager, or Admin views the list of rooms requiring attention (e.g., in "Cleaning" status) for a given branch. Admins/Managers can select any branch; Housekeepers are restricted to their assigned branch. |
| UC-56 | Mark Room as Clean | Housekeeping | Housekeeping staff marks a room as cleaned. The room's physical status is updated from "Cleaning" to "Available," making it rentable again. |

---

## J. Room Maintenance & Furniture Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-57 | Update Room Furniture Status | Furniture Management | Admin or Manager updates the status (e.g., AVAILABLE, BROKEN, FAILED) or quantity of a furniture item assigned to a specific room. |
| UC-58 | Replace Broken Furniture from Inventory | Furniture Management | Admin or Manager replaces a broken or failed in-room furniture item by selecting a replacement from the warehouse inventory. Stock is decremented and the room's furniture record is updated. |
| UC-59 | Report Room Incident | Room Maintenance | Admin or Manager reports a maintenance incident for a room (e.g., plumbing issue, structural damage). The system creates an incident record and automatically transitions the room's status to "Maintenance." |
| UC-60 | View Room Incidents | Room Maintenance | Admin or Manager views the list of open and resolved incident reports for a specific room, used for maintenance tracking. |
| UC-61 | Close Room Incident | Room Maintenance | Admin or Manager resolves an incident by providing a resolution note, marking it as "Resolved." If no other open incidents exist, the system can recover the room to "Available" status. |
| UC-62 | Recover Room from Maintenance | Room Maintenance | Admin or Manager manually triggers the recovery of a room from "Maintenance" status back to "Available," contingent on all associated incidents being resolved. |
| UC-63 | Fix / Discard Broken Furniture | Furniture Management | Admin or Manager handles warehouse-failed furniture by either returning it to stock (fix) or permanently discarding it from the inventory and room assignment records. |

---

## K. Inventory Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-64 | Search Inventory | Inventory Management | Admin or Manager searches the inventory stock for a specific branch, filtering by keyword and in-stock status, to review current supply levels. |
| UC-65 | Import Consumable Stock | Inventory Management | Admin or Manager records a stock import, specifying items and quantities received. An import receipt is created and inventory counts are updated for the branch. |
| UC-66 | Import Furniture to Warehouse | Inventory Management | Admin or Manager adds new furniture units to the branch warehouse by creating a furniture import receipt. Items become available for room assignment. |
| UC-67 | View Import History | Inventory Management | Admin or Manager views the full history of past import receipts for a branch to track procurement activities. |
| UC-68 | Edit Import Receipt | Inventory Management | Admin or Manager edits a previously submitted import receipt within the allowed editable period (current month, before a monthly report is finalized). |
| UC-69 | Generate Monthly Inventory Report | Inventory Management | Admin or Manager generates a monthly inventory report for a branch and specific period, summarizing opening stock, imports, usage, and closing stock. |
| UC-70 | Save Monthly Inventory Report | Inventory Management | Admin or Manager saves (finalizes) the monthly inventory report. Once saved, import receipts for that period become locked and no longer editable. |

---

## L. Finance & Cashflow

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-71 | View Cashflow Transactions | Finance | Admin or Manager views a paginated list of all financial transactions for a selected branch and date range, filterable by payment method (Cash, Card, Online). |
| UC-72 | View Cashflow Summary | Finance | Admin or Manager views aggregated cashflow totals (total income, total expense, net balance) for a selected branch and date range, for a quick financial overview. |
| UC-73 | View Transaction Breakdown | Finance | Admin or Manager opens the detail view for a specific payment transaction, showing a line-by-line breakdown of what was charged (room nights, services, damage, fees). |

---

## M. Revenue Reporting

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-74 | View Monthly Room Revenue Report | Reporting | Admin or Manager views the monthly room revenue dashboard for a specific branch and month/year, including total revenue, average occupancy rate, revenue by room type, and booking source breakdown. |
| UC-75 | View Yearly Room Revenue Report | Reporting | Admin or Manager views the 12-month room revenue trend for a branch and year, allowing year-over-year comparison and forecasting. |
| UC-76 | View Yearly Revenue Dashboard (Multi-metric) | Reporting | Admin or Manager views a consolidated yearly dashboard for a branch combining room revenue, service revenue, and expense data for profit/loss analysis. |
| UC-77 | View Multi-Branch Revenue Comparison | Reporting | Admin views a side-by-side revenue comparison across multiple branches for a selected month or year, enabling performance benchmarking between hotel locations. |
| UC-78 | View Monthly Service Revenue Report | Reporting | Admin or Manager views revenue generated by each service category (F&B, Spa, Laundry, etc.) for a branch in a specific month. |
| UC-79 | View Yearly Service Revenue Report | Reporting | Admin or Manager views a 12-month trend of service revenue for a branch, presented per service category. |
| UC-80 | View Monthly Expense Report | Reporting | Admin or Manager views recorded operational expenses for a branch in a specific month (e.g., salaries, utilities, supplies costs). |
| UC-81 | View Yearly Expense Report | Reporting | Admin or Manager views 12-month expense data for a branch to identify cost trends and anomalies. |
| UC-82 | Record / Save Monthly Expenses | Reporting | Admin or Manager manually inputs or updates the expense entries for a branch's monthly report and saves them to the database for inclusion in profit calculations. |

---

## N. Service Catalog Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-83 | View Service Catalog | Service Management | Admin or Manager views the list of all available hotel services (e.g., Breakfast, Spa, Laundry) configured in the system, organized by category. |
| UC-84 | Create Service | Service Management | Admin or Manager adds a new service item to the catalog by specifying its name, category, unit price, and description. |
| UC-85 | Update Service | Service Management | Admin or Manager edits the details (name, price, category) of an existing service item. |
| UC-86 | Delete Service | Service Management | Admin or Manager permanently removes a service from the catalog. |
| UC-87 | Toggle Service Status | Service Management | Admin or Manager activates or deactivates a service item, controlling its visibility and availability for staff to add to guest stays. |

---

## O. Cancellation Policy Management

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-88 | View Cancellation Policies | Policy Management | Admin or Manager views all cancellation policy rules configured for a specific branch (e.g., "No refund within 24 hours of check-in"). |
| UC-89 | Create Cancellation Policy | Policy Management | Admin or Manager defines a new cancellation rule for a branch, specifying the penalty type, penalty value, and the time window before check-in within which the penalty applies. |
| UC-90 | Update Cancellation Policy | Policy Management | Admin or Manager edits the terms of an existing cancellation policy. |
| UC-91 | Toggle Cancellation Policy | Policy Management | Admin or Manager activates or deactivates a cancellation policy rule without deleting it. |
| UC-92 | Delete Cancellation Policy | Policy Management | Admin or Manager permanently removes a cancellation policy rule from the system. |

---

## P. OTA Channel Integration (Channex.io)

| ID | Use Case | Feature | Use Case Description |
|----|----------|---------|----------------------|
| UC-93 | Receive OTA Booking via Webhook | OTA Integration | The Channex.io channel manager sends a webhook event when an online booking is received from an OTA (e.g., Booking.com, Agoda). The system processes the payload and creates or updates the corresponding booking record in the internal database. |
| UC-94 | Sync Room Type Inventory to OTA | OTA Integration | When rooms are added, removed, or their status changes, the system automatically pushes updated room-type availability counts to Channex.io, ensuring OTA listings reflect real-time inventory. |

