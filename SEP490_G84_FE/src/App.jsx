import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRouter from "./routes/AppRouter";

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-fill">
        <AppRouter />
      </main>
      <Footer />
    </div>
  );
}
export default App;
