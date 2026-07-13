-- 002 - Alignement sur le programme officiel Pré-Barreau (formation estivale 2026)

-- Semaine du programme où le chapitre est couvert (1..7, null = hors programme)
alter table chapters add column program_week int check (program_week between 1 and 7);

-- Sujets hebdomadaires à rendre (8 par matière, dont le transversal n°8)
create table assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  uuid not null references subjects(id) on delete cascade,
  week_number int not null check (week_number between 1 and 8),
  title       text not null,
  pages       text,              -- ex. "pp. 41–61 + 31–42"
  due_date    date not null,     -- lundi ou mardi de la semaine ; n°8 : 2026-08-16
  done_at     timestamptz,
  unique (subject_id, week_number)
);

create index on assignments (user_id, due_date);

alter table assignments enable row level security;
create policy "own assignments" on assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Les jalons génériques seedés en V1 sont remplacés par les sujets réels.
-- La table milestones reste pour les jalons personnels qu'elle ajoutera.
delete from milestones where title in (
  'Obligations : tout lu', 'Civil : tout lu', 'Obligations : tout fiché',
  'Procédure : tout lu', 'Civil : tout fiché', '5 annales de synthèse faites',
  'Procédure : tout fiché', 'Tout révisé - début sprint final'
);
