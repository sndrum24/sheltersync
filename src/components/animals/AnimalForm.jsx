import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/api/supabaseClient";
import { Upload, Loader2 } from "lucide-react";

const RESTRICTION_OPTIONS = [
  { value: "no_young_children", label: "No Young Children" },
  { value: "no_cats", label: "No cats" },
  { value: "older_kids_only", label: "Older Kids Only" },
  { value: "no_small_dogs", label: "No Small Dogs" },
  { value: "no_farm_animals", label: "No Farm Animals" },
  { value: "experienced_owner", label: "Experienced owner required" },
];

export default function AnimalForm({ initial, onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initial || {
    name: "",
    species: "dog",
    breed: "",
    age_years: "",
    age_months: "",
    gender: "unknown",
    weight_lbs: "",
    color: "",
    status: "intake",
    health_status: "healthy",
    spayed_neutered: false,
    vaccinated: false,
    microchipped: false,
    evaluated: false,
    playgroup_eligible: false,
    house_restrictions: [],
    intake_date: new Date().toISOString().split("T")[0],
    photo_url: "",
    notes: "",
    location: "",
  });

  const toggleRestriction = (value) => {
    const current = form.house_restrictions || [];
    const updated = current.includes(value)
      ? current.filter((r) => r !== value)
      : [...current, value];
    set("house_restrictions", updated);
  };
  const [uploading, setUploading] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    const fileName = `${Date.now()}-${file.name}`;

const { error } = await supabase.storage
  .from("animal-photos")
  .upload(fileName, file);

if (error) {
  console.error(error);
  return;
}

const { data } = supabase.storage
  .from("animal-photos")
  .getPublicUrl(fileName);

set("photo_url", data.publicUrl);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      age_years: form.age_years ? Number(form.age_years) : undefined,
      age_months: form.age_months ? Number(form.age_months) : undefined,
      weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">Photo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 rounded-xl bg-muted overflow-hidden flex items-center justify-center border border-border">
              {form.photo_url ? (
                <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🐾</span>
              )}
            </div>
            <div>
              <Label htmlFor="photo" className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Uploading..." : "Upload Photo"}
                </div>
              </Label>
              <input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG up to 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">Basic Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Animal name" required />
          </div>
          <div className="space-y-1.5">
            <Label>Species *</Label>
            <Select value={form.species} onValueChange={(v) => set("species", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="bird">Bird</SelectItem>
                <SelectItem value="reptile">Reptile</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Breed</Label>
            <Input value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="e.g. Golden Retriever" />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Age (years)</Label>
            <Input type="number" min="0" step="1" value={form.age_years} onChange={(e) => set("age_years", e.target.value)} placeholder="Years" />
          </div>
          <div className="space-y-1.5">
            <Label>Age (months)</Label>
            <Input type="number" min="0" max="11" step="1" value={form.age_months} onChange={(e) => set("age_months", e.target.value)} placeholder="Additional months (0–11)" />
          </div>
          <div className="space-y-1.5">
            <Label>Weight (lbs)</Label>
            <Input type="number" min="0" step="0.1" value={form.weight_lbs} onChange={(e) => set("weight_lbs", e.target.value)} placeholder="Weight" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Color / Markings</Label>
            <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. Black and tan" />
          </div>
        </CardContent>
      </Card>

      {/* Status & Health */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">Status & Health</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="intake">Intake</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="adopted">Adopted</SelectItem>
                  <SelectItem value="foster">Foster</SelectItem>
                  <SelectItem value="medical_hold">Medical Hold</SelectItem>
                  <SelectItem value="quarantine">Quarantine</SelectItem>
                  <SelectItem value="holding">Holding</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Health Status</Label>
              <Select value={form.health_status} onValueChange={(v) => set("health_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="needs_treatment">Needs Treatment</SelectItem>
                  <SelectItem value="recovering">Recovering</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="no_walk">No Walk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Intake Date</Label>
              <Input type="date" value={form.intake_date} onChange={(e) => set("intake_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Intake Type</Label>
              <Select value={form.intake_type || ""} onValueChange={(v) => set("intake_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select intake type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stray">Stray</SelectItem>
                  <SelectItem value="owner_surrender">Owner Surrender</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="born_in_shelter">Born in Shelter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Adoption Date</Label>
              <Input type="date" value={form.adoption_date || ""} onChange={(e) => set("adoption_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location / Kennel</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Kennel B3" />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.spayed_neutered} onCheckedChange={(v) => set("spayed_neutered", v)} />
              <Label className="text-sm">Spayed/Neutered</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.vaccinated} onCheckedChange={(v) => set("vaccinated", v)} />
              <Label className="text-sm">Vaccinated</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.microchipped} onCheckedChange={(v) => set("microchipped", v)} />
              <Label className="text-sm">Microchipped</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.evaluated} onCheckedChange={(v) => set("evaluated", v)} />
              <Label className="text-sm">Evaluated</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!form.playgroup_eligible} onCheckedChange={(v) => set("playgroup_eligible", !v)} />
              <Label className="text-sm">Not Playgroup Eligible</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* House Restrictions */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">House Restrictions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RESTRICTION_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={opt.value}
                  checked={(form.house_restrictions || []).includes(opt.value)}
                  onCheckedChange={() => toggleRestriction(opt.value)}
                />
                <Label htmlFor={opt.value} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Behavioral notes, medical history, special needs..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting} className="px-8">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initial ? "Update Animal" : "Add Animal"}
        </Button>
      </div>
    </form>
  );
}