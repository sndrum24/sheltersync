import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PawPrint, PlusCircle, Building2, LogOut, ChevronDown, Trash2, CalendarDays, BookOpen, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShelter } from "@/hooks/useShelter";
import NoShelter from "@/pages/NoShelter";
import { useQuery } from "@tanstack/react-query";
import LongStayAlert from "@/components/animals/LongStayAlert";
import { Navigate } from "react-router-dom";
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
  const { user, shelter, isLoading, needsShelter, isAdmin } = useShelter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: animals = [] } = useQuery({
  queryKey: ["animals", user?.shelter_id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("shelter_id", user.shelter_id);

    if (error) throw error;
    return data;
  },
  enabled: !!user?.shelter_id,
});

  const navItems = isAdmin
    ? [...baseNavItems, { label: "Add Animal", path: "/animals/new", icon: PlusCircle }, { label: "Breed Guide", path: "/breed-resources", icon: BookOpen }]
    : [...baseNavItems, { label: "Breed Guide", path: "/breed-resources", icon: BookOpen }];

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (needsShelter) {
  return <Navigate to="/no-shelter" replace />;
}

const handleLogout = async () => {
  await supabase.auth.signOut();
};

  const handleDeleteAccount = async () => {
    // Delete user record then log out
    await supabase
  .from("profiles")
  .delete()
  .eq("id", user.id);

await supabase.auth.signOut();
  };

  const isNavActive = (item) =>
    location.pathname === item.path ||
    (item.path === "/animals" &&
      location.pathname.startsWith("/animals") &&
      location.pathname !== "/animals/new") ||
    (item.path === "/calendar" && location.pathname === "/calendar");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
                  ShelterSync
                </span>
                {shelter && (
                  <span className="text-xs text-muted-foreground block -mt-1 leading-tight">
                    {shelter.name}
                  </span>
                )}
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/shelters"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  location.pathname === "/shelters"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Building2 className="w-4 h-4" />
                Shelters
              </Link>
            </nav>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {user?.full_name?.[0] || user?.email?.[0] || "?"}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-28 truncate">
                    {user?.full_name || user?.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-foreground truncate">{user?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  {shelter && <p className="text-xs text-muted-foreground truncate">{shelter.name}</p>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/shelters" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> {isAdmin ? "Manage Shelters" : "Shelter Info"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Long Stay Alert Banner */}
      <LongStayAlert animals={animals} />

      {/* Page Content with slide animation */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-safe"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-t border-border flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}