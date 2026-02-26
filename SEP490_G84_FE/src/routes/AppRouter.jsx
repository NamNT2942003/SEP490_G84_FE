import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from '@/components/layout/MainLayout'; 
import ClientLayout from '@/components/layout/ClientLayout';

// --- IMPORTS TỪ NHÁNH XÁC THỰC & LAYOUT ---
import Login from '@/features/auth/screens/Login';
import ForgotPassword from '@/features/auth/screens/ForgotPassword';
import ResetPassword from '@/features/auth/screens/ResetPassword';


// --- IMPORTS TỪ NHÁNH DIEPANH (PUBLIC PAGES) ---
import HomePage from "../features/booking/screens/HomePage";
import SearchRoom from "../features/booking/screens/SearchRoom";
import AboutPage from "../features/booking/screens/AboutPage";
import ContactPage from "../features/booking/screens/ContactPage";

// --- IMPORTS TỪ NHÁNH DONGPH (ADMIN PAGES) ---
import Dashboard from '@/features/dashboard/screens/Dashboard';
import AccountList from '@/features/accounts/screens/AccountList';
import UserDetail from '@/features/accounts/screens/UserDetail';
import EditStaff from '@/features/accounts/screens/EditStaff';
import CreateAccount from '@/features/accounts/screens/CreateAccount';
import RoomList from '@/features/rooms/screens/RoomList';
import NotFound from '@/features/common/screens/NotFound';

const AppRouter = () => {
  return (
    <Routes>
      {/* --- NHÓM 1: CÁC TRANG PUBLIC BỌC BẰNG CLIENT LAYOUT --- */}
      <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
      <Route path="/search" element={<ClientLayout><SearchRoom /></ClientLayout>} />
      <Route path="/about" element={<ClientLayout><AboutPage /></ClientLayout>} />
      <Route path="/contact" element={<ClientLayout><ContactPage /></ClientLayout>} />

      {/* --- NHÓM 2: CÁC TRANG XÁC THỰC TÀI KHOẢN --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* --- NHÓM 3: CÁC TRANG QUẢN TRỊ CÓ LAYOUT (DONGPH) --- */}
      <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/rooms" element={<MainLayout><RoomList /></MainLayout>} />
      <Route path="/accounts" element={<MainLayout><AccountList /></MainLayout>} />
      <Route path="/accounts/create" element={<MainLayout><CreateAccount /></MainLayout>} />
      <Route path="/accounts/:id" element={<MainLayout><UserDetail /></MainLayout>} />
      <Route path="/accounts/:id/edit" element={<MainLayout><EditStaff /></MainLayout>} />

      {/* Redirect mặc định nếu người dùng nhập sai link (Trang 404) */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;