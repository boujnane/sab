import Link from "next/link";
import { redirect } from "next/navigation";

import { DocumentRow } from "@/components/admin/document-row";
import { SupportUpload } from "@/components/admin/support-upload";
import { isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
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
        <h1 className="font-display text-xl italic text-plum-950">
          Quiz - supports
        </h1>
        <p className="mt-4 text-sm text-plum-700">
          SUPABASE_SERVICE_ROLE_KEY manquante.
        </p>
      </main>
    );
  }

  const { user: requestedUser } = await searchParams;
  const usersResult = await admin.auth.admin.listUsers({ perPage: 500 });
  const accounts = usersResult.data?.users ?? [];
  const target =
    accounts.find((a) => a.id === requestedUser) ??
    accounts.find((a) => !isAdminEmail(a.email)) ??
    accounts[0];

  if (!target) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8">
        <h1 className="font-display text-xl italic text-plum-950">
          Quiz - supports
        </h1>
        <p className="mt-4 text-sm text-plum-700">Aucun compte.</p>
      </main>
    );
  }

  const [subjectsResult, chaptersResult, documentsResult, questionsResult] =
    await Promise.all([
      admin
        .from("subjects")
        .select("id, name, sort_order, has_chapters")
        .eq("user_id", target.id)
        .order("sort_order"),
      admin
        .from("chapters")
        .select("id, subject_id, name, sort_order")
        .eq("user_id", target.id)
        .order("sort_order"),
      admin
        .from("documents")
        .select(
          "id, subject_id, chapter_id, filename, status, error_message, created_at",
        )
        .eq("user_id", target.id)
        .order("created_at", { ascending: false }),
      admin.from("questions").select("chapter_id").eq("user_id", target.id),
    ]);

  const subjects = (subjectsResult.data ?? []).filter((s) => s.has_chapters);
  const chapters = chaptersResult.data ?? [];
  const documents = documentsResult.data ?? [];

  const questionCountByChapter = new Map<string, number>();
  for (const q of questionsResult.data ?? []) {
    questionCountByChapter.set(
      q.chapter_id,
      (questionCountByChapter.get(q.chapter_id) ?? 0) + 1,
    );
  }
  const totalQuestions = questionsResult.data?.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-xl italic text-plum-950">
            Quiz - supports
          </h1>
          <p className="mt-1 font-mono text-xs text-plum-700">
            {target.email} · {totalQuestions} question
            {totalQuestions > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin" className="font-mono text-xs text-plum-700 underline">
          ← comptes
        </Link>
      </div>

      {accounts.length > 1 && (
        <nav className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={`/admin/quiz?user=${a.id}`}
              className={
                a.id === target.id
                  ? "text-plum-950 underline"
                  : "text-plum-700 hover:underline"
              }
            >
              {a.email}
            </Link>
          ))}
        </nav>
      )}

      <section className="mt-8 border-t-2 border-plum-700 pt-2.5">
        <h2 className="text-sm font-medium text-plum-950">Ajouter un support</h2>
        <div className="mt-3">
          <SupportUpload
            targetUserId={target.id}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            chapters={chapters.map((c) => ({
              id: c.id,
              name: c.name,
              subjectId: c.subject_id,
            }))}
          />
        </div>
      </section>

      {subjects.map((subject) => {
        const subjectDocs = documents.filter(
          (d) => d.subject_id === subject.id,
        );
        const subjectChapters = chapters.filter(
          (c) => c.subject_id === subject.id,
        );
        if (subjectDocs.length === 0 && subjectChapters.length === 0)
          return null;
        return (
          <section
            key={subject.id}
            className="mt-8 border-t-2 border-plum-700 pt-2.5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-plum-950">
                {subject.name}
              </h2>
              <span className="font-mono text-xs text-plum-700">
                {subjectChapters.reduce(
                  (sum, c) => sum + (questionCountByChapter.get(c.id) ?? 0),
                  0,
                )}{" "}
                q.
              </span>
            </div>
            {subjectDocs.length === 0 ? (
              <p className="mt-2 text-xs text-plum-700">Aucun support.</p>
            ) : (
              <ul className="mt-1 divide-y divide-plum-200">
                {subjectDocs.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    documentId={doc.id}
                    filename={doc.filename}
                    status={doc.status}
                    errorMessage={doc.error_message}
                    defaultChapterId={doc.chapter_id}
                    chapters={subjectChapters.map((c) => ({
                      id: c.id,
                      name: c.name,
                      questionCount: questionCountByChapter.get(c.id) ?? 0,
                    }))}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
