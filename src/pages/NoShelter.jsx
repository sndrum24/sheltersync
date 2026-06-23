import { supabase } from "@/api/supabaseClient";

export default function NoShelter() {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

     return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-2xl font-bold mb-2">
        No Shelter Access
      </h1>

      <p className="text-muted-foreground max-w-md">
        You currently do not have access to any shelter.
      </p>
    </div>
  );
}