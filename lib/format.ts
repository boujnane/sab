/** Date du jour au format ISO (YYYY-MM-DD), fuseau serveur. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Formate une date ISO en français court, ex. "mar. 1 sept." */
export function formatDateShort(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Formate une date ISO en français long, ex. "mardi 1 septembre 2026" */
export function formatDateLong(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Formate une date ISO courte pour un axe, ex. "13 juil." */
export function formatDateAxis(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Jour UTC entier depuis l'époque, pour une date ISO `YYYY-MM-DD`. */
export function isoToDayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Inverse de `isoToDayNumber`. */
export function dayNumberToIso(dayNumber: number): string {
  return new Date(dayNumber * 86_400_000).toISOString().slice(0, 10);
}

/** Liste des dates ISO entre `fromIso` et `toIso` inclus. */
export function isoDateRange(fromIso: string, toIso: string): string[] {
  const from = isoToDayNumber(fromIso);
  const to = isoToDayNumber(toIso);
  const days: string[] = [];
  for (let d = from; d <= to; d++) days.push(dayNumberToIso(d));
  return days;
}
