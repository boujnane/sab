"use client";

import { usePathname, useRouter } from "next/navigation";

import LineSidebar from "@/components/LineSidebar";

const NAV_ITEMS = [
  { label: "cockpit", href: "/" },
  { label: "timeline", href: "/timeline" },
  { label: "synthèse", href: "/synthese" },
];

function activeIndex(pathname: string) {
  if (pathname.startsWith("/timeline")) return 1;
  if (pathname.startsWith("/synthese")) return 2;
  return 0;
}

export function AppLineSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <LineSidebar
      items={NAV_ITEMS.map((item) => item.label)}
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
      defaultActive={activeIndex(pathname)}
      onItemClick={(index) => router.push(NAV_ITEMS[index].href)}
    />
  );
}
