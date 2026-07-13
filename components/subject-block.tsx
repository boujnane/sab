import Link from "next/link";
import { StatusStepper } from "@/components/status-stepper";
import { paceLabel, subjectProgress, type ChapterStatus } from "@/lib/progress";
import { programPace, type ProgramPace } from "@/lib/program-pace";

export interface ChapterVM {
  id: string;
  name: string;
  status: ChapterStatus;
  weight: number;
  programWeek: number | null;
}

interface Props {
  slug: string;
  name: string;
  examDateIso: string;
  todayIso: string;
  chapters: ChapterVM[];
}

const PACE_CLASS: Record<ProgramPace["kind"], string> = {
  ahead: "text-[var(--pace-ahead)]",
  behind: "text-[var(--pace-behind)]",
  on_track: "text-[var(--pace-ontrack)]",
  done: "text-[var(--pace-ontrack)]",
};

/**
 * Un bloc = une matière, chapitres inclus. Toute l'information utile du
 * quotidien vit ici : pas besoin de naviguer pour changer un statut.
 */
export function SubjectBlock({
  slug,
  name,
  examDateIso,
  todayIso,
  chapters,
}: Props) {
  const progress = subjectProgress(chapters);
  const pct = Math.round(progress * 100);
  const p = programPace(chapters, todayIso, examDateIso);

  return (
    <section
      aria-label={name}
      className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-hairline)]"
    >
      <header className="mb-2.5 flex items-baseline justify-between gap-3">
        <Link
          href={`/matieres/${slug}`}
          className="text-md font-medium text-plum-950 hover:text-petale-600"
        >
          {name}
        </Link>
        <span className="flex items-baseline gap-2.5">
          <span className={`font-mono text-xs ${PACE_CLASS[p.kind]}`}>
            {paceLabel(p)}
          </span>
          <span className="font-display text-lg text-plum-950">{pct}&nbsp;%</span>
        </span>
      </header>

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mb-2.5 h-[5px] overflow-hidden rounded-full bg-plum-100"
      >
        <div
          className="gradient-maturite h-full rounded-full motion-safe:animate-[grow_600ms_ease-out]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="grid gap-x-6 sm:grid-cols-2">
        {chapters.map((c) => (
          <li key={c.id}>
            <StatusStepper
              chapterId={c.id}
              chapterName={c.name}
              status={c.status}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
