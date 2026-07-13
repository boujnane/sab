"use server";

import { revalidatePath } from "next/cache";

import type { ChapterStatus } from "@/lib/progress";
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

  const { error: updateError } = await supabase
    .from("chapters")
    .update({ status: to })
    .eq("id", chapterId);
  if (updateError)
    return { ok: false, error: "La modification n'a pas été enregistrée. Réessaie." };

  await supabase.from("status_events").insert({
    user_id: user.id,
    chapter_id: chapterId,
    from_status: from,
    to_status: to,
  });

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

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, subject_id, sort_order")
    .eq("id", chapterId)
    .single();
  if (!chapter) return { ok: false, error: "Chapitre introuvable." };

  const { data: siblings } = await supabase
    .from("chapters")
    .select("id, sort_order")
    .eq("subject_id", chapter.subject_id)
    .order("sort_order");
  if (!siblings)
    return { ok: false, error: "La modification n'a pas été enregistrée. Réessaie." };

  const idx = siblings.findIndex((c) => c.id === chapterId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return { ok: true };

  const other = siblings[swapIdx];
  await Promise.all([
    supabase
      .from("chapters")
      .update({ sort_order: other.sort_order })
      .eq("id", chapter.id),
    supabase
      .from("chapters")
      .update({ sort_order: chapter.sort_order })
      .eq("id", other.id),
  ]);

  revalidatePath("/timeline");
  revalidatePath("/matieres/[slug]", "page");
  return { ok: true };
}
