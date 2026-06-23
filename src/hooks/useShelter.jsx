import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { hasPermission } from "@/lib/permissions";
import { useMemo } from "react";

export function useShelter() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return profile;
    },
  });

  const { data: shelters, isLoading: sheltersLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shelters")
        .select("*");

      if (error) throw error;
      return data ?? [];
    },
  });

  const shelter = useMemo(() => {
    if (!Array.isArray(shelters) || !user?.shelter_id) return null;
    return shelters.find((s) => s.id === user.shelter_id);
  }, [shelters, user?.shelter_id]);

  const needsShelter = !!user && !user.shelter_id && !userLoading;

  return {
    user,
    shelters,
    shelter,
    needsShelter,

    isLoading: userLoading || sheltersLoading,

    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff",
    isVolunteer: user?.role === "volunteer",

    canManageUsers: hasPermission(user, "manageUsers"),
    canDeleteAnimals: hasPermission(user, "deleteAnimals"),
    canEditAnimals: hasPermission(user, "editAnimals"),
    canAddNotes: hasPermission(user, "addNotes"),
    canDeleteNotes: hasPermission(user, "deleteNotes"),
  };
}