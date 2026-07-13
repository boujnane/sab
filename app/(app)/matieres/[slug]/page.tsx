import { notFound, redirect } from "next/navigation";

import { ChapterRow } from "@/components/chapter-row";
import { PaceBadge } from "@/components/pace-badge";
import { ProgressBar } from "@/components/progress-bar";
import { programPace } from "@/lib/program-pace";
import { subjectProgress } from "@/lib/progress";
import { formatDateShort, todayIso } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function MatierePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!subject || !subject.has_chapters) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("subject_id", subject.id)
    .order("sort_order");

  const list = chapters ?? [];
  const progress = subjectProgress(
    list.map((c) => ({ status: c.status, weight: c.weight })),
  );
  const subjectPace = programPace(
    list.map((c) => ({
      status: c.status,
      weight: c.weight,
      programWeek: c.program_week,
    })),
    todayIso(),
    subject.exam_date!,
  );
  const doneCount = list.filter((c) => c.status !== "non_vu").length;
  const masteredCount = list.filter((c) => c.status === "maitrise").length;

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-6 px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10 xl:grid-cols-[minmax(0,1fr)_340px] xl:px-12">
      <div className="grid min-w-0 content-start gap-5">
        <header>
          <h1 className="font-display text-xl italic text-plum-950">
            {subject.name}
          </h1>
          <div className="mt-3">
            <ProgressBar value={progress} />
          </div>
          <p className="mt-2 text-xs text-plum-700">
            {Math.round(progress * 100)} % · <PaceBadge pace={subjectPace} />
          </p>
        </header>

        <div className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] shadow-[var(--shadow-hairline)]">
          {list.map((chapter, i) => (
            <ChapterRow
              key={chapter.id}
              id={chapter.id}
              name={chapter.name}
              status={chapter.status}
              canMoveUp={i > 0}
              canMoveDown={i < list.length - 1}
            />
          ))}
        </div>
      </div>

      <aside className="grid min-w-0 content-start gap-5 overflow-hidden rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-4 text-xs shadow-[var(--shadow-hairline)] lg:sticky lg:top-8 lg:self-start">
        <section className="min-w-0 border-t-2 border-ciel-500 pt-2.5">
          <h2 className="mb-1.5 font-mono text-xs text-ciel-600">épreuve</h2>
          <p className="flex justify-between gap-3">
            <span className="text-plum-950">{subject.name}</span>
            <span className="font-mono text-plum-700">
              {formatDateShort(subject.exam_date!)}
            </span>
          </p>
        </section>

        <section className="min-w-0 border-t-2 border-plum-700 pt-2.5">
          <h2 className="mb-1.5 font-mono text-xs text-plum-700">matière</h2>
          <ul className="grid gap-1">
            <li className="flex justify-between gap-3">
              <span className="text-plum-950">chapitres touchés</span>
              <span className="font-mono text-plum-700">
                {doneCount}/{list.length}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-plum-950">maîtrisés</span>
              <span className="font-mono text-plum-700">{masteredCount}</span>
            </li>
          </ul>
        </section>
      </aside>
    </main>
  );
}
