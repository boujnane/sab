/**
 * Beranis — rythme calé sur le programme officiel Pré-Barreau.
 * Remplace le modèle linéaire de progress.ts pour expectedProgress/pace.
 * subjectProgress, STATUS_*, daysUntil et paceLabel restent inchangés.
 *
 * Modèle en deux phases :
 *  1. Phase programme (29 juin → 16 août) : un chapitre est attendu au
 *     statut "lu" (0.30) dès la fin de sa semaine de programme. L'attendu
 *     d'une matière est la somme pondérée des chapitres dont la semaine
 *     est passée, à hauteur de LU_WEIGHT.
 *  2. Phase révision (16 août → examen − 7 j) : montée linéaire de la
 *     valeur atteinte en fin de programme vers 1 (tout maîtrisé).
 * Les chapitres hors programme (program_week = null, ex. MARC) ne sont
 * attendus qu'en phase révision.
 */

import { STATUS_WEIGHT, type ChapterStatus } from "./progress";

export const PROGRAM_START = "2026-06-29"; // lundi semaine 1
export const PROGRAM_END = "2026-08-16"; // début période de révision
export const FINAL_SPRINT_DAYS = 7;

const LU_WEIGHT = STATUS_WEIGHT.lu; // 0.30

export interface ProgramChapter {
  status: ChapterStatus;
  weight: number;
  programWeek: number | null; // 1..7, null = période de révision uniquement
}

function isoToDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Fin de la semaine N du programme (dimanche soir) en jour UTC. */
function weekEndDay(week: number): number {
  return isoToDay(PROGRAM_START) + week * 7 - 1;
}

/**
 * Avancement attendu d'une matière à la date donnée, entre 0 et 1,
 * selon le programme officiel puis la période de révision.
 */
export function expectedProgramProgress(
  chapters: ProgramChapter[],
  todayIso: string,
  examDateIso: string,
): number {
  const totalWeight = chapters.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return 0;

  const today = isoToDay(todayIso);
  const programEnd = isoToDay(PROGRAM_END);
  const target = isoToDay(examDateIso) - FINAL_SPRINT_DAYS;

  // Attendu "fin de programme" : tous les chapitres au programme sont lus.
  const coveredWeight = (upToDay: number) =>
    chapters
      .filter((c) => c.programWeek !== null && weekEndDay(c.programWeek) <= upToDay)
      .reduce((s, c) => s + c.weight, 0);

  const atProgramEnd = (coveredWeight(programEnd) * LU_WEIGHT) / totalWeight;

  if (today <= programEnd) {
    return (coveredWeight(today) * LU_WEIGHT) / totalWeight;
  }
  if (target <= programEnd) return 1;

  // Phase révision : linéaire de atProgramEnd vers 1.
  const t = Math.min(1, (today - programEnd) / (target - programEnd));
  return atProgramEnd + t * (1 - atProgramEnd);
}

export type ProgramPace =
  | { kind: "ahead"; days: number }
  | { kind: "behind"; days: number }
  | { kind: "on_track" }
  | { kind: "done" };

/**
 * Écart en jours par rapport au programme : on cherche la date à laquelle
 * l'avancement réel était/sera attendu, et on compare à aujourd'hui.
 * Recherche par balayage jour à jour — trivial et suffisant (≈ 70 jours).
 */
export function programPace(
  chapters: ProgramChapter[],
  todayIso: string,
  examDateIso: string,
): ProgramPace {
  const actual =
    chapters.reduce((s, c) => s + c.weight * STATUS_WEIGHT[c.status], 0) /
    Math.max(
      1,
      chapters.reduce((s, c) => s + c.weight, 0),
    );
  if (actual >= 1) return { kind: "done" };

  const start = isoToDay(PROGRAM_START);
  const end = isoToDay(examDateIso) - FINAL_SPRINT_DAYS;
  const today = isoToDay(todayIso);

  // Premier jour où l'attendu dépasse le réel.
  let matchDay = end;
  for (let d = start; d <= end; d++) {
    const iso = new Date(d * 86_400_000).toISOString().slice(0, 10);
    if (expectedProgramProgress(chapters, iso, examDateIso) > actual) {
      matchDay = d;
      break;
    }
  }

  const delta = matchDay - today;
  if (Math.abs(delta) < 1) return { kind: "on_track" };
  return delta > 0
    ? { kind: "ahead", days: Math.round(delta) }
    : { kind: "behind", days: Math.round(-delta) };
}

/** Numéro de semaine du programme pour une date (1..7), null hors programme. */
export function currentProgramWeek(todayIso: string): number | null {
  const diff = isoToDay(todayIso) - isoToDay(PROGRAM_START);
  if (diff < 0) return null;
  const week = Math.floor(diff / 7) + 1;
  return week <= 7 ? week : null;
}
