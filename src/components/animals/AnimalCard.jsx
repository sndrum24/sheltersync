import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Heart, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { cn } from "@/lib/utils";

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
  experienced_owner: "Experienced Owner",
};

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

const speciesEmoji = {
  dog: "🐕", cat: "🐈", rabbit: "🐇", bird: "🐦", reptile: "🦎", other: "🐾",
};

function getDaysAtShelter(intakeDate) {
  if (!intakeDate) return null;
  const days = differenceInDays(new Date(), new Date(intakeDate));
  if (days < 14) return `${days}d at shelter`;
  const weeks = differenceInWeeks(new Date(), new Date(intakeDate));
  if (weeks < 8) return `${weeks}w at shelter`;
  const months = differenceInMonths(new Date(), new Date(intakeDate));
  return `${months}mo at shelter`;
}

function isLongFoster(animal) {
  if (animal.status !== "foster" || animal.species !== "dog" || !animal.intake_date) return false;
  return differenceInDays(new Date(), new Date(animal.intake_date)) > 20;
}

export default function AnimalCard({ animal, selectable = false, selected = false, onToggleSelect }) {
  const status = statusConfig[animal.status] || statusConfig.intake;
  const daysLabel = getDaysAtShelter(animal.intake_date);
  const longFoster = isLongFoster(animal);
  const validRestrictions = (animal.house_restrictions || []).filter((r) => VALID_RESTRICTIONS.has(r));

  const handleClick = (e) => {
    if (selectable) {
      e.preventDefault();
      onToggleSelect?.(animal.id);
    }
  };

  const cardContent = (
    <Card className={cn(
      "overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/60",
      animal.pending && "ring-2 ring-amber-400 border-amber-300 bg-amber-50/30",
      selected && "ring-2 ring-primary border-primary/50 bg-primary/5"
    )}>
      {/* Photo area */}
<div className="aspect-[4/3] bg-muted relative overflow-hidden group">

  {/* IMAGE CAROUSEL */}
  <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-full">

    {(animal.photo_urls?.length ? animal.photo_urls : [animal.photo_url])
      ?.filter(Boolean)
      .map((url, i) => (
        <div
          key={i}
          className="w-full h-full flex-shrink-0 snap-center"
        >
          <img
            src={url}
            alt={animal.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ))}

  </div>

  {/* STATUS BADGE */}
  <Badge
    className={cn("absolute top-3 left-3 border", status.className)}
  >
    {status.label}
  </Badge>

  {/* PENDING BADGE */}
  {animal.pending && (
    <Badge className="absolute top-3 right-3 border bg-amber-400/90 text-amber-900 border-amber-500/50">
      Pending
    </Badge>
  )}

  {/* SELECTED OVERLAY */}
  {selectable && selected && (
    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
      <CheckCircle2 className="w-10 h-10 text-primary drop-shadow" />
    </div>
  )}

  {/* SELECT OUTLINE */}
  {selectable && !selected && (
    <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white bg-black/20" />
  )}

</div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-heading text-lg font-semibold text-foreground">{animal.name}</h3>
          <span className="text-xs text-muted-foreground capitalize">{animal.gender || ""}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {animal.breed || animal.species}{animal.age_years ? ` · ${animal.age_years}yr` : ""}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {daysLabel && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {daysLabel}
            </span>
          )}
          {animal.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {animal.location}
            </span>
          )}
          {animal.health_status === "needs_treatment" && (
            <span className="flex items-center gap-1 text-destructive">
              <Heart className="w-3.5 h-3.5" />
              Needs care
            </span>
          )}
          {longFoster && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Long foster
            </span>
          )}
        </div>
        {validRestrictions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/40">
            {validRestrictions.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                <AlertTriangle className="w-2.5 h-2.5" />
                {RESTRICTION_LABELS[r]}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  if (selectable) {
    return <div onClick={handleClick}>{cardContent}</div>;
  }

  return <Link to={`/animals/${animal.id}`}>{cardContent}</Link>;
}