"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(
  _prev: { error?: string; sent?: boolean; email?: string } | undefined,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Adresse email requise." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error("sendMagicLink:", error.code ?? error.status, error.message);
    if (error.code === "over_email_send_rate_limit") {
      return {
        error: "Trop de codes demandés. Attends une minute avant de réessayer.",
      };
    }
    return { error: "La modification n'a pas été enregistrée. Réessaie." };
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

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
