import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuthUser } from "./useAuthUser";

export function useRole() {
  const { user } = useAuthUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
      }

      setProfile(data || null);
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  const role = profile?.role || "volunteer";

  return {
    user,
    profile,
    role,

    isOwner: role === "owner",
    isAdmin: role === "admin",
    isStaff: role === "staff",
    isVolunteer: role === "volunteer",

    loading,
  };
}