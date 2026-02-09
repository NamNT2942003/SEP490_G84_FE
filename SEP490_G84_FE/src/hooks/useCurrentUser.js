import { useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

/**
 * Lấy currentUser từ accessToken (JWT) trong localStorage.
 * Dùng cho Account Management thay cho mock test.
 * @returns {{ userId: number, role: string, fullName: string, branchName: string } | null}
 */
export function useCurrentUser() {
  return useMemo(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      const roleRaw = (decoded.role || '').split(',')[0] || '';
      const role = roleRaw.replace('ROLE_', '').toUpperCase(); // ADMIN, MANAGER, STAFF
      return {
        userId: decoded.userId ?? null,
        role: role || 'STAFF',
        fullName: decoded.fullName || '',
        branchName: decoded.branchName || '',
      };
    } catch (e) {
      return null;
    }
  }, []); // Re-compute khi component mount (token thay đổi thì cần refresh trang)
}
