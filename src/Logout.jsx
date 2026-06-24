import { supabase } from "@/api/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // 1. sign out
    await supabase.auth.signOut();

    // 2. clear ALL cached queries (IMPORTANT)
    queryClient.clear();

    // 3. redirect cleanly
    navigate("/login", { replace: true });
  };

  return <button onClick={handleLogout}>Logout</button>;
}