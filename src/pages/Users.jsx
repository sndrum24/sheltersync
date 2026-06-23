import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";

export default function Users() {
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

      if (error) throw error;

      return data || [];
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="border rounded-lg p-4 flex justify-between"
          >
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                {user.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}