import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useMemo } from "react";
import { useRole } from "./useRole";

export function useShelter() {
  const {
    user,
    profile,
    memberships = [],
    isOwner,
    isAdmin,
    isStaff,
    isVolunteer,
    loading: roleLoading,
  } = useRole();

  // SHELTERS
  const { data: shelters = [], isLoading: sheltersLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shelters").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // SAFE CURRENT SHELTER
  const shelter = useMemo(() => {
    if (isOwner) return null;
    if (!Array.isArray(memberships) || memberships.length === 0) return null;

    const first = memberships[0];

    return shelters.find((s) => s.id === first?.shelter_id);
  }, [shelters, memberships, isOwner]);

  // 🔥 GLOBAL FIX RULE
  const hasShelterAccess =
    isOwner || (Array.isArray(memberships) && memberships.length > 0);

  const needsShelter = !isOwner && !hasShelterAccess;

  return {
    user,
    profile,
    memberships,

    isOwner,
    isAdmin,
    isStaff,
    isVolunteer,

    shelters,
    shelter,

    needsShelter,
    isLoading: roleLoading || sheltersLoading,
  };
}