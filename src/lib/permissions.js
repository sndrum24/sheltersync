export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  STAFF: "staff",
  VOLUNTEER: "volunteer",
};

export const permissions = {
  manageUsers: [ROLES.OWNER, ROLES.ADMIN],
  manageShelters: [ROLES.OWNER, ROLES.ADMIN],

  deleteAnimals: [ROLES.OWNER, ROLES.ADMIN],

  createAnimals: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF],
  editAnimals: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF],

  processAdoptions: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF],
  createTasks: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF],

  addNotes: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF, ROLES.VOLUNTEER],

  deleteNotes: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF],

  viewAnimals: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF, ROLES.VOLUNTEER],
  viewSchedules: [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF, ROLES.VOLUNTEER],
};

export function hasPermission(userOrRole, permission) {
  const role =
    typeof userOrRole === "string"
      ? userOrRole
      : userOrRole?.role;

  if (!role) return false;

  return permissions[permission]?.includes(role) || false;
}