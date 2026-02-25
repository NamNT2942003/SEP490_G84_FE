import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { STORAGE_ACCESS_TOKEN } from '@/constants';
import { authApi } from './api/authApi';

const getStoredToken = () => localStorage.getItem(STORAGE_ACCESS_TOKEN) || null;

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.login(userData);
      return response;
    } catch (error) {
      const data = error.response?.data;
      const status = error.response?.status;
      let message = 'Login failed';
      if (typeof data === 'object' && data?.message) message = data.message;
      else if (status === 401) message = 'Sai tên đăng nhập hoặc mật khẩu.';
      else if (status === 403) message = 'Tài khoản bị khóa hoặc không có quyền truy cập.';
      else if (status === 500 && data) message = typeof data === 'string' ? data : (data.message || 'Lỗi server.');
      else if (data && typeof data === 'string') message = data;
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: getStoredToken(),
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem(STORAGE_ACCESS_TOKEN);
    },
    clearError: (state) => {
      state.error = null;
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
        const token = action.payload?.accessToken ?? action.payload?.token ?? null;
        state.token = token;
        if (token) localStorage.setItem(STORAGE_ACCESS_TOKEN, token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;