import { configureStore, createSlice } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

const appSlice = createSlice({
  name: "app",
  initialState: {
    loading: false,
  },
  reducers: {},
});

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    auth: authReducer,
  },
});
