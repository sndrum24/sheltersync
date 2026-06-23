import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function MessageStaffDialog({ user, shelterId }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

 const handleSend = async (e) => {
  e.preventDefault();

  if (!content.trim()) return;

  setSending(true);

  
const messageData = {
  shelter_id: shelterId,
  sender_name: user?.name,
  sender_email: user?.email,
  subject,
  content,
  read: false,
};
  const { error } = await supabase
    .from("staff_messages")
    .insert([messageData]);

  setSending(false);

  if (error) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
    return;
  }

  setOpen(false);
  setSubject("");
  setContent("");

  toast({
    title: "Message sent",
    description: "Staff will be notified.",
  });
};

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <MessageSquarePlus className="w-4 h-4" />
        Message Staff
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Message Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSend} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Subject (optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question about an animal"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message to the admin team..."
                className="min-h-[120px]"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={sending || !content.trim()} className="gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}