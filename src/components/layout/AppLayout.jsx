import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  PawPrint,
  PlusCircle,
  Building2,
  LogOut,
  ChevronDown,
  Trash2,
  CalendarDays,
  BookOpen,
  BarChart2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useShelter } from "@/hooks/useShelter";
import NoShelter from "@/pages/NoShelter";
import { useQuery } from "@tanstack/react-query";
import LongStayAlert from "@/components/animals/LongStayAlert";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { AnimatePresence, motion } from "framer-motion";

const baseNavItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Animals", path: "/animals", icon: PawPrint },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Reports", path: "/reports", icon: BarChart2 },
];

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function AppLayout() {
  const location = useLocation();
  const {
    user,
    shelter,
    isLoading,
    isOwner,
    isAdmin,
    memberships,
  } = useShelter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // -------------------------
  // LOADING GUARD (IMPORTANT)
  // -------------------------
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // -------------------------
  // GLOBAL RBAC FIX (NO-SHELTER SCREEN)
  // -------------------------
  const shouldShowNoShelterScreen =
    !isOwner &&
    !isAdmin &&
    (!memberships || memberships.length === 0);

  if (shouldShowNoShelterScreen) {
    return <NoShelter />;
  }

  // -------------------------
  // FETCH ANIMALS
  // -------------------------
  const { data: animals = [] } = useQuery({
    queryKey: ["animals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animals")
        .select("*");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // -------------------------
  // NAV ITEMS
  // -------------------------
  const navItems = isAdmin
    ? [
        ...baseNavItems,
        { label: "Add Animal", path: "/animals/new", icon: PlusCircle },
        { label: "Breed Guide", path: "/breed-resources", icon: BookOpen },
      ]
    : [
        ...baseNavItems,
        { label: "Breed Guide", path: "/breed-resources", icon: BookOpen },
      ];

  // -------------------------
  // LOGOUT
  // -------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
  };

  const isNavActive = (item) =>
    location.pathname === item.path ||
    (item.path === "/animals" &&
      location.pathname.startsWith("/animals") &&
      location.pathname !== "/animals/new");

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">

          <Link to="/" className="flex items-center gap-2">
            <PawPrint className="w-5 h-5" />
            <span className="font-semibold">ShelterSync</span>
          </Link>

          {/* NAV */}
          <nav className="hidden sm:flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md",
                    isNavActive(item)
                      ? "bg-primary text-white"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* USER MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2">
                <ChevronDown />
                {user?.email}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      {/* ALERT */}
      <LongStayAlert animals={animals} />

      {/* PAGE CONTENT */}
      <main className="flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* DELETE ACCOUNT */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}