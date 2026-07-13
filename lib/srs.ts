/**
 * Beranis - répétition espacée (FSRS-4.5 simplifié).
 * Module pur : aucune dépendance, aucune I/O. Ne pas y importer Supabase.
 *
 * Simplifications par rapport à FSRS complet :
 * - pas de fuzz sur les intervalles ;
 * - un seul pas d'apprentissage (raté → re-proposé 10 min plus tard) ;
 * - intervalle plafonné pour que tout repasse avant l'examen (J−3).
 */

export type Rating = 1 | 2 | 3 | 4; // raté / difficile / ok / facile

export type ReviewState = "new" | "learning" | "review" | "relearning";

export interface SrsCard {
  state: ReviewState;
  stability: number; // jours
  difficulty: number; // 1..10
  reps: number;
  lapses: number;
  lastReviewedAt: string | null; // ISO datetime
}

export const RATING_LABEL: Record<Rating, string> = {
  1: "raté",
  2: "difficile",
  3: "ok",
  4: "facile",
};

/** Poids par défaut FSRS-4.5. */
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
  0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
] as const;

/** Rétention cible : 90 %. */
const TARGET_RETENTION = 0.9;
const DECAY = -0.5;
const FACTOR = 19 / 81; // calé pour que intervalle = stabilité à R = 0.9

/** Une question ratée revient 10 minutes plus tard (souvent dans la session). */
const LAPSE_DELAY_MIN = 10;

/** Tout doit repasser avant l'examen : aucune échéance après J−3. */
export const EXAM_BUFFER_DAYS = 3;

const DAY_MS = 86_400_000;

export function newCard(): SrsCard {
  return {
    state: "new",
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    lastReviewedAt: null,
  };
}

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d));
}

function initDifficulty(rating: Rating): number {
  return clampDifficulty(W[4] - (rating - 3) * W[5]);
}

function nextDifficulty(d: number, rating: Rating): number {
  const updated = d - W[6] * (rating - 3);
  return clampDifficulty(W[7] * initDifficulty(4) + (1 - W[7]) * updated);
}

/** Probabilité de rappel après `elapsedDays` pour une stabilité donnée. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 1;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

function recallStability(card: SrsCard, rating: Rating, r: number): number {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  return (
    card.stability *
    (1 +
      Math.exp(W[8]) *
        (11 - card.difficulty) *
        Math.pow(card.stability, -W[9]) *
        (Math.exp(W[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus)
  );
}

function forgetStability(card: SrsCard, r: number): number {
  return (
    W[11] *
    Math.pow(card.difficulty, -W[12]) *
    (Math.pow(card.stability + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r))
  );
}

/** Intervalle (jours) visant la rétention cible. */
function nextIntervalDays(stability: number): number {
  const interval =
    (stability / FACTOR) * (Math.pow(TARGET_RETENTION, 1 / DECAY) - 1);
  return Math.max(1, Math.round(interval));
}

export interface ReviewResult {
  card: SrsCard;
  dueAt: string; // ISO datetime
}

/**
 * Applique une note à une carte et calcule sa prochaine échéance.
 * `examDateIso` (YYYY-MM-DD) plafonne l'échéance à examen − EXAM_BUFFER_DAYS.
 */
export function review(
  card: SrsCard,
  rating: Rating,
  nowIso: string,
  examDateIso: string,
): ReviewResult {
  const now = new Date(nowIso).getTime();
  const elapsedDays = card.lastReviewedAt
    ? Math.max(0, (now - new Date(card.lastReviewedAt).getTime()) / DAY_MS)
    : 0;

  let next: SrsCard;
  if (card.state === "new") {
    next = {
      state: rating === 1 ? "learning" : "review",
      stability: W[rating - 1],
      difficulty: initDifficulty(rating),
      reps: 1,
      lapses: rating === 1 ? 1 : 0,
      lastReviewedAt: nowIso,
    };
  } else {
    const r = retrievability(elapsedDays, card.stability);
    const difficulty = nextDifficulty(card.difficulty, rating);
    if (rating === 1) {
      next = {
        state: "relearning",
        stability: Math.max(0.1, forgetStability(card, r)),
        difficulty,
        reps: card.reps + 1,
        lapses: card.lapses + 1,
        lastReviewedAt: nowIso,
      };
    } else {
      next = {
        state: "review",
        stability: Math.max(0.1, recallStability(card, rating, r)),
        difficulty,
        reps: card.reps + 1,
        lapses: card.lapses,
        lastReviewedAt: nowIso,
      };
    }
  }

  let dueMs: number;
  if (rating === 1) {
    dueMs = now + LAPSE_DELAY_MIN * 60_000;
  } else {
    dueMs = now + nextIntervalDays(next.stability) * DAY_MS;
  }

  // Plafond produit : rien n'est planifié après examen − 3 jours.
  const [y, m, d] = examDateIso.split("-").map(Number);
  const capMs = Date.UTC(y, m - 1, d) - EXAM_BUFFER_DAYS * DAY_MS;
  if (dueMs > capMs) dueMs = Math.max(now, capMs);

  return { card: next, dueAt: new Date(dueMs).toISOString() };
}
