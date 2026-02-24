import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // sau này thêm booking: bookingReducer...
  },
});

export default store;