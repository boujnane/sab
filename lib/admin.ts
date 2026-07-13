/** Comptes autorisés à voir la vue admin multi-utilisateurs. */
const ADMIN_EMAILS = new Set(["ady.boujnane@gmail.com"]);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.trim().toLowerCase());
}
