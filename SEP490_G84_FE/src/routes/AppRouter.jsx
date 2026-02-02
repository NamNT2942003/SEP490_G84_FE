import { Routes, Route } from 'react-router-dom';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<div>Trang chủ AN-IHBMS</div>} />
      <Route path="/login" element={<div>Trang đăng nhập</div>} />
    </Routes>
  );
};

export default AppRouter;