import { redirect } from "next/navigation";

import { CountdownHero, type ExamVM } from "@/components/countdown-hero";
import { ExamRail } from "@/components/exam-rail";
import { FooterBands } from "@/components/footer-bands";
import {
  ProgramSwitch,
  parseProgramFilter,
} from "@/components/program-switch";
import { SubjectBlock, type ChapterVM } from "@/components/subject-block";
import {
  WeekBlock,
  type AssignmentVM,
  type WeakChapterVM,
} from "@/components/week-block";
import { cleanAssignmentTitle } from "@/lib/assignment-title";
import { daysUntil, STATUS_WEIGHT, type ChapterStatus } from "@/lib/progress";
import {
  PROGRAM_END,
  PROGRAM_START,
  currentProgramWeek,
} from "@/lib/program-pace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProgram } from "@/lib/user-program";

export const dynamic = "force-dynamic";

const SHORT_NAMES: Record<string, string> = {
  synthese: "synthèse",
  obligations: "obligations",
  civil: "civil (spé)",
  procedure: "procédure",
};

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
  "Tout révisé — début sprint final",
]);

function fullLabel(name: string, iso: string, durationMin: number) {
  const date = new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${name.toLowerCase()} · ${date} · ${durationMin / 60}h`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDayMonth(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ programme?: string | string[] }>;
}) {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);
  const selectedProgram = parseProgramFilter((await searchParams).programme);

  const [
    { data: subjects, error: subjectsError },
    { data: chapters, error: chaptersError },
    { data: milestones, error: milestonesError },
    { data: logs, error: logsError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase.from("subjects").select("*").order("sort_order"),
    supabase.from("chapters").select("*").order("sort_order"),
    supabase
      .from("milestones")
      .select("*")
      .is("done_at", null)
      .gte("due_date", todayIso)
      .order("due_date")
      .limit(3),
    supabase
      .from("synthesis_logs")
      .select("trained_on")
      .order("trained_on", { ascending: false }),
    supabase.from("assignments").select("*").order("due_date"),
  ]);

  const fetchError =
    subjectsError ?? chaptersError ?? milestonesError ?? logsError ?? assignmentsError;

  if (fetchError) {
    console.error("dashboard fetch:", fetchError);
    throw new Error(
      "Impossible de charger le programme. Vérifie les migrations Supabase.",
    );
  }

  if (!subjects || !chapters || !assignments) return null;

  if (subjects.length === 0 || chapters.length === 0 || assignments.length === 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/connexion");

    await ensureUserProgram(createAdminClient() ?? supabase, user.id);
    redirect("/");
  }

  const visibleExamSubjects = subjects.filter(
    (s) => selectedProgram === "all" || s.slug === selectedProgram,
  );

  const exams: ExamVM[] = visibleExamSubjects.map((s) => ({
    slug: s.slug,
    shortName: SHORT_NAMES[s.slug] ?? s.name.toLowerCase(),
    fullLabel: fullLabel(s.name, s.exam_date!, s.exam_duration_min),
    examDateIso: s.exam_date!,
  }));

  const lastLog = logs?.[0]?.trained_on ?? null;

  const subjectSlugById = new Map(subjects.map((s) => [s.id, s.slug]));
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
  const shortFor = (subjectId: string) =>
    SUBJECT_SHORT[subjectSlugById.get(subjectId) ?? ""] ?? "?";

  const allAssignments = assignments ?? [];
  const visibleSubjectIds = new Set(
    subjects
      .filter((s) => s.has_chapters)
      .filter((s) => selectedProgram === "all" || s.slug === selectedProgram)
      .map((s) => s.id),
  );
  const visibleAssignments = allAssignments.filter((a) =>
    visibleSubjectIds.has(a.subject_id),
  );
  const visibleChapters = (chapters ?? []).filter((c) =>
    visibleSubjectIds.has(c.subject_id),
  );
  const isRevisionPhase = todayIso > PROGRAM_END;
  const currentWeek = currentProgramWeek(todayIso) ?? 1;

  let weekItems: AssignmentVM[];
  let overdueCount: number;
  let weekRangeLabel = "";
  let weakChapters: WeakChapterVM[] | undefined;

  if (isRevisionPhase) {
    weekItems = visibleAssignments
      .filter((a) => a.week_number === 8)
    .map((a) => ({
      id: a.id,
      title: cleanAssignmentTitle(a.title),
      subjectShort: shortFor(a.subject_id),
      dueDateIso: a.due_date,
      done: !!a.done_at,
      }));
    overdueCount = visibleAssignments.filter(
      (a) => a.week_number !== 8 && !a.done_at && a.due_date < todayIso,
    ).length;
    weakChapters = visibleChapters
      .slice()
      .sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status])
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        name: c.name,
        subjectShort: shortFor(c.subject_id),
      }));
  } else {
    weekItems = visibleAssignments
      .filter((a) => a.week_number === currentWeek)
    .map((a) => ({
      id: a.id,
      title: cleanAssignmentTitle(a.title),
      subjectShort: shortFor(a.subject_id),
      dueDateIso: a.due_date,
      done: !!a.done_at,
      }));
    overdueCount = visibleAssignments.filter(
      (a) => a.week_number < currentWeek && !a.done_at,
    ).length;
    const weekStartIso = addDaysIso(PROGRAM_START, (currentWeek - 1) * 7);
    const weekEndIso = addDaysIso(weekStartIso, 6);
    const startDay = new Date(`${weekStartIso}T00:00:00Z`).getUTCDate();
    weekRangeLabel = `${startDay}–${formatDayMonth(weekEndIso)}`;
  }

  const upcomingAssignments = visibleAssignments
    .filter((a) => !a.done_at && a.due_date >= todayIso)
    .map((a) => ({
      id: a.id,
      title: cleanAssignmentTitle(a.title),
      dueDateIso: a.due_date,
      kind: shortFor(a.subject_id),
    }));
  const upcomingMilestones = (milestones ?? [])
    .filter((m) => !LEGACY_MILESTONE_TITLES.has(m.title))
    .map((m) => ({
      id: m.id,
      title: m.title,
      dueDateIso: m.due_date,
      kind: m.subject_id ? subjectNameById.get(m.subject_id) : "jalon",
    }));
  const upcomingDeadlines = [...upcomingAssignments, ...upcomingMilestones]
    .sort((a, b) => a.dueDateIso.localeCompare(b.dueDateIso))
    .slice(0, 3);

  const footerBands = (
    <FooterBands
      milestones={upcomingDeadlines}
      synthesis={{
        count: logs?.length ?? 0,
        daysSinceLast: lastLog ? daysUntil(lastLog, todayIso) : null,
        goal: "objectif : 5 avant le 16 août",
      }}
    />
  );

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10 xl:grid-cols-[minmax(0,1fr)_340px] xl:px-12">
      {/* colonne principale : hero (chiffre seul sur desktop) + semaine + matières */}
      <div className="grid min-w-0 content-start gap-5">
        <CountdownHero exams={exams} todayIso={todayIso} railInSidebar />

        <ProgramSwitch active={selectedProgram} />

        <WeekBlock
          mode={isRevisionPhase ? "revision" : "programme"}
          weekNumber={isRevisionPhase ? null : currentWeek}
          weekRangeLabel={weekRangeLabel}
          items={weekItems}
          overdueCount={overdueCount}
          weakChapters={weakChapters}
        />

        <div className="grid gap-3">
          {subjects
            .filter((s) => s.has_chapters)
            .filter(
              (s) => selectedProgram === "all" || s.slug === selectedProgram,
            )
            .map((s) => {
              const vms: ChapterVM[] = (chapters ?? [])
                .filter((c) => c.subject_id === s.id)
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  status: c.status as ChapterStatus,
                  weight: c.weight,
                  programWeek: c.program_week,
                }));
              return (
                <SubjectBlock
                  key={s.id}
                  slug={s.slug}
                  name={s.name}
                  examDateIso={s.exam_date!}
                  todayIso={todayIso}
                  chapters={vms}
                />
              );
            })}
        </div>

      </div>

      {/* sidebar : sous le contenu en mobile, sticky à droite en desktop */}
      <aside className="grid min-w-0 content-start gap-5 overflow-hidden rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-4 text-xs shadow-[var(--shadow-hairline)] lg:sticky lg:top-8 lg:self-start">
        <section aria-label="Épreuves" className="min-w-0 border-t-2 border-ciel-500 pt-2.5">
          <h2 className="mb-1.5 font-mono text-xs text-ciel-600">épreuves</h2>
          <ExamRail exams={exams} todayIso={todayIso} />
        </section>
        {footerBands}
      </aside>
    </main>
  );
}
