import { Routes, Route } from 'react-router-dom';
import Login from '@/features/auth/screens/Login';
import ForgotPassword from '@/features/auth/screens/ForgotPassword';
import MainLayout from '@/components/layout/MainLayout'; // Import Layout
import Dashboard from '@/features/dashboard/screens/Dashboard'; 
import ResetPassword from '@/features/auth/screens/ResetPassword';

// Component giả cho các trang chưa làm
const RoomList = () => <h1>Danh sách phòng (Đang phát triển)</h1>;


const AppRouter = () => {
  return (
    <Routes>
      {/* --- NHÓM 1: CÁC TRANG PUBLIC (KHÔNG CÓ HEADER/SIDEBAR) --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* --- NHÓM 2: CÁC TRANG PRIVATE (CÓ FULL LAYOUT) --- */}
      {/* Cách dùng: Bọc Component con vào trong MainLayout */}
      
    {/* Trang Dashboard */}
      <Route path="/dashboard" element={
        <MainLayout>
          <Dashboard />
        </MainLayout>
      } />

      {/* Trang Room List */}
      <Route path="/rooms" element={
        <MainLayout>
          <RoomList />
        </MainLayout>
      } />

      {/* Redirect mặc định về login */}
      /<Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRouter;