export function applyShelterFilter(
  query,
  { user }
) {
  if (!user) return query.eq("shelter_id", null);

  const role = user.role;

  // 👑 OWNER: full access
  if (role === "owner") return query;

  // 🟣 ADMIN: all shelters in system OR assigned shelters
  if (role === "admin") {
    if (Array.isArray(user.allowed_shelters) && user.allowed_shelters.length) {
      return query.in("shelter_id", user.allowed_shelters);
    }
    return query.eq("shelter_id", user.shelter_id);
  }

  // 🟡 STAFF + 🟢 VOLUNTEER: ONLY assigned shelter
  return query.eq("shelter_id", user.shelter_id || null);
}