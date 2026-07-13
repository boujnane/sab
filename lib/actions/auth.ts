"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProgram } from "@/lib/user-program";

export async function sendLoginCode(
  _prev: { error?: string; sent?: boolean; email?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Adresse email requise." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  if (admin) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (
      createError &&
      !createError.message.toLowerCase().includes("already registered") &&
      !createError.message.toLowerCase().includes("already been registered") &&
      !createError.message.toLowerCase().includes("already exists")
    ) {
      console.error(
        "createUserForOtp:",
        createError.code ?? createError.status,
        createError.message,
      );
      return {
        error: `Création utilisateur refusée par Supabase : ${createError.message}`,
      };
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: !admin },
  });

  if (error) {
    console.error("sendLoginCode:", error.code ?? error.status, error.message);
    if (error.code === "over_email_send_rate_limit") {
      return {
        error: "Trop de codes demandés. Attends une minute avant de réessayer.",
      };
    }
    return { error: `Envoi du code refusé par Supabase : ${error.message}` };
  }

  return { sent: true, email };
}

export async function verifyCode(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !code) {
    return { error: "Code requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) {
    console.error("verifyCode:", error.code ?? error.status, error.message);
    return { error: "Code invalide ou expiré. Réessaie." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Session non créée. Réessaie." };

  try {
    await ensureUserProgram(createAdminClient() ?? supabase, user.id);
  } catch (seedError) {
    console.error("ensureUserProgram:", seedError);
    return {
      error:
        "Connexion réussie, mais le programme n'a pas été initialisé. Vérifie la migration Supabase 002 et SUPABASE_SERVICE_ROLE_KEY sur Vercel.",
    };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
