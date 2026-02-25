import { configureStore, createSlice } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";

const appSlice = createSlice({
  name: "app",
  initialState: {
    loading: false,
  },
  reducers: {},
});

export const store = configureStore({
  reducer: {
    auth: authReducer,     // Của nhánh forgot-pass
    app: appSlice.reducer, // Của nhánh DiepAnh
    // sau này thêm booking: bookingReducer...
  },
});

export default store;