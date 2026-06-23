import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Inbox, Mail, MailOpen } from "lucide-react";

export default function StaffMessagesInbox({ shelterId }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

 const { data: messages = [], isLoading } = useQuery({
  queryKey: ["staff-messages", shelterId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("staff_messages")
      .select("*")
      .eq("shelter_id", shelterId)
      .order("created_date", { ascending: false });

    if (error) throw error;

    return data ?? [];
  },
  enabled: !!shelterId,
});

const unread = messages.filter((m) => !m.read).length;

const handleOpen = async (msg) => {
  setSelected(msg);

  if (msg.read) return;

  try {
    const { error } = await supabase
      .from("staff_messages")
      .update({ read: true })
      .eq("id", msg.id);

    if (error) throw error;

    await queryClient.invalidateQueries({
      queryKey: ["staff-messages", shelterId],
    });

    // Optional: update selected message immediately
    setSelected({ ...msg, read: true });
  } catch (error) {
    console.error("Error marking message as read:", error);
  }
};

  return (
    <>
      <Button variant="outline" className="gap-2 relative" onClick={() => setOpen(true)}>
        <Inbox className="w-4 h-4" />
        Staff Inbox
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Inbox className="w-5 h-5" /> Staff Inbox
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="text-muted-foreground -ml-1">
                ← Back
              </Button>
              <div className="space-y-1">
                {selected.subject && <h3 className="font-semibold text-foreground">{selected.subject}</h3>}
                <p className="text-xs text-muted-foreground">
                  From {selected.sender_name || selected.sender_email} · {format(new Date(selected.created_date), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4 leading-relaxed">
                {selected.content}
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleOpen(msg)}
                  className="w-full text-left flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors border border-border/50"
                >
                  {msg.read
                    ? <MailOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    : <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  }
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${!msg.read ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {msg.subject || "(No subject)"}
                      </span>
                      {!msg.read && <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-[10px]">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{msg.sender_name || msg.sender_email}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.content}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}