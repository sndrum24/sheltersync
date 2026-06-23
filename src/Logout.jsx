import { supabase } from "@/api/supabaseClient";

const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};
<button onClick={handleLogout}>
  Logout
</button>