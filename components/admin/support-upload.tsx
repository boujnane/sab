"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createSupportUpload,
  registerDocument,
} from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";

interface SubjectOption {
  id: string;
  name: string;
}

interface ChapterOption {
  id: string;
  name: string;
  subjectId: string;
}

const selectClass =
  "h-9 w-full rounded-(--radius) border border-plum-300 bg-white px-2.5 text-sm text-plum-950 focus:outline-none focus:ring-1 focus:ring-plum-700";

export function SupportUpload({
  targetUserId,
  subjects,
  chapters,
}: {
  targetUserId: string;
  subjects: SubjectOption[];
  chapters: ChapterOption[];
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [chapterId, setChapterId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const subjectChapters = chapters.filter((c) => c.subjectId === subjectId);

  function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file || !subjectId) {
      toast.error("Choisis une matière et un PDF.");
      return;
    }
    startTransition(async () => {
      const upload = await createSupportUpload(targetUserId);
      if (!upload.ok) {
        toast.error(upload.error);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("supports")
        .uploadToSignedUrl(upload.path, upload.token, file, {
          contentType: "application/pdf",
        });
      if (error) {
        toast.error(`Upload échoué : ${error.message}`);
        return;
      }
      const result = await registerDocument({
        targetUserId,
        subjectId,
        chapterId: chapterId || null,
        storagePath: upload.path,
        filename: file.name,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      toast("Support enregistré.");
    });
  }

  return (
    <form
      action={submit}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="support-subject">Matière</Label>
        <select
          id="support-subject"
          className={selectClass}
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setChapterId("");
          }}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="support-chapter">Chapitre (optionnel)</Label>
        <select
          id="support-chapter"
          className={selectClass}
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
        >
          <option value="">- tout le fascicule -</option>
          {subjectChapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-3 sm:col-start-1">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor="support-file">PDF du support</Label>
          <input
            id="support-file"
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="text-sm text-plum-700 file:mr-3 file:rounded-(--radius) file:border file:border-plum-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-plum-950"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
