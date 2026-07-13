-- Beranis — application du programme v2 sur l'utilisateur déjà seedé.
-- A coller tel quel dans Supabase Dashboard > SQL Editor > New query > Run.
--
-- Effet :
-- - garde les subjects existants ;
-- - supprime les chapitres V1 de cet utilisateur ;
-- - supprime les assignments existants de cet utilisateur ;
-- - supprime les jalons V1 inventés ;
-- - insère les chapitres au grain programme + 24 sujets datés.
--
-- Attention : supprimer les chapitres supprime aussi leurs status_events.

do $$
declare
  target_user uuid;
  synthese_id uuid;
  obligations_id uuid;
  civil_id uuid;
  procedure_id uuid;
begin
  select user_id
  into target_user
  from subjects
  order by sort_order
  limit 1;

  if target_user is null then
    raise exception 'Aucun subject trouvé. Connecte-toi une première fois puis seed les subjects V1.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chapters'
      and column_name = 'program_week'
  ) then
    alter table chapters
      add column program_week int check (program_week between 1 and 7);
  end if;

  create table if not exists assignments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    week_number int not null check (week_number between 1 and 8),
    title text not null,
    pages text,
    due_date date not null,
    done_at timestamptz,
    unique (subject_id, week_number)
  );

  create index if not exists assignments_user_id_due_date_idx
    on assignments (user_id, due_date);

  alter table assignments enable row level security;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'assignments'
      and policyname = 'own assignments'
  ) then
    create policy "own assignments" on assignments
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  select id into synthese_id from subjects where user_id = target_user and slug = 'synthese';
  select id into obligations_id from subjects where user_id = target_user and slug = 'obligations';
  select id into civil_id from subjects where user_id = target_user and slug = 'civil';
  select id into procedure_id from subjects where user_id = target_user and slug = 'procedure';

  if obligations_id is null or civil_id is null or procedure_id is null then
    raise exception 'Subjects attendus manquants pour user_id %', target_user;
  end if;

  update subjects
  set
    name = case slug
      when 'synthese' then 'Note de synthèse'
      when 'obligations' then 'Droit des obligations'
      when 'civil' then 'Droit civil (spé)'
      when 'procedure' then 'Procédure civile'
      else name
    end,
    exam_date = case slug
      when 'synthese' then '2026-09-01'::date
      when 'obligations' then '2026-09-02'::date
      when 'civil' then '2026-09-03'::date
      when 'procedure' then '2026-09-04'::date
      else exam_date
    end,
    exam_duration_min = case slug
      when 'synthese' then 300
      when 'obligations' then 180
      when 'civil' then 180
      when 'procedure' then 120
      else exam_duration_min
    end,
    has_chapters = case slug
      when 'synthese' then false
      else true
    end
  where user_id = target_user
    and slug in ('synthese', 'obligations', 'civil', 'procedure');

  delete from assignments where user_id = target_user;
  delete from chapters where user_id = target_user;
  delete from milestones
  where user_id = target_user
    and title in (
      'Obligations : tout lu',
      'Civil : tout lu',
      'Obligations : tout fiché',
      'Procédure : tout lu',
      'Civil : tout fiché',
      '5 annales de synthèse faites',
      'Procédure : tout fiché',
      'Tout révisé — début sprint final'
    );

  insert into chapters (user_id, subject_id, name, pdf_ref, weight, program_week, sort_order) values
    (target_user, obligations_id, 'Preuves', 'Cours_OB_1_Preuve pp. 5-24', 2, 1, 0),
    (target_user, obligations_id, 'Contrats — introduction et formation', 'Cours_OB_2 pp. 9-40', 3, 2, 1),
    (target_user, obligations_id, 'RGO — actions du créancier, modalités temporelles', 'Cours_OB_4 pp. 7-29', 3, 2, 2),
    (target_user, obligations_id, 'Contrats — validité : conditions tenant aux personnes', 'Cours_OB_2 pp. 41-61', 3, 3, 3),
    (target_user, obligations_id, 'RGO — modalités structurelles', 'Cours_OB_4 pp. 31-42', 2, 3, 4),
    (target_user, obligations_id, 'Contrats — validité : contenu et sanctions', 'Cours_OB_2 pp. 61-93', 4, 4, 5),
    (target_user, obligations_id, 'RGO — opérations translatives', 'Cours_OB_4 pp. 43-61', 3, 4, 6),
    (target_user, obligations_id, 'Contrats — effets, inexécution, annexes', 'Cours_OB_2 pp. 95-147', 5, 5, 7),
    (target_user, obligations_id, 'RGO — opérations créatrices', 'Cours_OB_4 pp. 63-70', 1, 5, 8),
    (target_user, obligations_id, 'RC — principes communs, fait d''une personne', 'Cours_OB_3 pp. 5-35', 4, 6, 9),
    (target_user, obligations_id, 'RGO — extinction de l''obligation', 'Cours_OB_4 pp. 71-86', 2, 6, 10),
    (target_user, obligations_id, 'RC — fait d''une chose, annexes', 'Cours_OB_3 pp. 37-73', 4, 7, 11),
    (target_user, obligations_id, 'Quasi-contrats', 'Cours_OB_5 pp. 5-27', 2, 7, 12),
    (target_user, civil_id, 'Couple hors mariage, formation du mariage', 'Tome 1 pp. 9-50', 3, 1, 0),
    (target_user, civil_id, 'Vie du couple marié, désunion et divorce', 'Tome 1 pp. 51-97', 4, 2, 1),
    (target_user, civil_id, 'Effets du divorce, l''enfant', 'Tome 1 pp. 98-183', 5, 3, 2),
    (target_user, civil_id, 'Qualification, vente, entreprise, prêt, mandat', 'Tome 2 pp. 7-92', 5, 4, 3),
    (target_user, civil_id, 'Bail ; cautionnement, garanties, gage, nantissement', 'Tome 2 pp. 93-104 + Tome 3 pp. 7-102', 5, 5, 4),
    (target_user, civil_id, 'Privilèges, sûretés immobilières ; intro biens, propriété individuelle', 'Tome 3 pp. 103-129 + Tome 4 pp. 5-60', 4, 6, 5),
    (target_user, civil_id, 'Protection de la propriété, propriété collective, démembrements', 'Tome 4 pp. 61-117', 4, 7, 6),
    (target_user, procedure_id, 'L''action en justice', 'Cours_PC pp. 11-24', 3, 1, 0),
    (target_user, procedure_id, 'Moyens de défense, compétence', 'Cours_PC pp. 24-44', 3, 2, 1),
    (target_user, procedure_id, 'Procédure devant le tribunal judiciaire', 'Cours_PC pp. 71-81', 3, 3, 2),
    (target_user, procedure_id, 'Référé, requête, mesures d''instruction', 'Cours_PC pp. 83-86 + 67-70', 2, 4, 3),
    (target_user, procedure_id, 'Qualification du jugement, exécution provisoire', 'Cours_PC pp. 87-98', 2, 5, 4),
    (target_user, procedure_id, 'L''appel', 'Cours_PC pp. 103-114', 3, 6, 5),
    (target_user, procedure_id, 'Voies d''exécution', 'Cours_PCE', 3, 7, 6),
    (target_user, procedure_id, 'MARC', 'Cours_MARC', 1, null, 7);

  insert into assignments (user_id, subject_id, week_number, title, pages, due_date) values
    (target_user, obligations_id, 1, 'Sujet 1 — Preuves', 'pp. 5-24', '2026-06-29'),
    (target_user, obligations_id, 2, 'Sujet 2 — Formation du contrat, RGO T1-T2', 'pp. 9-40 + 7-29', '2026-07-06'),
    (target_user, obligations_id, 3, 'Sujet 3 — Validité (personnes), modalités structurelles', 'pp. 41-61 + 31-42', '2026-07-13'),
    (target_user, obligations_id, 4, 'Sujet 4 — Validité (contenu, sanctions), opérations translatives', 'pp. 61-93 + 43-61', '2026-07-20'),
    (target_user, obligations_id, 5, 'Sujet 5 — Effets et inexécution, opérations créatrices', 'pp. 95-147 + 63-70', '2026-07-27'),
    (target_user, obligations_id, 6, 'Sujet 6 — RC (principes, fait d''une personne), extinction', 'pp. 5-35 + 71-86', '2026-08-03'),
    (target_user, obligations_id, 7, 'Sujet 7 — RC (fait d''une chose), quasi-contrats', 'pp. 37-73 + 5-27', '2026-08-10'),
    (target_user, obligations_id, 8, 'Sujet 8 — transversal (plateforme)', null, '2026-08-16'),
    (target_user, civil_id, 1, 'Sujet 1 — Couple hors mariage, formation du mariage', 'T1 pp. 9-50', '2026-06-30'),
    (target_user, civil_id, 2, 'Sujet 2 — Vie du couple, désunion, divorce', 'T1 pp. 51-97', '2026-07-07'),
    (target_user, civil_id, 3, 'Sujet 3 — Effets du divorce, l''enfant', 'T1 pp. 98-183', '2026-07-14'),
    (target_user, civil_id, 4, 'Sujet 4 — Qualification, vente, entreprise, prêt, mandat', 'T2 pp. 7-92', '2026-07-21'),
    (target_user, civil_id, 5, 'Sujet 5 — Bail, cautionnement, garanties, gage, nantissement', 'T2 + T3', '2026-07-28'),
    (target_user, civil_id, 6, 'Sujet 6 — Privilèges, sûretés immo ; intro biens, propriété', 'T3 + T4', '2026-08-04'),
    (target_user, civil_id, 7, 'Sujet 7 — Protection propriété, collective, démembrements', 'T4 pp. 61-117', '2026-08-11'),
    (target_user, civil_id, 8, 'Sujet 8 — transversal (plateforme)', null, '2026-08-16'),
    (target_user, procedure_id, 1, 'Sujet 1 — Action en justice', 'pp. 11-24', '2026-06-29'),
    (target_user, procedure_id, 2, 'Sujet 2 — Moyens de défense, compétence', 'pp. 24-44', '2026-07-06'),
    (target_user, procedure_id, 3, 'Sujet 3 — Procédure devant le TJ', 'pp. 71-81', '2026-07-13'),
    (target_user, procedure_id, 4, 'Sujet 4 — Référé, requête, mesures d''instruction', 'pp. 83-86 + 67-70', '2026-07-20'),
    (target_user, procedure_id, 5, 'Sujet 5 — Qualification du jugement, exécution provisoire', 'pp. 87-98', '2026-07-27'),
    (target_user, procedure_id, 6, 'Sujet 6 — L''appel', 'pp. 103-114', '2026-08-03'),
    (target_user, procedure_id, 7, 'Sujet 7 — Voies d''exécution', null, '2026-08-10'),
    (target_user, procedure_id, 8, 'Sujet 8 — transversal (plateforme)', null, '2026-08-16');

  update chapters
  set status = 'fiche'
  where user_id = target_user
    and subject_id = obligations_id
    and name = 'Preuves';

  update chapters
  set status = 'lu'
  where user_id = target_user
    and subject_id = procedure_id
    and name = 'L''action en justice';

  update chapters
  set status = 'lu'
  where user_id = target_user
    and subject_id = civil_id
    and name = 'Couple hors mariage, formation du mariage';

  raise notice 'Programme v2 appliqué pour user_id %', target_user;
end $$;

select
  s.slug,
  c.program_week,
  count(*) as chapters
from chapters c
join subjects s on s.id = c.subject_id
group by s.slug, c.program_week
order by s.slug, c.program_week nulls last;

select count(*) as assignments_count from assignments;
