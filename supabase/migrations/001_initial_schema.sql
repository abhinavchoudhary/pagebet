-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Reader'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CHALLENGES
-- ============================================================
create table if not exists challenges (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  creator_id      uuid not null references profiles(id) on delete cascade,
  daily_goal      int not null default 5,
  weekly_goal     int not null default 35,
  penalty_amount  numeric not null default 10,
  penalty_currency text not null default '₹',
  carry_over      boolean not null default false,
  invite_token    text unique not null,
  invite_active   boolean not null default true,
  archived        boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table challenges enable row level security;

create policy "challenges_select_members"
  on challenges for select
  to authenticated
  using (
    id in (
      select challenge_id from challenge_members where user_id = auth.uid()
    )
    or creator_id = auth.uid()
  );

create policy "challenges_insert_own"
  on challenges for insert
  to authenticated
  with check (creator_id = auth.uid());

create policy "challenges_update_creator"
  on challenges for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- Public read for join page (by token)
create policy "challenges_select_by_token"
  on challenges for select
  to anon
  using (invite_active = true);

-- ============================================================
-- CHALLENGE MEMBERS
-- ============================================================
create table if not exists challenge_members (
  challenge_id  uuid not null references challenges(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table challenge_members enable row level security;

create policy "challenge_members_select"
  on challenge_members for select
  to authenticated
  using (
    challenge_id in (
      select challenge_id from challenge_members cm2 where cm2.user_id = auth.uid()
    )
  );

create policy "challenge_members_insert_self"
  on challenge_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "challenge_members_delete_self_or_creator"
  on challenge_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or challenge_id in (
      select id from challenges where creator_id = auth.uid()
    )
  );

-- ============================================================
-- BOOKS
-- ============================================================
create table if not exists books (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  google_books_id text not null,
  title           text not null,
  authors         text[],
  cover_url       text,
  total_pages     int,
  finished        boolean not null default false,
  added_at        timestamptz not null default now(),
  unique (user_id, google_books_id)
);

alter table books enable row level security;

create policy "books_select_own"
  on books for select
  to authenticated
  using (user_id = auth.uid());

create policy "books_insert_own"
  on books for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "books_update_own"
  on books for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "books_delete_own"
  on books for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- READING SESSIONS
-- ============================================================
create table if not exists reading_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  book_id       uuid not null references books(id) on delete cascade,
  log_mode      text not null check (log_mode in ('cumulative', 'direct')),
  page_position int,
  pages_read    int not null,
  logged_at     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table reading_sessions enable row level security;

create policy "sessions_select_shared_challenge"
  on reading_sessions for select
  to authenticated
  using (
    user_id = auth.uid()
    or user_id in (
      select cm2.user_id
      from challenge_members cm1
      join challenge_members cm2 on cm1.challenge_id = cm2.challenge_id
      where cm1.user_id = auth.uid()
    )
  );

create policy "sessions_insert_own"
  on reading_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "sessions_update_own"
  on reading_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- CHALLENGE SESSION CREDITS
-- ============================================================
create table if not exists challenge_session_credits (
  session_id    uuid not null references reading_sessions(id) on delete cascade,
  challenge_id  uuid not null references challenges(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  pages_credited int not null,
  week_start    date not null,
  primary key (session_id, challenge_id)
);

alter table challenge_session_credits enable row level security;

create policy "credits_select_members"
  on challenge_session_credits for select
  to authenticated
  using (
    challenge_id in (
      select challenge_id from challenge_members where user_id = auth.uid()
    )
  );

create policy "credits_insert_own"
  on challenge_session_credits for insert
  to authenticated
  with check (user_id = auth.uid());

-- ============================================================
-- FEED REACTIONS
-- ============================================================
create table if not exists feed_reactions (
  session_id  uuid not null references reading_sessions(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  emoji       text not null,
  primary key (session_id, user_id)
);

alter table feed_reactions enable row level security;

create policy "reactions_select_shared"
  on feed_reactions for select
  to authenticated
  using (
    session_id in (
      select id from reading_sessions
      where user_id in (
        select cm2.user_id
        from challenge_members cm1
        join challenge_members cm2 on cm1.challenge_id = cm2.challenge_id
        where cm1.user_id = auth.uid()
      )
    )
  );

create policy "reactions_insert_own"
  on feed_reactions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "reactions_delete_own"
  on feed_reactions for delete
  to authenticated
  using (user_id = auth.uid());

create policy "reactions_update_own"
  on feed_reactions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- RPC: get_my_week_summary
-- ============================================================
create or replace function get_my_week_summary(
  p_challenge_id uuid,
  p_user_id uuid
)
returns table (
  pages_this_week bigint,
  weekly_goal int,
  penalty_exposure numeric,
  carry_over_surplus bigint,
  days_remaining int,
  week_start date
)
language plpgsql security definer as $$
declare
  v_joined_at timestamptz;
  v_weekly_goal int;
  v_penalty_amount numeric;
  v_carry_over boolean;
  v_ms_per_week bigint := 7 * 24 * 60 * 60 * 1000;
  v_elapsed bigint;
  v_week_num int;
  v_week_start date;
  v_week_end date;
  v_pages_this_week bigint;
  v_pages_last_week bigint;
  v_surplus bigint;
  v_effective_goal int;
  v_pages_owed bigint;
  v_days_remaining int;
begin
  select cm.joined_at, c.weekly_goal, c.penalty_amount, c.carry_over
  into v_joined_at, v_weekly_goal, v_penalty_amount, v_carry_over
  from challenge_members cm
  join challenges c on c.id = cm.challenge_id
  where cm.challenge_id = p_challenge_id and cm.user_id = p_user_id;

  if not found then
    return;
  end if;

  v_elapsed := extract(epoch from (now() - v_joined_at)) * 1000;
  v_week_num := floor(v_elapsed::numeric / (7 * 24 * 60 * 60 * 1000));
  v_week_start := (v_joined_at + (v_week_num * interval '7 days'))::date;
  v_week_end := v_week_start + interval '7 days';
  v_days_remaining := greatest(0, ceil(extract(epoch from (v_week_end::timestamptz - now())) / 86400));

  select coalesce(sum(csc.pages_credited), 0)
  into v_pages_this_week
  from challenge_session_credits csc
  where csc.challenge_id = p_challenge_id
    and csc.user_id = p_user_id
    and csc.week_start = v_week_start;

  v_surplus := 0;
  if v_carry_over and v_week_num > 0 then
    declare
      v_prev_week_start date := (v_joined_at + ((v_week_num - 1) * interval '7 days'))::date;
    begin
      select coalesce(sum(csc.pages_credited), 0)
      into v_pages_last_week
      from challenge_session_credits csc
      where csc.challenge_id = p_challenge_id
        and csc.user_id = p_user_id
        and csc.week_start = v_prev_week_start;

      v_surplus := greatest(0, v_pages_last_week - v_weekly_goal);
    end;
  end if;

  v_effective_goal := greatest(0, v_weekly_goal - v_surplus);
  v_pages_owed := greatest(0, v_effective_goal - v_pages_this_week);

  return query select
    v_pages_this_week,
    v_weekly_goal,
    v_pages_owed * v_penalty_amount,
    v_surplus,
    v_days_remaining,
    v_week_start;
end;
$$;

-- ============================================================
-- RPC: get_leaderboard
-- ============================================================
create or replace function get_leaderboard(p_challenge_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  pages_this_week bigint,
  weekly_goal int,
  penalty_exposure numeric
)
language plpgsql security definer as $$
begin
  return query
  select
    p.id,
    p.display_name,
    p.avatar_url,
    coalesce(
      (select sum(csc.pages_credited)
       from challenge_session_credits csc
       join challenge_members cm2 on cm2.challenge_id = csc.challenge_id and cm2.user_id = csc.user_id
       where csc.challenge_id = p_challenge_id
         and csc.user_id = p.id
         and csc.week_start = (
           cm2.joined_at + (
             floor(extract(epoch from (now() - cm2.joined_at)) / (7*24*3600)) * interval '7 days'
           )
         )::date
      ), 0
    ) as pages_this_week,
    c.weekly_goal,
    greatest(0,
      (c.weekly_goal - coalesce(
        (select sum(csc2.pages_credited)
         from challenge_session_credits csc2
         join challenge_members cm3 on cm3.challenge_id = csc2.challenge_id and cm3.user_id = csc2.user_id
         where csc2.challenge_id = p_challenge_id
           and csc2.user_id = p.id
           and csc2.week_start = (
             cm3.joined_at + (
               floor(extract(epoch from (now() - cm3.joined_at)) / (7*24*3600)) * interval '7 days'
             )
           )::date
        ), 0
      ))
    ) * c.penalty_amount as penalty_exposure
  from challenge_members cm
  join profiles p on p.id = cm.user_id
  join challenges c on c.id = cm.challenge_id
  where cm.challenge_id = p_challenge_id
  order by pages_this_week desc;
end;
$$;
