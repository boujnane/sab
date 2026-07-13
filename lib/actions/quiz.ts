"use server";

import { revalidatePath } from "next/cache";

import { review, newCard, type Rating, type SrsCard } from "@/lib/srs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ReviewStateDb } from "@/lib/supabase/types";

type Result = { ok: true } | { ok: false; error: string };

/** Dernière épreuve : borne de planification par défaut. */
const LAST_EXAM_ISO = "2026-09-04";

export async function answerQuestion(
  questionId: string,
  rating: Rating,
  sessionId?: string | null,
): Promise<Result> {
  if (![1, 2, 3, 4].includes(rating))
    return { ok: false, error: "Note invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const db = createAdminClient() ?? supabase;

  const { data: question } = await db
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .eq("user_id", user.id)
    .single();
  if (!question) return { ok: false, error: "Question introuvable." };

  const { data: existing } = await db
    .from("question_reviews")
    .select(
      "id, state, stability, difficulty, reps, lapses, last_reviewed_at",
    )
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .maybeSingle();

  const card: SrsCard = existing
    ? {
        state: existing.state,
        stability: existing.stability,
        difficulty: existing.difficulty,
        reps: existing.reps,
        lapses: existing.lapses,
        lastReviewedAt: existing.last_reviewed_at,
      }
    : newCard();

  const nowIso = new Date().toISOString();
  const next = review(card, rating, nowIso, LAST_EXAM_ISO);

  const row = {
    user_id: user.id,
    question_id: questionId,
    state: next.card.state as ReviewStateDb,
    stability: next.card.stability,
    difficulty: next.card.difficulty,
    reps: next.card.reps,
    lapses: next.card.lapses,
    last_rating: rating,
    due_at: next.dueAt,
    last_reviewed_at: nowIso,
  };

  const { error } = existing
    ? await db.from("question_reviews").update(row).eq("id", existing.id)
    : await db.from("question_reviews").insert(row);
  if (error) {
    console.error("answerQuestion:", error.code, error.message);
    return { ok: false, error: `Réponse non enregistrée : ${error.message}` };
  }

  let validSessionId: string | null = null;
  if (sessionId) {
    const { data: session } = await db
      .from("quiz_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    validSessionId = session?.id ?? null;
  }

  const { error: attemptError } = await db.from("question_attempts").insert({
    user_id: user.id,
    session_id: validSessionId,
    question_id: questionId,
    rating,
  });
  if (attemptError) {
    console.error(
      "answerQuestion attempt:",
      attemptError.code,
      attemptError.message,
    );
  }

  return { ok: true };
}

export async function flagQuestion(questionId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const db = createAdminClient() ?? supabase;
  const { data, error } = await db
    .from("questions")
    .update({ status: "signalee" })
    .eq("id", questionId)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error || !data) {
    console.error("flagQuestion:", error?.code, error?.message);
    return { ok: false, error: "Signalement non enregistré." };
  }

  return { ok: true };
}

export async function startQuizSession(): Promise<
  { ok: true; sessionId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const db = createAdminClient() ?? supabase;
  const { data, error } = await db
    .from("quiz_sessions")
    .insert({ user_id: user.id })
    .select("id")
    .single();
  if (error || !data) {
    console.error("startQuizSession:", error?.code, error?.message);
    return { ok: false, error: "Session non créée." };
  }
  return { ok: true, sessionId: data.id };
}

export async function finishQuizSession(
  sessionId: string,
  answered: number,
  correct: number,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const db = createAdminClient() ?? supabase;
  const { error } = await db
    .from("quiz_sessions")
    .update({
      ended_at: new Date().toISOString(),
      answered: Math.max(0, Math.trunc(answered)),
      correct: Math.max(0, Math.trunc(correct)),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);
  if (error) {
    console.error("finishQuizSession:", error.code, error.message);
    return { ok: false, error: "Session non clôturée." };
  }

  revalidatePath("/quiz");
  return { ok: true };
}
