import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Printer,
} from "lucide-react";

import { useAuthUser } from "@/auth/AuthProvider";
import { useRole } from "@/hooks/useRoles";

export default function AnimalNotes({ animalId, shelterId, animal }) {
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // -------------------------
  // GLOBAL AUTH (FIXED)
  // -------------------------
  const { user } = useAuthUser();
  const { isOwner, isAdmin, isStaff } = useRole();

  const canWriteNotes = !!user && (isOwner || isAdmin || isStaff);

  // -------------------------
  // FETCH NOTES
  // -------------------------
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["animal-notes", animalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animal_notes")
        .select("*")
        .eq("animal_id", animalId)
        .order("created_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // -------------------------
  // PRINT NOTES
  // -------------------------
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    const notesHtml = notes
      .map(
        (note) => `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:12px;break-inside:avoid;">
          <p style="white-space:pre-wrap;font-size:14px;">
            ${note.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </p>
          <p style="font-size:12px;color:#6b7280;">
            ${note.created_by} · ${format(
              new Date(note.created_date),
              "MMM d, yyyy 'at' h:mm a"
            )}
          </p>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head><title>Notes - ${animal?.name || "Animal"}</title></head>
        <body>
          <h2>Notes - ${animal?.name || "Animal"}</h2>
          ${notes.length ? notesHtml : "<p>No notes found</p>"}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  // -------------------------
  // ADD NOTE
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newNote.trim() || !user) return;

    if (!canWriteNotes) {
      alert("You do not have permission to add notes.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("animal_notes").insert([
      {
        animal_id: animalId,
        shelter_id: shelterId,
        content: newNote.trim(),
        created_by: user.id,
      },
    ]);

    if (error) {
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

  // -------------------------
  // DELETE NOTE
  // -------------------------
  const handleDelete = async (noteId) => {
    const { error } = await supabase
      .from("animal_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      alert(error.message);
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["animal-notes", animalId],
    });
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Notes ({notes.length})
        </CardTitle>

        {notes.length > 0 && (
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ADD NOTE */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canWriteNotes || submitting || !newNote.trim()}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Note
            </Button>
          </div>
        </form>

        {/* LOADING */}
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes yet.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="relative p-3 border rounded-lg bg-muted/40"
              >
                <p className="text-sm whitespace-pre-wrap">
                  {note.content}
                </p>

                <div className="text-xs text-muted-foreground mt-2">
                  {note.created_by} ·{" "}
                  {format(
                    new Date(note.created_date),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="absolute top-2 right-2">
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete this note?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(note.id)}
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