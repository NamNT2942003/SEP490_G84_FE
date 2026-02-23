import { useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_ACCESS_TOKEN } from '@/constants';

const DEFAULT_ROLE = 'STAFF';
const ROLE_PREFIX = 'ROLE_';

/**
 * Current user from JWT in localStorage.
 * @returns {{ userId: number, role: string, fullName: string, branchName: string } | null}
 */
export function useCurrentUser() {
  return useMemo(() => {
    const token = localStorage.getItem(STORAGE_ACCESS_TOKEN);
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      const roleRaw = (decoded.role || '').split(',')[0] || '';
      const role = roleRaw.replace(ROLE_PREFIX, '').toUpperCase();
      return {
        userId: decoded.userId ?? null,
        role: role || DEFAULT_ROLE,
        fullName: decoded.fullName || '',
        branchName: decoded.branchName || '',
      };
    } catch {
      return null;
    }
  }, []);
}
