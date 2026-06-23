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
    allowedShelters = [],
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
  // CURRENT SHELTER (RBAC SAFE)
  // -------------------------
  const shelter = useMemo(() => {
    // OWNER: no forced shelter context (global access)
    if (isOwner) return null;

    // no memberships → no shelter context
    if (!Array.isArray(memberships) || memberships.length === 0) {
      return null;
    }

    const first = memberships[0];

    return shelters.find(
      (s) => s.id === first?.shelter_id
    );
  }, [shelters, memberships, isOwner]);

  // -------------------------
  // 🔥 FIXED ACCESS LOGIC (NO MORE PROFILE SHELTER LOGIC)
  // -------------------------

  const hasShelterAccess =
    isOwner || (Array.isArray(memberships) && memberships.length > 0);

  const needsShelter =
    !isOwner && !hasShelterAccess;

  const canAccessAllShelters = isOwner;

  const canManageUsers =
    isOwner || isAdmin;

  const canEditAnimals =
    isOwner || isAdmin || isStaff;

  const canDeleteAnimals =
    isOwner || isAdmin;

  const canAddNotes =
    isOwner || isAdmin || isStaff || isVolunteer;

  const canDeleteNotes =
    isOwner || isAdmin;

  // -------------------------
  // RETURN API
  // -------------------------
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
    allowedShelters,

    needsShelter,

    isLoading: roleLoading || sheltersLoading,

    canAccessAllShelters,
    canManageUsers,
    canEditAnimals,
    canDeleteAnimals,
    canAddNotes,
    canDeleteNotes,

    hasShelterAccess,
  };
}