-- ===================================================================
-- DEMO DATA FOR ROOM MANAGEMENT SYSTEM
-- Generated for SEP490_G84 Hotel Management System
-- Date: March 11, 2026
-- ===================================================================

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM incidents WHERE room_id IS NOT NULL;
-- DELETE FROM room_furniture WHERE room_id IS NOT NULL;
-- DELETE FROM rooms WHERE branch_id IS NOT NULL;
-- DELETE FROM furniture_types WHERE id > 0;
-- DELETE FROM room_types WHERE id > 0;
-- DELETE FROM branches WHERE id > 0;

-- ===================================================================
-- 1. BRANCHES (Chi nhánh)
-- ===================================================================
INSERT INTO branches (id, branch_name, address, phone, email, created_at, updated_at) VALUES
(1, 'Central Branch', '123 Main Street, District 1, Ho Chi Minh City', '+84-28-1234-5678', 'central@hotel.com', NOW(), NOW()),
(2, 'North Branch', '456 Dong Da Street, Ba Dinh, Hanoi', '+84-24-2345-6789', 'north@hotel.com', NOW(), NOW()),
(3, 'South Branch', '789 Nguyen Hue Street, District 1, Ho Chi Minh City', '+84-28-3456-7890', 'south@hotel.com', NOW(), NOW());

-- ===================================================================
-- 2. ROOM TYPES (Loại phòng)
-- ===================================================================
INSERT INTO room_types (id, type_name, description, base_price, max_capacity, amenities, created_at, updated_at) VALUES
(1, 'STANDARD', 'Standard Room with basic amenities', 500000.00, 2, 'Air Conditioning, TV, Wi-Fi, Private Bathroom', NOW(), NOW()),
(2, 'SUPERIOR', 'Superior Room with enhanced comfort', 750000.00, 2, 'Air Conditioning, Smart TV, Wi-Fi, Private Bathroom, Mini Fridge', NOW(), NOW()),
(3, 'DELUXE', 'Deluxe Room with premium amenities', 1000000.00, 3, 'Air Conditioning, Smart TV, Wi-Fi, Private Bathroom, Mini Fridge, Balcony', NOW(), NOW()),
(4, 'SUITE', 'Luxury Suite with separate living area', 1500000.00, 4, 'Air Conditioning, Smart TV, Wi-Fi, Private Bathroom, Mini Fridge, Balcony, Living Room', NOW(), NOW());

-- ===================================================================
-- 3. FURNITURE TYPES (Loại đồ nội thất)
-- ===================================================================
INSERT INTO furniture_types (id, type_name, category, description, created_at, updated_at) VALUES
(1, 'Single Bed', 'FURNITURE', 'Standard single bed with mattress', NOW(), NOW()),
(2, 'Double Bed', 'FURNITURE', 'Double bed with premium mattress', NOW(), NOW()),
(3, 'Desk Chair', 'FURNITURE', 'Ergonomic office chair', NOW(), NOW()),
(4, 'Work Desk', 'FURNITURE', 'Wooden work desk with drawers', NOW(), NOW()),
(5, 'Wardrobe', 'FURNITURE', 'Large wardrobe with hangers', NOW(), NOW()),
(6, 'Air Conditioner', 'ELECTRICAL', 'Split-type air conditioning unit', NOW(), NOW()),
(7, 'Television', 'ELECTRICAL', 'Smart TV with cable connection', NOW(), NOW()),
(8, 'Mini Fridge', 'ELECTRICAL', 'Compact refrigerator', NOW(), NOW()),
(9, 'Table Lamp', 'ELECTRICAL', 'Bedside reading lamp', NOW(), NOW()),
(10, 'Curtains', 'TEXTILE', 'Blackout curtains for privacy', NOW(), NOW()),
(11, 'Pillows', 'TEXTILE', 'Comfortable sleeping pillows', NOW(), NOW()),
(12, 'Blankets', 'TEXTILE', 'Warm blankets for comfort', NOW(), NOW()),
(13, 'Towel Set', 'TEXTILE', 'Bath and face towels', NOW(), NOW()),
(14, 'Bedsheets', 'TEXTILE', 'High-quality cotton bedsheets', NOW(), NOW());

-- ===================================================================
-- 4. ROOMS (Phòng) - Mixed status for demo
-- ===================================================================
INSERT INTO rooms (id, room_name, room_number, floor, room_type_id, branch_id, status, max_capacity, current_price, description, created_at, updated_at) VALUES
-- Central Branch - Floor 1
(101, 'B1-101', '101', 1, 1, 1, 'AVAILABLE', 2, 500000.00, 'Standard room on first floor', NOW(), NOW()),
(102, 'B1-102', '102', 1, 1, 1, 'OCCUPIED', 2, 500000.00, 'Standard room on first floor', NOW(), NOW()),
(103, 'B1-103', '103', 1, 1, 1, 'MAINTENANCE', 2, 500000.00, 'Standard room on first floor - under maintenance', NOW(), NOW()),
(104, 'B1-104', '104', 1, 2, 1, 'AVAILABLE', 2, 750000.00, 'Superior room on first floor', NOW(), NOW()),
(105, 'B1-105', '105', 1, 2, 1, 'CLEANING', 2, 750000.00, 'Superior room on first floor - being cleaned', NOW(), NOW()),

-- Central Branch - Floor 2
(201, 'B2-101', '201', 2, 2, 1, 'OCCUPIED', 2, 750000.00, 'Superior room on second floor', NOW(), NOW()),
(202, 'B2-102', '202', 2, 2, 1, 'AVAILABLE', 2, 750000.00, 'Superior room on second floor', NOW(), NOW()),
(203, 'B2-103', '203', 2, 3, 1, 'MAINTENANCE', 3, 1000000.00, 'Deluxe room on second floor - equipment issues', NOW(), NOW()),
(204, 'B2-104', '204', 2, 3, 1, 'AVAILABLE', 3, 1000000.00, 'Deluxe room on second floor', NOW(), NOW()),
(205, 'B2-105', '205', 2, 4, 1, 'OCCUPIED', 4, 1500000.00, 'Luxury suite on second floor', NOW(), NOW()),

-- Central Branch - Floor 3
(301, 'B3-101', '301', 3, 3, 1, 'AVAILABLE', 3, 1000000.00, 'Deluxe room on third floor', NOW(), NOW()),
(302, 'B3-102', '302', 3, 3, 1, 'CLEANING', 3, 1000000.00, 'Deluxe room on third floor - post-checkout cleaning', NOW(), NOW()),
(303, 'B3-103', '303', 3, 4, 1, 'AVAILABLE', 4, 1500000.00, 'Luxury suite on third floor', NOW(), NOW()),

-- North Branch - Sample rooms
(401, 'N1-101', '101', 1, 1, 2, 'AVAILABLE', 2, 500000.00, 'Standard room - North branch', NOW(), NOW()),
(402, 'N1-102', '102', 1, 1, 2, 'OCCUPIED', 2, 500000.00, 'Standard room - North branch', NOW(), NOW()),
(403, 'N1-103', '103', 1, 2, 2, 'MAINTENANCE', 2, 750000.00, 'Superior room - North branch, AC repair needed', NOW(), NOW()),

-- South Branch - Sample rooms  
(501, 'S1-101', '101', 1, 1, 3, 'AVAILABLE', 2, 500000.00, 'Standard room - South branch', NOW(), NOW()),
(502, 'S1-102', '102', 1, 2, 3, 'OCCUPIED', 2, 750000.00, 'Superior room - South branch', NOW(), NOW());

-- ===================================================================
-- 5. ROOM FURNITURE (Đồ nội thất trong phòng)
-- ===================================================================

-- Room 101 (AVAILABLE) - Standard setup, all good condition
INSERT INTO room_furniture (id, room_id, furniture_type_id, quantity, condition_status, purchase_date, warranty_expiry, notes, created_at, updated_at) VALUES
(1, 101, 1, 2, 'GOOD', '2024-01-15', '2027-01-15', 'Two single beds in excellent condition', NOW(), NOW()),
(2, 101, 4, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Work desk in good condition', NOW(), NOW()),
(3, 101, 3, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Desk chair in good condition', NOW(), NOW()),
(4, 101, 5, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Large wardrobe functioning well', NOW(), NOW()),
(5, 101, 6, 1, 'GOOD', '2024-01-15', '2027-01-15', 'AC unit working perfectly', NOW(), NOW()),
(6, 101, 7, 1, 'GOOD', '2024-01-15', '2027-01-15', '32-inch smart TV', NOW(), NOW()),
(7, 101, 9, 2, 'GOOD', '2024-01-15', '2027-01-15', 'Two bedside lamps', NOW(), NOW()),
(8, 101, 10, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Blackout curtains', NOW(), NOW()),
(9, 101, 11, 4, 'GOOD', '2024-06-01', NULL, 'Four comfortable pillows', NOW(), NOW()),
(10, 101, 12, 2, 'GOOD', '2024-06-01', NULL, 'Two warm blankets', NOW(), NOW()),
(11, 101, 14, 1, 'GOOD', '2024-06-01', NULL, 'Fresh bedsheet set', NOW(), NOW());

-- Room 102 (OCCUPIED) - Standard setup, minor issues
INSERT INTO room_furniture (id, room_id, furniture_type_id, quantity, condition_status, purchase_date, warranty_expiry, notes, created_at, updated_at) VALUES
(12, 102, 1, 2, 'GOOD', '2024-01-15', '2027-01-15', 'Two single beds', NOW(), NOW()),
(13, 102, 4, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Work desk', NOW(), NOW()),
(14, 102, 3, 1, 'AVERAGE', '2024-01-15', '2027-01-15', 'Chair needs cushion replacement', NOW(), NOW()),
(15, 102, 5, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Wardrobe', NOW(), NOW()),
(16, 102, 6, 1, 'GOOD', '2024-01-15', '2027-01-15', 'AC working well', NOW(), NOW()),
(17, 102, 7, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'TV remote not working, screen flickering', NOW(), NOW()),
(18, 102, 9, 2, 'GOOD', '2024-01-15', '2027-01-15', 'Bedside lamps', NOW(), NOW());

-- Room 103 (MAINTENANCE) - Multiple broken items
INSERT INTO room_furniture (id, room_id, furniture_type_id, quantity, condition_status, purchase_date, warranty_expiry, notes, created_at, updated_at) VALUES
(19, 103, 1, 2, 'GOOD', '2024-01-15', '2027-01-15', 'Beds are fine', NOW(), NOW()),
(20, 103, 4, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'Desk drawer handle broken', NOW(), NOW()),
(21, 103, 3, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'Chair wheel broken, unstable', NOW(), NOW()),
(22, 103, 5, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Wardrobe', NOW(), NOW()),
(23, 103, 6, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'AC not cooling, needs repair', NOW(), NOW()),
(24, 103, 7, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'TV completely dead, no power', NOW(), NOW()),
(25, 103, 9, 2, 'BROKEN', '2024-01-15', '2027-01-15', 'Both lamps not working - electrical issue', NOW(), NOW());

-- Room 104 (AVAILABLE) - Superior room, mostly good
INSERT INTO room_furniture (id, room_id, furniture_type_id, quantity, condition_status, purchase_date, warranty_expiry, notes, created_at, updated_at) VALUES
(26, 104, 2, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Double bed in excellent condition', NOW(), NOW()),
(27, 104, 4, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Premium work desk', NOW(), NOW()),
(28, 104, 3, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Ergonomic chair', NOW(), NOW()),
(29, 104, 5, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Large wardrobe', NOW(), NOW()),
(30, 104, 6, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Premium AC unit', NOW(), NOW()),
(31, 104, 7, 1, 'GOOD', '2024-01-15', '2027-01-15', '43-inch smart TV', NOW(), NOW()),
(32, 104, 8, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Mini fridge with snacks', NOW(), NOW()),
(33, 104, 9, 2, 'GOOD', '2024-01-15', '2027-01-15', 'Designer bedside lamps', NOW(), NOW());

-- Room 105 (CLEANING) - Superior room with recent cleaning issues
INSERT INTO room_furniture (id, room_id, furniture_type_id, quantity, condition_status, purchase_date, warranty_expiry, notes, created_at, updated_at) VALUES
(34, 105, 2, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Double bed', NOW(), NOW()),
(35, 105, 4, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Work desk', NOW(), NOW()),
(36, 105, 6, 1, 'GOOD', '2024-01-15', '2027-01-15', 'AC working well', NOW(), NOW()),
(37, 105, 7, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Smart TV', NOW(), NOW()),
(38, 105, 8, 1, 'AVERAGE', '2024-01-15', '2027-01-15', 'Mini fridge needs cleaning - odor inside', NOW(), NOW());

-- Room 201 (OCCUPIED) - Superior room, mixed conditions
INSERT INTO room_furniture (id, room_id, furniture_type_id, quantity, condition_status, purchase_date, warranty_expiry, notes, created_at, updated_at) VALUES
(39, 201, 2, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Double bed', NOW(), NOW()),
(40, 201, 4, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Work desk', NOW(), NOW()),
(41, 201, 6, 1, 'AVERAGE', '2024-01-15', '2027-01-15', 'AC making noise but cooling', NOW(), NOW()),
(42, 201, 7, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Smart TV working perfectly', NOW(), NOW()),
(43, 201, 8, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Mini fridge', NOW(), NOW());

-- Room 203 (MAINTENANCE) - Deluxe room with serious issues
INSERT INTO room_furniture (id, room_id, furniture_type_id, quantity, condition_status, purchase_date, warranty_expiry, notes, created_at, updated_at) VALUES
(44, 203, 2, 1, 'GOOD', '2024-01-15', '2027-01-15', 'Premium double bed', NOW(), NOW()),
(45, 203, 4, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'Desk surface damaged by water', NOW(), NOW()),
(46, 203, 6, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'AC compressor failed, no cooling', NOW(), NOW()),
(47, 203, 7, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'TV screen cracked', NOW(), NOW()),
(48, 203, 8, 1, 'BROKEN', '2024-01-15', '2027-01-15', 'Mini fridge not working - electrical problem', NOW(), NOW());

-- ===================================================================
-- 6. INCIDENTS/ISSUES (Sự cố được báo cáo)
-- ===================================================================
INSERT INTO incidents (id, room_id, title, description, reported_by, reported_at, severity, category, status, resolved_at, resolution_notes, created_at, updated_at) VALUES
(1, 102, 'TV Remote Malfunction', 'Guest reported that TV remote is not responding properly. TV screen also shows flickering issues.', 'Admin', '2024-03-10 14:30:00', 'MEDIUM', 'EQUIPMENT', 'REPORTED', NULL, NULL, NOW(), NOW()),
(2, 103, 'Multiple Equipment Failures', 'Room has multiple broken items: AC not cooling, TV completely dead, desk drawer handle broken, chair unstable, and both bedside lamps not working.', 'Maintenance Staff', '2024-03-09 10:15:00', 'HIGH', 'EQUIPMENT', 'IN_PROGRESS', NULL, 'Technician assigned, parts ordered', NOW(), NOW()),
(3, 103, 'Electrical Issues', 'Suspected electrical problem - multiple devices not working. May need rewiring.', 'Maintenance Staff', '2024-03-09 10:30:00', 'HIGH', 'ELECTRICAL', 'REPORTED', NULL, NULL, NOW(), NOW()),
(4, 105, 'Mini Fridge Odor', 'Previous guest left food items that spoiled. Strong odor coming from mini fridge.', 'Housekeeping', '2024-03-11 08:45:00', 'MEDIUM', 'CLEANLINESS', 'IN_PROGRESS', NULL, 'Deep cleaning in progress', NOW(), NOW()),
(5, 201, 'AC Making Noise', 'Air conditioner is making unusual rattling noise but still cooling. Guest is slightly disturbed.', 'Guest Services', '2024-03-11 16:20:00', 'LOW', 'EQUIPMENT', 'REPORTED', NULL, NULL, NOW(), NOW()),
(6, 203, 'Water Damage', 'Desk surface damaged due to leaking from floor above. Multiple equipment affected.', 'Maintenance Staff', '2024-03-08 12:00:00', 'HIGH', 'STRUCTURAL', 'IN_PROGRESS', NULL, 'Water leak fixed, equipment replacement needed', NOW(), NOW()),
(7, 203, 'TV Screen Cracked', 'TV screen has large crack, possibly from water damage incident.', 'Maintenance Staff', '2024-03-08 12:15:00', 'HIGH', 'EQUIPMENT', 'REPORTED', NULL, NULL, NOW(), NOW()),
(8, 203, 'Electrical Equipment Failure', 'Mini fridge and other electrical equipment stopped working after water incident.', 'Maintenance Staff', '2024-03-08 12:30:00', 'HIGH', 'ELECTRICAL', 'REPORTED', NULL, NULL, NOW(), NOW());

-- ===================================================================
-- 7. UPDATE ROOM STATISTICS BASED ON FURNITURE CONDITIONS
-- ===================================================================

-- Update room statistics to reflect furniture conditions
-- This would typically be handled by triggers or scheduled jobs

-- ===================================================================
-- 8. SAMPLE USERS (Optional - for reports and assignments)
-- ===================================================================
INSERT INTO users (id, username, email, full_name, role, phone, branch_id, created_at, updated_at, is_active) VALUES
(1, 'admin', 'admin@hotel.com', 'System Administrator', 'ADMIN', '+84-90-1234-567', 1, NOW(), NOW(), true),
(2, 'maintenance_central', 'maintenance.central@hotel.com', 'Maintenance Staff', 'MAINTENANCE', '+84-90-2345-678', 1, NOW(), NOW(), true),
(3, 'housekeeping_central', 'housekeeping.central@hotel.com', 'Housekeeping Manager', 'HOUSEKEEPING', '+84-90-3456-789', 1, NOW(), NOW(), true),
(4, 'reception_central', 'reception.central@hotel.com', 'Reception Staff', 'RECEPTION', '+84-90-4567-890', 1, NOW(), NOW(), true);

-- ===================================================================
-- DATA SUMMARY
-- ===================================================================
-- Branches: 3 (Central, North, South)
-- Room Types: 4 (Standard, Superior, Deluxe, Suite)
-- Rooms: 15 total
--   - Available: 7 rooms
--   - Occupied: 4 rooms  
--   - Cleaning: 2 rooms
--   - Maintenance: 2 rooms
-- Furniture Items: 48 total
--   - Good condition: 31 items
--   - Average condition: 3 items
--   - Broken condition: 14 items
-- Incidents: 8 reported issues
-- Users: 4 staff members

-- ===================================================================
-- NOTES FOR FRONTEND TESTING
-- ===================================================================
-- 1. Room 103 has the most issues (5 broken items)
-- 2. Room 203 has water damage with multiple electrical failures
-- 3. Mixed status rooms provide realistic testing scenarios
-- 4. Different severity levels for incidents
-- 5. Realistic furniture quantities per room type
-- 6. Proper foreign key relationships maintained

SELECT 'Demo data inserted successfully!' as status;