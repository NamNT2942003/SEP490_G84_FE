import { useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_ACCESS_TOKEN } from '@/constants';

const ROLE_PREFIX = 'ROLE_';

/**
 * Current user from JWT (role + permissions từ backend, không fix cứng role string ở FE).
 * @returns {{ userId, branchId, role, fullName, branchName, permissions: { canAccessAccountList, canCreateAccount, canSeeAllAccounts, canEditUsername, canEditEmail, canAssignAnyRole, isStaff, isManager, isAdmin } } | null}
 */
function normalizeUserId(decoded) {
  const raw = decoded.userId ?? decoded.user_id;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function useCurrentUser() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ACCESS_TOKEN) : null;

  return useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      const roleRaw = (decoded.role || '').split(',')[0] || '';
      const role = roleRaw.replace(ROLE_PREFIX, '').toUpperCase();
      const permissions = decoded.permissions && typeof decoded.permissions === 'object'
        ? decoded.permissions
        : {};
      return {
        userId: normalizeUserId(decoded),
        branchId: decoded.branchId != null ? Number(decoded.branchId) : null,
        role: role || '',
        fullName: decoded.fullName || '',
        branchName: decoded.branchName || '',
        permissions: {
          canAccessAccountList: !!permissions.canAccessAccountList,
          canCreateAccount: !!permissions.canCreateAccount,
          canSeeAllAccounts: !!permissions.canSeeAllAccounts,
          canEditUsername: !!permissions.canEditUsername,
          canEditEmail: !!permissions.canEditEmail,
          canAssignAnyRole: !!permissions.canAssignAnyRole,
          isStaff: !!permissions.isStaff,
          isManager: !!permissions.isManager,
          isAdmin: !!permissions.isAdmin,
        },
      };
    } catch {
      return null;
    }
  }, [token]);
}