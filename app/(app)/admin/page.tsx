import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin";
import { formatDateShort } from "@/lib/format";
import { subjectProgress, type ChapterStatus } from "@/lib/progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface UserRow {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  subjects: { slug: string; name: string; sortOrder: number; progress: number }[];
  globalProgress: number;
  annales: number;
}

function pct(value: number): string {
  return `${Math.round(value * 100)} %`;
}

function timestampToIso(timestamp: string | null | undefined): string | null {
  return timestamp ? timestamp.slice(0, 10) : null;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  if (!isAdminEmail(user.email)) redirect("/");

  const admin = createAdminClient();
  if (!admin) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8">
        <h1 className="font-display text-xl italic text-plum-950">Admin</h1>
        <p className="mt-4 text-sm text-plum-700">
          SUPABASE_SERVICE_ROLE_KEY manquante : impossible de lister les
          comptes.
        </p>
      </main>
    );
  }

  const [usersResult, subjectsResult, chaptersResult, logsResult] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 500 }),
      admin.from("subjects").select("id, user_id, slug, name, sort_order"),
      admin.from("chapters").select("user_id, subject_id, status, weight"),
      admin.from("synthesis_logs").select("user_id"),
    ]);

  if (usersResult.error) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8">
        <h1 className="font-display text-xl italic text-plum-950">Admin</h1>
        <p className="mt-4 text-sm text-plum-700">
          Lecture des comptes refusée par Supabase : {usersResult.error.message}
        </p>
      </main>
    );
  }

  const subjects = subjectsResult.data ?? [];
  const chapters = chaptersResult.data ?? [];
  const logs = logsResult.data ?? [];

  const chaptersBySubject = new Map<
    string,
    { status: ChapterStatus; weight: number }[]
  >();
  for (const chapter of chapters) {
    const list = chaptersBySubject.get(chapter.subject_id) ?? [];
    list.push({ status: chapter.status, weight: chapter.weight });
    chaptersBySubject.set(chapter.subject_id, list);
  }

  const annalesByUser = new Map<string, number>();
  for (const log of logs) {
    annalesByUser.set(log.user_id, (annalesByUser.get(log.user_id) ?? 0) + 1);
  }

  const rows: UserRow[] = usersResult.data.users
    .map((account) => {
      const ownSubjects = subjects
        .filter((s) => s.user_id === account.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const withProgress = ownSubjects
        .map((s) => {
          const subjectChapters = chaptersBySubject.get(s.id) ?? [];
          return {
            slug: s.slug,
            name: s.name,
            sortOrder: s.sort_order,
            chapters: subjectChapters,
            progress: subjectProgress(subjectChapters),
          };
        })
        .filter((s) => s.chapters.length > 0);

      const allChapters = withProgress.flatMap((s) => s.chapters);

      return {
        id: account.id,
        email: account.email ?? account.id,
        createdAt: timestampToIso(account.created_at),
        lastSignInAt: timestampToIso(account.last_sign_in_at),
        subjects: withProgress.map(({ slug, name, sortOrder, progress }) => ({
          slug,
          name,
          sortOrder,
          progress,
        })),
        globalProgress: subjectProgress(allChapters),
        annales: annalesByUser.get(account.id) ?? 0,
      };
    })
    .sort((a, b) => (b.lastSignInAt ?? "").localeCompare(a.lastSignInAt ?? ""));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-xl italic text-plum-950">Admin</h1>
          <p className="mt-1 font-mono text-xs text-plum-700">
            {rows.length} compte{rows.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/quiz"
          className="rounded-[var(--radius)] border border-plum-200 bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-plum-950 transition-colors duration-150 hover:bg-plum-100"
        >
          quiz - supports →
        </Link>
      </div>

      <ul className="mt-6 grid gap-6">
        {rows.map((row) => (
          <li key={row.id} className="border-t-2 border-plum-700 pt-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-base text-plum-950">
                {row.email}
                {row.id === user.id && (
                  <span className="ml-2 font-mono text-xs text-plum-700">
                    (toi)
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-plum-700">
                {row.lastSignInAt
                  ? `vu ${formatDateShort(row.lastSignInAt)}`
                  : "jamais connecté"}
                {row.createdAt && ` · inscrit ${formatDateShort(row.createdAt)}`}
              </span>
            </div>

            {row.subjects.length === 0 ? (
              <p className="mt-2 text-xs text-plum-700">
                Aucun programme initialisé.
              </p>
            ) : (
              <dl className="mt-2 grid gap-1 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-plum-950">avancement global</dt>
                  <dd className="font-mono text-plum-700">
                    {pct(row.globalProgress)}
                  </dd>
                </div>
                {row.subjects.map((subject) => (
                  <div key={subject.slug} className="flex justify-between gap-3">
                    <dt className="text-plum-950">{subject.name}</dt>
                    <dd className="font-mono text-plum-700">
                      {pct(subject.progress)}
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3">
                  <dt className="text-plum-950">annales de synthèse</dt>
                  <dd className="font-mono text-plum-700">{row.annales}</dd>
                </div>
              </dl>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
