-- 004 - Journal détaillé des réponses de quiz

create table if not exists question_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid references quiz_sessions(id) on delete set null,
  question_id uuid not null references questions(id) on delete cascade,
  rating      int not null check (rating between 1 and 4),
  answered_at timestamptz not null default now()
);

create index if not exists question_attempts_user_answered_idx
  on question_attempts (user_id, answered_at desc);
create index if not exists question_attempts_user_question_idx
  on question_attempts (user_id, question_id);
create index if not exists question_attempts_session_idx
  on question_attempts (session_id);

alter table question_attempts enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'question_attempts'
      and policyname = 'own question_attempts'
  ) then
    create policy "own question_attempts" on question_attempts
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
