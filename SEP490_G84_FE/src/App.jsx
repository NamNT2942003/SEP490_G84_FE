import MainLayout from './components/layout/MainLayout';
import GuestInformation from './features/booking/screens/GuestInformation';

function App() {
  return (
    <MainLayout>
      {/* Trong thực tế bạn sẽ dùng <Routes> ở đây, hiện tại ta render trực tiếp để test */}
      <GuestInformation />
    </MainLayout>
  );
}

export default App;