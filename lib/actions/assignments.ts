"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
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

  const db = createAdminClient() ?? supabase;
  const { data, error } = await db
    .from("assignments")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", assignmentId)
    .eq("user_id", user.id)
    .select("id")
    .single();
  if (error) {
    console.error("setAssignmentDone:", error.code, error.message);
    return {
      ok: false,
      error: `Rendu non enregistré : ${error.message}`,
    };
  }

  if (!data) return { ok: false, error: "Rendu introuvable pour ce compte." };

  revalidatePath("/");
  revalidatePath("/timeline");
  return { ok: true };
}
