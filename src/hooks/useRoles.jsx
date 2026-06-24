import { useAuthUser } from "@/auth/AuthProvider";

export function useRole() {
  const { user } = useAuthUser();

  return {
    role: user?.role,
    isOwner: user?.isOwner,
    isAdmin: user?.isAdmin,
    isStaff: user?.isStaff,
    isVolunteer: user?.role === "volunteer",
  };
}