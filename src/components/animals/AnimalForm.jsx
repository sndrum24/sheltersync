import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";

export default function AnimalForm({ initial, onSubmit, isSubmitting }) {
  const [uploading, setUploading] = useState(false);

  const defaultForm = {
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
    photo_url: "", // ✅ matches AnimalDetail (primary)
    photo_urls: [], // optional gallery support
  };

  const [form, setForm] = useState(defaultForm);

  // ✅ sync when editing existing animal
  useEffect(() => {
    if (initial) {
      setForm({
        ...defaultForm,
        ...initial,
        age_years: initial.age_years ?? "",
        age_months: initial.age_months ?? "",
        weight_lbs: initial.weight_lbs ?? "",
        photo_url: initial.photo_url || "",
        photo_urls: initial.photo_urls || [],
      });
    }
  }, [initial]);

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // -----------------------------
  // PHOTO HANDLING (SAFE HYBRID)
  // -----------------------------
  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);

    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;

      // NOTE: kept generic upload logic (adjust if needed)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: file,
      }).catch(() => null);

      if (!res) continue;

      const data = await res.json().catch(() => null);
      if (data?.url) uploadedUrls.push(data.url);
    }

    const updatedGallery = [...(form.photo_urls || []), ...uploadedUrls];

    set("photo_urls", updatedGallery);

    // IMPORTANT: set first image as main photo (AnimalDetail uses photo_url)
    if (!form.photo_url && uploadedUrls.length > 0) {
      set("photo_url", uploadedUrls[0]);
    }

    setUploading(false);
  };

  const removePhoto = (index) => {
    const updated = form.photo_urls.filter((_, i) => i !== index);
    set("photo_urls", updated);

    // keep primary photo in sync
    if (form.photo_url === form.photo_urls[index]) {
      set("photo_url", updated[0] || "");
    }
  };

  // -----------------------------
  // SUBMIT (MATCH DETAIL PAGE)
  // -----------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,

      // normalize numbers
      age_years: form.age_years ? Number(form.age_years) : null,
      age_months: form.age_months ? Number(form.age_months) : null,
      weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : null,

      // ensure compatibility with AnimalDetail
      photo_url: form.photo_url || form.photo_urls?.[0] || null,
      photo_urls: form.photo_urls || [],
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ================= PHOTOS ================= */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Photos</CardTitle>
        </CardHeader>

        <CardContent>
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
            First image becomes the main profile photo
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
            placeholder="Behavior, medical, adoption notes..."
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