import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { X, CheckSquare, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "intake", label: "Intake" },
  { value: "available", label: "Available" },
  { value: "adopted", label: "Adopted" },
  { value: "foster", label: "Foster" },
  { value: "medical_hold", label: "Medical Hold" },
  { value: "quarantine", label: "Quarantine" },
  { value: "holding", label: "Holding" },
  { value: "other", label: "Other" },
];

export default function BulkEditBar({ selectedIds, shelterId, onClear }) {
  const [newStatus, setNewStatus] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const count = selectedIds.size;

  const handleApply = async () => {
    if (!newStatus && !newLocation.trim()) return;
    setSaving(true);
    const updates = {};
    if (newStatus) updates.status = newStatus;
    if (newLocation.trim()) updates.location = newLocation.trim();
   await Promise.all(
  [...selectedIds].map(async (id) => {
    const { error } = await supabase
      .from("animals")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  })
);
    queryClient.invalidateQueries({ queryKey: ["animals", shelterId] });
    setSaving(false);
    setNewStatus("");
    setNewLocation("");
    onClear();
  };

  return (
    <div className="sticky top-[68px] z-40 bg-card border border-primary/30 rounded-xl shadow-lg px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 mr-1">
        <CheckSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">{count} selected</span>
      </div>

      <div className="flex items-center gap-2 flex-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue placeholder="Set status…" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <Input
            className="h-8 w-36 text-sm"
            placeholder="Set location…"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
        </div>

        <Button
          size="sm"
          onClick={handleApply}
          disabled={saving || (!newStatus && !newLocation.trim())}
          className="h-8"
        >
          {saving ? "Saving…" : "Apply"}
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-muted-foreground ml-auto">
        <X className="w-4 h-4" />
        Cancel
      </Button>
    </div>
  );
}