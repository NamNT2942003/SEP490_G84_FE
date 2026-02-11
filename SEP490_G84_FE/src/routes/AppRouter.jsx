import { Routes, Route } from "react-router-dom";
import HomePage from "../features/public/screens/HomePage";
import SearchRoom from "../features/public/screens/SearchRoom";
import AboutPage from "../features/public/screens/AboutPage";
import ContactPage from "../features/public/screens/ContactPage";

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
