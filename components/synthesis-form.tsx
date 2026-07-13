"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { addSynthesisLog } from "@/lib/actions/synthesis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/format";

export function SynthesisForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await addSynthesisLog(undefined, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        setOpen(false);
        toast("Entraînement enregistré.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <Plus size={16} strokeWidth={1.75} />
          Ajouter un entraînement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel entraînement</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trained_on">Date</Label>
            <Input
              id="trained_on"
              name="trained_on"
              type="date"
              defaultValue={todayIso()}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="duration_min">Durée (minutes)</Label>
            <Input
              id="duration_min"
              name="duration_min"
              type="number"
              min={1}
              placeholder="300"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="annale_ref">Annale</Label>
            <Input id="annale_ref" name="annale_ref" placeholder="EST25 - session 1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feeling">Ressenti (/10)</Label>
            <Input id="feeling" name="feeling" type="number" min={1} max={10} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comment">Commentaire</Label>
            <Textarea id="comment" name="comment" rows={3} />
          </div>
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
