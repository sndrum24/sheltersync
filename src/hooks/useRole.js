import { useAuthUser } from "@/auth/AuthProvider";
import { supabase } from "@/api/supabaseClient";
import { useEffect, useState, useMemo } from "react";

export function useRole() {
  const { user } = useAuthUser();

  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setProfile(null);
        setMemberships([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const [{ data: profileData }, { data: membershipData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("shelter_members")
            .select("*")
            .eq("user_id", user.id),
        ]);

      setProfile(profileData || null);
      setMemberships(membershipData || []);

      setLoading(false);
    };

    load();
  }, [user?.id]);

  // -------------------------
  // ROLE (GLOBAL)
  // -------------------------
  const role = profile?.role || null;

  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isVolunteer = role === "volunteer";

  // -------------------------
  // SHELTER ACCESS (REAL DATA ONLY)
  // -------------------------
  const allowedShelters = useMemo(() => {
    return memberships.map(m => m.shelter_id);
  }, [memberships]);

  const hasGlobalAccess = isOwner || isAdmin;

  const hasShelterAccess = (shelterId) => {
    if (hasGlobalAccess) return true;
    return allowedShelters.includes(shelterId);
  };

  return {
    user,
    profile,

    role,
    isOwner,
    isAdmin,
    isStaff,
    isVolunteer,

    memberships,
    allowedShelters,

    hasGlobalAccess,
    hasShelterAccess,

    loading,
  };
}