"use client";

import Link from "next/link";
import { CalendarDays, Home, NotebookText } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "cockpit", href: "/", icon: Home },
  { label: "timeline", href: "/timeline", icon: CalendarDays },
  { label: "synthèse", href: "/synthese", icon: NotebookText },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-plum-200 bg-[color-mix(in_srgb,var(--bg)_92%,white)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-1px_2px_rgb(28_17_34_/_0.06)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-sm grid-cols-3 gap-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "grid min-h-12 place-items-center gap-0.5 rounded-[var(--radius)] px-2 py-1.5 text-[11px] transition-colors duration-150",
                  active
                    ? "bg-petale-50 text-petale-700"
                    : "text-plum-700 hover:bg-plum-100/70 hover:text-plum-950",
                )}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                <span className="font-mono">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
