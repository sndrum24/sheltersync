import { useState } from "react";
import { supabase } from "@/api/supabaseClient";

export default function InviteUserForm({ shelterId, user }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");

  const handleInvite = async () => {
    const { error } = await supabase
      .from("shelter_invitations")
      .insert({
        email,
        role,
        shelter_id: shelterId,
        invited_by: user.id,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Invitation sent");
    setEmail("");
  };

  return (
    <div className="space-y-2">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border p-2 w-full"
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="staff">Staff</option>
        <option value="volunteer">Volunteer</option>
        <option value="admin">Admin</option>
      </select>

      <button onClick={handleInvite} className="bg-black text-white p-2 w-full">
        Invite User
      </button>
    </div>
  );
}