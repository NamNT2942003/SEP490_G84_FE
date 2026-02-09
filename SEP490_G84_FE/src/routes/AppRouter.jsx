import { Routes, Route, Navigate } from 'react-router-dom';
// Code của bạn tôi
import Login from '@/features/auth/screens/Login';
import ForgotPassword from '@/features/auth/screens/ForgotPassword';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/features/dashboard/screens/Dashboard'; 

// Code Account Management của tôi
import AccountList from '@/components/AccountList';
import UserDetail from '@/components/UserDetail';
import EditStaff from '@/components/EditStaff';
import CreateAccount from '@/components/CreateAccount';

// Component giả cho các trang chưa làm
const RoomList = () => <h1>Room List (Coming soon)</h1>;

const AppRouter = () => {
  return (
    <Routes>
      {/* --- NHÓM 1: CÁC TRANG PUBLIC (KHÔNG CÓ HEADER/SIDEBAR) --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* --- NHÓM 2: CÁC TRANG PRIVATE (CÓ FULL LAYOUT) --- */}
      
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

      {/* --- NHÓM 3: ACCOUNT MANAGEMENT (Code của tôi) --- */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/accounts" element={
        <MainLayout>
          <AccountList />
        </MainLayout>
      } />
      <Route path="/accounts/create" element={<CreateAccount />} />
      <Route path="/accounts/:id" element={<UserDetail />} />
      <Route path="/accounts/:id/edit" element={<EditStaff />} />

      {/* Redirect mặc định về login */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRouter;