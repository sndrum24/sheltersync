import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useRole } from "./useRole";

export function useShelter() {
  const { isOwner, isAdmin, loading: roleLoading } = useRole();

  // -------------------------
  // FETCH SHELTERS ONLY
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
  // OPTIONAL UI FILTERING ONLY
  // -------------------------
  const visibleShelters = shelters;

  const hasFullAccess = isOwner || isAdmin;

  return {
    shelters,
    visibleShelters,

    isOwner,
    isAdmin,

    hasFullAccess,

    isLoading: roleLoading || sheltersLoading,
  };
}