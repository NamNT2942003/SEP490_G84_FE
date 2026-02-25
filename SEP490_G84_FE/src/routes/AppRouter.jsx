import { Routes, Route } from "react-router-dom";

import HomePage from "../features/booking/screens/HomePage";
import SearchRoom from "../features/booking/screens/SearchRoom";
import AboutPage from "../features/booking/screens/AboutPage";
import ContactPage from "../features/booking/screens/ContactPage";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchRoom />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<div>Login</div>} />
    </Routes>
  );
};

export default AppRouter;