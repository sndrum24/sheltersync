import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Phone, Flame, Heart, CloudLightning, Shield, ArrowRightLeft, User, AlertCircle, Loader2, X } from "lucide-react";

const CATEGORIES = {
  fire: { label: "Fire", icon: Flame, color: "bg-red-100 text-red-700 border-red-200" },
  medical: { label: "Medical", icon: Heart, color: "bg-pink-100 text-pink-700 border-pink-200" },
  natural_disaster: { label: "Natural Disaster", icon: CloudLightning, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  security: { label: "Security", icon: Shield, color: "bg-blue-100 text-blue-700 border-blue-200" },
  evacuation: { label: "Evacuation", icon: ArrowRightLeft, color: "bg-orange-100 text-orange-700 border-orange-200" },
  contact: { label: "Emergency Contact", icon: User, color: "bg-green-100 text-green-700 border-green-200" },
  other: { label: "Other", icon: AlertCircle, color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const PRIORITIES = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-muted text-muted-foreground border-border",
};

const emptyForm = { title: "", category: "other", content: "", phone: "", priority: "medium" };

export default function EmergencyInfoTab({ shelterId, isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: items = [], isLoading } = useQuery({
  queryKey: ["announcements", shelterId],
  enabled: !!shelterId,
  queryFn: async () => {
    return supabase
      .from("announcements")
      .select("*")
      .eq("shelter_id", shelterId)
  }
});

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
  .from("emergency_info")
  .insert([{ ...form, shelter_id: shelterId }]);

if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["emergency-info", shelterId] });
    setForm(emptyForm);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
  .from("emergency_info")
  .delete()
  .eq("id", id);

if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["emergency-info", shelterId] });
  };

  // Group by category
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Procedures and contacts for emergency situations</p>
        {isAdmin && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && isAdmin && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">New Emergency Entry</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fire Evacuation Route" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Phone Number (optional)</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 911-0000" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Instructions / Details *</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe the procedure or contact info..." rows={4} required />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No emergency information added yet.</p>
            {isAdmin && <Button className="mt-4" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Add First Entry</Button>}
          </CardContent>
        </Card>
      )}

      {/* Grouped entries */}
      {Object.entries(grouped).map(([category, entries]) => {
        const cfg = CATEGORIES[category] || CATEGORIES.other;
        const Icon = cfg.icon;
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{cfg.label}</h3>
            </div>
            <div className="space-y-3">
              {entries.sort((a, b) => (a.priority === "high" ? -1 : 1)).map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-foreground">{item.title}</span>
                          <Badge className={`text-xs border ${PRIORITIES[item.priority]}`}>{item.priority}</Badge>
                          <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                        {item.phone && (
                          <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary hover:underline">
                            <Phone className="w-3.5 h-3.5" /> {item.phone}
                          </a>
                        )}
                      </div>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}