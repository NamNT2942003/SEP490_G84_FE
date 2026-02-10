import { Routes, Route } from "react-router-dom";
import SearchRoom from "../pages/SearchRoom";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/search" element={<SearchRoom />} />
      <Route path="/login" element={<div>Login</div>} />
    </Routes>
  );
};

export default AppRouter;
