import Link from "next/link";

export interface MilestoneVM {
  id: string;
  title: string;
  dueDateIso: string;
  kind?: string;
}

export interface SynthesisVM {
  count: number;
  daysSinceLast: number | null;
  goal: string; // ex. "objectif : 5 avant le 16 août"
}

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

/**
 * Ancrage bas du dashboard : deux bandes à filet supérieur (pas de cards).
 * Ciel = informatif (échéances), plum = structurel (synthèse). Ce sont les
 * seules bordures épaisses (2px) de l'app.
 */
export function FooterBands({
  milestones,
  synthesis,
}: {
  milestones: MilestoneVM[];
  synthesis: SynthesisVM;
}) {
  return (
    <div className="grid gap-5 text-xs">
      <section
        aria-label="Prochaines échéances"
        className="min-w-0 border-t-2 border-[var(--info)] pt-2.5"
      >
        <h2 className="mb-1.5 font-mono text-xs text-[var(--info)]">
          prochaines échéances
        </h2>
        {milestones.length === 0 ? (
          <p className="text-plum-700">
            Aucune échéance à venir.
          </p>
        ) : (
          <ul className="grid gap-1">
            {milestones.slice(0, 3).map((m) => (
              <li key={m.id} className="grid gap-0.5">
                <div className="flex min-w-0 justify-between gap-3">
                  <span className="min-w-0 truncate text-plum-950">{m.title}</span>
                  <span className="font-mono text-plum-700">
                    {shortDate(m.dueDateIso)}
                  </span>
                </div>
                {m.kind && <span className="font-mono text-plum-700">{m.kind}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Note de synthèse"
        className="min-w-0 border-t-2 border-plum-700 pt-2.5"
      >
        <h2 className="mb-1.5 font-mono text-xs text-plum-700">
          <Link href="/synthese" className="hover:text-petale-600">
            note de synthèse
          </Link>
        </h2>
        {synthesis.count === 0 ? (
          <p className="text-plum-700">
            Aucun entraînement pour l&rsquo;instant. La première annale est la
            plus dure à commencer.
          </p>
        ) : (
          <>
            <p className="flex justify-between gap-3">
              <span className="text-plum-950">
                {synthesis.count} annale{synthesis.count > 1 ? "s" : ""} faite
                {synthesis.count > 1 ? "s" : ""}
              </span>
              {synthesis.daysSinceLast !== null && (
                <span className="font-mono text-plum-700">
                  dernière il y a {synthesis.daysSinceLast}&nbsp;j
                </span>
              )}
            </p>
            <p className="mt-0.5 text-plum-700">{synthesis.goal}</p>
          </>
        )}
      </section>
    </div>
  );
}
