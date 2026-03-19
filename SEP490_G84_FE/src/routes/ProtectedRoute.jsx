import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser.js";

const ProtectedRoute = ({ allowedRoles }) => {
    const { currentUser, isLoading } = useCurrentUser(); 
    
    // 1. Đợi Redux load data xong (tránh việc F5 bị đá ra màn login oan uổng)
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    // 2. Chưa đăng nhập -> Đá về Login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // 3. Đã đăng nhập nhưng Role không nằm trong danh sách cho phép -> Đá về Dashboard
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        console.warn(`Access Denied: User role ${currentUser.role} lacks permission.`);
        return <Navigate to="/dashboard" replace />;
    }

    // 4. Hợp lệ -> Cho đi tiếp vào các Route con
    return <Outlet />;
};

export default ProtectedRoute;