import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuthUser } from "@/auth/AuthProvider";

export function useShelter() {
  const { user, loading } = useAuthUser();

  const shelterId = user?.shelter_id;

  const { data: shelters = [] } = useQuery({
    queryKey: ["shelters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shelters").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  return {
    shelters,

    user,

    currentShelter: shelters.find((s) => s.id === shelterId) || null,

    hasShelter: !!shelterId,

    loading,
  };
}