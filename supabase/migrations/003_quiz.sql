-- 003 - Quiz IA sur les supports + répétition espacée (V2)

create type question_type as enum ('qcm', 'ouverte', 'mini_cas');
create type question_state as enum ('active', 'signalee');
create type document_status as enum ('uploaded', 'generating', 'ready', 'error');
create type review_state as enum ('new', 'learning', 'review', 'relearning');

-- PDF de cours ingérés (upload admin vers le bucket "supports")
create table documents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  subject_id        uuid not null references subjects(id) on delete cascade,
  chapter_id        uuid references chapters(id) on delete set null,
  storage_path      text not null,
  filename          text not null,
  anthropic_file_id text,             -- id Files API, réutilisé entre générations
  status            document_status not null default 'uploaded',
  error_message     text,
  created_at        timestamptz not null default now()
);

-- Questions générées, publiées telles quelles ("signalee" les écarte des sessions)
create table questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  chapter_id  uuid not null references chapters(id) on delete cascade,
  document_id uuid references documents(id) on delete set null,
  qtype       question_type not null,
  payload     jsonb not null,
  status      question_state not null default 'active',
  created_at  timestamptz not null default now()
);

-- État FSRS par question (absence de ligne = question jamais vue)
create table question_reviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  question_id      uuid not null references questions(id) on delete cascade,
  state            review_state not null default 'new',
  stability        double precision not null default 0,
  difficulty       double precision not null default 0,
  reps             int not null default 0,
  lapses           int not null default 0,
  last_rating      int check (last_rating between 1 and 4),
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz,
  unique (question_id)
);

-- Journal léger des sessions de 10 min
create table quiz_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  answered   int not null default 0,
  correct    int not null default 0
);

create index on documents (user_id, subject_id);
create index on questions (user_id, chapter_id);
create index on question_reviews (user_id, due_at);
create index on quiz_sessions (user_id, started_at desc);

alter table documents enable row level security;
alter table questions enable row level security;
alter table question_reviews enable row level security;
alter table quiz_sessions enable row level security;

create policy "own documents" on documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own questions" on questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own question_reviews" on question_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quiz_sessions" on quiz_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bucket privé pour les PDF de cours. Les uploads passent par des URL signées
-- créées côté serveur ; la lecture est réservée au propriétaire du fichier
-- (premier segment du chemin = user_id).
insert into storage.buckets (id, name, public)
values ('supports', 'supports', false)
on conflict (id) do nothing;

create policy "own supports read" on storage.objects
  for select using (
    bucket_id = 'supports' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own supports write" on storage.objects
  for insert with check (
    bucket_id = 'supports' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own supports delete" on storage.objects
  for delete using (
    bucket_id = 'supports' and (storage.foldername(name))[1] = auth.uid()::text
  );
