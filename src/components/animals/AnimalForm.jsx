import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/api/supabaseClient";
import { Upload, Loader2 } from "lucide-react";

const RESTRICTION_OPTIONS = [
  { value: "no_young_children", label: "No Young Children" },
  { value: "no_cats", label: "No Cats" },
  { value: "older_kids_only", label: "Older Kids Only" },
  { value: "no_small_dogs", label: "No Small Dogs" },
  { value: "no_farm_animals", label: "No Farm Animals" },
  { value: "experienced_owner", label: "Experienced Owner Required" },
];

export default function AnimalForm({ initial, onSubmit, isSubmitting }) {
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState(
    initial || {
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
      adoption_date: "",
      location: "",
      notes: "",
      photo_urls: [], // ✅ FIX: multi-image array
    }
  );

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleRestriction = (value) => {
    const current = form.house_restrictions || [];
    const updated = current.includes(value)
      ? current.filter((r) => r !== value)
      : [...current, value];

    set("house_restrictions", updated);
  };

  // ✅ MULTI IMAGE UPLOAD (FIXED)
  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);

    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("animal-photos")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const { data } = supabase.storage
        .from("animal-photos")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    set("photo_urls", [...(form.photo_urls || []), ...uploadedUrls]);
    setUploading(false);
  };

  const removePhoto = (index) => {
    set(
      "photo_urls",
      form.photo_urls.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      ...form,
      age_years: form.age_years ? Number(form.age_years) : null,
      age_months: form.age_months ? Number(form.age_months) : null,
      weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : null,
      photo_urls: form.photo_urls || [], // ✅ ensure array saved
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ================= PHOTOS ================= */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Photos</CardTitle>
        </CardHeader>

        <CardContent>
          {/* GALLERY */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {form.photo_urls?.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  className="w-full h-28 object-cover rounded-lg border"
                />

                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* UPLOAD */}
          <Label htmlFor="photos" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-muted">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload Photos
            </div>
          </Label>

          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotos}
          />

          <p className="text-xs text-muted-foreground mt-2">
            Upload multiple images (Petfinder-style gallery)
          </p>
        </CardContent>
      </Card>

      {/* ================= BASIC INFO ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />

          <Input
            placeholder="Breed"
            value={form.breed}
            onChange={(e) => set("breed", e.target.value)}
          />

          <Input
            type="number"
            placeholder="Age (years)"
            value={form.age_years}
            onChange={(e) => set("age_years", e.target.value)}
          />

          <Input
            type="number"
            placeholder="Weight (lbs)"
            value={form.weight_lbs}
            onChange={(e) => set("weight_lbs", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* ================= NOTES ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>

        <CardContent>
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Behavior, medical, etc..."
          />
        </CardContent>
      </Card>

      {/* ================= SUBMIT ================= */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {initial ? "Update Animal" : "Add Animal"}
        </Button>
      </div>
    </form>
  );
}