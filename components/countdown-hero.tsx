import { daysUntil } from "@/lib/progress";
import { ExamRail } from "@/components/exam-rail";

export interface ExamVM {
  slug: string;
  shortName: string; // "synthèse", "obligations", "civil (spé)", "procédure"
  fullLabel: string; // "la note de synthèse · mar. 1 sept. · 5h"
  examDateIso: string;
}

interface Props {
  exams: ExamVM[]; // triées par date
  todayIso: string;
  /** true = le rail vit dans la sidebar desktop ; il ne s'affiche ici que sur mobile. */
  railInSidebar?: boolean;
}

/**
 * Hero du dashboard : le countdown de la prochaine épreuve en Instrument
 * Serif italique, adossé au rail mono des quatre épreuves. La densité du
 * rail équilibre la respiration du chiffre - ne pas les séparer.
 */
export function CountdownHero({ exams, todayIso, railInSidebar }: Props) {
  const next =
    exams.find((e) => daysUntil(todayIso, e.examDateIso) >= 0) ?? exams[0];
  const d = daysUntil(todayIso, next.examDateIso);

  return (
    <div className="grid items-end gap-4 sm:grid-cols-[1fr_240px] sm:gap-5">
      <div>
        <p className="font-display text-[clamp(3.25rem,20vw,4.25rem)] italic leading-none text-plum-950 sm:text-3xl">
          J−{d}
        </p>
        <p className="mt-1.5 text-xs text-plum-700">avant {next.fullLabel}</p>
      </div>

      <div className={railInSidebar ? "lg:hidden" : undefined}>
        <ExamRail exams={exams} todayIso={todayIso} />
      </div>
    </div>
  );
}
