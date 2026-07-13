import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type DbClient = SupabaseClient<Database>;

const SUBJECTS = [
  {
    slug: "synthese",
    name: "Note de synthèse",
    exam_date: "2026-09-01",
    exam_duration_min: 300,
    has_chapters: false,
    sort_order: 0,
  },
  {
    slug: "obligations",
    name: "Droit des obligations",
    exam_date: "2026-09-02",
    exam_duration_min: 180,
    has_chapters: true,
    sort_order: 1,
  },
  {
    slug: "civil",
    name: "Droit civil (spé)",
    exam_date: "2026-09-03",
    exam_duration_min: 180,
    has_chapters: true,
    sort_order: 2,
  },
  {
    slug: "procedure",
    name: "Procédure civile",
    exam_date: "2026-09-04",
    exam_duration_min: 120,
    has_chapters: true,
    sort_order: 3,
  },
] as const;

const CHAPTERS = [
  ["obligations", "Preuves", "Cours_OB_1_Preuve pp. 5-24", 2, 1, 0],
  ["obligations", "Contrats — introduction et formation", "Cours_OB_2 pp. 9-40", 3, 2, 1],
  ["obligations", "RGO — actions du créancier, modalités temporelles", "Cours_OB_4 pp. 7-29", 3, 2, 2],
  ["obligations", "Contrats — validité : conditions tenant aux personnes", "Cours_OB_2 pp. 41-61", 3, 3, 3],
  ["obligations", "RGO — modalités structurelles", "Cours_OB_4 pp. 31-42", 2, 3, 4],
  ["obligations", "Contrats — validité : contenu et sanctions", "Cours_OB_2 pp. 61-93", 4, 4, 5],
  ["obligations", "RGO — opérations translatives", "Cours_OB_4 pp. 43-61", 3, 4, 6],
  ["obligations", "Contrats — effets, inexécution, annexes", "Cours_OB_2 pp. 95-147", 5, 5, 7],
  ["obligations", "RGO — opérations créatrices", "Cours_OB_4 pp. 63-70", 1, 5, 8],
  ["obligations", "RC — principes communs, fait d'une personne", "Cours_OB_3 pp. 5-35", 4, 6, 9],
  ["obligations", "RGO — extinction de l'obligation", "Cours_OB_4 pp. 71-86", 2, 6, 10],
  ["obligations", "RC — fait d'une chose, annexes", "Cours_OB_3 pp. 37-73", 4, 7, 11],
  ["obligations", "Quasi-contrats", "Cours_OB_5 pp. 5-27", 2, 7, 12],
  ["civil", "Couple hors mariage, formation du mariage", "Tome 1 pp. 9-50", 3, 1, 0],
  ["civil", "Vie du couple marié, désunion et divorce", "Tome 1 pp. 51-97", 4, 2, 1],
  ["civil", "Effets du divorce, l'enfant", "Tome 1 pp. 98-183", 5, 3, 2],
  ["civil", "Qualification, vente, entreprise, prêt, mandat", "Tome 2 pp. 7-92", 5, 4, 3],
  ["civil", "Bail ; cautionnement, garanties, gage, nantissement", "Tome 2 pp. 93-104 + Tome 3 pp. 7-102", 5, 5, 4],
  ["civil", "Privilèges, sûretés immobilières ; intro biens, propriété individuelle", "Tome 3 pp. 103-129 + Tome 4 pp. 5-60", 4, 6, 5],
  ["civil", "Protection de la propriété, propriété collective, démembrements", "Tome 4 pp. 61-117", 4, 7, 6],
  ["procedure", "L'action en justice", "Cours_PC pp. 11-24", 3, 1, 0],
  ["procedure", "Moyens de défense, compétence", "Cours_PC pp. 24-44", 3, 2, 1],
  ["procedure", "Procédure devant le tribunal judiciaire", "Cours_PC pp. 71-81", 3, 3, 2],
  ["procedure", "Référé, requête, mesures d'instruction", "Cours_PC pp. 83-86 + 67-70", 2, 4, 3],
  ["procedure", "Qualification du jugement, exécution provisoire", "Cours_PC pp. 87-98", 2, 5, 4],
  ["procedure", "L'appel", "Cours_PC pp. 103-114", 3, 6, 5],
  ["procedure", "Voies d'exécution", "Cours_PCE", 3, 7, 6],
  ["procedure", "MARC", "Cours_MARC", 1, null, 7],
] as const;

const ASSIGNMENTS = [
  ["obligations", 1, "Sujet 1 — Preuves", "pp. 5-24", "2026-06-29"],
  ["obligations", 2, "Sujet 2 — Formation du contrat, RGO T1-T2", "pp. 9-40 + 7-29", "2026-07-06"],
  ["obligations", 3, "Sujet 3 — Validité (personnes), modalités structurelles", "pp. 41-61 + 31-42", "2026-07-13"],
  ["obligations", 4, "Sujet 4 — Validité (contenu, sanctions), opérations translatives", "pp. 61-93 + 43-61", "2026-07-20"],
  ["obligations", 5, "Sujet 5 — Effets et inexécution, opérations créatrices", "pp. 95-147 + 63-70", "2026-07-27"],
  ["obligations", 6, "Sujet 6 — RC (principes, fait d'une personne), extinction", "pp. 5-35 + 71-86", "2026-08-03"],
  ["obligations", 7, "Sujet 7 — RC (fait d'une chose), quasi-contrats", "pp. 37-73 + 5-27", "2026-08-10"],
  ["obligations", 8, "Sujet 8 — transversal (plateforme)", null, "2026-08-16"],
  ["civil", 1, "Sujet 1 — Couple hors mariage, formation du mariage", "T1 pp. 9-50", "2026-06-30"],
  ["civil", 2, "Sujet 2 — Vie du couple, désunion, divorce", "T1 pp. 51-97", "2026-07-07"],
  ["civil", 3, "Sujet 3 — Effets du divorce, l'enfant", "T1 pp. 98-183", "2026-07-14"],
  ["civil", 4, "Sujet 4 — Qualification, vente, entreprise, prêt, mandat", "T2 pp. 7-92", "2026-07-21"],
  ["civil", 5, "Sujet 5 — Bail, cautionnement, garanties, gage, nantissement", "T2 + T3", "2026-07-28"],
  ["civil", 6, "Sujet 6 — Privilèges, sûretés immo ; intro biens, propriété", "T3 + T4", "2026-08-04"],
  ["civil", 7, "Sujet 7 — Protection propriété, collective, démembrements", "T4 pp. 61-117", "2026-08-11"],
  ["civil", 8, "Sujet 8 — transversal (plateforme)", null, "2026-08-16"],
  ["procedure", 1, "Sujet 1 — Action en justice", "pp. 11-24", "2026-06-29"],
  ["procedure", 2, "Sujet 2 — Moyens de défense, compétence", "pp. 24-44", "2026-07-06"],
  ["procedure", 3, "Sujet 3 — Procédure devant le TJ", "pp. 71-81", "2026-07-13"],
  ["procedure", 4, "Sujet 4 — Référé, requête, mesures d'instruction", "pp. 83-86 + 67-70", "2026-07-20"],
  ["procedure", 5, "Sujet 5 — Qualification du jugement, exécution provisoire", "pp. 87-98", "2026-07-27"],
  ["procedure", 6, "Sujet 6 — L'appel", "pp. 103-114", "2026-08-03"],
  ["procedure", 7, "Sujet 7 — Voies d'exécution", null, "2026-08-10"],
  ["procedure", 8, "Sujet 8 — transversal (plateforme)", null, "2026-08-16"],
] as const;

export async function ensureUserProgram(supabase: DbClient, userId: string) {
  // Le schéma est volontairement user-scoped (user_id + RLS). On ne crée pas
  // un nouveau programme : on instancie le même référentiel pour ce compte.
  const { data: existingSubjects, error: existingError } = await supabase
    .from("subjects")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (existingError) throw existingError;
  if (existingSubjects.length > 0) return;

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .insert(SUBJECTS.map((subject) => ({ ...subject, user_id: userId })))
    .select("id, slug");

  if (subjectsError) throw subjectsError;

  const subjectIdBySlug = new Map(subjects.map((subject) => [subject.slug, subject.id]));

  const { error: chaptersError } = await supabase.from("chapters").insert(
    CHAPTERS.map(([slug, name, pdfRef, weight, programWeek, sortOrder]) => ({
      user_id: userId,
      subject_id: subjectIdBySlug.get(slug)!,
      name,
      pdf_ref: pdfRef,
      weight,
      program_week: programWeek,
      sort_order: sortOrder,
    })),
  );

  if (chaptersError) throw chaptersError;

  const { error: assignmentsError } = await supabase.from("assignments").insert(
    ASSIGNMENTS.map(([slug, weekNumber, title, pages, dueDate]) => ({
      user_id: userId,
      subject_id: subjectIdBySlug.get(slug)!,
      week_number: weekNumber,
      title,
      pages,
      due_date: dueDate,
    })),
  );

  if (assignmentsError) throw assignmentsError;
}
