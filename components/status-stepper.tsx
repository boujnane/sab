"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { setChapterStatus } from "@/lib/actions/chapters";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  type ChapterStatus,
} from "@/lib/progress";

/** Dégradé de maturité plum-300 → petale-500, un arrêt par statut atteint. */
const MATURITY = ["#ba98cd", "#cf7fb6", "#e35a92", "#f22d79", "#ff0062"];
const EMPTY = "var(--color-plum-100)";

interface Props {
  chapterId: string;
  chapterName: string;
  status: ChapterStatus;
}

/**
 * Le geste central de l'app : tap sur la ligne → popover des 5 statuts →
 * mutation optimiste immédiate. Zéro layout shift, cible tactile ≥ 44px.
 */
export function StatusStepper({ chapterId, chapterName, status }: Props) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const rowRef = useRef<HTMLButtonElement>(null);

  const currentIndex = STATUS_ORDER.indexOf(optimistic);

  function select(next: ChapterStatus) {
    const prev = optimistic;
    setOpen(false);
    if (next === prev) return;
    startTransition(async () => {
      setOptimistic(next);
      const res = await setChapterStatus(chapterId, prev, next);
      if (!res.ok) {
        setOptimistic(prev);
        toast.error(res.error);
      } else {
        toast(`${chapterName} → ${STATUS_LABEL[next]}`, { duration: 1800 });
      }
    });
  }

  return (
    <div className="relative">
      <button
        ref={rowRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${chapterName} : ${STATUS_LABEL[optimistic]}. Changer le statut`}
        className="flex min-h-11 w-full items-center justify-between gap-4 rounded-[var(--radius)] px-2 py-1.5 text-left transition-colors duration-150 hover:bg-plum-100/60"
      >
        <span
          className={
            optimistic === "non_vu" ? "text-plum-700" : "text-plum-950"
          }
        >
          {chapterName}
        </span>
        <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
          {STATUS_ORDER.map((s, i) => (
            <span
              key={s}
              className="rounded-[2px] transition-all duration-150"
              style={{
                width: 14,
                height: i === currentIndex && i > 0 ? 12 : 8,
                background: i <= currentIndex && i > 0 ? MATURITY[i] : EMPTY,
              }}
            />
          ))}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <ul
            role="listbox"
            aria-label={`Statut de ${chapterName}`}
            className="absolute right-0 z-20 mt-1 w-44 rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-1 shadow-[var(--shadow-hairline)]"
          >
            {STATUS_ORDER.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s === optimistic}
                  onClick={() => select(s)}
                  className={`flex min-h-10 w-full items-center justify-between rounded-md px-2.5 text-sm transition-colors duration-150 hover:bg-plum-50 ${
                    s === optimistic
                      ? "font-medium text-petale-600"
                      : "text-plum-950"
                  }`}
                >
                  {STATUS_LABEL[s]}
                  <span
                    className="size-2 rounded-full"
                    style={{ background: i > 0 ? MATURITY[i] : EMPTY }}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
