import { Routes, Route, Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser.js";

// =====================================================================
// --- 1. LAYOUTS ---
// =====================================================================
import MainLayout from "@/components/layout/MainLayout";
import ClientLayout from '@/components/layout/ClientLayout';

// =====================================================================
// --- 2. PUBLIC / HOME PAGES ---
// =====================================================================
import HomePage from "@/features/home/screens/HomePage.jsx";
import AboutPage from "@/features/home/screens/AboutPage.jsx";
import ContactPage from "@/features/home/screens/ContactPage.jsx";

// =====================================================================
// --- 3. AUTH & GUEST PAGES ---
// =====================================================================
import Login from "@/features/auth/screens/Login";
import ForgotPassword from "@/features/auth/screens/ForgotPassword";
import ResetPassword from "@/features/auth/screens/ResetPassword";
import GuestAccessPage from "@/features/guest/screens/GuestAccessPage.jsx";
import GuestBookingHistoryPage from "@/features/guest/screens/GuestBookingHistoryPage.jsx";

// =====================================================================
// --- 4. BOOKING & PAYMENT PAGES ---
// =====================================================================
import SearchRoom from "@/features/booking/screens/SearchRoom.jsx";
import BookingSummary from "@/features/booking/components/BookingSummary";
import GuestInformation from "@/features/booking/screens/GuestInformation";
import PaymentSelection from "@/features/payment/screens/PaymentSelection.jsx";
import PaymentResult from "@/features/payment/screens/PaymentResult.jsx";

// =====================================================================
// --- 5. DASHBOARD, CORE & OPERATIONS ---
// =====================================================================
import Dashboard from "@/features/dashboard/screens/Dashboard";
import BookingManagement from "@/features/booking-management/screens/BookingManagement.jsx";
import FrontDeskDashboard from "@/features/manager_booking/screens/FrontDeskDashboard";
import StayScreen from "@/features/stay/screens/StayScreen";
import { HousekeepingDashboard } from "@/features/housekeeping/component/HousekeepingDashboard.jsx";

// =====================================================================
// --- 6. ADMIN & MANAGEMENT PAGES ---
// =====================================================================
import RoomManagement from "@/features/roomManagement/screens/RoomManagement";
import FurnitureManagement from "@/features/roomManagement/screens/FurnitureManagement";
import BranchManagement from "@/features/branch-management/screens/BranchManagement.jsx";
import RoomTypeManagement from "@/features/room-type-management/screens/RoomTypeManagement.jsx";
import RoomInventoryManagement from "@/features/room-inventory-management/screens/RoomInventoryManagement.jsx";
import PriceModifierManagement from "@/features/price-modifiers/screens/PriceModifierManagement.jsx";
import RefundPolicyManagement from "@/features/refund-policy/screens/RefundPolicyManagement.jsx";
import ServiceList from '@/features/services/screens/ServiceList';

// =====================================================================
// --- 7. INVENTORY, FINANCE & REPORTS ---
// =====================================================================
// Inventory (Chuẩn)
import InventoryScreen from "@/features/inventory/screens/InventoryScreen.jsx";
// Furniture Inventory (Giữ lại từ file cũ để không sót tính năng)

import InventoryReport from "@/features/furniture/screens/InventoryReport";
import FurnitureInventory from "@/features/furniture/screens/FurnitureInventory";
import ImportHistory from "@/features/furniture/screens/ImportHistory";
// Finance & Reports
import CashflowScreen from "@/features/finance/screens/CashflowScreen.jsx";
import RevenueCollectionScreen from "@/features/finance/screens/RevenueCollectionScreen.jsx";
import ServiceRevenueReportScreen from "@/features/report/screens/ServiceRevenueReportScreen.jsx";
import RevenueReportScreen from "@/features/report/screens/RevenueReportScreen.jsx";
import ExpenseReportScreen from "@/features/report/screens/ExpenseReportScreen.jsx";
import AggregatedReportScreen from "@/features/report/screens/AggregatedReportScreen.jsx";
import MultiBranchReportScreen from "@/features/report/screens/MultiBranchReportScreen.jsx";
import ReportDetailScreen from "@/features/report/screens/ReportDetailScreen.jsx";

// =====================================================================
// --- 8. ACCOUNTS & PROFILE ---
// =====================================================================
import AccountList from '@/features/accounts/screens/AccountList';
import UserDetail from '@/features/accounts/screens/UserDetail';
import EditStaff from '@/features/accounts/screens/EditStaff';
import CreateAccount from '@/features/accounts/screens/CreateAccount';
import UserProfile from '@/features/profile/screens/UserProfile';
import UpdateProfile from '@/features/profile/screens/UpdateProfile';

// =====================================================================
// --- 9. TEST / BOOTSTRAP PAGES (DEV ONLY) ---
// =====================================================================
import ImportInventoryBootstrap from "@/features/test/ImportInventoryBootstrap.jsx";
import MonthlyReportBootstrap from "@/features/test/MonthlyReportBootstrap.jsx";
import ExcelToWebReport from "@/features/test/ExcelToWebReport.jsx";
import ImportReceiptUI from "@/features/test/ImportReceiptUI.jsx";
import InventoryReportPage from "@/features/test/InventoryReportPage";

/**
 * ProtectedRoute: Requires user to be authenticated.
 * Redirects to /login if no valid token exists.
 */
const ProtectedRoute = ({ children }) => {
    const currentUser = useCurrentUser();
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

/**
 * RequireManagerOrAdmin: Only allows ADMIN and MANAGER roles.
 * Must be used inside ProtectedRoute (user is guaranteed to exist).
 */
const RequireManagerOrAdmin = ({ children }) => {
    const currentUser = useCurrentUser();
    // Must be authenticated
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    // Only ADMIN and MANAGER are allowed
    const role = currentUser.role?.toUpperCase();
    if (role === 'ADMIN' || role === 'MANAGER') {
        return children;
    }
    return <Navigate to="/dashboard" replace />;
};

const AppRouter = () => {
    return (
        <Routes>
            {/* --- NHÓM 1: CÁC TRANG PUBLIC & GUEST (Client Layout) --- */}
            <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
            <Route path="/about" element={<ClientLayout><AboutPage /></ClientLayout>} />
            <Route path="/contact" element={<ClientLayout><ContactPage /></ClientLayout>} />
            <Route path="/guest-access" element={<ClientLayout><GuestAccessPage /></ClientLayout>} />
            <Route path="/guest/bookings" element={<ClientLayout><GuestBookingHistoryPage /></ClientLayout>} />

            {/* --- NHÓM 2: CÁC TRANG AUTHENTICATION (Client Layout) --- */}
            <Route path="/login" element={<ClientLayout><Login /></ClientLayout>} />
            <Route path="/forgot-password" element={<ClientLayout><ForgotPassword /></ClientLayout>} />
            <Route path="/reset-password" element={<ClientLayout><ResetPassword /></ClientLayout>} />

            {/* --- NHÓM 3: BOOKING & PAYMENT (Client Layout) --- */}
            <Route path="/search" element={<ClientLayout><SearchRoom /></ClientLayout>} />
            <Route path="/BookingSummary" element={<ClientLayout><BookingSummary /></ClientLayout>} />
            <Route path="/guest-information" element={<ClientLayout><GuestInformation /></ClientLayout>} />
            <Route path="/payment-selection" element={<ClientLayout><PaymentSelection /></ClientLayout>} />
            <Route path="/payment/result" element={<ClientLayout><PaymentResult /></ClientLayout>} />

            {/* --- NHÓM 4: TEST / BOOTSTRAP (Dev only) --- */}
            <Route path="/test" element={<ImportInventoryBootstrap />} />
            <Route path="/test2" element={<MonthlyReportBootstrap />} />
            <Route path="/test3" element={<ExcelToWebReport />} />
            <Route path="/import-receipt" element={<ImportReceiptUI />} />
            <Route path="/inventory-report" element={<InventoryReportPage />} />

            {/* --- NHÓM 5: PRIVATE PAGES (Main Layout + ProtectedRoute) --- */}

            {/* 5.1 Dashboard, Core & Front Desk */}
            <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute><MainLayout><div>Room List (Coming Soon)</div></MainLayout></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><MainLayout><BookingManagement /></MainLayout></ProtectedRoute>} />
            <Route path="/manager-booking" element={<ProtectedRoute><MainLayout><FrontDeskDashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/stay" element={<ProtectedRoute><MainLayout><StayScreen /></MainLayout></ProtectedRoute>} />
            <Route path="/housekeeping" element={<ProtectedRoute><MainLayout><HousekeepingDashboard /></MainLayout></ProtectedRoute>} />

            {/* 5.2 Inventory & Finance */}
            <Route path="/inventory" element={<ProtectedRoute><MainLayout><InventoryScreen /></MainLayout></ProtectedRoute>} />

            <Route path="/furniture/report" element={<ProtectedRoute><MainLayout><InventoryReport /></MainLayout></ProtectedRoute>} />
            <Route path="/furniture/history" element={<ProtectedRoute><MainLayout><ImportHistory /></MainLayout></ProtectedRoute>} />
            <Route path="/furniture/furniture" element={<ProtectedRoute><MainLayout><FurnitureInventory /></MainLayout></ProtectedRoute>} />

            <Route path="/finance/cashflow" element={<ProtectedRoute><MainLayout><CashflowScreen /></MainLayout></ProtectedRoute>} />
            <Route path="/finance/revenue" element={<ProtectedRoute><MainLayout><RevenueCollectionScreen /></MainLayout></ProtectedRoute>} />

            {/* 5.3 Profile */}
            <Route path="/profile" element={<ProtectedRoute><MainLayout><UserProfile /></MainLayout></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><MainLayout><UpdateProfile /></MainLayout></ProtectedRoute>} />

            {/* 5.4 Reports */}
            <Route path="/report/revenue" element={<ProtectedRoute><MainLayout><RevenueReportScreen /></MainLayout></ProtectedRoute>} />
            <Route path="/report/expense" element={<ProtectedRoute><MainLayout><ExpenseReportScreen /></MainLayout></ProtectedRoute>} />
            <Route path="/report/services" element={<ProtectedRoute><MainLayout><ServiceRevenueReportScreen /></MainLayout></ProtectedRoute>} />
            <Route path="/report/aggregated" element={<ProtectedRoute><MainLayout><AggregatedReportScreen /></MainLayout></ProtectedRoute>} />
            <Route path="/report/multi-branch" element={<ProtectedRoute><MainLayout><MultiBranchReportScreen /></MainLayout></ProtectedRoute>} />
            <Route path="/report/detail/:category" element={<ProtectedRoute><MainLayout><ReportDetailScreen /></MainLayout></ProtectedRoute>} />

            {/* --- NHÓM 6: ADMIN / MANAGER ONLY PAGES (ProtectedRoute + RequireManagerOrAdmin) --- */}

            {/* 6.1 Admin Infrastructure Management */}
            <Route path="/admin/rooms" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><RoomManagement /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/admin/furniture" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><FurnitureManagement /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/admin/branches" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><BranchManagement /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/admin/room-types" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><RoomTypeManagement /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/admin/room-types/:roomTypeId/price-modifiers" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><PriceModifierManagement /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/admin/room-inventories" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><RoomInventoryManagement /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/admin/branches/:branchId/cancellation-policies" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><RefundPolicyManagement /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />

            {/* 6.2 Services Management */}
            <Route path="/services" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><ServiceList /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />

            {/* 6.3 Account Management */}
            <Route path="/accounts" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><AccountList /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/accounts/create" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><CreateAccount /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/accounts/:id" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><UserDetail /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />
            <Route path="/accounts/:id/edit" element={<ProtectedRoute><RequireManagerOrAdmin><MainLayout><EditStaff /></MainLayout></RequireManagerOrAdmin></ProtectedRoute>} />

            {/* --- NHÓM 7: CATCH-ALL (Redirect to Login) --- */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRouter;




