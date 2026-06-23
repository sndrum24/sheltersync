import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ClipboardList, Plus, Trash2, ChevronDown, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  injury:     { label: "Injury",      className: "bg-destructive/15 text-destructive border-destructive/30" },
  illness:    { label: "Illness",     className: "bg-amber-500/15 text-amber-600 border-amber-400/30" },
  behavior:   { label: "Behavior",    className: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  medication: { label: "Medication",  className: "bg-primary/15 text-primary border-primary/30" },
  escape:     { label: "Escape",      className: "bg-accent/20 text-accent-foreground border-accent/30" },
  bite:       { label: "Bite",        className: "bg-destructive/20 text-destructive border-destructive/40" },
  other:      { label: "Other",       className: "bg-muted text-muted-foreground border-border" },
};

const DEFAULT_TASKS = {
  injury:     ["Assess wound", "Clean and bandage", "Monitor for swelling", "Schedule vet visit"],
  illness:    ["Check temperature", "Monitor eating/drinking", "Administer medication", "Follow-up with vet"],
  behavior:   ["Document trigger", "Notify staff", "Update handling notes", "Schedule behavior consult"],
  medication: ["Confirm dosage", "Administer medication", "Log administration", "Monitor for side effects"],
  escape:     ["Secure enclosure", "Check for injuries", "Update enclosure notes", "Notify supervisor"],
  bite:       ["Document incident", "Assess wound on person/animal", "File incident report", "Notify supervisor"],
  other:      ["Document details", "Assess situation", "Notify staff if needed"],
};

function IncidentCard({ incident, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const allDone = incident.checklist?.length > 0 && incident.checklist.every((t) => t.completed);

  const toggleTask = async (idx) => {
    const updated = incident.checklist.map((t, i) =>
      i === idx ? { ...t, completed: !t.completed } : t
    );
    await onUpdate(incident.id, { checklist: updated });
  };

  const toggleResolved = async () => {
    await onUpdate(incident.id, { resolved: !incident.resolved });
  };

  const cat = CATEGORY_CONFIG[incident.category] || CATEGORY_CONFIG.other;

  return (
    <div className={cn("border rounded-xl overflow-hidden", incident.resolved ? "opacity-60" : "")}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-medium text-sm", incident.resolved && "line-through text-muted-foreground")}>{incident.title}</span>
            <Badge className={cn("border text-xs", cat.className)}>{cat.label}</Badge>
            {incident.resolved && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Resolved</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {incident.incident_date && <span>{format(new Date(incident.incident_date), "MMM d, yyyy")}</span>}
            {incident.checklist?.length > 0 && (
              <span>{incident.checklist.filter((t) => t.completed).length}/{incident.checklist.length} tasks done</span>
            )}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this incident?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(incident.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-border bg-muted/10 space-y-4">
          {incident.description && (
            <p className="text-sm text-muted-foreground">{incident.description}</p>
          )}

          {incident.checklist?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Care Checklist</p>
              <div className="space-y-1.5">
                {incident.checklist.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`task-${incident.id}-${idx}`}
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(idx)}
                    />
                    <Label
                      htmlFor={`task-${incident.id}-${idx}`}
                      className={cn("text-sm font-normal cursor-pointer", task.completed && "line-through text-muted-foreground")}
                    >
                      {task.task}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={incident.resolved ? "outline" : "default"}
              onClick={toggleResolved}
              className="gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {incident.resolved ? "Mark Unresolved" : "Mark Resolved"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CareChecklist({ animalId, shelterId }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", incident_date: new Date().toISOString().split("T")[0], category: "other", checklist: [] });
  const [customTask, setCustomTask] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
  queryKey: ["incidents", animalId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("animal_id", animalId)
      .order("created_date", { ascending: false });

    if (error) throw error;

    return data;
  },
});

  const handleCategoryChange = (cat) => {
    const defaultTasks = (DEFAULT_TASKS[cat] || []).map((t) => ({ task: t, completed: false }));
    setForm((f) => ({ ...f, category: cat, checklist: defaultTasks }));
  };

  const addCustomTask = () => {
    if (!customTask.trim()) return;
    setForm((f) => ({ ...f, checklist: [...f.checklist, { task: customTask.trim(), completed: false }] }));
    setCustomTask("");
  };

  const removeTask = (idx) => {
    setForm((f) => ({ ...f, checklist: f.checklist.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    const { error } = await supabase
  .from("incidents")
  .insert([
    {
      ...form,
      animal_id: animalId,
      shelter_id: shelterId,
    },
  ]);

if (error) throw error;

  const handleUpdate = async (id, data) => {
    const { error } = await supabase
  .from("incidents")
  .update(data)
  .eq("id", id);

if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["incidents", animalId] });
  };

  const handleDelete = async (id) => {
   const { error } = await supabase
  .from("incidents")
  .delete()
  .eq("id", id);

if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["incidents", animalId] });
  };

  const open = incidents.filter((i) => !i.resolved);
  const resolved = incidents.filter((i) => i.resolved);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Care Checklist & Incidents
          {open.length > 0 && <span className="text-sm font-normal text-muted-foreground">({open.length} open)</span>}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Log Incident
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title *</Label>
                <Input placeholder="e.g. Dog bite on left leg" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.incident_date} onChange={(e) => setForm((f) => ({ ...f, incident_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea placeholder="What happened?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[70px] resize-none" />
              </div>
            </div>

            {/* Checklist editor */}
            <div className="space-y-2">
              <Label>Checklist Tasks</Label>
              <div className="space-y-1.5">
                {form.checklist.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex-1 text-sm bg-background border border-border rounded-md px-3 py-1.5">{t.task}</span>
                    <button type="button" onClick={() => removeTask(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add a task..." value={customTask} onChange={(e) => setCustomTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTask(); }}} />
                <Button type="button" variant="outline" size="sm" onClick={addCustomTask}>Add</Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Incident
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No incidents logged.</p>
        ) : (
          <div className="space-y-2">
            {open.map((i) => <IncidentCard key={i.id} incident={i} onUpdate={handleUpdate} onDelete={handleDelete} />)}
            {resolved.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Resolved</p>
                {resolved.map((i) => <IncidentCard key={i.id} incident={i} onUpdate={handleUpdate} onDelete={handleDelete} />)}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}}