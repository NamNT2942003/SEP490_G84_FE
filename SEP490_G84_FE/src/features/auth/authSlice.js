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
      const message = (typeof data === 'object' && data?.message) ? data.message : (data || 'Login failed');
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
        state.token = action.payload.accessToken;
        localStorage.setItem(STORAGE_ACCESS_TOKEN, action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;