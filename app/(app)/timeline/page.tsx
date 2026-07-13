import { redirect } from "next/navigation";

import {
  TimelineChart,
  type TimelineMarker,
  type TimelinePoint,
} from "@/components/timeline-chart";
import {
  ProgramSwitch,
  parseProgramFilter,
} from "@/components/program-switch";
import {
  TimelineRoadmap,
  type RoadmapAssignment,
  type RoadmapSubject,
} from "@/components/timeline-roadmap";
import { cleanAssignmentTitle } from "@/lib/assignment-title";
import { PROGRAM_START, expectedProgramProgress } from "@/lib/program-pace";
import { STATUS_WEIGHT, type ChapterStatus } from "@/lib/progress";
import { isoDateRange, todayIso } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const SUBJECT_SHORT: Record<string, string> = {
  synthese: "SYN",
  obligations: "OB",
  civil: "CIV",
  procedure: "PC",
};

const LEGACY_MILESTONE_TITLES = new Set([
  "Obligations : tout lu",
  "Civil : tout lu",
  "Obligations : tout fiché",
  "Procédure : tout lu",
  "Civil : tout fiché",
  "5 annales de synthèse faites",
  "Procédure : tout fiché",
  "Tout révisé - début sprint final",
]);

function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ programme?: string | string[] }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const today = todayIso();
  const selectedProgram = parseProgramFilter((await searchParams).programme);

  const [
    { data: subjects },
    { data: chapters },
    { data: events },
    { data: milestones },
    { data: assignments },
  ] = await Promise.all([
    supabase.from("subjects").select("*").order("sort_order"),
    supabase
      .from("chapters")
      .select("id, subject_id, weight, program_week, status"),
    supabase
      .from("status_events")
      .select("chapter_id, to_status, created_at")
      .order("created_at"),
    supabase.from("milestones").select("*").order("due_date"),
    supabase.from("assignments").select("*").order("due_date"),
  ]);

  const revisionSubjects = (subjects ?? [])
    .filter((s) => s.has_chapters)
    .filter((s) => selectedProgram === "all" || s.slug === selectedProgram);
  const visibleSubjectIds = new Set(revisionSubjects.map((s) => s.id));
  const chapterList = (chapters ?? []).filter((c) =>
    visibleSubjectIds.has(c.subject_id),
  );
  const totalWeight = chapterList.reduce((s, c) => s + c.weight, 0) || 1;
  const hasProgramWeeks = chapterList.some((c) => c.program_week !== null);
  const hasAssignments = (assignments ?? []).length > 0;
  const programReady = revisionSubjects.length > 0 && hasAssignments;
  const chartReady = programReady && hasProgramWeeks;
  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));
  const chaptersBySubject = new Map<string, typeof chapterList>();
  for (const chapter of chapterList) {
    const list = chaptersBySubject.get(chapter.subject_id) ?? [];
    list.push(chapter);
    chaptersBySubject.set(chapter.subject_id, list);
  }

  const statusByChapter = new Map<string, ChapterStatus>();
  for (const chapter of chapterList) statusByChapter.set(chapter.id, "non_vu");
  const currentStatusByChapter = new Map(
    chapterList.map((chapter) => [chapter.id, chapter.status as ChapterStatus]),
  );
  const actualToday =
    chapterList.reduce(
      (sum, chapter) =>
        sum + chapter.weight * STATUS_WEIGHT[currentStatusByChapter.get(chapter.id)!],
      0,
    ) / totalWeight;

  const markerSubjects = (subjects ?? [])
    .filter((subject) => subject.exam_date)
    .filter((subject) => selectedProgram === "all" || subject.slug === selectedProgram);
  const rangeSubjects = markerSubjects.length > 0 ? markerSubjects : (subjects ?? []);
  const lastExamDate = rangeSubjects
    .map((subject) => subject.exam_date)
    .filter((date): date is string => !!date)
    .sort()
    .at(-1)!;
  const rangeEnd = today > lastExamDate ? today : lastExamDate;
  const days = isoDateRange(PROGRAM_START, rangeEnd);
  const chronological = (events ?? []).slice();
  let eventIdx = 0;

  const data: TimelinePoint[] = days.map((date) => {
    while (
      eventIdx < chronological.length &&
      chronological[eventIdx].created_at.slice(0, 10) <= date
    ) {
      const event = chronological[eventIdx];
      statusByChapter.set(event.chapter_id, event.to_status);
      eventIdx++;
    }

    const acquired = chapterList.reduce(
      (sum, chapter) =>
        sum + chapter.weight * STATUS_WEIGHT[statusByChapter.get(chapter.id)!],
      0,
    );
    const actualProgress = date === today ? actualToday : acquired / totalWeight;
    const expectedProgress =
      revisionSubjects.reduce((sum, subject) => {
        const subjectChapters = chaptersBySubject.get(subject.id) ?? [];
        const subjectWeight = subjectChapters.reduce(
          (weight, chapter) => weight + chapter.weight,
          0,
        );
        if (subjectWeight === 0) return sum;

        const expected = expectedProgramProgress(
          subjectChapters.map((chapter) => ({
            status: "non_vu",
            weight: chapter.weight,
            programWeek: chapter.program_week,
          })),
          date,
          subject.exam_date!,
        );
        return sum + expected * subjectWeight;
      }, 0) / totalWeight;

    return {
      date,
      actual: date <= today ? actualProgress : null,
      theorique: expectedProgress,
    };
  });
  const todayPoint = data.find((point) => point.date === today);

  const markers: TimelineMarker[] = markerSubjects
    .map((subject) => ({
      date: subject.exam_date!,
      label: SUBJECT_SHORT[subject.slug] ?? subject.name,
    }))
    .filter((marker) => marker.date >= PROGRAM_START && marker.date <= rangeEnd);

  const roadmapSubjects: RoadmapSubject[] = revisionSubjects.map((subject) => ({
    id: subject.id,
    slug: subject.slug,
    name: subject.name,
    examDateIso: subject.exam_date!,
  }));
  const roadmapAssignments: RoadmapAssignment[] = (assignments ?? [])
    .filter((assignment) => visibleSubjectIds.has(assignment.subject_id))
    .map((assignment) => {
      const weekChapters = chapterList.filter(
        (chapter) =>
          chapter.subject_id === assignment.subject_id &&
          chapter.program_week === assignment.week_number,
      );
      const coveredChapters = weekChapters.filter(
        (chapter) => STATUS_WEIGHT[chapter.status as ChapterStatus] >= STATUS_WEIGHT.lu,
      );
      const covered =
        weekChapters.length > 0 && coveredChapters.length === weekChapters.length;

      return {
        id: assignment.id,
        subjectId: assignment.subject_id,
        weekNumber: assignment.week_number,
        title: assignment.title,
        dueDateIso: assignment.due_date,
        done: !!assignment.done_at,
        covered,
        progressLabel:
          weekChapters.length > 0
            ? `${coveredChapters.length}/${weekChapters.length} chap. lus`
            : null,
      };
    });

  const upcomingAssignments = (assignments ?? [])
    .filter((a) => visibleSubjectIds.has(a.subject_id))
    .filter((a) => !a.done_at && a.due_date >= today)
    .slice(0, 8)
    .map((a) => {
      const subject = subjectById.get(a.subject_id);
      return {
        id: a.id,
        date: a.due_date,
        label: cleanAssignmentTitle(a.title),
        kind: SUBJECT_SHORT[subject?.slug ?? ""] ?? "?",
      };
    });
  const upcomingMilestones = (milestones ?? [])
    .filter(
      (m) =>
        !m.done_at &&
        m.due_date >= today &&
        !LEGACY_MILESTONE_TITLES.has(m.title),
    )
    .slice(0, 4)
    .map((m) => ({
      id: m.id,
      date: m.due_date,
      label: m.title,
      kind: "jalon",
    }));
  const upcoming = [...upcomingAssignments, ...upcomingMilestones]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);
  const exams = (subjects ?? [])
    .filter((s) => s.exam_date)
    .filter((s) => selectedProgram === "all" || s.slug === selectedProgram)
    .sort((a, b) => a.exam_date!.localeCompare(b.exam_date!));

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10 xl:grid-cols-[minmax(0,1fr)_340px] xl:px-12">
      <div className="grid min-w-0 content-start gap-4">
        <header>
          <h1 className="font-display text-xl italic text-plum-950">
            Timeline
          </h1>
          <p className="mt-1 font-mono text-xs text-plum-700">
            planning des rendus et niveau global
          </p>
        </header>

        <ProgramSwitch active={selectedProgram} pathname="/timeline" />

        <section
          aria-label="Planning et niveau de progression"
          className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-3 shadow-[var(--shadow-hairline)] sm:p-4"
        >
          {programReady ? (
            <>
              <TimelineRoadmap
                subjects={roadmapSubjects}
                assignments={roadmapAssignments}
                todayIso={today}
                selectedProgram={selectedProgram}
              />
              {chartReady && (
                <section
                  aria-label="Niveau global"
                  className="mt-7 border-t border-plum-200 pt-5"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <h2 className="font-display text-md italic text-plum-950">
                        Niveau global
                      </h2>
                      <p className="mt-1 font-mono text-xs text-plum-700">
                        acquis déclaré face au rythme attendu
                      </p>
                    </div>
                    <p className="flex gap-5 font-mono text-xs">
                      <span className="text-petale-600">
                        acquis {Math.round(actualToday * 100)} %
                      </span>
                      <span className="text-ciel-600">
                        attendu {Math.round((todayPoint?.theorique ?? 0) * 100)} %
                      </span>
                    </p>
                  </div>
                  <TimelineChart data={data} markers={markers} />
                  <p className="mt-3 flex gap-5 text-xs text-plum-700">
                    <span className="text-petale-600">acquis</span>
                    <span className="text-ciel-600">attendu</span>
                  </p>
                </section>
              )}
            </>
          ) : (
            <div className="grid min-h-72 content-center gap-2 text-center">
              <p className="font-display text-lg italic text-plum-950">
                Programme hebdomadaire absent
              </p>
              <p className="mx-auto max-w-sm text-sm text-plum-700">
                Le planning sera lisible après import du programme Pré-Barreau :
                chapitres avec semaine et sujets datés.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="grid min-w-0 content-start gap-5 overflow-hidden rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-4 text-xs shadow-[var(--shadow-hairline)] lg:sticky lg:top-8 lg:self-start">
        <section
          aria-label="Examens"
          className="min-w-0 border-t-2 border-ciel-500 pt-2.5"
        >
          <h2 className="mb-1.5 font-mono text-xs text-ciel-600">examens</h2>
          <ul className="grid gap-1.5">
            {exams.map((subject) => (
              <li key={subject.id} className="flex justify-between gap-3">
                <span className="text-plum-950">{subject.name}</span>
                <span className="font-mono text-plum-700">
                  {shortDate(subject.exam_date!)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Prochaines échéances"
          className="min-w-0 border-t-2 border-petale-500 pt-2.5"
        >
          <h2 className="mb-1.5 font-mono text-xs text-petale-600">
            prochaines échéances
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-plum-700">Aucune échéance à venir.</p>
          ) : (
            <ul className="grid gap-1.5">
              {upcoming.map((item) => (
                <li key={item.id} className="grid gap-0.5">
                  <div className="flex min-w-0 justify-between gap-3">
                    <span className="min-w-0 truncate text-plum-950">{item.label}</span>
                    <span className="font-mono text-plum-700">
                      {shortDate(item.date)}
                    </span>
                  </div>
                  <span className="font-mono text-plum-700">{item.kind}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </main>
  );
}
