-- Prétoire — schéma V1
-- Toutes les tables portent user_id + RLS "propriétaire uniquement".

create type chapter_status as enum ('non_vu', 'lu', 'fiche', 'revise', 'maitrise');

create table subjects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  name        text not null,
  exam_date   date,                -- null pour la note de synthèse ? non : elle a une date mais pas de chapitres
  exam_duration_min int not null,
  has_chapters boolean not null default true, -- false pour la note de synthèse
  sort_order  int not null default 0,
  unique (user_id, slug)
);

create table chapters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  uuid not null references subjects(id) on delete cascade,
  name        text not null,
  pdf_ref     text,                -- nom du support de cours, informatif
  status      chapter_status not null default 'non_vu',
  weight      int not null default 3 check (weight between 1 and 5),
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

create table status_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  chapter_id  uuid not null references chapters(id) on delete cascade,
  from_status chapter_status not null,
  to_status   chapter_status not null,
  created_at  timestamptz not null default now()
);

create table milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  uuid references subjects(id) on delete set null,
  title       text not null,
  due_date    date not null,
  done_at     timestamptz
);

create table synthesis_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  trained_on   date not null default current_date,
  duration_min int not null,
  annale_ref   text,
  feeling      int check (feeling between 1 and 10),
  comment      text
);

create index on chapters (subject_id, sort_order);
create index on status_events (user_id, created_at);
create index on milestones (user_id, due_date);
create index on synthesis_logs (user_id, trained_on desc);

-- RLS
alter table subjects enable row level security;
alter table chapters enable row level security;
alter table status_events enable row level security;
alter table milestones enable row level security;
alter table synthesis_logs enable row level security;

create policy "own subjects" on subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own chapters" on chapters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own status_events" on status_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own milestones" on milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own synthesis_logs" on synthesis_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at automatique sur chapters
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

create trigger chapters_touch before update on chapters
  for each row execute function touch_updated_at();
