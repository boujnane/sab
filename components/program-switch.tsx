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
    <nav
      aria-label="Programme"
      className="min-w-0 overflow-hidden border-t-2 border-plum-700 pt-2.5"
    >
      <h2 className="mb-2 font-mono text-xs text-plum-700">programme</h2>
      <div className="-mx-1 flex max-w-full snap-x gap-1 overflow-x-auto px-1 pb-1 text-xs [scrollbar-width:none] sm:mx-0 sm:inline-flex sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
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
                "min-h-10 min-w-[6.75rem] snap-start rounded-[var(--radius)] border px-3 py-2 text-center font-mono transition-colors duration-150 sm:min-w-0",
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
