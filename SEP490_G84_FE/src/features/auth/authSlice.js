import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from './api/authApi'; // Đường dẫn của em có thể khác, giữ nguyên theo code cũ
import { jwtDecode } from 'jwt-decode';

// Hàm helper: Validate JWT có đúng format 3 phần không
const isValidJwt = (token) => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3;
};

// Hàm helper: Chuyên nhận token và trả về object user hoàn chỉnh
const getUserFromToken = (token) => {
    if (!token) return null;
    // Kiểm tra format JWT trước khi decode — tránh crash khi localStorage có giá trị rác
    if (!isValidJwt(token)) {
        console.warn("Token trong localStorage không hợp lệ, đã xóa.");
        localStorage.removeItem('accessToken');
        return null;
    }
    try {
        const decoded = jwtDecode(token);
        const roleList = (decoded.role || "").split(",");
        let mainRole = roleList.find(r => r.includes("ROLE_")) || roleList[0] || "User";
        
        // Cắt chữ ROLE_ đi để dùng cho code logic (VD: ADMIN)
        let rawRole = mainRole.replace("ROLE_", "").toUpperCase(); 
        // Viết hoa chữ cái đầu để dùng hiển thị UI (VD: Admin)
        let roleDisplay = rawRole.charAt(0) + rawRole.slice(1).toLowerCase();

        return {
            fullName: decoded.fullName || "User",
            role: rawRole, 
            roleDisplay: roleDisplay,
            branchName: decoded.branchName || ""
        };
    } catch (error) {
        console.error("Lỗi giải mã token:", error);
        localStorage.removeItem('accessToken');
        return null;
    }
};

// Đọc token từ localStorage, nếu không hợp lệ thì coi như chưa login
const rawToken = localStorage.getItem('accessToken');
const initialToken = isValidJwt(rawToken) ? rawToken : null;
if (rawToken && !initialToken) localStorage.removeItem('accessToken'); // Dọn sạch token rác

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await authApi.login(userData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Login failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        // Tự động giải mã token có sẵn trong localStorage khi F5 trang
        user: getUserFromToken(initialToken), 
        token: initialToken,
        isLoading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem('accessToken');
        },
        clearError: (state) => {
            state.error = null;
        },
        setTokenFromGoogle: (state, action) => {
            const token = action.payload;
            state.token = token;
            state.user = getUserFromToken(token);
            localStorage.setItem('accessToken', token);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                const token = action.payload.accessToken; // Lấy token từ api
                state.token = token;
                state.user = getUserFromToken(token); // Giải mã và lưu ngay user
                localStorage.setItem('accessToken', token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError, setTokenFromGoogle } = authSlice.actions;
export default authSlice.reducer;