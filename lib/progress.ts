/**
 * Beranis — logique d'avancement et d'écart de rythme.
 * Module pur : aucune dépendance, aucune I/O. Ne pas y importer Supabase.
 * Les dates sont manipulées en jours UTC entiers pour éviter tout bug de fuseau.
 */

export type ChapterStatus = "non_vu" | "lu" | "fiche" | "revise" | "maitrise";

export const STATUS_ORDER: readonly ChapterStatus[] = [
  "non_vu",
  "lu",
  "fiche",
  "revise",
  "maitrise",
] as const;

export const STATUS_WEIGHT: Record<ChapterStatus, number> = {
  non_vu: 0,
  lu: 0.3,
  fiche: 0.55,
  revise: 0.8,
  maitrise: 1,
};

export const STATUS_LABEL: Record<ChapterStatus, string> = {
  non_vu: "non vu",
  lu: "lu",
  fiche: "fiché",
  revise: "révisé",
  maitrise: "maîtrisé",
};

/** Début du plan de révision (prépa estivale). */
export const PLAN_START = "2026-07-13";

/** Marge de sprint final : la matière doit être à 100 % J−7 avant l'épreuve. */
export const FINAL_SPRINT_DAYS = 7;

export interface ChapterInput {
  status: ChapterStatus;
  weight: number; // 1..5
}

export type Pace =
  | { kind: "ahead"; days: number }
  | { kind: "behind"; days: number }
  | { kind: "on_track" }
  | { kind: "done" };

/** Jour UTC entier depuis l'époque, pour une date ISO `YYYY-MM-DD`. */
function isoToDayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Avancement pondéré d'une matière, entre 0 et 1. */
export function subjectProgress(chapters: ChapterInput[]): number {
  const totalWeight = chapters.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return 0;
  const acquired = chapters.reduce(
    (s, c) => s + c.weight * STATUS_WEIGHT[c.status],
    0,
  );
  return acquired / totalWeight;
}

/**
 * Avancement théorique attendu à la date `today` : linéaire de 0 (PLAN_START)
 * à 1 (exam_date − FINAL_SPRINT_DAYS). Borné à [0, 1].
 */
export function expectedProgress(
  todayIso: string,
  examDateIso: string,
  planStartIso: string = PLAN_START,
): number {
  const start = isoToDayNumber(planStartIso);
  const target = isoToDayNumber(examDateIso) - FINAL_SPRINT_DAYS;
  const today = isoToDayNumber(todayIso);
  if (target <= start) return 1;
  return Math.min(1, Math.max(0, (today - start) / (target - start)));
}

/**
 * Écart de rythme en jours : (réel − théorique) / vitesse quotidienne.
 * |écart| < 0.5 jour → "dans les temps".
 */
export function pace(
  actual: number,
  todayIso: string,
  examDateIso: string,
  planStartIso: string = PLAN_START,
): Pace {
  if (actual >= 1) return { kind: "done" };
  const start = isoToDayNumber(planStartIso);
  const target = isoToDayNumber(examDateIso) - FINAL_SPRINT_DAYS;
  const spanDays = target - start;
  if (spanDays <= 0) return { kind: "on_track" };

  const expected = expectedProgress(todayIso, examDateIso, planStartIso);
  const dailyRate = 1 / spanDays;
  const deltaDays = (actual - expected) / dailyRate;

  if (Math.abs(deltaDays) < 0.5) return { kind: "on_track" };
  return deltaDays > 0
    ? { kind: "ahead", days: Math.round(deltaDays) }
    : { kind: "behind", days: Math.round(-deltaDays) };
}

/** Libellé français de l'écart, prêt à afficher. */
export function paceLabel(p: Pace): string {
  switch (p.kind) {
    case "done":
      return "terminé";
    case "on_track":
      return "dans les temps";
    case "ahead":
      return `J+${p.days} d'avance`;
    case "behind":
      return `J−${p.days} de retard`;
  }
}

/** Jours restants avant une date (négatif si passée). */
export function daysUntil(todayIso: string, dateIso: string): number {
  return isoToDayNumber(dateIso) - isoToDayNumber(todayIso);
}
