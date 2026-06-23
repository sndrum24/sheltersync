import React, { useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PawPrint, Heart, Home, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import AnimalCard from "@/components/animals/AnimalCard";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import { useShelter } from "@/hooks/useShelter";

export default function Dashboard() {
  const {
    user,
    shelter,
    memberships,
    isOwner,
  } = useShelter();

  // -------------------------
  // DERIVE ACCESSIBLE SHELTERS
  // -------------------------
  const shelterIds = useMemo(() => {
    if (isOwner) return null; // owner sees ALL shelters

    return memberships.map(m => m.shelter_id);
  }, [memberships, isOwner]);

  // -------------------------
  // MAIN ANIMALS QUERY (FIXED RBAC)
  // -------------------------
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ["animals", shelterIds],
    queryFn: async () => {
      let query = supabase.from("animals").select("*");

      // OWNER = ALL SHELTERS
      if (!isOwner) {
        query = query.in("shelter_id", shelterIds || []);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: isOwner || (shelterIds?.length > 0),
  });

  // -------------------------
  // STATS
  // -------------------------
  const stats = useMemo(() => {
    return {
      total: animals.length,
      available: animals.filter(a => a.status === "available").length,
      adopted: animals.filter(a => a.status === "adopted").length,
      needsCare: animals.filter(
        a =>
          a.health_status === "needs_treatment" ||
          a.health_status === "critical"
      ).length,
    };
  }, [animals]);

  // -------------------------
  // RECENT ANIMALS (FIXED RBAC)
  // -------------------------
  const { data: recentAnimals = [] } = useQuery({
    queryKey: ["recent-animals", shelterIds],
    queryFn: async () => {
      let query = supabase
        .from("animals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!isOwner) {
        query = query.in("shelter_id", shelterIds || []);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: isOwner || (shelterIds?.length > 0),
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
  // UI (UNCHANGED STRUCTURE)
  // -------------------------
  return (
    <div className="space-y-10">
      <AnnouncementBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Dashboard
          </h1>

          <p className="text-muted-foreground mt-1">
            {shelter?.name || "All Shelters"} — overview
          </p>
        </div>

        <Link to="/animals/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Animal
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Animals" value={stats.total} icon={PawPrint} />
        <StatsCard title="Available" value={stats.available} icon={Heart} />
        <StatsCard title="Adopted" value={stats.adopted} icon={Home} />
        <StatsCard title="Needs Care" value={stats.needsCare} icon={AlertTriangle} />
      </div>

      {/* Recent */}
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
            {recentAnimals.map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}