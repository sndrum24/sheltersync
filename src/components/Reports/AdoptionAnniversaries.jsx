import React, { useMemo, useState } from "react";
import { differenceInMonths, format, addMonths } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Heart, ChevronDown, ChevronRight, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MILESTONE_MONTHS = [1, 6, 12, 24, 36, 48, 60];

function getMilestoneLabel(months) {
  if (months < 12) return `${months} Month${months > 1 ? "s" : ""}`;
  const years = months / 12;
  return `${years} Year${years > 1 ? "s" : ""}`;
}

function getMilestoneColor(months) {
  if (months === 1) return "bg-pink-100 text-pink-700 border-pink-200";
  if (months === 6) return "bg-purple-100 text-purple-700 border-purple-200";
  if (months === 12) return "bg-amber-100 text-amber-700 border-amber-200";
  if (months === 24) return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-green-100 text-green-700 border-green-200";
}

export default function AdoptionAnniversaries({ animals }) {
  const [open, setOpen] = useState(false);
  const [filterMilestone, setFilterMilestone] = useState("all");
  const [filterSpecies, setFilterSpecies] = useState("all");

  const allAnniversaries = useMemo(() => {
    const today = new Date();
    const results = [];
    animals.forEach((animal) => {
      if (!animal.adoption_date || animal.status !== "adopted") return;
      const adoptedDate = new Date(animal.adoption_date);
      const monthsAdopted = differenceInMonths(today, adoptedDate);
      MILESTONE_MONTHS.forEach((milestone) => {
        if (monthsAdopted === milestone) {
          results.push({ animal, milestone, adoptedDate, anniversaryDate: addMonths(adoptedDate, milestone) });
        }
      });
    });
    return results.sort((a, b) => a.milestone - b.milestone);
  }, [animals]);

  const filtered = useMemo(() => {
    return allAnniversaries.filter((e) => {
      const milestoneMatch = filterMilestone === "all" || e.milestone === Number(filterMilestone);
      const speciesMatch = filterSpecies === "all" || e.animal.species === filterSpecies;
      return milestoneMatch && speciesMatch;
    });
  }, [allAnniversaries, filterMilestone, filterSpecies]);

  const speciesOptions = useMemo(() => {
    const s = new Set(allAnniversaries.map((e) => e.animal.species));
    return [...s];
  }, [allAnniversaries]);

  const handlePrint = () => {
    const rows = filtered.map((entry) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${entry.animal.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize;">${entry.animal.species}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${entry.animal.breed || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${format(entry.adoptedDate, "MMMM d, yyyy")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${getMilestoneLabel(entry.milestone)} Anniversary 🎉</td>
      </tr>
    `).join("");

    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Adoption Anniversaries</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; color: #111827; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        p { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 10px 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>
      <h1>💕 Adoption Anniversaries</h1>
      <p>Printed on ${format(new Date(), "MMMM d, yyyy")} · Animals celebrating milestones this month</p>
      ${rows.length === 0
        ? `<p style="font-style:italic;color:#9ca3af;">No adoption anniversaries match the selected filters.</p>`
        : `<table>
            <thead><tr>
              <th>Name</th><th>Species</th><th>Breed</th><th>Adoption Date</th><th>Milestone</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`
      }
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      {/* Header / toggle */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2.5">
          <Heart className="w-5 h-5 text-pink-500" />
          <span className="font-heading font-semibold text-foreground">Adoption Anniversaries This Month</span>
          <span className="text-sm text-muted-foreground">({allAnniversaries.length})</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-muted/20 border-b border-border">
            <Select value={filterMilestone} onValueChange={setFilterMilestone}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="All milestones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Milestones</SelectItem>
                {MILESTONE_MONTHS.map((m) => (
                  <SelectItem key={m} value={String(m)}>{getMilestoneLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="All species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                {speciesOptions.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={handlePrint}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              <Printer className="w-3.5 h-3.5" /> Print List
            </button>
          </div>

          {/* List */}
          <div className="px-5 py-4">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {allAnniversaries.length === 0 ? "No adoption anniversaries this month." : "No results match the selected filters."}
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center text-lg">
                        {entry.animal.species === "dog" ? "🐕" : entry.animal.species === "cat" ? "🐈" : "🐾"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{entry.animal.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {entry.animal.species}{entry.animal.breed ? ` · ${entry.animal.breed}` : ""} · Adopted {format(entry.adoptedDate, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge className={`border text-xs ${getMilestoneColor(entry.milestone)}`}>
                      🎉 {getMilestoneLabel(entry.milestone)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}