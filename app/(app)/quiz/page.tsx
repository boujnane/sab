import Link from "next/link";
import { redirect } from "next/navigation";

import { QuizHub, type HubSubject } from "@/components/quiz-hub";
import type { QuizProgressStats } from "@/components/quiz-progress";
import { QuizSession, type SessionQuestion } from "@/components/quiz-session";
import {
  parseQuestionPayload,
  QUESTION_SECONDS,
  SESSION_BUDGET_SECONDS,
  SESSION_MAX_QUESTIONS,
} from "@/lib/quiz-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface QuestionRow {
  id: string;
  chapter_id: string;
  qtype: "qcm" | "ouverte" | "mini_cas";
  payload: unknown;
}

interface ReviewRow {
  question_id: string;
  state: "new" | "learning" | "review" | "relearning";
  reps: number;
  lapses: number;
  last_rating: number | null;
  due_at: string;
}

interface AttemptRow {
  question_id: string;
  rating: number;
  answered_at: string;
}

interface QuizSessionRow {
  id: string;
  started_at: string;
  answered: number;
  correct: number;
}

/** Dues d'abord, puis jamais vues, puis (mode libre) les plus fragiles. */
function orderForSession(
  questions: QuestionRow[],
  reviews: Map<string, string>,
  nowIso: string,
  includeSeen: boolean,
): QuestionRow[] {
  const due = questions
    .filter((q) => {
      const dueAt = reviews.get(q.id);
      return dueAt !== undefined && dueAt <= nowIso;
    })
    .sort((a, b) => reviews.get(a.id)!.localeCompare(reviews.get(b.id)!));
  const fresh = questions.filter((q) => !reviews.has(q.id));
  if (!includeSeen) return [...due, ...fresh];
  const seen = questions
    .filter((q) => {
      const dueAt = reviews.get(q.id);
      return dueAt !== undefined && dueAt > nowIso;
    })
    .sort((a, b) => reviews.get(a.id)!.localeCompare(reviews.get(b.id)!));
  return [...due, ...fresh, ...seen];
}

function takeSessionRows(ordered: QuestionRow[]): QuestionRow[] {
  const batch: QuestionRow[] = [];
  let budget = SESSION_BUDGET_SECONDS;
  for (const q of ordered) {
    if (batch.length >= SESSION_MAX_QUESTIONS) break;
    const payload = parseQuestionPayload(q.qtype, q.payload);
    if (!payload) continue;
    const cost = QUESTION_SECONDS[q.qtype];
    if (cost > budget && batch.length > 0) continue;
    budget -= cost;
    batch.push(q);
  }
  return batch;
}

function shuffledRows(rows: QuestionRow[]): QuestionRow[] {
  const shuffled = [...rows];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    chapitre?: string;
    matiere?: string;
    ordre?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const db = createAdminClient() ?? supabase;

  const quizUserId = user.id;
  const preview = false;

  const [
    questionsResult,
    reviewsResult,
    chaptersResult,
    subjectsResult,
    sessionsResult,
    attemptsResult,
  ] = await Promise.all([
    db
      .from("questions")
      .select("id, chapter_id, qtype, payload")
      .eq("user_id", quizUserId)
      .eq("status", "active"),
    db
      .from("question_reviews")
      .select("question_id, state, reps, lapses, last_rating, due_at")
      .eq("user_id", quizUserId),
    db
      .from("chapters")
      .select("id, subject_id, name, sort_order")
      .eq("user_id", quizUserId)
      .order("sort_order"),
    db
      .from("subjects")
      .select("id, name, sort_order")
      .eq("user_id", quizUserId)
      .order("sort_order"),
    db
      .from("quiz_sessions")
      .select("id, started_at, answered, correct")
      .eq("user_id", quizUserId)
      .gt("answered", 0)
      .order("started_at", { ascending: false })
      .limit(14),
    db
      .from("question_attempts")
      .select("question_id, rating, answered_at")
      .eq("user_id", quizUserId)
      .order("answered_at", { ascending: false })
      .limit(500),
  ]);

  const questions = (questionsResult.data ?? []) as QuestionRow[];
  const reviewRows = (reviewsResult.data ?? []) as ReviewRow[];
  const reviews = new Map(reviewRows.map((r) => [r.question_id, r.due_at]));
  const chapters = chaptersResult.data ?? [];
  const subjects = subjectsResult.data ?? [];
  const sessions = (sessionsResult.data ?? []) as QuizSessionRow[];
  const attempts = (attemptsResult.data ?? []) as AttemptRow[];
  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
  const subjectIdByQuestionId = new Map(
    questions.map((q) => [
      q.id,
      chapterById.get(q.chapter_id)?.subject_id ?? null,
    ]),
  );
  const nowIso = new Date().toISOString();

  const isDue = (q: QuestionRow) => {
    const dueAt = reviews.get(q.id);
    return dueAt !== undefined && dueAt <= nowIso;
  };
  const totalDue =
    questions.filter(isDue).length +
    questions.filter((q) => !reviews.has(q.id)).length;

  const params = await searchParams;
  const inSession = params.mode === "jour" || params.chapitre || params.matiere;

  /* ---------------- Hub : choix de la session ---------------- */
  if (!inSession) {
    const dailySessionCount = takeSessionRows(
      orderForSession(questions, reviews, nowIso, false),
    ).length;
    const hubSubjects: HubSubject[] = subjects
      .map((s) => {
        const subjectChapters = chapters
          .filter((c) => c.subject_id === s.id)
          .map((c) => {
            const qs = questions.filter((q) => q.chapter_id === c.id);
            return {
              id: c.id,
              name: c.name,
              total: qs.length,
              due:
                qs.filter(isDue).length +
                qs.filter((q) => !reviews.has(q.id)).length,
            };
          })
          .filter((c) => c.total > 0);
        return {
          id: s.id,
          name: s.name,
          total: subjectChapters.reduce((sum, c) => sum + c.total, 0),
          due: subjectChapters.reduce((sum, c) => sum + c.due, 0),
          chapters: subjectChapters,
        };
      })
      .filter((s) => s.total > 0);

    const since7Iso = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const recentAttempts = attempts.filter((a) => a.answered_at >= since7Iso);
    const recentCorrect = recentAttempts.filter((a) => a.rating >= 3).length;
    const masteredQuestionIds = new Set(
      reviewRows
        .filter(
          (r) =>
            r.state === "review" &&
            (r.last_rating ?? 0) >= 3 &&
            r.due_at > nowIso,
        )
        .map((r) => r.question_id),
    );
    const fragileQuestionIds = new Set(
      reviewRows
        .filter(
          (r) =>
            r.state === "learning" ||
            r.state === "relearning" ||
            r.last_rating === 1 ||
            r.lapses > 0,
        )
        .map((r) => r.question_id),
    );
    const attemptsBySubject = new Map<
      string,
      { attempts: number; correct: number }
    >();
    for (const attempt of attempts) {
      const subjectId = subjectIdByQuestionId.get(attempt.question_id);
      if (!subjectId) continue;
      const entry = attemptsBySubject.get(subjectId) ?? {
        attempts: 0,
        correct: 0,
      };
      entry.attempts += 1;
      if (attempt.rating >= 3) entry.correct += 1;
      attemptsBySubject.set(subjectId, entry);
    }
    const progress: QuizProgressStats = {
      sevenDays: {
        sessions: sessions.filter((s) => s.started_at >= since7Iso).length,
        answered: recentAttempts.length,
        correct: recentCorrect,
        accuracy:
          recentAttempts.length > 0
            ? Math.round((recentCorrect / recentAttempts.length) * 100)
            : null,
      },
      srs: {
        seen: reviewRows.length,
        unseen: Math.max(0, questions.length - reviewRows.length),
        due: totalDue,
        mastered: masteredQuestionIds.size,
        fragile: fragileQuestionIds.size,
      },
      recentSessions: sessions.slice(0, 6).map((s) => ({
        id: s.id,
        startedAt: s.started_at,
        answered: s.answered,
        correct: s.correct,
      })),
      subjects: hubSubjects.map((subject) => {
        const subjectAttempts = attemptsBySubject.get(subject.id) ?? {
          attempts: 0,
          correct: 0,
        };
        const subjectQuestionIds = new Set(
          questions
            .filter(
              (q) =>
                chapterById.get(q.chapter_id)?.subject_id === subject.id,
            )
            .map((q) => q.id),
        );
        return {
          id: subject.id,
          name: subject.name,
          total: subject.total,
          due: subject.due,
          attempts: subjectAttempts.attempts,
          correct: subjectAttempts.correct,
          accuracy:
            subjectAttempts.attempts > 0
              ? Math.round(
                  (subjectAttempts.correct / subjectAttempts.attempts) * 100,
                )
              : null,
          mastered: [...subjectQuestionIds].filter((id) =>
            masteredQuestionIds.has(id),
          ).length,
        };
      }),
    };

    return (
      <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-4 sm:px-6 md:pt-8">
        <QuizHub
          subjects={hubSubjects}
          totalQuestions={questions.length}
          totalDue={totalDue}
          dailySessionCount={dailySessionCount}
          progress={progress}
          preview={preview}
        />
      </main>
    );
  }

  /* ---------------- Session ---------------- */
  let pool = questions;
  let title =
    params.ordre === "aleatoire" ? "Run aléatoire" : "Session du jour";
  let includeSeen = false;

  if (params.chapitre) {
    const chapter = chapterById.get(params.chapitre);
    pool = questions.filter((q) => q.chapter_id === params.chapitre);
    title = chapter?.name ?? "Chapitre";
    includeSeen = true;
  } else if (params.matiere) {
    const ids = new Set(
      chapters.filter((c) => c.subject_id === params.matiere).map((c) => c.id),
    );
    pool = questions.filter((q) => ids.has(q.chapter_id));
    title = subjectNameById.get(params.matiere) ?? "Matière";
    includeSeen = true;
  }

  const ordered = orderForSession(pool, reviews, nowIso, includeSeen);
  const sessionRows =
    params.ordre === "aleatoire"
      ? takeSessionRows(shuffledRows(ordered))
      : takeSessionRows(ordered);
  const batch: SessionQuestion[] = sessionRows.flatMap((q) => {
    const payload = parseQuestionPayload(q.qtype, q.payload);
    if (!payload) return [];
    return [
      {
        id: q.id,
        qtype: q.qtype,
        payload,
        subjectName:
          subjectNameById.get(
            chapterById.get(q.chapter_id)?.subject_id ?? "",
          ) ?? "",
      } as SessionQuestion,
    ];
  });

  const backlogCount = ordered.length;

  if (batch.length === 0) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pb-6 pt-8 sm:px-6">
        <h1 className="font-display text-xl italic text-plum-950">Quiz</h1>
        <p className="mt-4 text-sm text-plum-950">
          Rien à réviser ici pour l&apos;instant.
        </p>
        <Link
          href="/quiz"
          className="mt-6 inline-block font-mono text-xs text-plum-700 underline"
        >
          ← choisir un autre quiz
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-4 sm:px-6 md:pt-8">
      <QuizSession
        questions={batch}
        dueCount={backlogCount}
        preview={preview}
        title={title}
      />
    </main>
  );
}
