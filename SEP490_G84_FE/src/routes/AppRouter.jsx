
import { Routes, Route } from "react-router-dom";

import HomePage from "../features/home/screens/HomePage.jsx";
import SearchRoom from "../features/home/screens/SearchRoom.jsx";
import AboutPage from "../features/home/screens/AboutPage.jsx";
import ContactPage from "../features/home/screens/ContactPage.jsx";
import Login from '@/features/auth/screens/Login';
import ForgotPassword from '@/features/auth/screens/ForgotPassword';
import MainLayout from '@/components/layout/MainLayout'; // Import Layout
import Dashboard from '@/features/dashboard/screens/Dashboard';
import ResetPassword from '@/features/auth/screens/ResetPassword';
import PaymentSelection from '@/features/payment/screens/PaymentSelection';
import PaymentResult from '@/features/payment/screens/PaymentResult';
import BookingSummary from '@/features/booking/components/BookingSummary';
import GuestInformation from '@/features/booking/screens/GuestInformation';

// Component giả cho các trang chưa làm
const RoomList = () => <h1>Danh sách phòng (Đang phát triển)</h1>;


const AppRouter = () => {
    return (

        <Routes>
            {/* --- NHÓM 1: CÁC TRANG PUBLIC (KHÔNG CÓ HEADER/SIDEBAR) --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/payment" element={<PaymentSelection />} />
            <Route path="/payment/result" element={<PaymentResult />} />
            <Route path="/BookingSummary" element={<BookingSummary />}/>
            <Route path="/GuestInformation" element={<GuestInformation />} />

            {/* --- NHÓM 2: CÁC TRANG PRIVATE (CÓ FULL LAYOUT) --- */}
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/search" element={<MainLayout><SearchRoom /></MainLayout>} />
            <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
            <Route path="/rooms" element={<MainLayout><RoomList /></MainLayout>} />
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />


            {/* Redirect mặc định về login */}
            <Route path="*" element={<Login />} />
        </Routes>
    );
};

export default AppRouter;
