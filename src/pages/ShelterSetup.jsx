import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuthUser } from "@/auth/AuthProvider";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";

export default function ShelterSetup() {
  const { user, loading } = useAuthUser();
  const queryClient = useQueryClient();

  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin" || role === "owner";
  const isOwner = role === "owner";

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });

  const [creating, setCreating] = useState(false);

  const { data: shelters = [], isLoading: sheltersLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shelters").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loading || sheltersLoading;

  const handleCreateShelter = async (e) => {
    e.preventDefault();

    if (!isAdmin) return alert("Not authorized");

    setCreating(true);

    const { error } = await supabase.from("shelters").insert({
      ...form,
      created_by: user.id,
    });

    setCreating(false);

    if (error) return alert(error.message);

    queryClient.invalidateQueries({ queryKey: ["shelters"] });

    setForm({
      name: "",
      address: "",
      phone: "",
      email: "",
      description: "",
    });
  };

  const handleDeleteShelter = async (id) => {
    if (!isAdmin) return alert("Not authorized");

    const { error } = await supabase
      .from("shelters")
      .delete()
      .eq("id", id);

    if (error) return alert(error.message);

    queryClient.invalidateQueries({ queryKey: ["shelters"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <p className="text-red-500">Not authorized</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <h1 className="text-3xl font-bold">Shelter Setup</h1>

      {shelters.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex justify-between p-4">
            <div>
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-sm text-muted-foreground">
                {s.address}
              </p>
            </div>

            <Button
              variant="destructive"
              onClick={() => handleDeleteShelter(s.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="space-y-3">
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <Input
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />

          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <Input
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <Button onClick={handleCreateShelter} disabled={creating}>
            {creating ? "Creating..." : "Create Shelter"}
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}