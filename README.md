SEP490_G84_FE/
├── node_modules/         # Thư viện đã cài (Bootstrap, Redux, Axios...)
├── public/               # File tĩnh (Logo khách sạn, favicon)
├── src/
│   ├── assets/           # Ảnh, icon dùng trong dự án
│   ├── components/       # Các thành phần giao diện dùng chung
│   │   ├── ui/           # Component cơ bản (Button.jsx, Table.jsx, Input.jsx)
│   │   └── layout/       # Khung trang (Header.jsx, Sidebar.jsx, Footer.jsx)
│   ├── constants/        # Hằng số (Business Rules, API endpoints)
│   ├── features/         # MODULAR CORE (Chia theo nghiệp vụ SRS)
│   │   ├── auth/         # Login, Logout, Forgot Password [cite: 151, 562]
│   │   │   ├── api/      # Các hàm gọi API riêng cho Auth
│   │   │   ├── components/# Giao diện riêng cho Auth (LoginForm.jsx)
│   │   │   ├── screens/  # Các trang (Login.jsx, ResetPassword.jsx) 
│   │   │   └── authSlice.js # Quản lý State của Auth (Redux Toolkit)
│   │   ├── booking/      # Cho khách đặt phòng (Search, Room Detail) 
│   │   │   └── ...       # (Cấu trúc tương tự như auth)
│   │   └── management/   # Quản lý (Phòng, Nhân viên, Báo cáo) 
│   ├── hooks/            # Các custom hooks (useAuth, useForm)
│   ├── routes/           # Điều hướng trang
│   │   └── AppRouter.jsx # File tập trung quản lý tất cả các Route
│   ├── services/         # Cấu hình thư viện bên thứ 3
│   │   └── apiClient.js  # Cấu hình Axios (BaseURL, JWT Interceptors)
│   ├── store/            # Cấu hình Redux Store
│   │   └── index.js      # Nơi tập hợp tất cả các Slices
│   ├── utils/            # Hàm bổ trợ (Format tiền VND, format date)
│   ├── App.jsx           # Component gốc, nơi chứa Router & Layout
│   ├── index.css         # CSS toàn cục (Reset CSS)
│   └── main.jsx          # File khởi chạy (Nơi nhúng Bootstrap & Provider)
├── .gitignore            # Chặn đẩy node_modules lên Git
├── package.json          # Danh sách thư viện & scripts
└── vite.config.js        # Cấu hình Vite
