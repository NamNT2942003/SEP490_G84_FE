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
import GuestInformation from "@/features/booking/screens/GuestInformation.jsx";
import PaymentSelection from "@/features/payment/screens/PaymentSelection.jsx";
import PaymentResult from "@/features/payment/screens/PaymentResult.jsx";

// =====================================================================
// --- 5. DASHBOARD, CORE & OPERATIONS ---
// =====================================================================
import Dashboard from "@/features/dashboard/screens/Dashboard";
import BookingManagement from "@/features/booking-management/screens/BookingManagement.jsx";
import FrontDeskDashboard from "@/features/manager_booking/screens/FrontDeskDashboard";
import StayScreen from "@/features/stay/screens/StayScreen";

// =====================================================================
// --- 6. ADMIN & MANAGEMENT PAGES ---
// =====================================================================
import RoomManagement from "@/features/admin/screens/RoomManagement";
import FurnitureManagement from "@/features/admin/screens/FurnitureManagement";
import BranchManagement from "@/features/branch-management/screens/BranchManagement.jsx";
import RoomTypeManagement from "@/features/room-type-management/screens/RoomTypeManagement.jsx";
import RoomInventoryManagement from "@/features/room-inventory-management/screens/RoomInventoryManagement.jsx";
import PriceModifierManagement from "@/features/price-modifiers/screens/PriceModifierManagement.jsx";
import ServiceList from '@/features/services/screens/ServiceList';

// =====================================================================
// --- 7. INVENTORY, FINANCE & REPORTS ---
// =====================================================================
// Inventory (Chuẩn)
import InventoryScreen from "@/features/inventory/screens/InventoryScreen.jsx";
// Furniture Inventory (Giữ lại từ file cũ để không sót tính năng)
import InventoryManagement from "@/features/furniture/screens/InventoryManagement";
import InventoryReport from "@/features/furniture/screens/InventoryReport";
import FurnitureInventory from "@/features/furniture/screens/FurnitureInventory";
import ImportHistory from "@/features/furniture/screens/ImportHistory";
// Finance & Reports
import CashflowScreen from "@/features/finance/screens/CashflowScreen.jsx";
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
 * Helper HOC: Chặn Staff truy cập vào các trang quản lý nhạy cảm (Account, Services, Admin...).
 * Redirect về trang /dashboard an toàn.
 */
const RequireManagerOrAdmin = ({ children }) => {
    const currentUser = useCurrentUser();
    if (currentUser?.permissions?.isStaff) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
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
            <Route path="/guest-information" element={<ClientLayout><GuestInformation/></ClientLayout>} />
            <Route path="/payment-selection" element={<PaymentSelection/>} />
            <Route path="/payment/result" element={<PaymentResult/>} />

            {/* --- NHÓM 4: TEST / BOOTSTRAP (Dev only) --- */}
            <Route path="/test" element={<ImportInventoryBootstrap />} />
            <Route path="/test2" element={<MonthlyReportBootstrap />} />
            <Route path="/test3" element={<ExcelToWebReport />} />
            <Route path="/import-receipt" element={<ImportReceiptUI />} />
            <Route path="/inventory-report" element={<InventoryReportPage />} />

            {/* --- NHÓM 5: PRIVATE PAGES (Main Layout) --- */}
            
            {/* 5.1 Dashboard, Core & Front Desk */}
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/rooms" element={<MainLayout><div>Room List (Coming Soon)</div></MainLayout>} />
            <Route path="/bookings" element={<MainLayout><BookingManagement /></MainLayout>} />
            <Route path="/manager-booking" element={<MainLayout><FrontDeskDashboard /></MainLayout>} />
            <Route path="/stay" element={<MainLayout><StayScreen /></MainLayout>} />

            {/* 5.2 Inventory & Finance */}
            <Route path="/inventory" element={<MainLayout><InventoryScreen /></MainLayout>} />
            {/* Sub-routes cho Furniture Inventory (Giữ nguyên cấu trúc file 1) */}
            <Route path="/furniture" element={<MainLayout><InventoryManagement /></MainLayout>} />
            <Route path="/furniture/report" element={<MainLayout><InventoryReport /></MainLayout>} />
            <Route path="/furniture/history" element={<MainLayout><ImportHistory /></MainLayout>} />
            <Route path="/furniture/furniture" element={<MainLayout><FurnitureInventory /></MainLayout>} />
            
            <Route path="/finance/cashflow" element={<MainLayout><CashflowScreen /></MainLayout>} />

            {/* 5.3 Profile */}
            <Route path="/profile" element={<MainLayout><UserProfile /></MainLayout>} />
            <Route path="/profile/edit" element={<MainLayout><UpdateProfile /></MainLayout>} />

            {/* 5.4 Reports */}
            <Route path="/report/revenue" element={<MainLayout><RevenueReportScreen /></MainLayout>} />
            <Route path="/report/expense" element={<MainLayout><ExpenseReportScreen /></MainLayout>} />
            <Route path="/report/services" element={<MainLayout><ServiceRevenueReportScreen /></MainLayout>} />
            <Route path="/report/aggregated" element={<MainLayout><AggregatedReportScreen /></MainLayout>} />
            <Route path="/report/multi-branch" element={<MainLayout><MultiBranchReportScreen /></MainLayout>} />
            <Route path="/report/detail/:category" element={<MainLayout><ReportDetailScreen /></MainLayout>} />

            {/* --- NHÓM 6: ADMIN / MANAGER ONLY PAGES (Main Layout + RequireManagerOrAdmin) --- */}
            
            {/* 6.1 Admin Infrastructure Management */}
            <Route path="/admin/rooms" element={<MainLayout><RoomManagement /></MainLayout>} />
            <Route path="/admin/furniture" element={<MainLayout><FurnitureManagement /></MainLayout>} />
            <Route path="/admin/branches" element={<MainLayout><BranchManagement /></MainLayout>} />
            <Route path="/admin/room-types" element={<MainLayout><RoomTypeManagement /></MainLayout>} />
            <Route path="/admin/room-types/:roomTypeId/price-modifiers" element={<MainLayout><PriceModifierManagement /></MainLayout>} />
            <Route path="/admin/room-inventories" element={<MainLayout><RoomInventoryManagement /></MainLayout>} />
            
            {/* 6.2 Services Management */}
            <Route path="/services" element={<MainLayout><RequireManagerOrAdmin><ServiceList /></RequireManagerOrAdmin></MainLayout>} />

            {/* 6.3 Account Management */}
            <Route path="/accounts" element={<MainLayout><RequireManagerOrAdmin><AccountList /></RequireManagerOrAdmin></MainLayout>} />
            <Route path="/accounts/create" element={<MainLayout><RequireManagerOrAdmin><CreateAccount /></RequireManagerOrAdmin></MainLayout>} />
            <Route path="/accounts/:id" element={<MainLayout><RequireManagerOrAdmin><UserDetail /></RequireManagerOrAdmin></MainLayout>} />
            <Route path="/accounts/:id/edit" element={<MainLayout><RequireManagerOrAdmin><EditStaff /></RequireManagerOrAdmin></MainLayout>} />

            {/* --- NHÓM 7: CATCH-ALL (Redirect to Login) --- */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRouter;