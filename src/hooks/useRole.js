import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuthUser } from "@/auth/AuthProvider";

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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: membershipData } = await supabase
        .from("shelter_members")
        .select("*")
        .eq("user_id", user.id);

      setProfile(profileData);
      setMemberships(membershipData || []);
      setLoading(false);
    };

    load();
  }, [user?.id]);

  const role = profile?.role;

  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isVolunteer = role === "volunteer";

  const hasFullAccess = isOwner || isAdmin;

  const accessibleShelters = useMemo(() => {
    if (hasFullAccess) return "ALL";
    return memberships.map(m => m.shelter_id);
  }, [memberships, hasFullAccess]);

  return {
    user,
    profile,
    role,
    isOwner,
    isAdmin,
    isStaff,
    isVolunteer,
    memberships,
    hasFullAccess,
    accessibleShelters,
    loading,
  };
}