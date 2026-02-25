import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/features/auth/screens/Login';
import ForgotPassword from '@/features/auth/screens/ForgotPassword';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/features/dashboard/screens/Dashboard';
import ResetPassword from '@/features/auth/screens/ResetPassword';
import AccountList from '@/features/accounts/screens/AccountList';
import UserDetail from '@/features/accounts/screens/UserDetail';
import EditStaff from '@/features/accounts/screens/EditStaff';
import CreateAccount from '@/features/accounts/screens/CreateAccount';
import RoomList from '@/features/rooms/screens/RoomList';
import NotFound from '@/features/common/screens/NotFound';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Private routes – bọc MainLayout */}
      <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/rooms" element={<MainLayout><RoomList /></MainLayout>} />
      <Route path="/accounts" element={<MainLayout><AccountList /></MainLayout>} />
      <Route path="/accounts/create" element={<MainLayout><CreateAccount /></MainLayout>} />
      <Route path="/accounts/:id" element={<MainLayout><UserDetail /></MainLayout>} />
      <Route path="/accounts/:id/edit" element={<MainLayout><EditStaff /></MainLayout>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;