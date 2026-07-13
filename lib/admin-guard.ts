import { isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminGuard =
  | { ok: true; admin: NonNullable<ReturnType<typeof createAdminClient>> }
  | { ok: false; error: string };

/** Garde des actions réservées à l'admin : session + allowlist + service role. */
export async function requireAdmin(): Promise<AdminGuard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };
  if (!isAdminEmail(user.email))
    return { ok: false, error: "Réservé à l'admin." };
  const admin = createAdminClient();
  if (!admin)
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquante." };
  return { ok: true, admin };
}
