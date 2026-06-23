import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isToday, isFuture, isPast, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock, Users, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useShelter } from "@/hooks/useShelter";
import { useToast } from "@/components/ui/use-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { user, isAdmin } = useShelter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", location: "", max_volunteers: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["shelter-events", user?.shelter_id],
    queryFn: async () => {
  const { data, error } = await supabase
    .from("shelter_events")
    .select("*")
    .eq("shelter_id", user.shelter_id)
    .order("date");

  if (error) throw error;
  return data;
},
  });

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(startOfMonth(currentMonth));

  const eventsOnDay = (day) => events.filter((e) => e.date && isSameDay(parseISO(e.date), day));

  const openCreate = (date) => {
    setEditingEvent(null);
    setForm({ title: "", description: "", date: date ? format(date, "yyyy-MM-dd") : "", time: "", location: "", max_volunteers: "" });
    setShowForm(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || "",
      description: event.description || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || "",
      max_volunteers: event.max_volunteers || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = { ...form, shelter_id: user.shelter_id, max_volunteers: form.max_volunteers ? Number(form.max_volunteers) : undefined };
    if (editingEvent) {
      await supabase
  .from("shelter_events")
  .update(data)
  .eq("id", editingEvent.id);
    } else {
      await supabase
  .from("shelter_events")
  .insert([{ ...data, signups: [] }]);
    }
    queryClient.invalidateQueries({ queryKey: ["shelter-events"] });
    setShowForm(false);
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
   await supabase
  .from("shelter_events")
  .delete()
  .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["shelter-events"] });
  };

  const handleSignup = async (event) => {
    const alreadySigned = (event.signups || []).some((s) => s.email === user.email);
    let updatedSignups;
    if (alreadySigned) {
      updatedSignups = event.signups.filter((s) => s.email !== user.email);
    } else {
      if (event.max_volunteers && (event.signups || []).length >= event.max_volunteers) {
        toast({ title: "Event is full", description: "No more volunteer spots available.", variant: "destructive" });
        return;
      }
      updatedSignups = [...(event.signups || []), { email: user.email, name: user.full_name || user.email }];
    }
    await supabase
  .from("shelter_events")
  .update({ signups: updatedSignups })
  .eq("id", event.id);
    queryClient.invalidateQueries({ queryKey: ["shelter-events"] });
  };

  const selectedDayEvents = selectedDate ? eventsOnDay(selectedDate) : [];
  const upcomingEvents = events.filter((e) => e.date && (isFuture(parseISO(e.date)) || isToday(parseISO(e.date)))).slice(0, 10);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">Events & volunteer sign-ups</p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => openCreate(null)}>
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
                {Array(startPad).fill(null).map((_, i) => (
                  <div key={`pad-${i}`} className="bg-muted/30 aspect-square" />
                ))}
                {daysInMonth.map((day) => {
                  const dayEvents = eventsOnDay(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);
                  return (
                    <button
                      key={day.toString()}
                      onClick={() => setSelectedDate(isSameDay(day, selectedDate) ? null : day)}
                      className={cn(
                        "bg-card aspect-square flex flex-col items-center justify-start pt-1.5 gap-0.5 hover:bg-muted/50 transition-colors relative",
                        isSelected && "bg-primary/10 hover:bg-primary/15",
                        isCurrentDay && "ring-2 ring-inset ring-primary/40"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isCurrentDay && "bg-primary text-primary-foreground",
                        !isCurrentDay && isSelected && "text-primary font-bold"
                      )}>
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 flex-wrap justify-center px-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected day events */}
              {selectedDate && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">{format(selectedDate, "EEEE, MMMM d")}</p>
                  {selectedDayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events this day.{isAdmin && " Click 'Add Event' to create one."}</p>
                  ) : (
                    selectedDayEvents.map((event) => <EventCard key={event.id} event={event} user={user} isAdmin={isAdmin} onSignup={handleSignup} onEdit={openEdit} onDelete={handleDelete} />)
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming events sidebar */}
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-foreground">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} user={user} isAdmin={isAdmin} onSignup={handleSignup} onEdit={openEdit} onDelete={handleDelete} compact />
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) setEditingEvent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event name" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Main hall" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Volunteers</Label>
              <Input type="number" min="1" value={form.max_volunteers} onChange={(e) => setForm((f) => ({ ...f, max_volunteers: e.target.value }))} placeholder="Leave blank for unlimited" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Details about this event..." className="min-h-[80px]" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{editingEvent ? "Save Changes" : "Create Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventCard({ event, user, isAdmin, onSignup, onEdit, onDelete, compact }) {
  const signups = event.signups || [];
  const isSigned = signups.some((s) => s.email === user?.email);
  const isFull = event.max_volunteers && signups.length >= event.max_volunteers;
  const past = event.date && isPast(parseISO(event.date)) && !isToday(parseISO(event.date));

  return (
    <div className={cn("rounded-xl border border-border bg-card p-3.5 space-y-2", past && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{event.title}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {event.date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="w-3 h-3" />{format(parseISO(event.date), "MMM d")}
                {event.time && ` · ${event.time}`}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />{event.location}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(event)}>
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
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {!compact && event.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          {signups.length}{event.max_volunteers ? `/${event.max_volunteers}` : ""} volunteers
          {isFull && <Badge className="ml-1 text-[10px] py-0 px-1.5 bg-destructive/10 text-destructive border-destructive/20">Full</Badge>}
        </span>
        {!past && (
          <Button
            size="sm"
            variant={isSigned ? "secondary" : "default"}
            className="h-7 text-xs px-3"
            onClick={() => onSignup(event)}
          >
            {isSigned ? "Cancel Sign-up" : "Sign Up"}
          </Button>
        )}
      </div>

      {isAdmin && signups.length > 0 && !compact && (
        <div className="pt-1 border-t border-border/50">
          <p className="text-[11px] text-muted-foreground font-medium mb-1">Signed up:</p>
          <div className="flex flex-wrap gap-1">
            {signups.map((s) => (
              <span key={s.email} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{s.name || s.email}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}