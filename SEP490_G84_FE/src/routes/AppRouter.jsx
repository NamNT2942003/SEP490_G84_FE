import { Routes, Route, Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser.js";

// --- LAYOUTS ---
import MainLayout from "@/components/layout/MainLayout";
import ClientLayout from '@/components/layout/ClientLayout';

// --- PUBLIC / HOME PAGES ---
import HomePage from "@/features/home/screens/HomePage.jsx";
import AboutPage from "@/features/home/screens/AboutPage.jsx";
import ContactPage from "@/features/home/screens/ContactPage.jsx";

// --- AUTH PAGES ---
import Login from "@/features/auth/screens/Login";
import ForgotPassword from "@/features/auth/screens/ForgotPassword";
import ResetPassword from "@/features/auth/screens/ResetPassword";

// --- GUEST BOOKING HISTORY (Magic Link) ---
import GuestAccessPage from "@/features/guest/screens/GuestAccessPage.jsx";
import GuestBookingHistoryPage from "@/features/guest/screens/GuestBookingHistoryPage.jsx";

// --- BOOKING & PAYMENT PAGES ---
import SearchRoom from "@/features/booking/screens/SearchRoom.jsx";
import BookingSummary from "@/features/booking/components/BookingSummary";
import GuestInformation from "@/features/booking/screens/GuestInformation.jsx";
import PaymentSelection from "@/features/payment/screens/PaymentSelection.jsx";
import PaymentResult from "@/features/payment/screens/PaymentResult.jsx";

// --- DASHBOARD & ADMIN PAGES ---
import Dashboard from "@/features/dashboard/screens/Dashboard";
import RoomManagement from "@/features/admin/screens/RoomManagement";
import FurnitureManagement from "@/features/admin/screens/FurnitureManagement";

// --- SERVICE MANAGEMENT ---
import ServiceList from '@/features/services/screens/ServiceList';

// --- FRONT DESK & STAY ---
import FrontDeskDashboard from "../features/manager_booking/screens/FrontDeskDashboard";
import StayScreen from "../features/stay/screens/StayScreen";

// --- INVENTORY & FINANCE ---
import InventoryScreen from "../features/inventory/screens/InventoryScreen.jsx";
import CashflowScreen from "../features/finance/screens/CashflowScreen.jsx";

// --- REPORTS ---
import ServiceRevenueReportScreen from "../features/report/screens/ServiceRevenueReportScreen.jsx";
import RevenueReportScreen from "@/features/report/screens/RevenueReportScreen.jsx";
import ExpenseReportScreen from "../features/report/screens/ExpenseReportScreen.jsx";
import AggregatedReportScreen from "../features/report/screens/AggregatedReportScreen.jsx";
import MultiBranchReportScreen from "@/features/report/screens/MultiBranchReportScreen.jsx";
import ReportDetailScreen from "@/features/report/screens/ReportDetailScreen.jsx";

// --- ACCOUNT & PROFILE PAGES ---
import AccountList from '@/features/accounts/screens/AccountList';
import UserDetail from '@/features/accounts/screens/UserDetail';
import EditStaff from '@/features/accounts/screens/EditStaff';
import CreateAccount from '@/features/accounts/screens/CreateAccount';
import UserProfile from '@/features/profile/screens/UserProfile';

// --- TEST / BOOTSTRAP PAGES ---
import ImportInventoryBootstrap from "@/features/test/ImportInventoryBootstrap.jsx";
import MonthlyReportBootstrap from "@/features/test/MonthlyReportBootstrap.jsx";
import ExcelToWebReport from "@/features/test/ExcelToWebReport.jsx";
import ImportReceiptUI from "@/features/test/ImportReceiptUI.jsx";
import InventoryReportPage from "../features/test/InventoryReportPage";
import RevenueDashboard from "../features/test/RevenueDashboard.jsx"; // Note: Imported but route wasn't defined in original, kept import just in case

/** * Helper HOC: Chặn Staff truy cập vào các trang quản lý nhạy cảm (Account, Services, v.v.)
 * Redirect về trang /dashboard 
 */
const RedirectStaffToDashboard = ({ children }) => {
    const currentUser = useCurrentUser();
    if (currentUser?.permissions?.isStaff) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const AppRouter = () => {
    return (
        <Routes>
            {/* --- 1. NHÓM PUBLIC PAGES (Client Layout) --- */}
            <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
            <Route path="/about" element={<ClientLayout><AboutPage /></ClientLayout>} />
            <Route path="/contact" element={<ClientLayout><ContactPage /></ClientLayout>} />

            {/* --- 2. NHÓM AUTH & GUEST (Client Layout) --- */}
            <Route path="/login" element={<ClientLayout><Login /></ClientLayout>} />
            <Route path="/forgot-password" element={<ClientLayout><ForgotPassword /></ClientLayout>} />
            <Route path="/reset-password" element={<ClientLayout><ResetPassword /></ClientLayout>} />
            
            <Route path="/guest-access" element={<ClientLayout><GuestAccessPage /></ClientLayout>} />
            <Route path="/guest/bookings" element={<ClientLayout><GuestBookingHistoryPage /></ClientLayout>} />

            {/* --- 3. NHÓM BOOKING & PAYMENT --- */}
            <Route path="/search" element={<ClientLayout><SearchRoom /></ClientLayout>} />
            <Route path="/BookingSummary" element={<ClientLayout><BookingSummary /></ClientLayout>} />
            <Route path="/guest-information" element={<ClientLayout><GuestInformation/></ClientLayout>} />
            <Route path="/payment-selection" element={<PaymentSelection/>} />
            <Route path="/payment/result" element={<PaymentResult/>} />

            {/* --- 4. NHÓM TEST / BOOTSTRAP (Dev only) --- */}
            <Route path="/test" element={<ImportInventoryBootstrap />} />
            <Route path="/test2" element={<MonthlyReportBootstrap />} />
            <Route path="/test3" element={<ExcelToWebReport />} />
            <Route path="/import-receipt" element={<ImportReceiptUI />} />
            <Route path="/inventory-report" element={<InventoryReportPage />} />

            {/* --- 5. PRIVATE PAGES (Main Layout) --- */}
            {/* 5.1 Dashboard & Core */}
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/rooms" element={<MainLayout><div>Room List (Coming Soon)</div></MainLayout>} />
            
            {/* 5.2 Front Desk / Stay */}
            <Route path="/manager-booking" element={<MainLayout><FrontDeskDashboard /></MainLayout>} />
            <Route path="/stay" element={<MainLayout><StayScreen /></MainLayout>} />

            {/* 5.3 Inventory & Finance */}
            <Route path="/inventory" element={<MainLayout><InventoryScreen /></MainLayout>} />
            <Route path="/finance/cashflow" element={<MainLayout><CashflowScreen /></MainLayout>} />

            {/* 5.4 Profile (cũ /profile/edit → gộp vào User Profile) */}
            <Route path="/profile" element={<MainLayout><UserProfile /></MainLayout>} />
            <Route path="/profile/edit" element={<Navigate to="/profile" replace />} />

            {/* 5.5 Reports */}
            <Route path="/report/revenue" element={<MainLayout><RevenueReportScreen /></MainLayout>} />
            <Route path="/report/expense" element={<MainLayout><ExpenseReportScreen /></MainLayout>} />
            <Route path="/report/services" element={<MainLayout><ServiceRevenueReportScreen /></MainLayout>} />
            <Route path="/report/aggregated" element={<MainLayout><AggregatedReportScreen /></MainLayout>} />
            <Route path="/report/multi-branch" element={<MainLayout><MultiBranchReportScreen /></MainLayout>} />
            <Route path="/report/detail/:category" element={<MainLayout><ReportDetailScreen /></MainLayout>} />

            {/* --- 6. ADMIN / MANAGER ONLY PAGES (Main Layout + RedirectStaffToDashboard) --- */}
            {/* Admin Management */}
            <Route path="/admin/rooms" element={<MainLayout><RoomManagement /></MainLayout>} />
            <Route path="/admin/furniture" element={<MainLayout><FurnitureManagement /></MainLayout>} />
            
            {/* Services Management */}
            <Route path="/services" element={<MainLayout><RedirectStaffToDashboard><ServiceList /></RedirectStaffToDashboard></MainLayout>} />

            {/* Account Management */}
            <Route path="/accounts" element={<MainLayout><RedirectStaffToDashboard><AccountList /></RedirectStaffToDashboard></MainLayout>} />
            <Route path="/accounts/create" element={<MainLayout><RedirectStaffToDashboard><CreateAccount /></RedirectStaffToDashboard></MainLayout>} />
            <Route path="/accounts/:id" element={<MainLayout><RedirectStaffToDashboard><UserDetail /></RedirectStaffToDashboard></MainLayout>} />
            <Route path="/accounts/:id/edit" element={<MainLayout><RedirectStaffToDashboard><EditStaff /></RedirectStaffToDashboard></MainLayout>} />

            {/* --- 7. CATCH-ALL --- */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRouter;