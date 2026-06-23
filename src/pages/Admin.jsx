import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { isOwner, isAdmin, loading } = useRole();

  const [users, setUsers] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [members, setMembers] = useState([]);

  const [userId, setUserId] = useState("");
  const [shelterId, setShelterId] = useState("");
  const [role, setRole] = useState("volunteer");

  if (loading) return null;
  if (!isOwner && !isAdmin) return <Navigate to="/" replace />;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: userData } = await supabase
      .from("profiles")
      .select("id, email");

    const { data: shelterData } = await supabase
      .from("shelters")
      .select("id, name");

    const { data: memberData } = await supabase
      .from("shelter_members")
      .select("*");

    setUsers(userData || []);
    setShelters(shelterData || []);
    setMembers(memberData || []);
  };

  const assignRole = async () => {
    if (!userId || !shelterId || !role) return;

    const { error } = await supabase
      .from("shelter_members")
      .insert([{ user_id: userId, shelter_id: shelterId, role }]);

    if (error) return alert(error.message);

    loadData();
  };

  const removeRole = async (id) => {
    await supabase.from("shelter_members").delete().eq("id", id);
    loadData();
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Control Center</h1>

      {/* ASSIGN */}
      <div>
        <select onChange={(e) => setUserId(e.target.value)}>
          <option value="">User</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>

        <select onChange={(e) => setShelterId(e.target.value)}>
          <option value="">Shelter</option>
          {shelters.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="volunteer">Volunteer</option>
        </select>

        <button onClick={assignRole}>Assign</button>
      </div>

      {/* LIST */}
      <table border="1">
        <thead>
          <tr>
            <th>User</th>
            <th>Shelter</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {members.map(m => (
            <tr key={m.id}>
              <td>{m.user_id}</td>
              <td>{m.shelter_id}</td>
              <td>{m.role}</td>
              <td>
                <button onClick={() => removeRole(m.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}