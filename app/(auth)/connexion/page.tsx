"use client";

import { useState, useTransition } from "react";

import { sendLoginCode, verifyCode } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConnexionPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitEmail(formData: FormData) {
    setError(null);
    const value = String(formData.get("email") ?? "").trim();
    startTransition(async () => {
      const result = await sendLoginCode(undefined, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEmail(value);
      }
    });
  }

  function submitCode(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await verifyCode(undefined, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <h1 className="font-display text-2xl italic text-plum-950">
          Beranis
        </h1>
        <p className="mt-2 text-xs text-plum-700">
          Cockpit de révision CRFPA. Connexion par code envoyé par email.
        </p>

        {email ? (
          <form action={submitCode} className="mt-8 flex flex-col gap-3">
            <input type="hidden" name="email" value={email} />
            <p className="text-xs text-plum-700">
              Code envoyé à {email}. Vérifie aussi tes spams.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Code à 6 chiffres</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-petale-600">{error}</p>}
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? "Vérification…" : "Se connecter"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setEmail(null);
                setError(null);
              }}
              className="text-xs text-plum-700 hover:text-plum-950"
            >
              Changer d&apos;email
            </button>
          </form>
        ) : (
          <form action={submitEmail} className="mt-8 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="toi@exemple.fr"
                autoComplete="email"
                required
              />
            </div>
            {error && <p className="text-xs text-petale-600">{error}</p>}
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? "Envoi…" : "Recevoir le code"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
