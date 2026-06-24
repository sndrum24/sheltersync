import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PawPrint, CalendarDays, BarChart2 } from "lucide-react";
import { useShelter } from "@/hooks/useShelter";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate } from "react-router-dom";

const navBase = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Animals", path: "/animals", icon: PawPrint },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Reports", path: "/reports", icon: BarChart2 },
];

export default function AppLayout() {
  const location = useLocation();

  const {
    user,
    isLoading,
  } = useShelter();

  const [showDelete, setShowDelete] = useState(false);

  // -------------------------
  // AUTH GUARD ONLY (NO SHELTER LOGIC)
  // -------------------------
  if (isLoading) return <div>Loading...</div>;

  if (!user) {
  return <Navigate to="/login" replace />;
}

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="flex justify-between p-4 border-b">
        <Link to="/">ShelterSync</Link>

        <nav className="flex gap-2">
          {navBase.map((item) => (
            <Link key={item.path} to={item.path}>
              {item.label}
            </Link>
          ))}
        </nav>

        <button onClick={logout}>Logout</button>
      </header>

      {/* CONTENT */}
      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}