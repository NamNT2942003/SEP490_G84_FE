import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';

// 1. Tạo thunk để xử lý bất đồng bộ (Gọi API)
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.login(userData);
      // response.accessToken là cái token backend trả về
      return response;
    } catch (error) {
      // Nếu lỗi, trả về message từ backend hoặc lỗi mặc định
      return rejectWithValue(error.response?.data || 'Đăng nhập thất bại');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('accessToken') || null, // Lấy token nếu user F5 lại trang
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Khi đang gọi API
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // Khi gọi thành công
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.accessToken;
        // Lưu token vào localStorage ngay lập tức
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      // Khi gọi thất bại
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;