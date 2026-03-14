import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AppRouter from "./routes/AppRouter";

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/roomManagement");

  // Development mode: Auto-set a dummy token to bypass login
  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && !localStorage.getItem("accessToken")) {
      // Set a development token for testing
      localStorage.setItem("accessToken", "dev-token-for-testing");
      localStorage.setItem("user", JSON.stringify({ role: "STAFF" }));
    }
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isAdmin && <Header />}
      <main className="flex-fill">
        <AppRouter />
      </main>
      {!isAdmin && <Footer />}
    </div>
  );

import AppRouter from './routes/AppRouter';

function App() {
    return (
        <div className="app">
            <AppRouter />
        </div>
    );
}

export default App;