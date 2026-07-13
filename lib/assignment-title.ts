export function cleanAssignmentTitle(title: string): string {
  return title
    .replace(/^Sujet\s+\d+\s+[--]\s+/, "")
    .replace(/\s+[--]\s+/g, " ");
}
