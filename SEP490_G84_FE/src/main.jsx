import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux'; // <--- BẠN ĐANG THIẾU DÒNG NÀY
import store from './store';            // <--- VÀ DÒNG NÀY (Để lấy store truyền vào)
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* Thay Client ID thật của bạn vào đây */}
      <GoogleOAuthProvider clientId="797386412355-9p28298hvgjg8ccrf800t2laaq44ltk9.apps.googleusercontent.com">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);