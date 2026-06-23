
import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useShelter } from "@/hooks/useShelter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Plus, CheckCircle2, Loader2, UserPlus, Map, AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ShelterMap from "@/components/shelter/ShelterMap";
import EmergencyInfoTab from "@/components/shelter/EmergencyInfo";

export default function ShelterSetup() {
  const { user, shelters, isAdmin, isLoading } = useShelter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShelter, setEditingShelter] = useState(null);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedShelter, setSelectedShelter] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const handleCreateShelter = async (e) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.from("shelters").insert([form]).select().single();
    if (error) throw error;
    const newShelter = data;
    if (!user.shelter_id) {
      await supabase.from("profiles").update({ shelter_id: newShelter.id }).eq("id", user.id);
    }
    queryClient.invalidateQueries({ queryKey: ["shelters"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    setForm({ name: "", address: "", phone: "", email: "", description: "" });
    setShowCreateForm(false);
    setCreating(false);
  };

  const handleUpdateShelter = async () => {
    if (!editingShelter) return;
    const { error } = await supabase
      .from("shelters")
      .update({
        name: editingShelter.name,
        address: editingShelter.address,
        phone: editingShelter.phone,
        email: editingShelter.email,
        description: editingShelter.description,
      })
      .eq("id", editingShelter.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["shelters"] });
    setEditingShelter(null);
  };

  const handleDeleteShelter = async (id) => {
    if (!confirm("Delete this shelter?")) return;
    await supabase.from("profiles").update({ shelter_id: null }).eq("shelter_id", id);
    await supabase.from("shelters").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["shelters"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };
const handleRoleChange = async (userId, role) => {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    alert(error.message);
    return;
  }

  queryClient.invalidateQueries({
    queryKey: ["users"],
  });
};
  const handleAssignVolunteer = async () => {
  if (!selectedUser || !selectedShelter) return;

  setAssigning(true);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      shelter_id: selectedShelter,
    })
    .eq("id", selectedUser)
    .select();

  console.log("ASSIGN RESULT:", data);
  console.log("ASSIGN ERROR:", error);

  if (error) {
    alert(error.message);
    setAssigning(false);
    return;
  }

  alert("Volunteer assigned successfully");

  queryClient.invalidateQueries({ queryKey: ["users"] });

  setSelectedUser("");
  setSelectedShelter("");

  setAssigning(false);
};

  const handleInviteUser = async (e) => {
  e.preventDefault();

  alert(
    "User invitations require Supabase Auth. Create the account first using the Sign Up page, then assign a role below."
  );
};

  const handleJoinShelter = async (shelterId) => {
    const { error } = await supabase.from("profiles").update({ shelter_id: shelterId }).eq("id", user.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const myShelter = shelters?.find((s) => s.id === user?.shelter_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Shelter Management</h1>
        <p className="text-muted-foreground mt-1">Manage shelters, map, and emergency information</p>
      </div>

      <Tabs defaultValue="shelters">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="shelters" className="gap-1.5">
            <Building2 className="w-4 h-4" /> Shelters
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5">
            <Map className="w-4 h-4" /> Map
          </TabsTrigger>
          <TabsTrigger value="emergency" className="gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Emergency Info
          </TabsTrigger>
        </TabsList>

        {/* ── Shelters Tab ── */}
        <TabsContent value="shelters" className="mt-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">Shelters</h2>
              {isAdmin && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowCreateForm(!showCreateForm)}>
                  <Plus className="w-4 h-4" /> New Shelter
                </Button>
              )}
            </div>

            {shelters.length === 0 && !showCreateForm && (
              <Card className="border-dashed">
                <CardContent className="text-center py-10">
                  <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No shelters created yet.</p>
                  {isAdmin && (
                    <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Create First Shelter
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {shelters.map((shelter) => {
              const memberCount = allUsers.filter((u) => u.shelter_id === shelter.id).length;
              const isMyShel = user?.shelter_id === shelter.id;
              return (
                <div key={shelter.id} className="space-y-2">
                  <Card className={isMyShel ? "border-primary/40 bg-primary/5" : ""}>
                    {/* FIX: CardContent is flex row; info div and action area are proper siblings */}
                    <CardContent className="flex items-start justify-between p-5">
                      {/* Left: shelter info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{shelter.name}</h3>
                          {isMyShel && (
                            <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">
                              Your Shelter
                            </Badge>
                          )}
                        </div>
                        {shelter.address && <p className="text-sm text-muted-foreground">{shelter.address}</p>}
                        {shelter.description && <p className="text-sm text-muted-foreground mt-1">{shelter.description}</p>}
                        {isAdmin && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {memberCount} volunteer{memberCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>

                      {/* Right: action buttons */}
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {!isMyShel && (
                          <Button size="sm" variant="outline" onClick={() => handleJoinShelter(shelter.id)}>
                            Join
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => setEditingShelter(shelter)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteShelter(shelter.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {isMyShel && <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />}
                      </div>
                    </CardContent>
                  </Card>

                  {/* FIX: Edit form only shows for the shelter being edited, rendered outside the card */}
                  {editingShelter?.id === shelter.id && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Edit Shelter</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          value={editingShelter.name || ""}
                          onChange={(e) => setEditingShelter({ ...editingShelter, name: e.target.value })}
                          placeholder="Name"
                        />
                        <Input
                          value={editingShelter.address || ""}
                          onChange={(e) => setEditingShelter({ ...editingShelter, address: e.target.value })}
                          placeholder="Address"
                        />
                        <Input
                          value={editingShelter.phone || ""}
                          onChange={(e) => setEditingShelter({ ...editingShelter, phone: e.target.value })}
                          placeholder="Phone"
                        />
                        <Input
                          value={editingShelter.email || ""}
                          onChange={(e) => setEditingShelter({ ...editingShelter, email: e.target.value })}
                          placeholder="Email"
                        />
                        <Textarea
                          value={editingShelter.description || ""}
                          onChange={(e) => setEditingShelter({ ...editingShelter, description: e.target.value })}
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateShelter}>Save</Button>
                          <Button variant="outline" onClick={() => setEditingShelter(null)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>

          {showCreateForm && isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Create New Shelter</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateShelter} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Shelter Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Happy Paws Animal Shelter" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@shelter.org" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Address</Label>
                      <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, State" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="About this shelter..." />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button type="submit" disabled={creating}>
                      {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Shelter
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardHeader>
                <Card>
  <CardHeader>
    <CardTitle>User Registration</CardTitle>
  </CardHeader>

  <CardContent>
    Users should create their own account using the
    Sign Up page. After registration, use User
    Management below to assign roles and shelters.
  </CardContent>
</Card>
                <CardDescription>Send an invitation email to a new volunteer or admin</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Email Address</Label>
                      <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="volunteer@example.com" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={inviting || !inviteEmail.trim()} className="gap-1.5">
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Send Invitation
                    </Button>
                    {inviteSuccess && (
                      <span className="text-sm text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Invitation sent!
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

     {isAdmin && shelters.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Assign Volunteer to Shelter</CardTitle>
      <CardDescription>
        Move a volunteer to a shelter
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>User</Label>

          <Select
            value={selectedUser}
            onValueChange={setSelectedUser}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>

            <SelectContent>
              {allUsers.map((u) => (
                <SelectItem
                  key={u.id}
                  value={u.id}
                >
                  {u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Shelter</Label>

          <Select
            value={selectedShelter}
            onValueChange={setSelectedShelter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shelter" />
            </SelectTrigger>

            <SelectContent>
              {shelters.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleAssignVolunteer}
        disabled={
          !selectedUser ||
          !selectedShelter ||
          assigning
        }
      >
        {assigning && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        Assign Volunteer
      </Button>
    </CardContent>
  </Card>
)}
        </TabsContent>

        {/* ── Map Tab ── */}
        <TabsContent value="map" className="mt-6">
          <ShelterMap shelter={myShelter} />
        </TabsContent>

        {/* ── Emergency Info Tab ── */}
        <TabsContent value="emergency" className="mt-6">
          <EmergencyInfoTab shelterId={user?.shelter_id} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}