import React, { useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useRole } from "@/hooks/useRoles";
import {
  PawPrint,
  Heart,
  Home,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useShelter } from "@/hooks/useShelter";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import AnimalCard from "@/components/animals/AnimalCard";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import { useAuthUser } from "@/auth/AuthProvider";
export default function Dashboard() {
   const { user } = useAuthUser();
    const { isAdmin, isOwner } = useRole();
    const { shelters } = useShelter();


  // -------------------------
  // SIMPLE ACCESS MODEL (NO MEMBERSHIPS)
  // -------------------------

  const isGlobalAccess = isOwner || isAdmin;

  // -------------------------
  // MAIN ANIMALS QUERY
  // -------------------------
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ["animals"],
    queryFn: async () => {
      let query = supabase.from("animals").select("*");

      // Only restrict in future if needed
      // Right now: everyone sees same data OR you enforce via RLS
      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });

  // -------------------------
  // STATS
  // -------------------------
  const stats = useMemo(() => {
    return {
      total: animals.length,
      available: animals.filter((a) => a.status === "available").length,
      adopted: animals.filter((a) => a.status === "adopted").length,
      needsCare: animals.filter(
        (a) =>
          a.health_status === "needs_treatment" ||
          a.health_status === "critical"
      ).length,
    };
  }, [animals]);

  // -------------------------
  // RECENT ANIMALS
  // -------------------------
  const { data: recentAnimals = [] } = useQuery({
    queryKey: ["recent-animals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  // -------------------------
  // LOADING
  // -------------------------
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse text-muted-foreground">
          Loading dashboard...
        </div>
      </div>
    );
  }

  // -------------------------
  // UI
  // -------------------------
 return (
  <div className="space-y-10">

    <AnnouncementBanner />

    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Dashboard
          </h1>

          <p className="text-muted-foreground mt-1">
            {isGlobalAccess ? "All Shelters" : "Shelter"} — overview
          </p>
        </div>

        <Link to="/animals/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Animal
          </Button>
        </Link>
      </div>

      {/* WELCOME */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {user?.email}
        </h1>

        <div className="text-sm text-gray-500">
          Role: {isOwner ? "Owner" : isAdmin ? "Admin" : "User"}
        </div>
      </div>

      {/* BASIC STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold">Shelters</h2>
          <p className="text-2xl">{shelters.length}</p>
        </div>
      </div>

      {/* MAIN STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Animals" value={stats.total} icon={PawPrint} />
        <StatsCard title="Available" value={stats.available} icon={Heart} />
        <StatsCard title="Adopted" value={stats.adopted} icon={Home} />
        <StatsCard title="Needs Care" value={stats.needsCare} icon={AlertTriangle} />
      </div>

      {/* RECENT */}
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Animals</h2>
          <Link to="/animals">View all →</Link>
        </div>

        {recentAnimals.length === 0 ? (
          <div className="text-center py-16">
            <PawPrint className="mx-auto mb-3" />
            No animals yet
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {recentAnimals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}
      </div>

    </div>
  </div>
);
}