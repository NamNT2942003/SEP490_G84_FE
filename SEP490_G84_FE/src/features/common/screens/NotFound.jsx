import React from 'react';
import { useNavigate } from 'react-router-dom';
import Buttons from '@/components/ui/Buttons';
import { COLORS, APP_STRINGS } from '@/constants';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center bg-light text-center p-4">
      
      {/* 1. Icon minh họa (Dùng icon cái cửa hoặc biển báo) */}
      <div className="mb-4 text-brand opacity-50">
        <i className="bi bi-cone-striped" style={{ fontSize: '5rem', color: COLORS.PRIMARY }}></i>
      </div>

      {/* 2. Số 404 Lớn */}
      <h1 className="display-1 fw-bold" style={{ color: COLORS.PRIMARY, letterSpacing: '5px' }}>
        404
      </h1>

      {/* 3. Thông điệp hài hước kiểu khách sạn */}
      <h2 className="fs-3 fw-bold mb-3 text-dark">Room Not Found?</h2>
      <p className="text-muted mb-5" style={{ maxWidth: '500px' }}>
        Xin lỗi, có vẻ như bạn đang cố gắng mở một cánh cửa không tồn tại hoặc trang này đang được "bảo trì". 
        Vui lòng quay lại sảnh chính.
      </p>

      {/* 4. Các nút điều hướng */}
      <div className="d-flex gap-3">
        <Buttons 
          variant="outline" 
          onClick={() => navigate(-1)} // Quay lại trang trước đó
          icon={<i className="bi bi-arrow-left"></i>}
        >
          Go Back
        </Buttons>

        <Buttons 
          onClick={() => navigate('/dashboard')} // Về trang chủ Dashboard
          icon={<i className="bi bi-house-door-fill"></i>}
          className="shadow-sm"
        >
          Return to Dashboard
        </Buttons>
      </div>

      {/* Footer nhỏ */}
      <div className="mt-5 text-muted small fixed-bottom pb-4">
        {APP_STRINGS.APP_NAME} System
      </div>
    </div>
  );
};

export default NotFound;