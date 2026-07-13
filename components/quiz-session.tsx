"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  answerQuestion,
  finishQuizSession,
  flagQuestion,
  startQuizSession,
} from "@/lib/actions/quiz";
import {
  miniCasRating,
  qcmRating,
  type MiniCasPayload,
  type OuvertePayload,
  type QcmPayload,
} from "@/lib/quiz-schema";
import { RATING_LABEL, type Rating } from "@/lib/srs";
import { cn } from "@/lib/utils";

export type SessionQuestion = { id: string; subjectName: string } & (
  | { qtype: "qcm"; payload: QcmPayload }
  | { qtype: "ouverte"; payload: OuvertePayload }
  | { qtype: "mini_cas"; payload: MiniCasPayload }
);

interface QuestionResult {
  rating: Rating;
  subjectName: string;
}

const ETAPE_LABEL: Record<string, string> = {
  qualification: "qualification",
  fondement: "fondement",
  conclusion: "conclusion",
};

/** Série de bonnes réponses, dans le langage des barres de maturité. */
function ComboMeter({ streak }: { streak: number }) {
  const filled = Math.min(streak, 5);
  return (
    <span
      className="flex items-center gap-1"
      aria-label={`série de ${streak} bonne${streak > 1 ? "s" : ""} réponse${streak > 1 ? "s" : ""}`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "h-3 w-1.5 rounded-full transition-all duration-300",
            i < filled ? "gradient-maturite" : "bg-plum-200",
          )}
        />
      ))}
      {streak > 5 && (
        <span className="ml-0.5 font-mono text-xs text-petale-600">
          ×{streak}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Briques partagées                                                    */
/* ------------------------------------------------------------------ */

function OptionRow({
  label,
  index,
  state,
  onSelect,
  disabled,
}: {
  label: string;
  index: number;
  state: "idle" | "correct" | "wrong" | "revealed" | "dimmed";
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex min-h-12 w-full touch-manipulation items-baseline gap-3 rounded-[var(--radius)] border px-4 py-3 text-left text-sm transition-all duration-150",
        state === "idle" &&
          "border-plum-200 bg-[var(--surface)] text-plum-950 hover:border-plum-400 active:scale-[0.99]",
        state === "correct" &&
          "quiz-pop border-sauge-500 bg-sauge-50 text-sauge-800",
        state === "wrong" && "border-petale-500 bg-petale-50 text-petale-800",
        state === "revealed" &&
          "border-sauge-300 bg-[var(--surface)] text-sauge-700",
        state === "dimmed" &&
          "border-plum-100 bg-[var(--surface)] text-plum-400",
      )}
    >
      <span className="font-mono text-xs" aria-hidden>
        {index + 1}
      </span>
      <span>{label}</span>
    </button>
  );
}

function ContinueBar({
  correct,
  explication,
  onContinue,
  onFlag,
  label = "Continuer",
}: {
  correct: boolean;
  explication?: string;
  onContinue: () => void;
  onFlag?: () => void;
  label?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        onContinue();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  return (
    <div className="quiz-enter mt-4 flex flex-col gap-3">
      <div
        className={cn(
          "rounded-[var(--radius)] px-4 py-3",
          correct ? "bg-sauge-100" : "bg-petale-100",
        )}
      >
        <p
          className={cn(
            "font-mono text-xs",
            correct ? "text-sauge-800" : "text-petale-800",
          )}
        >
          {correct ? "juste" : "raté"}
        </p>
        {explication && (
          <p className="mt-1 text-sm text-plum-950">{explication}</p>
        )}
      </div>
      {/* Mobile : reste accessible au-dessus de la nav basse sans scroller */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-10 -mx-1 flex items-center gap-2 rounded-[var(--radius)] bg-[var(--bg)]/95 p-1 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <button
          type="button"
          onClick={onContinue}
          className={cn(
            "h-12 flex-1 touch-manipulation rounded-[var(--radius)] text-sm font-medium text-white transition-colors duration-150 md:h-11",
            correct
              ? "bg-sauge-600 hover:bg-sauge-700"
              : "bg-petale-600 hover:bg-petale-700",
          )}
        >
          {label}
        </button>
        {onFlag && (
          <button
            type="button"
            onClick={onFlag}
            className="h-12 touch-manipulation rounded-[var(--radius)] px-3 font-mono text-xs text-plum-700 hover:bg-plum-100 md:h-11"
          >
            signaler
          </button>
        )}
      </div>
    </div>
  );
}

/** Sélection au clavier : touches 1..n quand la question est active. */
function useNumberKeys(count: number, active: boolean, onPick: (i: number) => void) {
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (n >= 1 && n <= count) onPick(n - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, active, onPick]);
}

/* ------------------------------------------------------------------ */
/* QCM                                                                  */
/* ------------------------------------------------------------------ */

function QcmView({
  payload,
  onComplete,
  onFlag,
}: {
  payload: QcmPayload;
  onComplete: (rating: Rating) => void;
  onFlag: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  useNumberKeys(4, selected === null, setSelected);
  const correct = selected === payload.correct;

  return (
    <div className="quiz-enter">
      <p className="text-md text-plum-950">{payload.question}</p>
      <div className="mt-4 flex flex-col gap-2">
        {payload.options.map((option, i) => (
          <OptionRow
            key={i}
            label={option}
            index={i}
            disabled={selected !== null}
            onSelect={() => setSelected(i)}
            state={
              selected === null
                ? "idle"
                : i === payload.correct
                  ? i === selected
                    ? "correct"
                    : "revealed"
                  : i === selected
                    ? "wrong"
                    : "dimmed"
            }
          />
        ))}
      </div>
      {selected !== null && (
        <ContinueBar
          correct={correct}
          explication={payload.explication}
          onContinue={() => onComplete(qcmRating(correct))}
          onFlag={onFlag}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Question ouverte (auto-évaluation)                                   */
/* ------------------------------------------------------------------ */

const RATING_STYLE: Record<Rating, string> = {
  1: "border-petale-500 text-petale-700 hover:bg-petale-50",
  2: "border-plum-400 text-plum-700 hover:bg-plum-100",
  3: "border-sauge-300 text-sauge-700 hover:bg-sauge-50",
  4: "border-sauge-500 text-sauge-800 hover:bg-sauge-100",
};

function OuverteView({
  payload,
  onComplete,
  onFlag,
}: {
  payload: OuvertePayload;
  onComplete: (rating: Rating) => void;
  onFlag: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        setRevealed(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed]);

  return (
    <div className="quiz-enter">
      <p className="text-md text-plum-950">{payload.question}</p>
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-5 h-12 w-full touch-manipulation rounded-[var(--radius)] bg-petale-500 text-sm font-medium text-white transition-colors duration-150 hover:bg-petale-600 md:h-11"
        >
          Voir la réponse
        </button>
      ) : (
        <div className="quiz-enter mt-4 flex flex-col gap-3">
          <div className="rounded-[var(--radius)] border-l-2 border-ciel-500 bg-ciel-50 px-4 py-3">
            <p className="font-mono text-xs text-ciel-700">réponse attendue</p>
            <p className="mt-1 text-sm text-plum-950">
              {payload.reponse_attendue}
            </p>
          </div>
          <p className="font-mono text-xs text-plum-700">
            tu l&apos;avais ?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onComplete(r)}
                className={cn(
                  "h-11 rounded-[var(--radius)] border bg-[var(--surface)] font-mono text-xs transition-colors duration-150",
                  RATING_STYLE[r],
                )}
              >
                {RATING_LABEL[r]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onFlag}
            className="self-end font-mono text-xs text-plum-700 hover:underline"
          >
            signaler
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mini-cas : le syllogisme qui se construit                            */
/* ------------------------------------------------------------------ */

function MiniCasView({
  payload,
  onComplete,
  onFlag,
}: {
  payload: MiniCasPayload;
  onComplete: (rating: Rating) => void;
  onFlag: () => void;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongSteps, setWrongSteps] = useState(0);

  const etape = payload.etapes[step];
  const isLast = step === payload.etapes.length - 1;
  const correct = selected === etape.correct;

  useNumberKeys(4, selected === null, setSelected);

  function continueStep() {
    const nextWrong = wrongSteps + (correct ? 0 : 1);
    if (isLast) {
      onComplete(miniCasRating(nextWrong));
    } else {
      setWrongSteps(nextWrong);
      setSelected(null);
      setStep(step + 1);
    }
  }

  return (
    <div className="quiz-enter">
      <div className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-hairline)]">
        <p className="font-mono text-xs text-plum-700">cas pratique</p>
        <p className="mt-1 text-sm leading-relaxed text-plum-950">
          {payload.scenario}
        </p>
      </div>

      {/* Syllogisme déjà construit : les étapes validées s'empilent */}
      {step > 0 && (
        <ol className="mt-3 flex flex-col gap-1.5">
          {payload.etapes.slice(0, step).map((done, i) => (
            <li
              key={i}
              className="flex items-baseline gap-2 border-l-2 border-sauge-300 pl-3"
            >
              <span className="font-mono text-xs text-plum-700">
                {ETAPE_LABEL[done.type]}
              </span>
              <span className="text-xs text-plum-950">
                {done.options[done.correct]}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="quiz-enter mt-5" key={step}>
        <p className="font-mono text-xs text-petale-600">
          {ETAPE_LABEL[etape.type]} · {step + 1}/{payload.etapes.length}
        </p>
        <p className="mt-1 text-md text-plum-950">{etape.question}</p>
        <div className="mt-3 flex flex-col gap-2">
          {etape.options.map((option, i) => (
            <OptionRow
              key={i}
              label={option}
              index={i}
              disabled={selected !== null}
              onSelect={() => setSelected(i)}
              state={
                selected === null
                  ? "idle"
                  : i === etape.correct
                    ? i === selected
                      ? "correct"
                      : "revealed"
                    : i === selected
                      ? "wrong"
                      : "dimmed"
              }
            />
          ))}
        </div>
        {selected !== null && (
          <ContinueBar
            correct={correct}
            explication={etape.explication}
            onContinue={continueStep}
            onFlag={onFlag}
            label={isLast ? "Conclure" : "Étape suivante"}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Session                                                              */
/* ------------------------------------------------------------------ */

export function QuizSession({
  questions,
  dueCount,
  preview = false,
  title = "Session du jour",
}: {
  questions: SessionQuestion[];
  dueCount: number;
  /** Aperçu admin : questions réelles, aucune réponse enregistrée. */
  preview?: boolean;
  title?: string;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [, startTransition] = useTransition();
  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (preview) return;
    startTransition(async () => {
      const result = await startQuizSession();
      if (result.ok) sessionIdRef.current = result.sessionId;
    });
  }, [preview]);

  const current = questions[index];
  const done = index >= questions.length;

  useEffect(() => {
    if (!done || finishedRef.current) return;
    finishedRef.current = true;
    const correct = results.filter((r) => r.rating >= 3).length;
    startTransition(async () => {
      if (sessionIdRef.current) {
        await finishQuizSession(
          sessionIdRef.current,
          results.length,
          correct,
        );
      }
    });
  }, [done, results]);

  function complete(rating: Rating) {
    const question = questions[index];
    setResults((prev) => [
      ...prev,
      { rating, subjectName: question.subjectName },
    ]);
    const nextStreak = rating >= 3 ? streak + 1 : 0;
    setStreak(nextStreak);
    setMaxStreak((m) => Math.max(m, nextStreak));
    setIndex(index + 1);
    if (preview) return;
    startTransition(async () => {
      const result = await answerQuestion(
        question.id,
        rating,
        sessionIdRef.current,
      );
      if (!result.ok) toast.error(result.error);
    });
  }

  function flag() {
    const question = questions[index];
    startTransition(async () => {
      const result = await flagQuestion(question.id);
      if (result.ok) toast("Question signalée - elle ne reviendra plus.");
      else toast.error(result.error);
    });
    setIndex(index + 1);
  }

  if (done) {
    const correct = results.filter((r) => r.rating >= 3).length;
    const failed = results.filter((r) => r.rating === 1).length;
    const bySubject = new Map<string, { total: number; correct: number }>();
    for (const r of results) {
      const entry = bySubject.get(r.subjectName) ?? { total: 0, correct: 0 };
      entry.total += 1;
      if (r.rating >= 3) entry.correct += 1;
      bySubject.set(r.subjectName, entry);
    }

    const precision =
      results.length > 0 ? Math.round((correct / results.length) * 100) : 0;

    return (
      <div className="quiz-enter flex flex-col items-center pt-10 text-center">
        <p className="font-mono text-xs text-plum-700">
          {title} - terminé{preview ? " · aperçu admin" : ""}
        </p>
        <p className="mt-2 font-display text-3xl italic leading-none text-plum-950">
          {correct}/{results.length}
        </p>
        <div className="mt-4 flex items-center gap-6 font-mono text-xs text-plum-700">
          <span>{precision} % de précision</span>
          <span className="flex items-center gap-2">
            meilleure série <ComboMeter streak={maxStreak} />
          </span>
        </div>
        <dl className="mt-6 w-full max-w-xs">
          {[...bySubject.entries()].map(([subject, stats]) => (
            <div
              key={subject}
              className="flex items-center justify-between gap-3 border-t border-plum-200 py-2 text-xs"
            >
              <dt className="text-plum-950">{subject || "-"}</dt>
              <dd className="flex items-center gap-2 font-mono text-plum-700">
                <span
                  className="h-1 w-16 overflow-hidden rounded-full bg-plum-200"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full bg-sauge-500"
                    style={{
                      width: `${Math.round((stats.correct / stats.total) * 100)}%`,
                    }}
                  />
                </span>
                {stats.correct}/{stats.total}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-plum-700">
          {failed > 0
            ? `${failed} question${failed > 1 ? "s" : ""} ratée${failed > 1 ? "s" : ""} - elle${failed > 1 ? "s" : ""} reviendra${failed > 1 ? "ont" : ""} très vite.`
            : "Rien de raté - les intervalles s'allongent."}
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
          <Link
            href="/quiz"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] bg-petale-500 text-sm font-medium text-white transition-colors duration-150 hover:bg-petale-600"
          >
            Autre quiz
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] text-sm text-plum-700 transition-colors duration-150 hover:bg-plum-100"
          >
            Retour au cockpit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-[var(--bg)]/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Link
          href="/quiz"
          aria-label="Quitter la session"
          className="rounded-[var(--radius)] p-1.5 text-plum-700 transition-colors duration-150 hover:bg-plum-100"
        >
          <X size={16} strokeWidth={1.75} />
        </Link>
        <div className="flex flex-1 gap-1" aria-hidden>
          {questions.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i < index
                  ? "bg-petale-500"
                  : i === index
                    ? "bg-plum-400"
                    : "bg-plum-200",
              )}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-plum-700">
          {index + 1}/{questions.length}
        </span>
      </header>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-xs text-plum-700">
          {preview && <span className="text-ciel-600">aperçu admin · </span>}
          {title}
          {current.subjectName && current.subjectName !== title
            ? ` · ${current.subjectName}`
            : ""}
          {dueCount > 0 &&
            index === 0 &&
            ` · ${dueCount} en file`}
        </p>
        <ComboMeter streak={streak} />
      </div>

      <div className="mt-2" key={current.id}>
        {current.qtype === "qcm" && (
          <QcmView payload={current.payload} onComplete={complete} onFlag={flag} />
        )}
        {current.qtype === "ouverte" && (
          <OuverteView
            payload={current.payload}
            onComplete={complete}
            onFlag={flag}
          />
        )}
        {current.qtype === "mini_cas" && (
          <MiniCasView
            payload={current.payload}
            onComplete={complete}
            onFlag={flag}
          />
        )}
      </div>
    </div>
  );
}
