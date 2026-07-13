"use server";

import { revalidatePath } from "next/cache";

import type { ChapterStatus } from "@/lib/progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function setChapterStatus(
  chapterId: string,
  from: ChapterStatus,
  to: ChapterStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const db = createAdminClient() ?? supabase;
  const { data: updatedChapter, error: updateError } = await db
    .from("chapters")
    .update({ status: to })
    .eq("id", chapterId)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (updateError) {
    console.error("setChapterStatus:update:", updateError.code, updateError.message);
    return {
      ok: false,
      error: `Statut non enregistré : ${updateError.message}`,
    };
  }

  if (!updatedChapter)
    return { ok: false, error: "Chapitre introuvable pour ce compte." };

  const { error: eventError } = await db.from("status_events").insert({
    user_id: user.id,
    chapter_id: chapterId,
    from_status: from,
    to_status: to,
  });
  if (eventError) {
    console.error("setChapterStatus:event:", eventError.code, eventError.message);
  }

  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/matieres/[slug]", "page");
  return { ok: true };
}

export async function reorderChapter(
  chapterId: string,
  direction: "up" | "down",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const db = createAdminClient() ?? supabase;
  const { data: chapter, error: chapterError } = await db
    .from("chapters")
    .select("id, subject_id, sort_order")
    .eq("id", chapterId)
    .eq("user_id", user.id)
    .single();
  if (chapterError) {
    console.error("reorderChapter:chapter:", chapterError.code, chapterError.message);
  }
  if (!chapter) return { ok: false, error: "Chapitre introuvable." };

  const { data: siblings, error: siblingsError } = await db
    .from("chapters")
    .select("id, sort_order")
    .eq("subject_id", chapter.subject_id)
    .eq("user_id", user.id)
    .order("sort_order");
  if (siblingsError) {
    console.error("reorderChapter:siblings:", siblingsError.code, siblingsError.message);
  }
  if (!siblings)
    return {
      ok: false,
      error: siblingsError
        ? `Ordre non chargé : ${siblingsError.message}`
        : "Ordre non chargé.",
    };

  const idx = siblings.findIndex((c) => c.id === chapterId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return { ok: true };

  const other = siblings[swapIdx];
  const [firstUpdate, secondUpdate] = await Promise.all([
    db
      .from("chapters")
      .update({ sort_order: other.sort_order })
      .eq("id", chapter.id)
      .eq("user_id", user.id),
    db
      .from("chapters")
      .update({ sort_order: chapter.sort_order })
      .eq("id", other.id)
      .eq("user_id", user.id),
  ]);

  const reorderError = firstUpdate.error ?? secondUpdate.error;
  if (reorderError) {
    console.error("reorderChapter:update:", reorderError.code, reorderError.message);
    return { ok: false, error: `Ordre non enregistré : ${reorderError.message}` };
  }

  revalidatePath("/timeline");
  revalidatePath("/matieres/[slug]", "page");
  return { ok: true };
}
