import { useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_ACCESS_TOKEN } from '@/constants';

const ROLE_PREFIX = 'ROLE_';

/**
 * Current user from JWT (role + permissions từ backend, không fix cứng role string ở FE).
 * @returns {{ userId, role, fullName, branchName, permissions: { canAccessAccountList, canCreateAccount, canSeeAllAccounts, canEditUsername, canEditEmail, canAssignAnyRole, isStaff, isManager, isAdmin } } | null}
 */
export function useCurrentUser() {
  return useMemo(() => {
    const token = localStorage.getItem(STORAGE_ACCESS_TOKEN);
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      const roleRaw = (decoded.role || '').split(',')[0] || '';
      const role = roleRaw.replace(ROLE_PREFIX, '').toUpperCase();
      const permissions = decoded.permissions && typeof decoded.permissions === 'object'
        ? decoded.permissions
        : {};
      return {
        userId: decoded.userId ?? null,
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
  }, []);
}
