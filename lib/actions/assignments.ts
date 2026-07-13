"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function setAssignmentDone(
  assignmentId: string,
  done: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const { error } = await supabase
    .from("assignments")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", assignmentId);
  if (error)
    return { ok: false, error: "La modification n'a pas été enregistrée. Réessaie." };

  revalidatePath("/");
  revalidatePath("/timeline");
  return { ok: true };
}
