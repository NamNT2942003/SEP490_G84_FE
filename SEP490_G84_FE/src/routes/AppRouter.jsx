import { Routes, Route } from 'react-router-dom';
import AccountList from '../components/AccountList';
import UserDetail from '../components/UserDetail';
import EditStaff from '../components/EditStaff';
import CreateAccount from '../components/CreateAccount';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<AccountList />} />
      <Route path="/accounts" element={<AccountList />} />
      <Route path="/accounts/create" element={<CreateAccount />} />
      <Route path="/accounts/:id" element={<UserDetail />} />
      <Route path="/accounts/:id/edit" element={<EditStaff />} />
    </Routes>
  );
};

export default AppRouter;