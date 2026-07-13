"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/lib/actions/documents";
import { generateQuestions } from "@/lib/actions/generate-questions";
import type { DocumentStatusDb } from "@/lib/supabase/types";

interface ChapterOption {
  id: string;
  name: string;
  questionCount: number;
}

const STATUS_LABEL: Record<DocumentStatusDb, string> = {
  uploaded: "uploadé",
  generating: "génération…",
  ready: "prêt",
  error: "erreur",
};

const selectClass =
  "h-8 min-w-0 flex-1 rounded-(--radius) border border-plum-300 bg-white px-2 text-xs text-plum-950 focus:outline-none focus:ring-1 focus:ring-plum-700";

export function DocumentRow({
  documentId,
  filename,
  status,
  errorMessage,
  chapters,
  defaultChapterId,
}: {
  documentId: string;
  filename: string;
  status: DocumentStatusDb;
  errorMessage: string | null;
  chapters: ChapterOption[];
  defaultChapterId: string | null;
}) {
  const [chapterId, setChapterId] = useState(
    defaultChapterId ?? chapters[0]?.id ?? "",
  );
  const [generating, startGenerate] = useTransition();
  const [deleting, startDelete] = useTransition();

  function generate() {
    if (!chapterId) return;
    const existing = chapters.find((c) => c.id === chapterId)?.questionCount ?? 0;
    if (
      existing > 0 &&
      !window.confirm(
        `Ce chapitre a déjà ${existing} question${existing > 1 ? "s" : ""} - regénérer en ajoutera d'autres. Continuer ?`,
      )
    )
      return;
    startGenerate(async () => {
      toast("Génération lancée - cela peut prendre quelques minutes.");
      const result = await generateQuestions(documentId, chapterId);
      if (result.ok) {
        toast(`${result.count} questions générées.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove() {
    startDelete(async () => {
      const result = await deleteDocument(documentId);
      if (!result.ok) toast.error(result.error);
    });
  }

  const busy = generating || status === "generating";

  return (
    <li className="flex flex-col gap-2 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm text-plum-950">
          {filename}
        </span>
        <span className="shrink-0 font-mono text-xs text-plum-700">
          {busy ? "génération…" : STATUS_LABEL[status]}
        </span>
      </div>
      {status === "error" && errorMessage && (
        <p className="text-xs text-petale-700">{errorMessage}</p>
      )}
      <div className="flex items-center gap-2">
        <select
          aria-label="Chapitre à générer"
          className={selectClass}
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          disabled={busy}
        >
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.questionCount > 0 ? ` · ${c.questionCount} q.` : ""}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={generate} disabled={busy || !chapterId}>
          {busy ? "En cours…" : "Générer"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={deleting || busy}
        >
          Supprimer
        </Button>
      </div>
    </li>
  );
}
