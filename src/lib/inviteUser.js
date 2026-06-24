import { supabase } from "@/api/supabaseClient";

export async function inviteUser({ email, role, shelterId, invitedBy }) {
  const { data, error } = await supabase
    .from("shelter_invitations")
    .insert({
      email,
      role,
      shelter_id: shelterId,
      invited_by: invitedBy,
    });

  if (error) throw error;

  return data;
}