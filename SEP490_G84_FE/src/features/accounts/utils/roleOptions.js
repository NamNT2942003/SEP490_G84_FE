import { accountAPI } from '@/features/accounts/api/accountApi';

export const DEFAULT_ACCOUNT_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'STAFF', label: 'Staff' },
];

/**
 * Roles cho form Create/Edit: ưu tiên assignable-roles (theo quyền BE),
 * nếu rỗng thì fallback /accounts/roles + filter admin/manager (khớp AccountList).
 */
export async function fetchRoleOptionsForAccountForm(currentUser) {
  if (!currentUser?.permissions?.canCreateAccount && !currentUser?.permissions?.canAccessAccountList) {
    return [];
  }

  let list = [];
  const uid = currentUser.userId;
  if (uid != null) {
    try {
      const res = await accountAPI.getAssignableRoles(uid);
      list = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.warn('assignable-roles failed:', e);
    }
  }

  if (list.length > 0) return list;

  if (!currentUser.permissions?.canCreateAccount) return [];

  try {
    const res = await accountAPI.getRoles();
    let all = Array.isArray(res.data) ? res.data : [];
    if (all.length === 0) all = DEFAULT_ACCOUNT_ROLES;

    if (currentUser.permissions.isAdmin || currentUser.permissions.canAssignAnyRole) {
      return all;
    }
    if (currentUser.permissions.isManager) {
      return all.filter((r) => String(r.value || '').toUpperCase() === 'STAFF');
    }
  } catch (e) {
    console.warn('roles fallback failed:', e);
  }

  if (currentUser.permissions.isAdmin || currentUser.permissions.canAssignAnyRole) {
    return DEFAULT_ACCOUNT_ROLES;
  }
  if (currentUser.permissions.isManager) {
    return DEFAULT_ACCOUNT_ROLES.filter((r) => r.value === 'STAFF');
  }
  return [];
}
