import { useState, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, FileText, Upload, Loader2, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useShelter } from "@/hooks/useShelter";

const CATEGORY_LABELS = {
  characteristics: "Characteristics",
  training: "Training",
  health: "Health",
  diet: "Diet",
  behavior: "Behavior",
  other: "Other",
};

const CATEGORY_COLORS = {
  characteristics: "bg-primary/10 text-primary border-primary/20",
  training: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  health: "bg-destructive/10 text-destructive border-destructive/20",
  diet: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  behavior: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  other: "bg-muted text-muted-foreground border-border",
};

const EMPTY_FORM = { breed: "", species: "dog", title: "", content: "", category: "characteristics", file_url: "", file_name: "" };

export default function BreedResources() {
  const { user, isAdmin } = useShelter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedBreeds, setExpandedBreeds] = useState({});

const { data: breedResources = [] } = useQuery({
  queryKey: ["breed_resources", user?.shelter_id],
  enabled: !!user?.shelter_id,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("breed_resources")
      .select("*")
      .eq("shelter_id", user.shelter_id);

    if (error) throw error;
    return data || [];
  },
});

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      breed: item.breed || "",
      species: item.species || "dog",
      title: item.title || "",
      content: item.content || "",
      category: item.category || "characteristics",
      file_url: item.file_url || "",
      file_name: item.file_name || "",
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;

const { error: uploadError } = await supabase.storage
  .from("breed-resources")
  .upload(fileName, file);

if (uploadError) throw uploadError;

const { data: publicUrlData } = supabase.storage
  .from("breed-resources")
  .getPublicUrl(fileName);

const file_url = publicUrlData.publicUrl;
    set("file_url", file_url);
    set("file_name", file.name);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = { ...form, shelter_id: user.shelter_id };
    if (editingItem) {
     const { error } = await supabase
  .from("breed_resources")
  .update(data)
  .eq("id", editingItem.id);
    } else {
     const { error } = await supabase
  .from("breed_resources")
  .insert([data]);
    }
    queryClient.invalidateQueries({ queryKey: ["breed-resources"] });
    setShowForm(false);
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
  const { error } = await supabase
    .from("breed_resources")
    .delete()
    .eq("id", id);

  if (error) throw error;

  queryClient.invalidateQueries({
    queryKey: ["breed_resources", user?.shelter_id],
  });
};

  const toggleBreed = (breed) => setExpandedBreeds((prev) => ({ ...prev, [breed]: !prev[breed] }));

  // Group by breed
 const grouped = useMemo(() => {
  const filtered = breedResources.filter((r) => {
    if (!search) return true;

    return (
      r.breed?.toLowerCase().includes(search.toLowerCase()) ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.content?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return filtered.reduce((acc, r) => {
    const key = r.breed || "Unknown";

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(r);
    return acc;
  }, {});
}, [breedResources, search]);

  const breedNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Breed Resources</h1>
          <p className="text-muted-foreground mt-1">Characteristics, training tips, and helpful guides by breed</p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Resource
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search breeds, titles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Grouped by breed */}
      {breedNames.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">No resources yet</h3>
          {isAdmin && <p className="text-muted-foreground">Click "Add Resource" to get started.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {breedNames.map((breed) => {
            const items = grouped[breed];
            const isOpen = expandedBreeds[breed] !== false; // default open
            return (
              <div key={breed} className="border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleBreed(breed)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-semibold text-foreground">{breed}</span>
                    <span className="text-sm text-muted-foreground">({items.length} {items.length === 1 ? "resource" : "resources"})</span>
                    <span className="text-xs text-muted-foreground capitalize hidden sm:inline">· {items[0]?.species}</span>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="p-4 border-t border-border bg-muted/20 space-y-3">
                    {items.map((item) => (
                      <Card key={item.id} className="border-border/60">
                        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-semibold text-foreground">{item.title}</CardTitle>
                            <Badge className={cn("mt-1.5 text-[10px] border", CATEGORY_COLORS[item.category])}>
                              {CATEGORY_LABELS[item.category]}
                            </Badge>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </CardHeader>
                        {(item.content || item.file_url) && (
                          <CardContent className="pt-0 space-y-2">
                            {item.content && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>}
                            {item.file_url && (
                              <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                                <FileText className="w-3.5 h-3.5" />
                                {item.file_name || "View Attachment"}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) setEditingItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingItem ? "Edit Resource" : "Add Breed Resource"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Breed *</Label>
                <Input value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="e.g. Golden Retriever" required />
              </div>
              <div className="space-y-1.5">
                <Label>Species</Label>
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
            </div>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Energy & Exercise Needs" required />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes / Content</Label>
              <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Add breed notes, tips, or descriptions..." className="min-h-[100px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Attach File (PDF, image, etc.)</Label>
              <div className="flex items-center gap-3">
                <Label htmlFor="breedfile" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Uploading..." : "Upload File"}
                  </div>
                </Label>
                <input id="breedfile" type="file" className="hidden" onChange={handleFileUpload} />
                {form.file_name && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{form.file_name}</span>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || uploading}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? "Save Changes" : "Add Resource"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}