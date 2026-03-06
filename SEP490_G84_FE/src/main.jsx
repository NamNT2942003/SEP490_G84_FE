import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";
import "./index.css";

// 1. Import GoogleOAuthProvider vào đây
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {/* 2. Bọc GoogleOAuthProvider bên ngoài Provider của Redux */}
        <GoogleOAuthProvider clientId="nhap-tam-client-id-bua-vao-day-de-test">
            <Provider store={store}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </Provider>
        </GoogleOAuthProvider>
    </React.StrictMode>,
);