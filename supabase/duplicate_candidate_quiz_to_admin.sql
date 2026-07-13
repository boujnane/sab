-- Duplique les données quiz de la candidate vers le compte admin pour tester.
-- Cible : ady.boujnane@gmail.com
-- Source : compte dont l'email commence par sabrineboujnane@
-- Ne copie pas l'historique de réponses, les sessions, ni le SRS.

do $$
declare
  admin_email text := 'ady.boujnane@gmail.com';
  candidate_email_prefix text := 'sabrineboujnane@%';
  source_user uuid;
  target_user uuid;
begin
  select id into target_user
  from auth.users
  where lower(email) = lower(admin_email)
  limit 1;

  if target_user is null then
    raise exception 'Compte admin introuvable: %', admin_email;
  end if;

  select id into source_user
  from auth.users
  where lower(coalesce(email, '')) like lower(candidate_email_prefix)
  order by created_at asc
  limit 1;

  if source_user is null then
    raise exception 'Compte candidate introuvable avec le préfixe %', candidate_email_prefix;
  end if;

  create temp table _subject_map (
    source_id uuid primary key,
    target_id uuid not null
  ) on commit drop;

  insert into subjects (
    user_id,
    slug,
    name,
    exam_date,
    exam_duration_min,
    has_chapters,
    sort_order
  )
  select
    target_user,
    s.slug,
    s.name,
    s.exam_date,
    s.exam_duration_min,
    s.has_chapters,
    s.sort_order
  from subjects s
  where s.user_id = source_user
  on conflict (user_id, slug) do update set
    name = excluded.name,
    exam_date = excluded.exam_date,
    exam_duration_min = excluded.exam_duration_min,
    has_chapters = excluded.has_chapters,
    sort_order = excluded.sort_order;

  insert into _subject_map (source_id, target_id)
  select s.id, t.id
  from subjects s
  join subjects t on t.user_id = target_user and t.slug = s.slug
  where s.user_id = source_user;

  create temp table _chapter_map (
    source_id uuid primary key,
    target_id uuid not null
  ) on commit drop;

  insert into chapters (
    user_id,
    subject_id,
    name,
    pdf_ref,
    status,
    weight,
    program_week,
    sort_order
  )
  select
    target_user,
    sm.target_id,
    c.name,
    c.pdf_ref,
    c.status,
    c.weight,
    c.program_week,
    c.sort_order
  from chapters c
  join _subject_map sm on sm.source_id = c.subject_id
  where c.user_id = source_user
    and not exists (
      select 1
      from chapters existing
      where existing.user_id = target_user
        and existing.subject_id = sm.target_id
        and existing.name = c.name
    );

  insert into _chapter_map (source_id, target_id)
  select c.id, tc.id
  from chapters c
  join _subject_map sm on sm.source_id = c.subject_id
  join chapters tc
    on tc.user_id = target_user
   and tc.subject_id = sm.target_id
   and tc.name = c.name
  where c.user_id = source_user;

  create temp table _document_map (
    source_id uuid primary key,
    target_id uuid not null
  ) on commit drop;

  insert into documents (
    user_id,
    subject_id,
    chapter_id,
    storage_path,
    filename,
    anthropic_file_id,
    status,
    error_message
  )
  select
    target_user,
    sm.target_id,
    cm.target_id,
    d.storage_path,
    d.filename,
    d.anthropic_file_id,
    d.status,
    d.error_message
  from documents d
  join _subject_map sm on sm.source_id = d.subject_id
  left join _chapter_map cm on cm.source_id = d.chapter_id
  where d.user_id = source_user
    and not exists (
      select 1
      from documents existing
      where existing.user_id = target_user
        and existing.filename = d.filename
        and existing.subject_id = sm.target_id
        and coalesce(existing.chapter_id, '00000000-0000-0000-0000-000000000000'::uuid)
          = coalesce(cm.target_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

  insert into _document_map (source_id, target_id)
  select d.id, td.id
  from documents d
  join _subject_map sm on sm.source_id = d.subject_id
  left join _chapter_map cm on cm.source_id = d.chapter_id
  join documents td
    on td.user_id = target_user
   and td.filename = d.filename
   and td.subject_id = sm.target_id
   and coalesce(td.chapter_id, '00000000-0000-0000-0000-000000000000'::uuid)
     = coalesce(cm.target_id, '00000000-0000-0000-0000-000000000000'::uuid)
  where d.user_id = source_user;

  insert into questions (
    user_id,
    chapter_id,
    document_id,
    qtype,
    payload,
    status
  )
  select
    target_user,
    cm.target_id,
    dm.target_id,
    q.qtype,
    q.payload,
    q.status
  from questions q
  join _chapter_map cm on cm.source_id = q.chapter_id
  left join _document_map dm on dm.source_id = q.document_id
  where q.user_id = source_user
    and not exists (
      select 1
      from questions existing
      where existing.user_id = target_user
        and existing.chapter_id = cm.target_id
        and existing.qtype = q.qtype
        and existing.payload = q.payload
    );

  raise notice 'Quiz dupliqué de % vers %', source_user, target_user;
end $$;
