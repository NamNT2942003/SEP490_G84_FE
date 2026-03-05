import { useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AppRouter from "./routes/AppRouter";

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isAdmin && <Header />}
      <main className="flex-fill">
        <AppRouter />
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;
