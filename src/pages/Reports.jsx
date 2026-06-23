import React, { useMemo, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useShelter } from "@/hooks/useShelter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Home, PawPrint, TrendingUp, Clock, Printer, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AdoptionAnniversaries from "@/components/reports/AdoptionAnniversaries";

const COLORS = ["hsl(221,70%,48%)", "hsl(0,72%,51%)", "hsl(199,65%,45%)", "hsl(262,55%,55%)", "hsl(0,84%,60%)", "hsl(45,93%,47%)"];

const INTAKE_COLORS = {
  stray: "hsl(45,93%,47%)",
  owner_surrender: "hsl(221,70%,48%)",
  community_trapped: "hsl(199,65%,45%)",
  transfer: "hsl(262,55%,55%)",
  born_in_shelter: "hsl(0,84%,60%)",
  other: "hsl(220,15%,65%)",
};

export default function Reports() {
  const { user } = useShelter();
  const [monthsBack] = useState(6);

  const { data: animals = [], isLoading } = useQuery({
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

  const adoptedAnimals = useMemo(() => animals.filter((a) => a.status === "adopted"), [animals]);

  const adoptionsByMonth = useMemo(() => {
    const months = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = adoptedAnimals.filter((a) => {
        const d = a.adoption_date ? new Date(a.adoption_date) : a.updated_date ? new Date(a.updated_date) : null;
        return d && isWithinInterval(d, { start, end });
      }).length;
      months.push({ month: format(date, "MMM yy"), count });
    }
    return months;
  }, [adoptedAnimals, monthsBack]);

  const bySpecies = useMemo(() => {
    const map = {};
    adoptedAnimals.forEach((a) => {
      const s = a.species || "other";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [adoptedAnimals]);

  const statusBreakdown = useMemo(() => {
    const map = {};
    animals.forEach((a) => {
      const s = a.status || "other";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [animals]);

  const avgDaysToAdopt = useMemo(() => {
    const withIntake = adoptedAnimals.filter((a) => a.intake_date);
    if (!withIntake.length) return null;
    const total = withIntake.reduce((sum, a) => {
      const intake = new Date(a.intake_date);
      const adopted = new Date(a.adoption_date || a.updated_date || a.created_date);
      return sum + Math.max(0, Math.round((adopted - intake) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Math.round(total / withIntake.length);
  }, [adoptedAnimals]);

  const intakeTypeByMonth = useMemo(() => {
    const months = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const inMonth = animals.filter((a) => {
        const d = a.intake_date ? new Date(a.intake_date) : null;
        return d && isWithinInterval(d, { start, end });
      });
      months.push({
        month: format(date, "MMM yy"),
        stray: inMonth.filter((a) => a.intake_type === "stray").length,
        owner_surrender: inMonth.filter((a) => a.intake_type === "owner_surrender").length,
        community_trapped: inMonth.filter((a) => a.intake_type === "community_trapped").length,
      });
    }
    return months;
  }, [animals, monthsBack]);

  const intakeTypeTotals = useMemo(() => {
    const map = {};
    animals.forEach((a) => {
      if (a.intake_type) map[a.intake_type] = (map[a.intake_type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [animals]);

  const playgroupStats = useMemo(() => {
    const dogs = animals.filter((a) => a.species === "dog");
    const eligible = dogs.filter((a) => a.playgroup_eligible);
    const notEligible = dogs.filter((a) => !a.playgroup_eligible);

    const adopted = eligible.filter((a) => a.status === "adopted");
    const current = eligible.filter((a) => a.status !== "adopted");

    const avgDays = (list) => {
      const withData = list.filter((a) => a.status === "adopted" && a.intake_date);
      if (!withData.length) return null;
      const total = withData.reduce((sum, a) => {
        const intake = new Date(a.intake_date);
        const adoptedDate = new Date(a.adoption_date || a.updated_date || a.created_date);
        return sum + Math.max(0, Math.round((adoptedDate - intake) / (1000 * 60 * 60 * 24)));
      }, 0);
      return Math.round(total / withData.length);
    };

    const playgroupAvg = avgDays(eligible);
    const nonPlaygroupAvg = avgDays(notEligible);
    const fasterPct = (playgroupAvg !== null && nonPlaygroupAvg !== null && nonPlaygroupAvg > 0)
      ? Math.round(((nonPlaygroupAvg - playgroupAvg) / nonPlaygroupAvg) * 100)
      : null;

    const chartData = [
      ...(playgroupAvg !== null ? [{ group: "In Playgroup", days: playgroupAvg, fill: "hsl(var(--primary))" }] : []),
      ...(nonPlaygroupAvg !== null ? [{ group: "Not In Playgroup", days: nonPlaygroupAvg, fill: "hsl(var(--muted-foreground))" }] : []),
    ];

    return { total: eligible.length, adopted: adopted.length, current: current.length, playgroupAvg, nonPlaygroupAvg, fasterPct, chartData };
  }, [animals]);

  const topBreeds = useMemo(() => {
    const map = {};
    adoptedAnimals.forEach((a) => {
      if (a.breed) map[a.breed] = (map[a.breed] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [adoptedAnimals]);

  const handlePrintReports = () => {
    const win = window.open("", "_blank");

    const summaryRows = [
      ["Total Adopted", adoptedAnimals.length],
      ["Currently In Shelter", animals.filter(a => a.status !== "adopted").length],
      ["Available Now", animals.filter(a => a.status === "available").length],
      ["Avg Days to Adopt", avgDaysToAdopt !== null ? `${avgDaysToAdopt} days` : "—"],
    ];

    const summaryHtml = summaryRows.map(([label, val]) =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${label}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:700;font-size:18px;">${val}</td></tr>`
    ).join("");

    const adoptionMonthRows = adoptionsByMonth.map(r =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.month}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.count}</td></tr>`
    ).join("");

    const speciesRows = bySpecies.map(r =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize;">${r.name}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.value}</td></tr>`
    ).join("");

    const statusRows = statusBreakdown.map(r =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize;">${r.name}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.value}</td></tr>`
    ).join("");

    const intakeRows = intakeTypeTotals.map(r =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize;">${r.name}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.value}</td></tr>`
    ).join("");

    const breedRows = topBreeds.map(r =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.name}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.count}</td></tr>`
    ).join("");

    const intakeMonthRows = intakeTypeByMonth.map(r =>
      `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.month}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.stray}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.owner_surrender}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${r.community_trapped}</td>
      </tr>`
    ).join("");

    win.document.write(`<!DOCTYPE html><html><head>
      <title>Shelter Reports</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 860px; margin: 40px auto; color: #111827; }
        h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
        h2 { font-size: 16px; font-weight: 600; margin: 28px 0 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
        p.sub { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; }
        th { text-align: left; padding: 8px 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; }
        .legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; margin-bottom: 12px; }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>
      <h1>📊 Shelter Reports</h1>
      <p class="sub">Printed on ${format(new Date(), "MMMM d, yyyy")}</p>

      <h2>Summary</h2>
      <table><tbody>${summaryRows.length ? summaryHtml : "<tr><td>No data</td></tr>"}</tbody></table>

      <h2>Adoptions — Last 6 Months</h2>
      <div class="legend"><div class="legend-item"><div class="swatch" style="background:hsl(221,70%,48%);"></div>Adoptions per month</div></div>
      <table>
        <thead><tr><th>Month</th><th>Adoptions</th></tr></thead>
        <tbody>${adoptionMonthRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
      </table>

      <h2>Adoptions by Species</h2>
      <div class="legend">${bySpecies.map((r, i) => `<div class="legend-item"><div class="swatch" style="background:${COLORS[i % COLORS.length]};"></div>${r.name}</div>`).join("")}</div>
      <table>
        <thead><tr><th>Species</th><th>Count</th></tr></thead>
        <tbody>${speciesRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
      </table>

      <h2>Current Status Breakdown</h2>
      <div class="legend">${statusBreakdown.map((r, i) => `<div class="legend-item"><div class="swatch" style="background:${COLORS[i % COLORS.length]};"></div>${r.name}</div>`).join("")}</div>
      <table>
        <thead><tr><th>Status</th><th>Count</th></tr></thead>
        <tbody>${statusRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
      </table>

      <h2>Intake Type Breakdown</h2>
      <div class="legend">${intakeTypeTotals.map((r, i) => `<div class="legend-item"><div class="swatch" style="background:${COLORS[i % COLORS.length]};"></div>${r.name}</div>`).join("")}</div>
      <table>
        <thead><tr><th>Intake Type</th><th>Count</th></tr></thead>
        <tbody>${intakeRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
      </table>

      <h2>Intake by Type — Last 6 Months</h2>
      <div class="legend">
        <div class="legend-item"><div class="swatch" style="background:hsl(45,93%,47%);"></div>Stray</div>
        <div class="legend-item"><div class="swatch" style="background:hsl(221,70%,48%);"></div>Owner Surrender</div>
        <div class="legend-item"><div class="swatch" style="background:hsl(199,65%,45%);"></div>Community Trapped</div>
      </div>
      <table>
        <thead><tr><th>Month</th><th>Stray</th><th>Owner Surrender</th><th>Community Trapped</th></tr></thead>
        <tbody>${intakeMonthRows || "<tr><td colspan='4'>No data</td></tr>"}</tbody>
      </table>

      <h2>Top Adopted Breeds</h2>
      <table>
        <thead><tr><th>Breed</th><th>Count</th></tr></thead>
        <tbody>${breedRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Adoption statistics and shelter overview</p>
        </div>
        <Button variant="outline" onClick={handlePrintReports} className="gap-2">
          <Printer className="w-4 h-4" /> Print Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Home} color="bg-chart-3/15 text-chart-3" title="Total Adopted" value={adoptedAnimals.length} />
        <SummaryCard icon={PawPrint} color="bg-primary/10 text-primary" title="Currently In Shelter" value={animals.filter(a => a.status !== "adopted").length} />
        <SummaryCard icon={TrendingUp} color="bg-accent/20 text-accent-foreground" title="Available Now" value={animals.filter(a => a.status === "available").length} />
        <SummaryCard icon={Clock} color="bg-amber-500/15 text-amber-600" title="Avg Days to Adopt" value={avgDaysToAdopt !== null ? `${avgDaysToAdopt}d` : "—"} />
      </div>

      {/* Playgroup Stats */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Playgroup Dogs</CardTitle></CardHeader>
        <CardContent>
          {playgroupStats.total === 0 ? (
            <p className="text-muted-foreground text-sm py-2 text-center">No playgroup-eligible animals recorded yet. Set playgroup status on animal profiles.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold font-heading text-primary">{playgroupStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Playgroup Eligible</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-heading text-chart-3">{playgroupStats.adopted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Adopted</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-heading text-amber-600">{playgroupStats.current}</p>
                  <p className="text-xs text-muted-foreground mt-1">Currently In Shelter</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-heading text-muted-foreground">
                    {Math.round((playgroupStats.adopted / playgroupStats.total) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Adoption Rate</p>
                </div>
              </div>

              {/* Time to adopt comparison */}
              {playgroupStats.chartData.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Avg Days to Adoption — Playgroup vs Non-Playgroup Dogs</p>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Bar chart */}
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={playgroupStats.chartData} barCategoryGap="40%">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="group" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} unit="d" />
                          <Tooltip formatter={(v) => [`${v} days`, "Avg Days to Adoption"]} />
                          <Bar dataKey="days" name="Avg Days to Adoption" radius={[6, 6, 0, 0]}>
                            {playgroupStats.chartData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Summary callout */}
                    <div className="flex flex-col gap-3 shrink-0">
                      {playgroupStats.playgroupAvg !== null && (
                        <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 text-center min-w-32">
                          <p className="text-2xl font-bold font-heading text-primary">{playgroupStats.playgroupAvg}d</p>
                          <p className="text-xs text-muted-foreground">In Playgroup</p>
                        </div>
                      )}
                      {playgroupStats.nonPlaygroupAvg !== null && (
                        <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 text-center min-w-32">
                          <p className="text-2xl font-bold font-heading text-muted-foreground">{playgroupStats.nonPlaygroupAvg}d</p>
                          <p className="text-xs text-muted-foreground">Not In Playgroup</p>
                        </div>
                      )}
                      {playgroupStats.fasterPct !== null && (
                        <div className={`rounded-xl px-4 py-3 border text-center ${playgroupStats.fasterPct >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <p className={`text-sm font-semibold ${playgroupStats.fasterPct >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {playgroupStats.fasterPct >= 0
                              ? `${playgroupStats.fasterPct}% faster`
                              : `${Math.abs(playgroupStats.fasterPct)}% slower`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">vs non-playgroup</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adoptions over time */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Adoptions — Last 6 Months</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adoptionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Adoptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Current Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Adoptions by Species */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Adoptions by Species</CardTitle></CardHeader>
          <CardContent>
            {bySpecies.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No adoption data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bySpecies} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Adopted" radius={[0, 4, 4, 0]}>
                    {bySpecies.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Adopted Breeds */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Top Adopted Breeds</CardTitle></CardHeader>
          <CardContent>
            {topBreeds.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No breed data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topBreeds}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Adopted" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Stray vs Owner Surrender vs Community Trapped over time */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-heading text-base">Intake by Type — Last 6 Months</CardTitle></CardHeader>
          <CardContent>
            {intakeTypeByMonth.every(m => m.stray === 0 && m.owner_surrender === 0 && m.community_trapped === 0) ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No intake type data yet. Set the Intake Type on animal profiles to populate this chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={intakeTypeByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stray" name="Stray" fill={INTAKE_COLORS.stray} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="owner_surrender" name="Owner Surrender" fill={INTAKE_COLORS.owner_surrender} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="community_trapped" name="Community Trapped" fill={INTAKE_COLORS.community_trapped} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Overall intake type breakdown */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-base">Intake Type Breakdown</CardTitle></CardHeader>
          <CardContent>
            {intakeTypeTotals.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No intake type data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={intakeTypeTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                    {intakeTypeTotals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Adoption Anniversaries — bottom of page */}
      <AdoptionAnniversaries animals={animals} />
    </div>
  );
}

function SummaryCard({ icon: Icon, color, title, value }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold font-heading">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}