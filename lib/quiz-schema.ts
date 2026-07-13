/**
 * Beranis - schémas des questions de quiz (payload jsonb) et mapping des
 * réponses vers les notes SRS. Partagé entre la génération (validation de la
 * sortie du modèle) et la session de quiz.
 */

import { z } from "zod";
import type { Rating } from "./srs";

export const qcmSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.number().int().min(0).max(3),
  explication: z.string(),
});

export const ouverteSchema = z.object({
  question: z.string(),
  reponse_attendue: z.string(),
});

export const miniCasEtapeSchema = z.object({
  type: z.enum(["qualification", "fondement", "conclusion"]),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.number().int().min(0).max(3),
  explication: z.string(),
});

export const miniCasSchema = z.object({
  scenario: z.string(),
  etapes: z.array(miniCasEtapeSchema).min(2).max(4),
});

export type QcmPayload = z.infer<typeof qcmSchema>;
export type OuvertePayload = z.infer<typeof ouverteSchema>;
export type MiniCasEtape = z.infer<typeof miniCasEtapeSchema>;
export type MiniCasPayload = z.infer<typeof miniCasSchema>;

export const generatedQuestionSchema = z.discriminatedUnion("qtype", [
  z.object({ qtype: z.literal("qcm"), payload: qcmSchema }),
  z.object({ qtype: z.literal("ouverte"), payload: ouverteSchema }),
  z.object({ qtype: z.literal("mini_cas"), payload: miniCasSchema }),
]);

/** Sortie structurée attendue de l'API Claude. */
export const generationOutputSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

/** Question telle que servie à la session (payload validé côté serveur). */
export type QuizQuestion = { id: string; chapterId: string } & (
  | { qtype: "qcm"; payload: QcmPayload }
  | { qtype: "ouverte"; payload: OuvertePayload }
  | { qtype: "mini_cas"; payload: MiniCasPayload }
);

export function parseQuestionPayload(
  qtype: string,
  payload: unknown,
): QuizQuestion["payload"] | null {
  const parsed =
    qtype === "qcm"
      ? qcmSchema.safeParse(payload)
      : qtype === "ouverte"
        ? ouverteSchema.safeParse(payload)
        : qtype === "mini_cas"
          ? miniCasSchema.safeParse(payload)
          : null;
  return parsed?.success ? parsed.data : null;
}

/** QCM : faux → raté ; juste → ok. */
export function qcmRating(isCorrect: boolean): Rating {
  return isCorrect ? 3 : 1;
}

/** Mini-cas : toutes étapes justes → ok ; une erreur → difficile ; sinon raté. */
export function miniCasRating(wrongSteps: number): Rating {
  if (wrongSteps === 0) return 3;
  if (wrongSteps === 1) return 2;
  return 1;
}

/** Budget temps estimé par question (secondes) - cible session ≈ 10 min. */
export const QUESTION_SECONDS: Record<QuizQuestion["qtype"], number> = {
  qcm: 30,
  ouverte: 45,
  mini_cas: 120,
};

export const SESSION_BUDGET_SECONDS = 10 * 60;
export const SESSION_MAX_QUESTIONS = 12;
