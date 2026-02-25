import { Routes, Route } from "react-router-dom";

import HomePage from "../features/home/screens/HomePage.jsx";
import SearchRoom from "../features/home/screens/SearchRoom.jsx";
import AboutPage from "../features/home/screens/AboutPage.jsx";
import ContactPage from "../features/home/screens/ContactPage.jsx";

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