export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  STAFF: "staff",
  VOLUNTEER: "volunteer",
};

export const permissions = {
  manageUsers: ["owner", "admin"],
  manageShelters: ["owner", "admin"],

  deleteAnimals: ["owner", "admin"],

  createAnimals: ["owner", "admin", "staff"],
  editAnimals: ["owner", "admin", "staff"],

  processAdoptions: ["owner", "admin", "staff"],
  createTasks: ["owner", "admin", "staff"],

  addNotes: ["owner", "admin", "staff", "volunteer"],

  deleteNotes: ["owner", "admin", "staff"],

  viewAnimals: ["owner", "admin", "staff", "volunteer"],
  viewSchedules: ["owner", "admin", "staff", "volunteer"],
};

export function hasPermission(user, permission) {
  if (!user) return false;

  const allowedRoles = permissions[permission];
  if (!allowedRoles) return false;

  return allowedRoles.includes(user.role);
}