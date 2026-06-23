import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  PawPrint,
  CalendarDays,
  BarChart2,
  LogOut,
  ChevronDown,
  Trash2,
  PlusCircle,
  BookOpen,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useShelter } from "@/hooks/useShelter";
import { useQuery } from "@tanstack/react-query";
import LongStayAlert from "@/components/animals/LongStayAlert";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { AnimatePresence, motion } from "framer-motion";

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
    shelter,
    isLoading,
    isOwner,
    isAdmin,
    memberships,
    needsShelter,
  } = useShelter();

  const [showDelete, setShowDelete] = useState(false);

  // 🔥 CRITICAL SAFE GUARD (FIXED ORDER)
  if (isLoading) return <div className="p-10">Loading...</div>;

  if (!isOwner && !isAdmin && (!memberships || memberships.length === 0)) {
    return <Navigate to="/no-shelter" replace />;
  }

  const navItems = isAdmin
    ? [...navBase, { label: "Add Animal", path: "/animals/new", icon: PlusCircle }, { label: "Breed Guide", path: "/breed-resources", icon: BookOpen }]
    : [...navBase, { label: "Breed Guide", path: "/breed-resources", icon: BookOpen }];

  const logout = async () => supabase.auth.signOut();

  return (
    <div className="min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="flex justify-between p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <PawPrint />
          ShelterSync
        </Link>

        <nav className="hidden sm:flex gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex gap-2 px-3 py-2 rounded",
                  location.pathname === item.path ? "bg-primary text-white" : ""
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2">
              {user?.email}
              <ChevronDown />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowDelete(true)}
              className="text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <LongStayAlert animals={[]} />

      {/* CONTENT */}
      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* DELETE DIALOG */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}