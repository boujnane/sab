export interface QuizProgressStats {
  sevenDays: {
    sessions: number;
    answered: number;
    correct: number;
    accuracy: number | null;
  };
  srs: {
    seen: number;
    unseen: number;
    due: number;
    mastered: number;
    fragile: number;
  };
  recentSessions: {
    id: string;
    startedAt: string;
    answered: number;
    correct: number;
  }[];
  subjects: {
    id: string;
    name: string;
    total: number;
    due: number;
    attempts: number;
    correct: number;
    accuracy: number | null;
    mastered: number;
  }[];
}

function accuracyLabel(value: number | null): string {
  if (value === null) return "-";
  return `${value} %`;
}

function ratioPct(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}

export function QuizProgress({ stats }: { stats: QuizProgressStats }) {
  const hasActivity =
    stats.sevenDays.answered > 0 ||
    stats.recentSessions.length > 0 ||
    stats.srs.seen > 0;
  const srsTotal = stats.srs.seen + stats.srs.unseen;
  const activeSeen = Math.max(
    0,
    stats.srs.seen - stats.srs.mastered - stats.srs.fragile,
  );

  return (
    <section className="mt-8 border-t-2 border-plum-700 pt-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-xs text-plum-700">progression</h2>
        <p className="font-mono text-xs text-plum-700">7 derniers jours</p>
      </div>

      {!hasActivity ? (
        <p className="mt-3 text-sm text-plum-700">
          Aucun run enregistré pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-3 grid gap-6">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-3">
              <p className="font-mono text-xs text-plum-700">précision</p>
              <p className="mt-1 font-display text-lg italic text-plum-950">
                {accuracyLabel(stats.sevenDays.accuracy)}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-3">
              <p className="font-mono text-xs text-plum-700">réponses</p>
              <p className="mt-1 font-display text-lg italic text-plum-950">
                {stats.sevenDays.answered}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] p-3">
              <p className="font-mono text-xs text-plum-700">runs</p>
              <p className="mt-1 font-display text-lg italic text-plum-950">
                {stats.sevenDays.sessions}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-medium text-plum-950">
                Maturité des questions
              </h3>
              <p className="font-mono text-xs text-plum-700">
                {stats.srs.seen}/{srsTotal}
              </p>
            </div>
            <div
              className="mt-2 flex h-2 overflow-hidden rounded-full bg-plum-200"
              aria-hidden
            >
              <span
                className="bg-sauge-500"
                style={{ width: `${ratioPct(stats.srs.mastered, srsTotal)}%` }}
              />
              <span
                className="bg-petale-500"
                style={{ width: `${ratioPct(stats.srs.fragile, srsTotal)}%` }}
              />
              <span
                className="bg-plum-400"
                style={{ width: `${ratioPct(activeSeen, srsTotal)}%` }}
              />
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
              <div>
                <dt className="text-plum-700">maîtrisées</dt>
                <dd className="text-plum-950">{stats.srs.mastered}</dd>
              </div>
              <div>
                <dt className="text-plum-700">fragiles</dt>
                <dd className="text-plum-950">{stats.srs.fragile}</dd>
              </div>
              <div>
                <dt className="text-plum-700">à revoir</dt>
                <dd className="text-plum-950">{stats.srs.due}</dd>
              </div>
            </dl>
          </div>

          {stats.recentSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-plum-950">
                Derniers runs
              </h3>
              <ul className="mt-2 grid gap-2">
                {stats.recentSessions.map((session) => {
                  const pct = ratioPct(session.correct, session.answered);
                  return (
                    <li
                      key={session.id}
                      className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.75rem] items-center gap-3 text-xs"
                    >
                      <span className="font-mono text-plum-700">
                        {shortDate(session.startedAt)}
                      </span>
                      <span
                        className="h-1.5 overflow-hidden rounded-full bg-plum-200"
                        aria-hidden
                      >
                        <span
                          className="block h-full rounded-full bg-petale-500"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="text-right font-mono text-plum-950">
                        {session.correct}/{session.answered}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {stats.subjects.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-plum-950">Par matière</h3>
              <ul className="mt-1 border-l border-plum-200 pl-3">
                {stats.subjects.map((subject) => (
                  <li key={subject.id}>
                    <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <span className="min-w-0 truncate text-sm text-plum-950">
                        {subject.name}
                      </span>
                      <span className="whitespace-nowrap text-right font-mono text-xs text-plum-700">
                        {accuracyLabel(subject.accuracy)} · {subject.due} rev.
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
