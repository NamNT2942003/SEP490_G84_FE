import { Routes, Route } from "react-router-dom";

import HomePage from "../features/home/screens/HomePage.jsx";
import SearchRoom from "../features/home/screens/SearchRoom.jsx";
import AboutPage from "../features/home/screens/AboutPage.jsx";
import ContactPage from "../features/home/screens/ContactPage.jsx";
import Login from "@/features/auth/screens/Login";
import ForgotPassword from "@/features/auth/screens/ForgotPassword";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/features/dashboard/screens/Dashboard";
import ResetPassword from "@/features/auth/screens/ResetPassword";
import BookingSummary from "@/features/booking/components/BookingSummary";
import GuestInformation from "@/features/booking/screens/GuestInformation";
import RoomManagement from "@/features/roomManagement/screens/RoomManagement";
import FurnitureManagement from "@/features/roomManagement/screens/FurnitureManagement";
import PaymentSelection from "@/features/payment/screens/PaymentSelection.jsx";
import PaymentResult from "@/features/payment/screens/PaymentResult.jsx";
import InventoryManagement from "@/features/inventory/screens/InventoryManagement";


const AppRouter = () => {
  return (
    <Routes>
      {/* Public pages - No layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/BookingSummary" element={<BookingSummary />} />
      <Route path="/GuestInformation" element={<GuestInformation />} />
        <Route path="/payment-selection" element={<PaymentSelection />} />
        <Route path="/payment/result" element={<PaymentResult />} />


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
            element={<InventoryManagement />}
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
};

export default AppRouter;
