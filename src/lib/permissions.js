export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  VOLUNTEER: "volunteer",
};

export const permissions = {
  manageUsers: ["admin"],
  manageShelters: ["admin"],

  deleteAnimals: ["admin"],

  createAnimals: ["admin", "staff"],
  editAnimals: ["admin", "staff"],

  processAdoptions: ["admin", "staff"],
  createTasks: ["admin", "staff"],

  addNotes: ["admin", "staff", "volunteer"],

  deleteNotes: ["admin", "staff"],

  viewAnimals: ["admin", "staff", "volunteer"],
  viewSchedules: ["admin", "staff", "volunteer"],
};

export function hasPermission(user, permission) {
  if (!user) return false;

  const allowedRoles = permissions[permission];

  if (!allowedRoles) return false;

  return allowedRoles.includes(user.role);
}