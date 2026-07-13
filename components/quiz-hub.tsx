import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { QuizProgress, type QuizProgressStats } from "@/components/quiz-progress";

export interface HubChapter {
  id: string;
  name: string;
  total: number;
  due: number;
}

export interface HubSubject {
  id: string;
  name: string;
  total: number;
  due: number;
  chapters: HubChapter[];
}

function dueLabel(due: number): string {
  if (due === 0) return "à jour";
  return `${due} à revoir`;
}

export function QuizHub({
  subjects,
  totalQuestions,
  totalDue,
  dailySessionCount,
  progress,
  preview,
}: {
  subjects: HubSubject[];
  totalQuestions: number;
  totalDue: number;
  dailySessionCount: number;
  progress: QuizProgressStats;
  preview: boolean;
}) {
  if (totalQuestions === 0) {
    return (
      <div>
        <h1 className="font-display text-xl italic text-plum-950">Quiz</h1>
        <p className="mt-4 text-sm text-plum-700">
          Aucune question pour l&apos;instant. Elles apparaîtront ici dès que
          les supports auront été ingérés.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block font-mono text-xs text-plum-700 underline"
        >
          ← retour au cockpit
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <h1 className="font-display text-xl italic text-plum-950">Quiz</h1>
        <p className="min-w-0 truncate text-right font-mono text-xs text-plum-700">
          {preview && <span className="text-ciel-600">aperçu admin · </span>}
          {totalQuestions} questions
        </p>
      </div>

      {/* Session du jour - pilotée par la répétition espacée */}
      <section className="quiz-enter mt-5 overflow-hidden rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] shadow-[var(--shadow-hairline)]">
        <div className="flex items-end justify-between gap-4 p-5">
          <div>
            <p className="font-mono text-xs text-plum-700">session du jour</p>
            <p className="mt-1 font-display text-2xl italic leading-none text-plum-950">
              {dailySessionCount}
            </p>
            <p className="mt-1.5 text-sm text-plum-700">
              {dailySessionCount > 0
                ? `${totalDue} en file - run court, les ratées reviennent, les maîtrisées s'espacent`
                : "tout est à jour - rien ne presse aujourd'hui"}
            </p>
          </div>
        </div>
        <div className="border-t border-plum-100 p-3">
          {dailySessionCount > 0 ? (
            <Link
              href="/quiz?mode=jour&ordre=aleatoire"
              className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-petale-500 text-sm font-medium text-white transition-colors duration-150 hover:bg-petale-600"
            >
              Lancer un run aléatoire
              <span className="font-mono text-xs text-petale-100">
                {dailySessionCount} q
              </span>
            </Link>
          ) : (
            <Link
              href="/quiz?mode=jour"
              className="flex h-12 items-center justify-center rounded-[var(--radius)] border border-plum-200 text-sm font-medium text-plum-950 transition-colors duration-150 hover:bg-plum-100"
            >
              S&apos;entraîner quand même
            </Link>
          )}
        </div>
      </section>

      <QuizProgress stats={progress} />

      {/* Entraînement libre par matière / chapitre */}
      <section className="mt-8 border-t-2 border-plum-700 pt-2.5">
        <h2 className="font-mono text-xs text-plum-700">entraînement libre</h2>
        <div className="mt-2 grid gap-5">
          {subjects.map((subject) => (
            <div key={subject.id}>
              <Link
                href={`/quiz?matiere=${subject.id}`}
                className="group -mx-2 grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-[var(--radius)] px-2 transition-colors duration-150 hover:bg-plum-100/70"
              >
                <span className="min-w-0 truncate text-sm font-medium text-plum-950">
                  {subject.name}
                </span>
                <span className="flex min-w-0 items-center justify-end gap-1.5 whitespace-nowrap font-mono text-xs text-plum-700">
                  <span className="hidden sm:inline">
                    {subject.total} q · {dueLabel(subject.due)}
                  </span>
                  <span className="sm:hidden">
                    {subject.total} q
                    {subject.due > 0 ? ` · ${subject.due}` : ""}
                  </span>
                  <ArrowRight
                    size={14}
                    strokeWidth={1.75}
                    className="hidden opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block"
                    aria-hidden
                  />
                </span>
              </Link>
              <ul className="mt-0.5 border-l border-plum-200 pl-3">
                {subject.chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <Link
                      href={`/quiz?chapitre=${chapter.id}`}
                      className="group grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-[var(--radius)] px-2 transition-colors duration-150 hover:bg-plum-100/70"
                    >
                      <span className="min-w-0 truncate text-sm text-plum-950">
                        {chapter.name}
                      </span>
                      <span className="flex min-w-0 items-center justify-end gap-1.5 whitespace-nowrap font-mono text-xs text-plum-700">
                        {chapter.due > 0 ? (
                          <span className="text-petale-600">
                            <span className="hidden sm:inline">
                              {chapter.due} à revoir
                            </span>
                            <span className="sm:hidden">{chapter.due}</span>
                          </span>
                        ) : (
                          "à jour"
                        )}
                        <ArrowRight
                          size={14}
                          strokeWidth={1.75}
                          className="hidden opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:block"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
