"use client";

import { usePathname, useRouter } from "next/navigation";

import LineSidebar from "@/components/LineSidebar";

const NAV_ITEMS = [
  { label: "cockpit", href: "/" },
  { label: "quiz", href: "/quiz" },
  { label: "timeline", href: "/timeline" },
  { label: "synthèse", href: "/synthese" },
];

const ADMIN_ITEM = { label: "admin", href: "/admin" };

function activeIndex(pathname: string, items: { href: string }[]) {
  const index = items.findIndex(
    (item) => item.href !== "/" && pathname.startsWith(item.href),
  );
  return index === -1 ? 0 : index;
}

export function AppLineSidebar({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = showAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <LineSidebar
      items={items.map((item) => item.label)}
      accentColor="var(--color-petale-500)"
      textColor="var(--color-plum-700)"
      markerColor="var(--color-plum-200)"
      showIndex
      showMarker
      proximityRadius={86}
      maxShift={18}
      falloff="smooth"
      markerLength={36}
      markerGap={12}
      tickScale={0.45}
      scaleTick
      itemGap={18}
      fontSize={0.95}
      smoothing={120}
      defaultActive={activeIndex(pathname, items)}
      onItemClick={(index) => router.push(items[index].href)}
    />
  );
}
