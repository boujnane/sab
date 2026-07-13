"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProgram } from "@/lib/user-program";

function stringifyErrorValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function supabaseErrorDetails(error: unknown): string {
  if (!error || typeof error !== "object") return stringifyErrorValue(error);

  const record = error as Record<string, unknown>;
  const parts = [
    ["name", record.name],
    ["status", record.status],
    ["code", record.code],
    ["message", record.message],
    ["cause", record.cause],
  ]
    .map(([label, value]) => {
      const text = stringifyErrorValue(value);
      return text ? `${label}=${text}` : "";
    })
    .filter(Boolean);

  if (parts.length > 0) return parts.join(" ");

  try {
    return JSON.stringify(error, Object.getOwnPropertyNames(error));
  } catch {
    return String(error);
  }
}

function isExistingUserError(error: { message?: string } | null): boolean {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists")
  );
}

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

    if (createError && !isExistingUserError(createError)) {
      const details = supabaseErrorDetails(createError);
      console.error("createUserForOtp:", details);
      return {
        error: `Création utilisateur refusée par Supabase : ${details}`,
      };
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    const details = supabaseErrorDetails(error);
    console.error("sendLoginCode:", details);
    if (error.code === "over_email_send_rate_limit") {
      return {
        error: "Trop de codes demandés. Attends une minute avant de réessayer.",
      };
    }
    return { error: `Envoi du code refusé par Supabase : ${details}` };
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
