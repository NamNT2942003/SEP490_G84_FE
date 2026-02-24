import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/features/auth/screens/Login';
import ForgotPassword from '@/features/auth/screens/ForgotPassword';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/features/dashboard/screens/Dashboard';
import ResetPassword from '@/features/auth/screens/ResetPassword';
import AccountList from '@/components/AccountList';
import UserDetail from '@/components/UserDetail';
import EditStaff from '@/components/EditStaff';
import CreateAccount from '@/components/CreateAccount';

const RoomList = () => <h1>Room List (Coming soon)</h1>;

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Private routes with layout */}
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

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/accounts" element={
        <MainLayout>
          <AccountList />
        </MainLayout>
      } />
      <Route path="/accounts/create" element={<MainLayout><CreateAccount /></MainLayout>} />
      <Route path="/accounts/:id" element={<MainLayout><UserDetail /></MainLayout>} />
      <Route path="/accounts/:id/edit" element={<MainLayout><EditStaff /></MainLayout>} />

      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRouter;