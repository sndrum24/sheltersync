import { permissions } from "./permissions";

export function hasPermission(user, permission) {
  if (!user) return false;

  const allowedRoles = permissions[permission];
  if (!allowedRoles) return false;

  return allowedRoles.includes(user.role);
}