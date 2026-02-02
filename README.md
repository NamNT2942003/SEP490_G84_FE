SEP490_G84_FE/
├── node_modules/       # Thư viện đã cài (Bootstrap, Redux, Axios...)
├── public/             # File tĩnh (Logo khách sạn, favicon)
├── src/
│   ├── assets/         # Ảnh, icon dùng trong dự án
│   ├── components/     # Các thành phần giao diện dùng chung
│   │   ├── ui/         # Component cơ bản (Button.jsx, Table.jsx)
│   │   └── layout/     # Khung trang (Header.jsx, Sidebar.jsx)
│   ├── constants/      # Hằng số (Business Rules, API endpoints)
│   ├── features/       # MODULAR CORE (Chia theo nghiệp vụ SRS)
│   │   ├── auth/       # Login, Logout, Forgot Password
│   │   │   ├── api/    # Các hàm gọi API riêng cho Auth
│   │   │   ├── screens/# Các trang (Login.jsx, ResetPassword.jsx)
│   │   │   └── authSlice.js # Quản lý State của Auth (Redux Toolkit)
│   │   ├── booking/    # Cho khách đặt phòng (Search, Room Detail)
│   │   └── management/ # Quản lý (Phòng, Nhân viên, Báo cáo)
│   ├── hooks/          # Các custom hooks (useAuth, useForm)
│   ├── routes/         # Điều hướng trang
│   │   └── AppRouter.jsx
│   ├── services/       # Cấu hình thư viện bên thứ 3 (Axios apiClient)
│   ├── store/          # Cấu hình Redux Store (index.js)
│   ├── utils/          # Hàm bổ trợ (Format tiền VND, format date)
│   ├── App.jsx         # Component gốc chứa Router & Layout
│   ├── index.css       # CSS toàn cục (Reset CSS)
│   └── main.jsx        # File khởi chạy (Nhúng Bootstrap & Provider)
├── .gitignore          # Chặn đẩy node_modules lên Git
├── package.json        # Danh sách thư viện & scripts
└── vite.config.js      # Cấu hình Vite
