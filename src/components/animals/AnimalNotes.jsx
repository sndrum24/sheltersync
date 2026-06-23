import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, MessageSquare, Printer } from "lucide-react";
import { useShelter } from "@/hooks/useShelter";

export default function AnimalNotes({ animalId, shelterId, animal }) {
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const notesHtml = notes.map((note) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:12px;break-inside:avoid;">
        <p style="margin:0 0 8px 0;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#111827;">${note.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <p style="margin:0;font-size:12px;color:#6b7280;">${note.created_by} &middot; ${format(new Date(note.created_date), "MMM d, yyyy 'at' h:mm a")}</p>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Notes Report — ${animal?.name || "Animal"}</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; color: #111827; }
            h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
            .meta { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
            .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>Notes Report — ${animal?.name || "Animal"}</h1>
          <p class="meta">
            ${animal?.species ? animal.species.charAt(0).toUpperCase() + animal.species.slice(1) : ""}
            ${animal?.breed ? `&middot; ${animal.breed}` : ""}
            &middot; Printed on ${format(new Date(), "MMMM d, yyyy")}
          </p>
          <hr class="divider" />
          ${notes.length === 0 ? '<p style="color:#6b7280;">No notes recorded.</p>' : notesHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

const { data: notes = [], isLoading } = useQuery({
  queryKey: ["animal-notes", animalId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("animal_notes")
      .select("*")
      .eq("animal_id", animalId)
      .order("created_date", { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return data || [];
  },
});

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!newNote.trim()) return;

  setSubmitting(true);

  const { error } = await supabase
    .from("animal_notes")
    .insert([
      {
        animal_id: animalId,
        shelter_id: shelterId,
        content: newNote.trim(),
        created_by: user?.email
      },
    ]);

  if (error) {
    console.error(error);
    alert(error.message);
    setSubmitting(false);
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: ["animal-notes", animalId],
  });

  setNewNote("");
  setSubmitting(false);
};

  const handleDelete = async (noteId) => {
    await supabase
  .from("animal_notes")
  .delete()
  .eq("id", noteId);
    queryClient.invalidateQueries({ queryKey: ["animal-notes", animalId] });
  };



  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Notes
          {notes.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({notes.length})</span>
          )}
        </CardTitle>
        {notes.length > 0 && (
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print Report
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !newNote.trim()} className="gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Note
            </Button>
          </div>
        </form>

        {/* Notes list */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
        ) : (
          <div className="space-y-3 pt-1">
            {notes.map((note) => (
              <div key={note.id} className="group relative bg-muted/50 rounded-lg p-3.5 border border-border/50">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pr-8">{note.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">{note.created_by}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(note.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}