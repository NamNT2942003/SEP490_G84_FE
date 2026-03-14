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

// --- BOOKING & PAYMENT PAGES ---
// Đã chuyển SearchRoom từ home sang booking theo đúng cấu trúc mới
import SearchRoom from "@/features/booking/screens/SearchRoom.jsx";
import BookingSummary from "@/features/booking/components/BookingSummary";
import GuestInformation from "@/features/booking/screens/GuestInformation";
import RoomManagement from "@/features/roomManagement/screens/RoomManagement";
import FurnitureManagement from "@/features/roomManagement/screens/FurnitureManagement";
import PaymentSelection from "@/features/payment/screens/PaymentSelection.jsx";
import PaymentResult from "@/features/payment/screens/PaymentResult.jsx";
import InventoryManagement from "@/features/inventory/screens/InventoryManagement";
import InventoryReport from "@/features/inventory/screens/InventoryReport";
import ImportHistory from "@/features/inventory/screens/ImportHistory";

// --- DASHBOARD & ADMIN PAGES ---
import Dashboard from "@/features/dashboard/screens/Dashboard";
import RoomManagement from "@/features/admin/screens/RoomManagement";
import FurnitureManagement from "@/features/admin/screens/FurnitureManagement";

// --- ACCOUNT MANAGEMENT PAGES ---
import AccountList from '@/features/accounts/screens/AccountList';
import UserDetail from '@/features/accounts/screens/UserDetail';
import EditStaff from '@/features/accounts/screens/EditStaff';
import CreateAccount from '@/features/accounts/screens/CreateAccount';


      {/* Main pages - With Header/Footer/Sidebar */}
      <Route
        path="/dashboard"
        element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        }
      />

      <Route
        path="/rooms"
        element={
          <MainLayout>
            <div>Room List (Coming Soon)</div>
          </MainLayout>
        }
      />

      {/* Admin pages - With Sidebar only (no Header/Footer) */}
      <Route path="/roomManagement/rooms" element={<RoomManagement />} />
      <Route path="/roomManagement/furniture" element={<FurnitureManagement />} />
        <Route
            path="/inventory"
            element={<MainLayout>
                <InventoryManagement />
            </MainLayout>}
        />

        <Route
            path="/inventoryReport"
            element={
                <MainLayout>
            <InventoryReport />
                </MainLayout>}
        />

        <Route
            path="/inventoryHistory"
            element={
            <MainLayout>
            <ImportHistory />
            </MainLayout>}
        />


      {/* Public pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchRoom />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
/** Helper: Staff không được vào trang Account → redirect về /dashboard */
const BlockStaffFromAccounts = ({ children }) => {
    const currentUser = useCurrentUser();
    if (currentUser?.permissions?.isStaff) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const AppRouter = () => {
    return (
        <Routes>
            {/* --- NHÓM 1: CÁC TRANG PUBLIC BỌC BẰNG CLIENT LAYOUT --- */}
            <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
            <Route path="/about" element={<ClientLayout><AboutPage /></ClientLayout>} />
            <Route path="/contact" element={<ClientLayout><ContactPage /></ClientLayout>} />

            {/* --- NHÓM 2: CÁC TRANG XÁC THỰC TÀI KHOẢN --- */}
            <Route path="/login" element={<ClientLayout><Login /></ClientLayout>} />
            <Route path="/forgot-password" element={<ClientLayout><ForgotPassword /></ClientLayout>} />
            <Route path="/reset-password" element={<ClientLayout><ResetPassword /></ClientLayout>} />

            {/* 3. BOOKING & PAYMENT */}
            <Route path="/search" element={<ClientLayout><SearchRoom /></ClientLayout>} />
            <Route path="/BookingSummary" element={<ClientLayout><BookingSummary /></ClientLayout>} />
            <Route path="/guest-information" element={<ClientLayout><GuestInformation/></ClientLayout>}/>
            <Route path="/payment-selection" element={<PaymentSelection/>}/>
            <Route path="/payment/result" element={<PaymentResult/>}/>

            {/* 4. ADMIN MANAGEMENT  */}
            <Route path="/admin/rooms" element={<MainLayout><RoomManagement /></MainLayout>} />
            <Route path="/admin/furniture" element={<MainLayout><FurnitureManagement /></MainLayout>} />

            {/* 5. PRIVATE PAGES (With MainLayout) */}
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/rooms" element={<MainLayout><div>Room List (Coming Soon)</div></MainLayout>} />

            {/* 6. ACCOUNT PAGES (MainLayout + Block Staff) */}
            <Route
                path="/accounts"
                element={<MainLayout><BlockStaffFromAccounts><AccountList /></BlockStaffFromAccounts></MainLayout>}
            />
            <Route
                path="/accounts/create"
                element={<MainLayout><BlockStaffFromAccounts><CreateAccount /></BlockStaffFromAccounts></MainLayout>}
            />
            <Route
                path="/accounts/:id"
                element={<MainLayout><BlockStaffFromAccounts><UserDetail /></BlockStaffFromAccounts></MainLayout>}
            />
            <Route
                path="/accounts/:id/edit"
                element={<MainLayout><BlockStaffFromAccounts><EditStaff /></BlockStaffFromAccounts></MainLayout>}
            />

            {/* 7. CATCH-ALL (Redirect to Login for unknown routes) */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRouter;