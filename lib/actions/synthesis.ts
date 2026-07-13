"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

interface ActionState {
  error?: string;
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = value?.toString().trim();
  return text ? text : null;
}

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  const text = value?.toString();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isInteger(number) || number < 1) return null;
  return number;
}

export async function addSynthesisLog(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée. Reconnecte-toi." };

  const trainedOn = formData.get("trained_on")?.toString();
  const durationMin = parsePositiveInt(formData.get("duration_min"));
  const feeling = parsePositiveInt(formData.get("feeling"));

  if (!trainedOn || !/^\d{4}-\d{2}-\d{2}$/.test(trainedOn)) {
    return { error: "Indique une date valide." };
  }
  if (!durationMin) {
    return { error: "Indique une durée valide." };
  }
  if (feeling !== null && feeling > 10) {
    return { error: "Le ressenti doit être compris entre 1 et 10." };
  }

  const { error } = await supabase.from("synthesis_logs").insert({
    user_id: user.id,
    trained_on: trainedOn,
    duration_min: durationMin,
    annale_ref: optionalText(formData.get("annale_ref")),
    feeling,
    comment: optionalText(formData.get("comment")),
  });

  if (error) {
    return { error: "L'entraînement n'a pas été enregistré. Réessaie." };
  }

  revalidatePath("/");
  revalidatePath("/synthese");
  return {};
}
