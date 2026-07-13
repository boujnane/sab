import { ProgramFilter } from "@/components/program-switch";
import { cleanAssignmentTitle } from "@/lib/assignment-title";
import { formatDateAxis } from "@/lib/format";
import { PROGRAM_END, currentProgramWeek } from "@/lib/program-pace";
import { cn } from "@/lib/utils";

export interface RoadmapSubject {
  id: string;
  slug: string;
  name: string;
  examDateIso: string;
}

export interface RoadmapAssignment {
  id: string;
  subjectId: string;
  weekNumber: number;
  title: string;
  dueDateIso: string;
  done: boolean;
  covered: boolean;
  progressLabel: string | null;
}

const SUBJECT_SHORT: Record<string, string> = {
  obligations: "OB",
  civil: "CIV",
  procedure: "PC",
};

type AssignmentState = "done" | "late" | "current" | "upcoming";

function assignmentState(
  assignment: RoadmapAssignment,
  todayIso: string,
  currentWeek: number | null,
): AssignmentState {
  if (assignment.done || assignment.covered) return "done";
  if (assignment.dueDateIso < todayIso) return "late";
  if (assignment.weekNumber === currentWeek) return "current";
  return "upcoming";
}

function stateLabel(state: AssignmentState) {
  if (state === "done") return "couvert";
  if (state === "late") return "en retard";
  if (state === "current") return "cette semaine";
  return "à venir";
}

const STATE_CELL_CLASS: Record<AssignmentState, string> = {
  done: "border-t-plum-700 bg-plum-100/60",
  late: "border-t-petale-500 bg-petale-50/55",
  current: "border-t-ciel-600 bg-ciel-50/70 shadow-[inset_0_1px_0_var(--color-ciel-300)]",
  upcoming: "border-t-plum-200",
};

const STATE_DOT_CLASS: Record<AssignmentState, string> = {
  done: "bg-plum-700",
  late: "bg-petale-500",
  current: "bg-ciel-600",
  upcoming: "bg-plum-200",
};

const STATE_TEXT_CLASS: Record<AssignmentState, string> = {
  done: "text-plum-950",
  late: "text-petale-700",
  current: "text-ciel-700",
  upcoming: "text-plum-700",
};

function phaseLabel(todayIso: string, currentWeek: number | null) {
  if (currentWeek) return `semaine ${currentWeek}`;
  if (todayIso > PROGRAM_END) return "révision";
  return "avant programme";
}

export function TimelineRoadmap({
  subjects,
  assignments,
  todayIso,
  selectedProgram,
}: {
  subjects: RoadmapSubject[];
  assignments: RoadmapAssignment[];
  todayIso: string;
  selectedProgram: ProgramFilter;
}) {
  const currentWeek = currentProgramWeek(todayIso);
  const visibleAssignments = assignments.filter((assignment) =>
    subjects.some((subject) => subject.id === assignment.subjectId),
  );
  const doneCount = visibleAssignments.filter(
    (assignment) => assignment.done || assignment.covered,
  ).length;
  const lateCount = visibleAssignments.filter(
    (assignment) =>
      assignmentState(assignment, todayIso, currentWeek) === "late",
  ).length;
  const currentCount = visibleAssignments.filter(
    (assignment) =>
      assignmentState(assignment, todayIso, currentWeek) === "current",
  ).length;
  const futureCount = visibleAssignments.filter(
    (assignment) =>
      assignmentState(assignment, todayIso, currentWeek) === "upcoming",
  ).length;

  const summary = [
    { label: "couverts", value: doneCount, tone: "text-plum-950" },
    { label: "en retard", value: lateCount, tone: "text-petale-600" },
    { label: "cette semaine", value: currentCount, tone: "text-ciel-600" },
    { label: "à venir", value: futureCount, tone: "text-plum-700" },
  ];

  return (
    <section aria-label="Planning des rendus" className="border-t-2 border-plum-700 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg italic text-plum-950">
            Planning des rendus
          </h2>
          <p className="mt-1 font-mono text-xs text-plum-700">
            {selectedProgram === "all" ? "tous les programmes" : "programme sélectionné"} · {phaseLabel(todayIso, currentWeek)}
          </p>
        </div>
        <p className="font-mono text-xs text-plum-700">
          aujourd’hui · {formatDateAxis(todayIso)}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-plum-200 py-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-3">
            <dt className="font-mono text-xs text-plum-700">{item.label}</dt>
            <dd className={cn("font-mono text-md", item.tone)}>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-8">
        {subjects.map((subject) => {
          const subjectAssignments = assignments
            .filter((assignment) => assignment.subjectId === subject.id)
            .sort((a, b) => a.weekNumber - b.weekNumber);

          return (
            <article key={subject.id} className="grid gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-display text-md italic text-plum-950">
                  {subject.name}
                </h3>
                <p className="font-mono text-xs text-plum-700">
                  {SUBJECT_SHORT[subject.slug] ?? subject.slug.toUpperCase()} · examen {formatDateAxis(subject.examDateIso)}
                </p>
              </div>

              <ol className="grid overflow-x-auto border-y border-plum-100 pb-1 md:grid-cols-4 xl:grid-cols-[repeat(8,minmax(8.25rem,1fr))]">
                {subjectAssignments.map((assignment) => {
                  const state = assignmentState(assignment, todayIso, currentWeek);
                  const isEvenWeek = assignment.weekNumber % 2 === 0;

                  return (
                    <li
                      key={assignment.id}
                      className={cn(
                        "min-h-40 min-w-36 border-l border-t-[3px] border-l-plum-100 px-3 py-3 first:border-l-0",
                        isEvenWeek ? "bg-plum-50" : "bg-[var(--surface)]",
                        STATE_CELL_CLASS[state],
                      )}
                    >
                      <div className="grid gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-xs text-plum-950">
                            S{assignment.weekNumber}
                          </p>
                          <time className="font-mono text-xs text-plum-700">
                            {formatDateAxis(assignment.dueDateIso)}
                          </time>
                        </div>
                        <p
                          className={cn(
                            "inline-flex w-fit items-center gap-1.5 font-mono text-xs leading-none",
                            STATE_TEXT_CLASS[state],
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn("size-1.5 rounded-full", STATE_DOT_CLASS[state])}
                          />
                          {stateLabel(state)}
                        </p>
                      </div>
                      <p className="mt-4 line-clamp-5 text-sm leading-snug text-plum-950">
                        {cleanAssignmentTitle(assignment.title)}
                      </p>
                      {assignment.progressLabel && (
                        <p className="mt-3 font-mono text-xs text-plum-700">
                          {assignment.progressLabel}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </article>
          );
        })}
      </div>
    </section>
  );
}
