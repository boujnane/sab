"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setAssignmentDone } from "@/lib/actions/assignments";
import { cleanAssignmentTitle } from "@/lib/assignment-title";

export interface AssignmentVM {
  id: string;
  title: string;
  subjectShort: string;
  dueDateIso: string;
  done: boolean;
}

export interface WeakChapterVM {
  id: string;
  name: string;
  subjectShort: string;
}

interface Props {
  mode: "programme" | "revision";
  weekNumber: number | null;
  weekRangeLabel: string;
  items: AssignmentVM[];
  overdueCount: number;
  weakChapters?: WeakChapterVM[];
}

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

function AssignmentRow({ item }: { item: AssignmentVM }) {
  const [done, setDone] = useState(item.done);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const result = await setAssignmentDone(item.id, next);
      if (!result.ok) {
        setDone(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <li className="flex items-center gap-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={item.title}
        onClick={toggle}
        className={`h-4 w-4 shrink-0 rounded-full border transition-colors duration-150 ${
          done ? "border-petale-500 bg-petale-500" : "border-plum-300"
        }`}
      />
      <span
        className={`flex-1 truncate ${
          done ? "text-plum-400 line-through" : "text-plum-950"
        }`}
      >
        {cleanAssignmentTitle(item.title)}
      </span>
      <span className="font-mono text-plum-700">{item.subjectShort}</span>
      <span className="font-mono text-plum-700">
        {shortDate(item.dueDateIso)}
      </span>
    </li>
  );
}

/**
 * Ancrage haut du dashboard : sujets de la semaine en cours (phase
 * programme), ou 3 transversaux + chapitres les plus faibles (phase
 * révision, à partir du 16 août). Même convention que FooterBands.
 */
export function WeekBlock({
  mode,
  weekNumber,
  weekRangeLabel,
  items,
  overdueCount,
  weakChapters,
}: Props) {
  return (
    <section
      aria-label="Cette semaine"
      className="border-t-2 border-petale-500 pt-2.5 text-xs"
    >
      <h2 className="mb-1.5 font-mono text-xs text-petale-600">
        {mode === "programme"
          ? `cette semaine · semaine ${weekNumber} · ${weekRangeLabel}`
          : "période de révision"}
      </h2>

      {items.length === 0 ? (
        <p className="text-plum-700">Rien à rendre cette semaine.</p>
      ) : (
        <ul className="grid gap-1.5">
          {items.map((item) => (
            <AssignmentRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {mode === "revision" && weakChapters && weakChapters.length > 0 && (
        <ul className="mt-2 grid gap-1 border-t border-plum-200 pt-2">
          {weakChapters.map((c) => (
            <li
              key={c.id}
              className="flex justify-between gap-3 text-plum-700"
            >
              <span>{c.name}</span>
              <span className="font-mono">{c.subjectShort}</span>
            </li>
          ))}
        </ul>
      )}

      {overdueCount > 0 && (
        <p className="mt-2 text-petale-600">
          {overdueCount} sujet{overdueCount > 1 ? "s" : ""} en retard des
          semaines passées
        </p>
      )}
    </section>
  );
}
