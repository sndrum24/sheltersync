import { useAuthUser } from "./useAuthUser";
import { supabase } from "@/api/supabaseClient";
import { useEffect, useState } from "react";

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

      // PROFILE
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // MEMBERSHIPS (NEW SOURCE OF TRUTH)
      const { data: memberData } = await supabase
        .from("shelter_members")
        .select("*")
        .eq("user_id", user.id);

      setProfile(profileData || null);
      setMemberships(memberData || []);
      setLoading(false);
    };

    load();
  }, [user]);

  // -------------------------
  // OWNER OVERRIDE (GLOBAL ADMIN)
  // -------------------------
  const isOwner = profile?.role === "owner";

  // -------------------------
  // SHELTER ROLES (FROM MEMBERSHIPS)
  // -------------------------
  const isAdmin = memberships.some(m => m.role === "admin");
  const isStaff = memberships.some(m => m.role === "staff");
  const isVolunteer = memberships.some(m => m.role === "volunteer");

  const allowedShelters = memberships.map(m => m.shelter_id);

  return {
    user,
    profile,
    memberships,

    isOwner,
    isAdmin,
    isStaff,
    isVolunteer,

    allowedShelters,
    loading,
  };
}