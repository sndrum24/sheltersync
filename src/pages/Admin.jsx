import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useRole } from "@/hooks/useRoles";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { isOwner, isAdmin, loading } = useRole();

  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("volunteer");

  // -------------------------
  // AUTH GUARD
  // -------------------------
  if (loading) return <div>Loading...</div>;

  if (!isOwner && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // -------------------------
  // LOAD DATA
  // -------------------------
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role");

    if (error) {
      console.error(error);
      return;
    }

    setUsers(data || []);
  };

  // -------------------------
  // UPDATE ROLE
  // -------------------------
  const updateRole = async () => {
    if (!userId || !role) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("user_id", user.id)

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  // -------------------------
  // RESET ROLE
  // -------------------------
  const resetRole = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "volunteer" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Control Center</h1>

      {/* ASSIGN ROLE */}
      <div style={{ marginBottom: 20 }}>
        <select onChange={(e) => setUserId(e.target.value)}>
          <option value="">User</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.email} ({u.role})
            </option>
          ))}
        </select>

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="volunteer">Volunteer</option>
        </select>

        <button onClick={updateRole}>
          Update Role
        </button>
      </div>

      {/* USERS TABLE */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={() => resetRole(u.id)}>
                  Reset to Volunteer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}