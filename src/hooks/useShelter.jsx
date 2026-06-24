import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useMemo } from "react";
import { useRole } from "./useRole";

export function useShelter() {
  const {
    isOwner,
    isAdmin,
    loading: roleLoading,
  } = useRole();

  // -------------------------
  // SHELTERS QUERY
  // -------------------------
  const { data: shelters = [], isLoading: sheltersLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shelters")
        .select("*");

      if (error) throw error;
      return data || [];
    },
  });

  // -------------------------
  // ACCESS CONTROL
  // -------------------------
  const hasFullAccess = isOwner;
  const hasAdminAccess = isOwner || isAdmin;

  const accessibleShelters = useMemo(() => {
    if (isOwner || isAdmin) return shelters;
    return shelters; // later you can filter via memberships
  }, [shelters, isOwner, isAdmin]);

  return {
    shelters,
    accessibleShelters,

    isOwner,
    isAdmin,

    isLoading: roleLoading || sheltersLoading,

    hasFullAccess,
    hasAdminAccess,
  };
}