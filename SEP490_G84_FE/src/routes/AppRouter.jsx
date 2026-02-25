import { Routes, Route } from 'react-router-dom';

// --- IMPORTS TỪ NHÁNH FORGOT-PASS ---
import Login from '@/features/auth/screens/Login';
import ForgotPassword from '@/features/auth/screens/ForgotPassword';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/features/dashboard/screens/Dashboard'; 
import ResetPassword from '@/features/auth/screens/ResetPassword';

// --- IMPORTS TỪ NHÁNH DIEPANH ---
import HomePage from "../features/booking/screens/HomePage";
import SearchRoom from "../features/booking/screens/SearchRoom";
import AboutPage from "../features/booking/screens/AboutPage";
import ContactPage from "../features/booking/screens/ContactPage";

// Component giả cho các trang chưa làm
const RoomList = () => <h1>Danh sách phòng (Đang phát triển)</h1>;

const AppRouter = () => {
  return (
    <Routes>
      {/* --- NHÓM 1: CÁC TRANG PUBLIC DÀNH CHO KHÁCH (DIEPANH) --- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchRoom />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* --- NHÓM 2: CÁC TRANG XÁC THỰC TÀI KHOẢN (FORGOT-PASS) --- */}
      <Route path="/login" element={<Login />} /> {/* Đã dùng Login thật của bạn */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* --- NHÓM 3: CÁC TRANG QUẢN TRỊ CÓ LAYOUT (FORGOT-PASS) --- */}
      <Route path="/dashboard" element={
        <MainLayout>
          <Dashboard />
        </MainLayout>
      } />

      <Route path="/rooms" element={
        <MainLayout>
          <RoomList />
        </MainLayout>
      } />

      {/* Redirect mặc định nếu người dùng nhập sai link (Đã sửa lỗi gõ nhầm dấu /) */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRouter;