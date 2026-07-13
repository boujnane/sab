import { redirect } from "next/navigation";

import { SynthesisForm } from "@/components/synthesis-form";
import { formatDateShort } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function SynthesePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: logs } = await supabase
    .from("synthesis_logs")
    .select("*")
    .order("trained_on", { ascending: false });

  const entries = logs ?? [];
  const lastEntry = entries[0] ?? null;

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-7 px-6 py-8 md:grid-cols-[minmax(0,1fr)_340px] md:px-10 xl:px-12">
      <div className="grid content-start gap-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="font-display text-xl italic text-plum-950">
              Synthèse
            </h1>
            <p className="mt-1 font-mono text-xs text-plum-700">
              {entries.length} annale{entries.length > 1 ? "s" : ""}
            </p>
          </div>
          <SynthesisForm />
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-plum-700">
            Aucun entraînement pour l&apos;instant. La première annale est la
            plus dure à commencer.
          </p>
        ) : (
          <ul className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] shadow-[var(--shadow-hairline)]">
            {entries.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-1 border-b border-plum-200 px-4 py-3 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base text-plum-950">
                    {log.annale_ref || "Annale"}
                  </span>
                  <span className="font-mono text-xs text-plum-700">
                    {formatDateShort(log.trained_on)}
                  </span>
                </div>
                <p className="font-mono text-xs text-plum-700">
                  {log.duration_min} min
                  {log.feeling ? ` · ressenti ${log.feeling}/10` : ""}
                </p>
                {log.comment && (
                  <p className="text-xs text-plum-700">{log.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="grid min-w-0 content-start gap-5 overflow-hidden rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-4 text-xs shadow-[var(--shadow-hairline)] md:sticky md:top-8 md:self-start">
        <section className="min-w-0 border-t-2 border-plum-700 pt-2.5">
          <h2 className="mb-1.5 font-mono text-xs text-plum-700">journal</h2>
          <ul className="grid gap-1">
            <li className="flex justify-between gap-3">
              <span className="text-plum-950">annales faites</span>
              <span className="font-mono text-plum-700">{entries.length}</span>
            </li>
            {lastEntry && (
              <li className="flex justify-between gap-3">
                <span className="text-plum-950">dernière</span>
                <span className="font-mono text-plum-700">
                  {formatDateShort(lastEntry.trained_on)}
                </span>
              </li>
            )}
          </ul>
        </section>
      </aside>
    </main>
  );
}
