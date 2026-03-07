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
import ServiceList from '@/features/services/screens/ServiceList';
import ServiceDetail from '@/features/services/screens/ServiceDetail';
import EditService from '@/features/services/screens/EditService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/** Staff không được vào trang Account List → redirect về /dashboard */
const BlockStaffFromAccounts = ({ children }) => {
  const currentUser = useCurrentUser();
  if (currentUser?.permissions?.isStaff) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/** Staff không được vào trang Service Management → redirect về /dashboard */
const BlockStaffFromServices = ({ children }) => {
  const currentUser = useCurrentUser();
  if (currentUser?.permissions?.isStaff) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* --- NHÓM 1: CÁC TRANG PUBLIC (KHÔNG CÓ HEADER/SIDEBAR) --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* --- NHÓM 2: CÁC TRANG PRIVATE (CÓ FULL LAYOUT) --- */}
      {/* Cách dùng: Bọc Component con vào trong MainLayout */}

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

      <Route path="/services" element={
        <MainLayout>
          <BlockStaffFromServices>
            <ServiceList />
          </BlockStaffFromServices>
        </MainLayout>
      } />

      <Route path="/services/:id/edit" element={
        <MainLayout>
          <BlockStaffFromServices>
            <EditService />
          </BlockStaffFromServices>
        </MainLayout>
      } />

      <Route path="/services/:id" element={
        <MainLayout>
          <BlockStaffFromServices>
            <ServiceDetail />
          </BlockStaffFromServices>
        </MainLayout>
      } />

      <Route path="/accounts" element={
        <MainLayout>
          <BlockStaffFromAccounts>
            <AccountList />
          </BlockStaffFromAccounts>
        </MainLayout>
      } />

      <Route path="/accounts/create" element={
        <MainLayout>
          <BlockStaffFromAccounts>
            <CreateAccount />
          </BlockStaffFromAccounts>
        </MainLayout>
      } />

      <Route path="/accounts/:id" element={
        <MainLayout>
          <BlockStaffFromAccounts>
            <UserDetail />
          </BlockStaffFromAccounts>
        </MainLayout>
      } />

      <Route path="/accounts/:id/edit" element={
        <MainLayout>
          <BlockStaffFromAccounts>
            <EditStaff />
          </BlockStaffFromAccounts>
        </MainLayout>
      } />

      {/* Redirect mặc định về login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;
