/**
 * Beranis - génération de questions par l'API Claude à partir d'un support PDF.
 * Le PDF est uploadé une seule fois via la Files API (id mémorisé sur
 * `documents.anthropic_file_id`), puis référencé à chaque génération.
 */

import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import {
  generationOutputSchema,
  type GeneratedQuestion,
} from "@/lib/quiz-schema";

const FILES_BETA = "files-api-2025-04-14";
const MODEL = "claude-sonnet-5";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante.");
  return new Anthropic({ apiKey });
}

/** Uploade un PDF vers la Files API Anthropic et renvoie son file_id. */
export async function uploadPdfToAnthropic(
  pdf: ArrayBuffer,
  filename: string,
): Promise<string> {
  const uploaded = await client().beta.files.upload({
    file: await toFile(Buffer.from(pdf), filename, {
      type: "application/pdf",
    }),
    betas: [FILES_BETA],
  });
  return uploaded.id;
}

const SYSTEM = `Tu prépares une candidate au CRFPA (session septembre 2026, spécialité droit civil) à partir de ses supports de cours Pré-Barreau.

Tu génères des questions d'entraînement à remplissage rapide, jamais rédactionnelles. Trois formats :

1. "qcm" - une question de connaissance précise, 4 options, une seule juste. Les distracteurs sont juridiquement plausibles (articles voisins, conditions inversées, jurisprudences proches).
2. "ouverte" - une question dont la réponse tient en une ou deux lignes (définition, condition, délai, fondement). "reponse_attendue" est courte et précise.
3. "mini_cas" - LE format de l'examen. Un scénario factuel court (3 à 6 lignes, personnages nommés, faits datés) suivi de 2 à 4 étapes calquées sur le syllogisme juridique du cas pratique CRFPA :
   - "qualification" : qualifier juridiquement les faits ;
   - "fondement" : choisir le bon fondement (article précis du Code civil / CPC, ou jurisprudence) ;
   - "conclusion" : trancher la solution.
   Chaque étape est un choix unique parmi 4 options, avec une explication courte (2 phrases max) qui énonce la règle et son application aux faits - pas de récitation de cours.

Règles :
- Reste strictement dans le contenu du chapitre demandé, tel qu'exposé dans le support fourni.
- Cite les articles avec précision (numéro exact).
- Formulations en français juridique clair, niveau CRFPA.
- Les explications doivent permettre de comprendre l'erreur, pas seulement donner la bonne réponse.`;

export interface GenerationTarget {
  chapterName: string;
  pdfRef: string | null; // ex. "Cours_OB_1_Preuve pp. 5-24"
  subjectName: string;
}

/**
 * Génère les questions d'un chapitre à partir d'un PDF déjà uploadé.
 * Lance une erreur si l'appel API ou la validation échoue.
 */
export async function generateChapterQuestions(
  anthropicFileId: string,
  target: GenerationTarget,
): Promise<GeneratedQuestion[]> {
  const pagesHint = target.pdfRef
    ? `Le référentiel indique pour ce chapitre : « ${target.pdfRef} ». Concentre-toi sur ces pages.`
    : "";

  const stream = client().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: [FILES_BETA],
    system: SYSTEM,
    output_config: {
      format: zodOutputFormat(generationOutputSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "file", file_id: anthropicFileId },
          },
          {
            type: "text",
            text: `Matière : ${target.subjectName}.
Chapitre : ${target.chapterName}.
${pagesHint}

Génère exactement : 8 questions "qcm", 4 questions "ouverte" et 3 questions "mini_cas" sur ce chapitre.`,
          },
        ],
      },
    ],
  });

  const message = await stream.finalMessage();
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  if (!text) throw new Error("Réponse vide du modèle.");

  const parsed = generationOutputSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Sortie invalide : ${parsed.error.message.slice(0, 300)}`);
  }
  return parsed.data.questions;
}
