import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link, useParams } from "react-router-dom";
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { ArrowLeft, Pencil, Trash2, ShieldCheck, Syringe, Cpu, Printer, AlertTriangle, Clock, ClipboardCheck, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import AnimalForm from "@/components/animals/AnimalForm";
import AnimalNotes from "@/components/animals/AnimalNotes";
import CareChecklist from "@/components/animals/CareChecklist";
import { supabase } from "@/api/supabaseClient";
import { useAuthUser } from "@/auth/AuthProvider";


const statusConfig = {
  intake: { label: "Intake", className: "bg-accent/20 text-accent-foreground border-accent/30" },
  available: { label: "Available", className: "bg-primary/15 text-primary border-primary/30" },
  adopted: { label: "Adopted", className: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
  foster: { label: "Foster", className: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  medical_hold: { label: "Medical Hold", className: "bg-destructive/15 text-destructive border-destructive/30" },
  quarantine: { label: "Quarantine", className: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30" },
  holding: { label: "Holding", className: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  other: { label: "Other", className: "bg-muted text-muted-foreground border-border" },
};

const healthConfig = {
  healthy: { label: "Healthy", className: "bg-primary/15 text-primary" },
  needs_treatment: { label: "Needs Treatment", className: "bg-accent/20 text-accent-foreground" },
  recovering: { label: "Recovering", className: "bg-chart-3/15 text-chart-3" },
  critical: { label: "Critical", className: "bg-destructive/15 text-destructive" },
  no_walk: { label: "No Walk", className: "bg-amber-500/15 text-amber-600" },
};

const speciesEmoji = { dog: "🐕", cat: "🐈", rabbit: "🐇", bird: "🐦", reptile: "🦎", other: "🐾" };

const VALID_RESTRICTIONS = new Set([
  "no_young_children", "no_cats", "older_kids_only",
  "no_small_dogs", "no_farm_animals", "experienced_owner"
]);

const RESTRICTION_LABELS = {
  no_young_children: "No Young Children",
  no_cats: "No Cats",
  older_kids_only: "Older Kids Only",
  no_small_dogs: "No Small Dogs",
  no_farm_animals: "No Farm Animals",
  experienced_owner: "Experienced Owner Required",
};

function getDaysAtShelter(intakeDate) {
  if (!intakeDate) return null;
  const days = differenceInDays(new Date(), new Date(intakeDate));
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} at shelter`;
  const weeks = differenceInWeeks(new Date(), new Date(intakeDate));
  if (weeks < 8) return `${weeks} week${weeks !== 1 ? "s" : ""} at shelter`;
  const months = differenceInMonths(new Date(), new Date(intakeDate));
  return `${months} month${months !== 1 ? "s" : ""} at shelter`;
}

function formatAge(years, months) {
  const y = years ? `${years} yr${years !== 1 ? "s" : ""}` : "";
  const m = months ? `${months} mo` : "";
  return [y, m].filter(Boolean).join(" ") || null;
}

export default function AnimalDetail() {
  
  const { id } = useParams();

  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handlePrint = (animal, notes) => {
    const restrictionsHtml = animal.house_restrictions?.length
      ? `<div style="margin-top:12px;padding:10px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;">
          <strong style="color:#dc2626;font-size:13px;">⚠ House Restrictions:</strong>
          <ul style="margin:6px 0 0 16px;padding:0;color:#b91c1c;font-size:13px;">
            ${animal.house_restrictions.map((r) => `<li>${RESTRICTION_LABELS[r] || r}</li>`).join("")}
          </ul>
        </div>`
      : "";

    const notesHtml = notes?.length
      ? notes.map((n) => `
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:10px;break-inside:avoid;">
            <p style="margin:0 0 6px 0;white-space:pre-wrap;font-size:13px;line-height:1.6;color:#111827;">${n.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            <p style="margin:0;font-size:11px;color:#6b7280;">${n.created_by} · ${format(new Date(n.created_date), "MMM d, yyyy 'at' h:mm a")}</p>
          </div>`).join("")
      : "<p style='color:#6b7280;font-size:13px;'>No notes recorded.</p>";

    const ageStr = formatAge(animal.age_years, animal.age_months);
    const fields = [
      ["Species", animal.species],
      animal.breed && ["Breed", animal.breed],
      animal.gender && ["Gender", animal.gender],
      ageStr && ["Age", ageStr],
      animal.weight_lbs && ["Weight", `${animal.weight_lbs} lbs`],
      animal.color && ["Color", animal.color],
      animal.location && ["Location", animal.location],
      animal.intake_date && ["Intake Date", format(new Date(animal.intake_date), "MMMM d, yyyy")],
      ["Health", animal.health_status?.replace("_", " ")],
      ["Spayed/Neutered", animal.spayed_neutered ? "Yes" : "No"],
      ["Vaccinated", animal.vaccinated ? "Yes" : "No"],
      ["Microchipped", animal.microchipped ? "Yes" : "No"],
    ].filter(Boolean);

    const fieldsHtml = fields.map(([label, value]) => `
      <tr>
        <td style="padding:5px 10px 5px 0;color:#6b7280;font-size:13px;white-space:nowrap;">${label}</td>
        <td style="padding:5px 0;font-size:13px;color:#111827;text-transform:capitalize;">${value}</td>
      </tr>`).join("");

    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Profile — ${animal.name}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;color:#111827;}h1{font-size:24px;font-weight:700;margin:0 0 2px;}
      .meta{font-size:13px;color:#6b7280;margin-bottom:20px;}table{border-collapse:collapse;width:100%;}
      h2{font-size:16px;font-weight:600;margin:24px 0 10px;}hr{border:none;border-top:1px solid #e5e7eb;margin:16px 0;}
      @media print{body{margin:20px;}}</style></head><body>
      ${animal.photo_url ? `<img src="${animal.photo_url}" style="width:100%;max-height:300px;object-fit:cover;border-radius:10px;margin-bottom:16px;" />` : ""}
      <h1>${animal.name}</h1>
      <p class="meta">Printed on ${format(new Date(), "MMMM d, yyyy")}</p>
      <hr />
      <table>${fieldsHtml}</table>
      ${restrictionsHtml}
      ${animal.notes ? `<h2>General Notes</h2><p style="font-size:13px;color:#374151;white-space:pre-wrap;">${animal.notes.replace(/</g, "&lt;")}</p>` : ""}
      <h2>Staff Notes</h2>${notesHtml}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

 const { user } = useAuthUser();

const { data: animal, isLoading } = useQuery({
  queryKey: ["animal", id],
  enabled: !!id,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },
});

const { data: notes = [] } = useQuery({
  queryKey: ["animal-notes", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("animal_notes")
      .select("*")
      .eq("animal_id", id)
      .order("created_date", { ascending: false });

    if (error) throw error;
    return data;
  },
  enabled: !!id,
});

  const handleUpdate = async (data) => {
  try {
    setIsSubmitting(true);

    const { error } = await supabase
      .from("animals")
      .update(data)
      .eq("id", id);

    if (error) throw error;

    queryClient.invalidateQueries({
      queryKey: ["animals"],
    });

    queryClient.invalidateQueries({
      queryKey: ["animal", id],
    });

    setEditing(false);
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDelete = async () => {
  const { error } = await supabase
    .from("animals")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  queryClient.invalidateQueries({
    queryKey: ["animals"],
  });

  navigate("/animals");
};

  const handleTogglePending = async () => {
  const { error } = await supabase
    .from("animals")
    .update({
      pending: !animal.pending,
    })
    .eq("id", id);

  if (error) throw error;

  queryClient.invalidateQueries({
    queryKey: ["animals"],
  });

  queryClient.invalidateQueries({
    queryKey: ["animal", id],
  });
};
const handleTogglePricelessPups = async () => {
  const { error } = await supabase
    .from("animals")
    .update({
      priceless_pups: !animal.priceless_pups,
    })
    .eq("id", id);

  if (error) throw error;

  queryClient.invalidateQueries({
    queryKey: ["animals"],
  });

  queryClient.invalidateQueries({
    queryKey: ["animal", id],
  });
};
if (isLoading) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

if (!animal) {
  return (
    <div className="text-center py-20">
      <h2 className="font-heading text-2xl font-bold mb-2">
        Animal not found
      </h2>
      <Link to="/animals">
        <Button>Back to Animals</Button>
      </Link>
    </div>
  );
}
const status = statusConfig[animal.status] || statusConfig.intake;
const health = healthConfig[animal.health_status] || healthConfig.healthy;

const validRestrictions = (animal.house_restrictions || []).filter((r) =>
  VALID_RESTRICTIONS.has(r)
);
const createdDate =
  animal?.created_date &&
  !isNaN(new Date(animal.created_date).getTime());

const intakeDate =
  animal?.intake_date &&
  !isNaN(new Date(animal.intake_date).getTime());

const adoptionDate =
  animal?.adoption_date &&
  !isNaN(new Date(animal.adoption_date).getTime());
const daysAtShelter = getDaysAtShelter(animal.intake_date);
if (editing) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setEditing(false)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="font-heading text-2xl font-bold">
          Edit {animal.name}
        </h1>
      </div>

      <AnimalForm
        initial={{
          ...animal,
          age_years: animal.age_years ?? "",
          age_months: animal.age_months ?? "",
          weight_lbs: animal.weight_lbs ?? "",
        }}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}


  return (
    // edit form
    <div className={cn("max-w-3xl mx-auto space-y-6 p-1 rounded-2xl transition-colors", animal.pending && "bg-amber-50/60")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/animals">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">{animal.name}</h1>
            {animal.pending && (
              <span className="text-sm font-semibold text-amber-600">⏳ Pending</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant={animal.priceless_pups ? "default" : "outline"}
            size="sm"
            onClick={handleTogglePricelessPups}
            className={cn("gap-1.5", animal.priceless_pups ? "bg-amber-400 hover:bg-amber-500 text-white border-amber-400" : "text-amber-600 border-amber-400 hover:bg-amber-50")}
          >
            <Star className={cn("w-3.5 h-3.5", animal.priceless_pups && "fill-white")} />
            {animal.priceless_pups ? "Priceless Pups ✓" : "Priceless Pups"}
          </Button>
          <Button
            variant={animal.pending ? "default" : "outline"}
            size="sm"
            onClick={handleTogglePending}
            className={cn("gap-1.5", animal.pending ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" : "text-amber-600 border-amber-400 hover:bg-amber-50")}
          >
            <Clock className="w-3.5 h-3.5" />
            {animal.pending ? "Clear Pending" : "Mark Pending"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrint(animal, notes)} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {animal.name}?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently remove this animal record.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Photo + Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="aspect-square rounded-2xl bg-muted overflow-hidden border border-border">
          {animal.photo_url ? (
            <img src={animal.photo_url} alt={animal.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">{speciesEmoji[animal.species] || "🐾"}</div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("border text-sm", status.className)}>{status.label}</Badge>
            <Badge className={cn("text-sm", health.className)}>{health.label}</Badge>
          </div>
          <div className="space-y-3">
            <InfoRow label="Species" value={animal.species} capitalize />
            {animal.breed && <InfoRow label="Breed" value={animal.breed} />}
            {animal.gender && <InfoRow label="Gender" value={animal.gender} capitalize />}
            {(animal.age_years || animal.age_months) && <InfoRow label="Age" value={formatAge(animal.age_years, animal.age_months)} />}
            {animal.weight_lbs && <InfoRow label="Weight" value={`${animal.weight_lbs} lbs`} />}
            {animal.color && <InfoRow label="Color" value={animal.color} />}
            {animal.location && <InfoRow label="Location" value={animal.location} />}
           {animal.intake_date &&
 !isNaN(new Date(animal.intake_date).getTime()) && (
  <InfoRow
    label="Intake Date"
    value={format(new Date(animal.intake_date), "MMMM d, yyyy")}
  />
)}
           {animal.adoption_date &&
 !isNaN(new Date(animal.adoption_date).getTime()) && (
  <InfoRow
    label="Adoption Date"
    value={format(new Date(animal.adoption_date), "MMMM d, yyyy")}
  />
)}
            {daysAtShelter && <InfoRow label="Time at Shelter" value={daysAtShelter} />}
            {animal.intake_type && <InfoRow label="Intake Type" value={animal.intake_type.replace("_", " ")} capitalize />}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <MedBadge label="Spayed/Neutered" active={animal.spayed_neutered} icon={ShieldCheck} />
            <MedBadge label="Vaccinated" active={animal.vaccinated} icon={Syringe} />
            <MedBadge label="Microchipped" active={animal.microchipped} icon={Cpu} />
            {!animal.playgroup_eligible && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-destructive/10 text-destructive border-destructive/20 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Not Playgroup Eligible
              </div>
            )}
          </div>
          {validRestrictions.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> House Restrictions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {validRestrictions.map((r) => (
                  <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                    {RESTRICTION_LABELS[r]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Intake Background */}
      {(animal.intake_type) && (
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Intake Background</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl border flex-1 min-w-40",
              animal.intake_type === "stray" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
            )}>
              <span className="text-xl">{animal.intake_type === "stray" ? "🐾" : animal.intake_type === "owner_surrender" ? "🏠" : "📋"}</span>
              <div>
                <p className="text-xs text-muted-foreground">Intake Type</p>
                <p className="text-sm font-semibold capitalize">{animal.intake_type.replace(/_/g, " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-heading text-lg">Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <EvalBadge
            label="Evaluated"
            active={animal.evaluated}
            icon={ClipboardCheck}
            activeText="Has Been Evaluated"
            inactiveText="Not Yet Evaluated"
          />
          <button
            onClick={async () => {
             const { error } = await supabase
  .from("animals")
  .update({
    playgroup_eligible: !animal.playgroup_eligible,
  })
  .eq("id", id);

if (error) throw error;
              queryClient.invalidateQueries({ queryKey: ["animals"] });
            }}
            className="flex-1 min-w-40 text-left"
          >
            <EvalBadge
              label="Playgroup"
              active={animal.playgroup_eligible}
              icon={Users}
              activeText="In Playgroup ✓"
              inactiveText="Not In Playgroup — tap to set"
              interactive
            />
          </button>
        </CardContent>
      </Card>

      {/* General notes from animal profile */}
      {animal.notes && (
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Profile Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{animal.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Staff notes */}
      <AnimalNotes animalId={id} shelterId={user?.shelter_id} animal={animal} />

      {/* Care checklist & incidents */}
      <CareChecklist animalId={id} shelterId={user?.shelter_id} />

      <p className="text-xs text-muted-foreground">
  Added by {animal.created_by || "Unknown"}
</p>
    </div>
  );
}

function InfoRow({ label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", capitalize && "capitalize")}>{value}</span>
    </div>
  );
}

function MedBadge({ label, active, icon: Icon }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border",
      active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
    )}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

function EvalBadge({ label, active, icon: Icon, activeText, inactiveText, interactive }) {
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-4 py-3 rounded-xl border flex-1 min-w-40 transition-colors",
      active ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-border",
      interactive && "hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-semibold", active ? "text-primary" : "text-muted-foreground")}>
          {active ? activeText : inactiveText}
        </p>
      </div>
    </div>
  );
}