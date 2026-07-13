"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import {
  generateChapterQuestions,
  uploadPdfToAnthropic,
} from "@/lib/quiz-generation";

export async function generateQuestions(
  documentId: string,
  chapterId: string,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const { admin } = guard;

  const [{ data: doc }, { data: chapter }] = await Promise.all([
    admin
      .from("documents")
      .select("id, user_id, subject_id, storage_path, filename, anthropic_file_id")
      .eq("id", documentId)
      .single(),
    admin
      .from("chapters")
      .select("id, user_id, name, pdf_ref, subject_id")
      .eq("id", chapterId)
      .single(),
  ]);
  if (!doc) return { ok: false, error: "Document introuvable." };
  if (!chapter || chapter.user_id !== doc.user_id)
    return { ok: false, error: "Chapitre introuvable pour ce compte." };

  const { data: subject } = await admin
    .from("subjects")
    .select("name")
    .eq("id", chapter.subject_id)
    .single();

  await admin
    .from("documents")
    .update({ status: "generating", error_message: null })
    .eq("id", doc.id);
  revalidatePath("/admin/quiz");

  try {
    let fileId = doc.anthropic_file_id;
    if (!fileId) {
      const { data: blob, error: downloadError } = await admin.storage
        .from("supports")
        .download(doc.storage_path);
      if (downloadError || !blob)
        throw new Error(
          `PDF illisible dans Storage : ${downloadError?.message ?? "vide"}`,
        );
      fileId = await uploadPdfToAnthropic(
        await blob.arrayBuffer(),
        doc.filename,
      );
      await admin
        .from("documents")
        .update({ anthropic_file_id: fileId })
        .eq("id", doc.id);
    }

    const questions = await generateChapterQuestions(fileId, {
      chapterName: chapter.name,
      pdfRef: chapter.pdf_ref,
      subjectName: subject?.name ?? "",
    });

    const { error: insertError } = await admin.from("questions").insert(
      questions.map((q) => ({
        user_id: doc.user_id,
        chapter_id: chapter.id,
        document_id: doc.id,
        qtype: q.qtype,
        payload: q.payload,
      })),
    );
    if (insertError)
      throw new Error(`Insertion refusée : ${insertError.message}`);

    await admin.from("documents").update({ status: "ready" }).eq("id", doc.id);
    revalidatePath("/admin/quiz");
    revalidatePath("/quiz");
    revalidatePath("/");
    return { ok: true, count: questions.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generateQuestions:", message);
    await admin
      .from("documents")
      .update({ status: "error", error_message: message.slice(0, 500) })
      .eq("id", doc.id);
    revalidatePath("/admin/quiz");
    return { ok: false, error: `Génération échouée : ${message}` };
  }
}
