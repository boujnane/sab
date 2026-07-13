import { daysUntil } from "@/lib/progress";
import type { ExamVM } from "@/components/countdown-hero";

/**
 * Rail mono des quatre épreuves. Vit sous le hero sur mobile, dans la
 * sidebar sticky sur desktop - même composant aux deux endroits.
 */
export function ExamRail({
  exams,
  todayIso,
}: {
  exams: ExamVM[];
  todayIso: string;
}) {
  return (
    <ul className="grid gap-1 font-mono text-xs">
      {exams.map((e) => {
        const days = daysUntil(todayIso, e.examDateIso);
        const [, m, day] = e.examDateIso.split("-");
        return (
          <li key={e.slug} className="flex justify-between gap-3">
            <span className="text-plum-700">
              {day}.{m} {e.shortName}
            </span>
            <span className="text-plum-950">
              {days >= 0 ? `J−${days}` : "passée"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
