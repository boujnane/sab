"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";

type ActionError = { ok: false; error: string };

export async function createSupportUpload(
  targetUserId: string,
): Promise<{ ok: true; path: string; token: string } | ActionError> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const path = `${targetUserId}/${randomUUID()}.pdf`;
  const { data, error } = await guard.admin.storage
    .from("supports")
    .createSignedUploadUrl(path);
  if (error) {
    console.error("createSupportUpload:", error.message);
    return { ok: false, error: `Upload refusé : ${error.message}` };
  }
  return { ok: true, path, token: data.token };
}

export async function registerDocument(input: {
  targetUserId: string;
  subjectId: string;
  chapterId: string | null;
  storagePath: string;
  filename: string;
}): Promise<{ ok: true } | ActionError> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const { error } = await guard.admin.from("documents").insert({
    user_id: input.targetUserId,
    subject_id: input.subjectId,
    chapter_id: input.chapterId,
    storage_path: input.storagePath,
    filename: input.filename,
  });
  if (error) {
    console.error("registerDocument:", error.code, error.message);
    return { ok: false, error: `Document non enregistré : ${error.message}` };
  }

  revalidatePath("/admin/quiz");
  return { ok: true };
}

export async function deleteDocument(
  documentId: string,
): Promise<{ ok: true } | ActionError> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const { data: doc, error: readError } = await guard.admin
    .from("documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .single();
  if (readError || !doc)
    return { ok: false, error: "Document introuvable." };

  const { error: storageError } = await guard.admin.storage
    .from("supports")
    .remove([doc.storage_path]);
  if (storageError)
    console.error("deleteDocument storage:", storageError.message);

  const { error } = await guard.admin
    .from("documents")
    .delete()
    .eq("id", documentId);
  if (error) {
    console.error("deleteDocument:", error.code, error.message);
    return { ok: false, error: `Suppression refusée : ${error.message}` };
  }

  revalidatePath("/admin/quiz");
  return { ok: true };
}
