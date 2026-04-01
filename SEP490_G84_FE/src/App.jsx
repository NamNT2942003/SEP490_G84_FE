import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";

function App() {
  // Development mode: Auto-set a dummy token to bypass login
  useEffect(() => {
      // eslint-disable-next-line no-undef
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && !localStorage.getItem("accessToken")) {
      // Set a development token for testing
      localStorage.setItem("accessToken", "dev-token-for-testing");
      localStorage.setItem("user", JSON.stringify({ role: "STAFF" }));
    }
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-fill">
        <AppRouter />
      </main>
    </div>
  );
  }

  export default App;


