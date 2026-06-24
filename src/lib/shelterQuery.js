export function applyShelterFilter(query, { user, memberships }) {
  if (!user?.role) {
    return query.eq("shelter_id", "__none__");
  }

  const role = user.role;

  // 👑 OWNER: full access
  if (role === "owner") return query;

  // 🟣 ADMIN: full access (simple + stable)
  if (role === "admin") return query;

  // 🟡 STAFF + 🟢 VOLUNTEER: only assigned shelters
  const allowedShelters = memberships?.map(m => m.shelter_id) || [];

  if (!allowedShelters.length) {
    return query.eq("shelter_id", "__none__");
  }

  return query.in("shelter_id", allowedShelters);
}