-- Diagnostic Beranis programme v2.
-- A coller tel quel dans Supabase Dashboard > SQL Editor > New query.
-- Lecture seule : ce script ne modifie aucune donnée.

select
  'subjects' as section,
  count(*)::text as value,
  coalesce(string_agg(slug, ', ' order by sort_order), '') as detail
from subjects;

select
  'chapters' as section,
  count(*)::text as value,
  concat(
    count(*) filter (where program_week is not null),
    ' avec program_week / ',
    count(*) filter (where program_week is null),
    ' sans program_week'
  ) as detail
from chapters;

select
  'assignments' as section,
  count(*)::text as value,
  concat(
    count(*) filter (where done_at is null),
    ' ouverts, dates ',
    coalesce(min(due_date)::text, 'n/a'),
    ' -> ',
    coalesce(max(due_date)::text, 'n/a')
  ) as detail
from assignments;

select
  'distinct user_ids' as section,
  count(distinct user_id)::text as value,
  coalesce(string_agg(distinct user_id::text, ', '), '') as detail
from (
  select user_id from subjects
  union all
  select user_id from chapters
  union all
  select user_id from assignments
  union all
  select user_id from milestones
) rows;

select
  s.slug,
  c.program_week,
  count(*) as chapters
from chapters c
join subjects s on s.id = c.subject_id
group by s.slug, c.program_week
order by s.slug, c.program_week nulls last;

select
  s.slug,
  a.week_number,
  a.title,
  a.due_date,
  a.done_at
from assignments a
join subjects s on s.id = a.subject_id
order by a.due_date, s.sort_order;

select
  title,
  due_date,
  done_at
from milestones
where title in (
  'Obligations : tout lu',
  'Civil : tout lu',
  'Obligations : tout fiché',
  'Procédure : tout lu',
  'Civil : tout fiché',
  '5 annales de synthèse faites',
  'Procédure : tout fiché',
  'Tout révisé - début sprint final'
)
order by due_date;
