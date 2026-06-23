import React, { useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PawPrint, Heart, Home, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "@/components/dashboard/StatsCard";
import AnimalCard from "@/components/animals/AnimalCard";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import { useShelter } from "@/hooks/useShelter";


export default function Dashboard() {
  const { user, shelter } = useShelter();
    const { data: animals = [], isLoading } = useQuery({
  queryKey: ["animals", user?.shelter_id],
  queryFn: async () => {
    if (!user?.shelter_id) return [];

    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("shelter_id", user.shelter_id);

    if (error) throw error;
    return data || [];
  },
  enabled: !!user?.shelter_id,
});

  const stats = React.useMemo(() => {
    const total = animals.length;
    const available = animals.filter((a) => a.status === "available").length;
    const adopted = animals.filter((a) => a.status === "adopted").length;
    const needsCare = animals.filter((a) => a.health_status === "needs_treatment" || a.health_status === "critical").length;
    return { total, available, adopted, needsCare };
  }, [animals]);

  const { data: recentAnimals = [], isLoading: recentLoading } = useQuery({
  queryKey: ["recent-animals", user?.shelter_id],
  queryFn: async () => {
    if (!user?.shelter_id) return [];

    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("shelter_id", user.shelter_id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  },
  enabled: !!user?.shelter_id,
});
 if (isLoading) {
  return (
    <div className="space-y-3">
      <div className="animate-pulse text-muted-foreground">
        Loading dashboard...
      </div>
    </div>
  );
}

  return (
    <div className="space-y-10">
      {/* Announcements */}
      <AnnouncementBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">{shelter?.name || "Your Shelter"} — animal overview</p>
        </div>
        <Link to="/animals/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Animal
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Animals" value={stats.total} icon={PawPrint} color="bg-primary/10 text-primary" />
        <StatsCard title="Available" value={stats.available} icon={Heart} color="bg-accent/20 text-accent-foreground" />
        <StatsCard title="Adopted" value={stats.adopted} icon={Home} color="bg-chart-3/15 text-chart-3" />
        <StatsCard title="Needs Care" value={stats.needsCare} icon={AlertTriangle} color="bg-destructive/15 text-destructive" />
      </div>

      {/* Recent Animals */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl font-semibold text-foreground">Recent Animals</h2>
          <Link to="/animals" className="text-sm text-primary font-medium hover:underline">View all →</Link>
        </div>
        {recentAnimals.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <PawPrint className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">No animals yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first animal to the shelter.</p>
            <Link to="/animals/new"><Button>Add First Animal</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentAnimals.map((animal) => <AnimalCard key={animal.id} animal={animal} />)}
          </div>
        )}
      </div>
    </div>
  );
}