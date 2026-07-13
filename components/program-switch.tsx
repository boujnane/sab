import Link from "next/link";

import { cn } from "@/lib/utils";

export type ProgramFilter = "all" | "obligations" | "civil" | "procedure";

const PROGRAM_OPTIONS: Array<{
  value: ProgramFilter;
  label: string;
  short: string;
}> = [
  { value: "all", label: "tous les programmes", short: "tous" },
  { value: "obligations", label: "droit des obligations", short: "obligations" },
  { value: "civil", label: "droit civil", short: "civil" },
  { value: "procedure", label: "procédure civile", short: "procédure" },
];

export function parseProgramFilter(value: unknown): ProgramFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "obligations" || raw === "civil" || raw === "procedure") {
    return raw;
  }
  return "all";
}

export function ProgramSwitch({
  active,
  pathname = "/",
}: {
  active: ProgramFilter;
  pathname?: string;
}) {
  return (
    <nav aria-label="Programme" className="border-t-2 border-plum-700 pt-2.5">
      <h2 className="mb-2 font-mono text-xs text-plum-700">programme</h2>
      <div className="grid grid-cols-2 gap-1 text-xs sm:inline-grid sm:grid-cols-4">
        {PROGRAM_OPTIONS.map((option) => {
          const href =
            option.value === "all"
              ? pathname
              : `${pathname}?programme=${option.value}`;
          const selected = active === option.value;

          return (
            <Link
              key={option.value}
              href={href}
              aria-current={selected ? "page" : undefined}
              title={option.label}
              className={cn(
                "min-h-9 rounded-[var(--radius)] border px-2.5 py-2 text-center font-mono transition-colors duration-150",
                selected
                  ? "border-petale-500 bg-petale-50 text-petale-700"
                  : "border-plum-200 text-plum-700 hover:bg-plum-50 hover:text-plum-950",
              )}
            >
              {option.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
