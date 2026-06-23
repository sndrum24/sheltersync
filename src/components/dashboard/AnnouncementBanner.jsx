import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useShelter } from "@/hooks/useShelter";
import { AlertTriangle, Info, X, Megaphone, Plus, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const priorityConfig = {
  info: { icon: Info, bg: "bg-blue-50 border-blue-200", text: "text-blue-800", icon_color: "text-blue-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 border-amber-200", text: "text-amber-800", icon_color: "text-amber-500" },
  urgent: { icon: Megaphone, bg: "bg-destructive/10 border-destructive/30", text: "text-destructive", icon_color: "text-destructive" },
};

const emptyForm = { title: "", message: "", priority: "info" };

export default function AnnouncementBanner() {
  const { user, isAdmin } = useShelter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements", user?.shelter_id],
    queryFn: async () => {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("shelter_id", user.shelter_id)
    .eq("active", true)
    .order("created_date", { ascending: false });

  if (error) throw error;
  return data;
},
  })

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    const { error } = await supabase
  .from("announcements")
  .insert([
    {
      ...form,
      shelter_id: user.shelter_id,
      active: true,
    },
  ]);

if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    setForm(emptyForm);
    setShowForm(false);
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    const { error } = await supabase
  .from("announcements")
  .update({
    title: form.title,
    message: form.message,
    priority: form.priority,
  })
  .eq("id", editingId);

if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setSaving(false);
  };

  const handleEdit = (ann) => {
    setForm({ title: ann.title, message: ann.message, priority: ann.priority });
    setEditingId(ann.id);
    setShowForm(true);
    setListExpanded(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
  .from("announcements")
  .update({ active: false })
  .eq("id", id);

if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  if (!announcements.length && !isAdmin) return null;

  return (
    <div className="space-y-3">
      {/* Active announcements display */}
      {announcements.map((ann) => {
        const cfg = priorityConfig[ann.priority] || priorityConfig.info;
        const Icon = cfg.icon;
        return (
          <div key={ann.id} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border", cfg.bg)}>
            <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", cfg.icon_color)} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold", cfg.text)}>{ann.title}</p>
              <p className={cn("text-sm mt-0.5", cfg.text, "opacity-80")}>{ann.message}</p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(ann)} className={cn("opacity-60 hover:opacity-100 p-0.5", cfg.text)}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(ann.id)} className={cn("opacity-60 hover:opacity-100 p-0.5", cfg.text)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Admin controls */}
      {isAdmin && (
        <div className="space-y-2">
          {/* Manage existing / post new row */}
          {!showForm && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Post Announcement
              </button>
              {announcements.length > 0 && (
                <button
                  onClick={() => setListExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {listExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Manage ({announcements.length})
                </button>
              )}
            </div>
          )}

          {/* Dropdown list for managing existing announcements */}
          {listExpanded && !showForm && (
            <div className="border border-border rounded-xl bg-card divide-y divide-border overflow-hidden">
              {announcements.map((ann) => {
                const cfg = priorityConfig[ann.priority] || priorityConfig.info;
                return (
                  <div key={ann.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className={cn("text-xs font-medium capitalize px-2 py-0.5 rounded-full border", cfg.bg, cfg.text)}>
                      {ann.priority}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{ann.title}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(ann)} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(ann.id)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create / Edit form */}
          {showForm && (
            <div className="border border-border rounded-xl p-4 bg-card space-y-3">
              <p className="text-sm font-semibold">{editingId ? "Edit Announcement" : "New Announcement"}</p>
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Textarea
                placeholder="Message..."
                value={form.message}
                rows={2}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info</SelectItem>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="urgent">🚨 Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" onClick={editingId ? handleUpdate : handleCreate} disabled={saving}>
                  {editingId ? "Save" : "Post"}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}