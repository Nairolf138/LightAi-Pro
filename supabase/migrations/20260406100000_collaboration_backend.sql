-- Collaboration backend extension for LightAI-Pro
-- Adds: projects, team_members, roles, shared_shows, action_journal, and live lock orchestration.

create extension if not exists pgcrypto;

create table if not exists public.roles (
  id bigserial primary key,
  slug text not null unique check (slug in ('owner', 'operator', 'viewer')),
  description text not null,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.roles (slug, description, permissions)
values
  (
    'owner',
    'Full project control including membership and destructive operations.',
    jsonb_build_object('project', 'rw', 'team', 'rw', 'show', 'rw', 'lock', 'rw')
  ),
  (
    'operator',
    'Live operation rights without membership administration.',
    jsonb_build_object('project', 'rw', 'team', 'r', 'show', 'rw', 'lock', 'rw')
  ),
  (
    'viewer',
    'Read-only visibility for monitoring and review.',
    jsonb_build_object('project', 'r', 'team', 'r', 'show', 'r', 'lock', 'r')
  )
on conflict (slug) do update
set description = excluded.description,
    permissions = excluded.permissions;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  live_state jsonb not null default '{}'::jsonb,
  state_version bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.team_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id bigint not null references public.roles(id),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create table if not exists public.shared_shows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  show_payload jsonb not null default '{}'::jsonb,
  state_version bigint not null default 0,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_journal (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  shared_show_id uuid references public.shared_shows(id) on delete set null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  cue_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.live_control_locks (
  project_id uuid primary key references public.projects(id) on delete cascade,
  holder_user_id uuid not null references auth.users(id) on delete cascade,
  holder_session_id text not null,
  acquired_at timestamptz not null default timezone('utc', now()),
  heartbeat_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);
create index if not exists idx_shared_shows_project_id on public.shared_shows(project_id);
create index if not exists idx_action_journal_project_id_created_at on public.action_journal(project_id, created_at desc);
create index if not exists idx_live_control_locks_expires_at on public.live_control_locks(expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_projects_set_updated_at on public.projects;
create trigger trg_projects_set_updated_at
before update on public.projects
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_team_members_set_updated_at on public.team_members;
create trigger trg_team_members_set_updated_at
before update on public.team_members
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_shared_shows_set_updated_at on public.shared_shows;
create trigger trg_shared_shows_set_updated_at
before update on public.shared_shows
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_live_control_locks_set_updated_at on public.live_control_locks;
create trigger trg_live_control_locks_set_updated_at
before update on public.live_control_locks
for each row
execute procedure public.set_updated_at();

create or replace function public.has_project_role(
  p_project_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    join public.roles r on r.id = tm.role_id
    where tm.project_id = p_project_id
      and tm.user_id = auth.uid()
      and r.slug = any (p_roles)
  )
  or exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.owner_id = auth.uid()
      and 'owner' = any (p_roles)
  );
$$;

create or replace function public.assert_project_role(
  p_project_id uuid,
  p_roles text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_project_role(p_project_id, p_roles) then
    raise exception 'Insufficient role for project %', p_project_id using errcode = '42501';
  end if;
end;
$$;

alter table public.projects enable row level security;
alter table public.team_members enable row level security;
alter table public.roles enable row level security;
alter table public.shared_shows enable row level security;
alter table public.action_journal enable row level security;
alter table public.live_control_locks enable row level security;

-- roles policies
create policy if not exists "roles_read_for_authenticated"
on public.roles
for select
to authenticated
using (true);

-- projects policies
create policy if not exists "projects_select_for_team"
on public.projects
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.has_project_role(id, array['owner', 'operator', 'viewer'])
);

create policy if not exists "projects_insert_owner"
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid());

create policy if not exists "projects_update_owner_or_operator"
on public.projects
for update
to authenticated
using (
  owner_id = auth.uid()
  or public.has_project_role(id, array['owner', 'operator'])
)
with check (
  owner_id = auth.uid()
  or public.has_project_role(id, array['owner', 'operator'])
);

create policy if not exists "projects_delete_owner"
on public.projects
for delete
to authenticated
using (owner_id = auth.uid());

-- team_members policies
create policy if not exists "team_members_select_for_team"
on public.team_members
for select
to authenticated
using (public.has_project_role(project_id, array['owner', 'operator', 'viewer']));

create policy if not exists "team_members_manage_owner"
on public.team_members
for all
to authenticated
using (public.has_project_role(project_id, array['owner']))
with check (public.has_project_role(project_id, array['owner']));

-- shared_shows policies
create policy if not exists "shared_shows_select_for_team"
on public.shared_shows
for select
to authenticated
using (public.has_project_role(project_id, array['owner', 'operator', 'viewer']));

create policy if not exists "shared_shows_insert_owner_or_operator"
on public.shared_shows
for insert
to authenticated
with check (public.has_project_role(project_id, array['owner', 'operator']));

create policy if not exists "shared_shows_update_owner_or_operator"
on public.shared_shows
for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (public.has_project_role(project_id, array['owner', 'operator']));

create policy if not exists "shared_shows_delete_owner"
on public.shared_shows
for delete
to authenticated
using (public.has_project_role(project_id, array['owner']));

-- action_journal policies
create policy if not exists "action_journal_select_for_team"
on public.action_journal
for select
to authenticated
using (public.has_project_role(project_id, array['owner', 'operator', 'viewer']));

create policy if not exists "action_journal_insert_owner_or_operator"
on public.action_journal
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.has_project_role(project_id, array['owner', 'operator'])
);

-- live_control_locks policies
create policy if not exists "live_control_locks_select_for_team"
on public.live_control_locks
for select
to authenticated
using (public.has_project_role(project_id, array['owner', 'operator', 'viewer']));

create policy if not exists "live_control_locks_upsert_owner_or_operator"
on public.live_control_locks
for insert
to authenticated
with check (
  holder_user_id = auth.uid()
  and public.has_project_role(project_id, array['owner', 'operator'])
);

create policy if not exists "live_control_locks_update_owner_or_operator"
on public.live_control_locks
for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'operator']))
with check (
  holder_user_id = auth.uid()
  and public.has_project_role(project_id, array['owner', 'operator'])
);

create policy if not exists "live_control_locks_delete_owner_or_operator"
on public.live_control_locks
for delete
to authenticated
using (
  holder_user_id = auth.uid()
  and public.has_project_role(project_id, array['owner', 'operator'])
);

create or replace function public.sync_project_live_state(
  p_project_id uuid,
  p_expected_version bigint,
  p_patch jsonb default '{}'::jsonb
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.projects;
begin
  perform public.assert_project_role(p_project_id, array['owner', 'operator']);

  update public.projects p
  set live_state = coalesce(p.live_state, '{}'::jsonb) || coalesce(p_patch, '{}'::jsonb),
      state_version = p.state_version + 1,
      updated_at = timezone('utc', now())
  where p.id = p_project_id
    and p.state_version = p_expected_version
  returning p.* into v_row;

  if v_row.id is null then
    raise exception 'Version conflict on project % (expected %)', p_project_id, p_expected_version
      using errcode = 'P0001';
  end if;

  return v_row;
end;
$$;

create or replace function public.sync_shared_show_state(
  p_shared_show_id uuid,
  p_expected_version bigint,
  p_patch jsonb default '{}'::jsonb
)
returns public.shared_shows
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.shared_shows;
  v_actor uuid := auth.uid();
begin
  update public.shared_shows s
  set show_payload = coalesce(s.show_payload, '{}'::jsonb) || coalesce(p_patch, '{}'::jsonb),
      state_version = s.state_version + 1,
      updated_by = v_actor,
      updated_at = timezone('utc', now())
  where s.id = p_shared_show_id
    and s.state_version = p_expected_version
    and public.has_project_role(s.project_id, array['owner', 'operator'])
  returning s.* into v_row;

  if v_row.id is null then
    raise exception 'Version conflict or insufficient role for shared_show % (expected %)', p_shared_show_id, p_expected_version
      using errcode = 'P0001';
  end if;

  return v_row;
end;
$$;

create or replace function public.log_cue_action(
  p_project_id uuid,
  p_shared_show_id uuid,
  p_cue_id text,
  p_action_type text default 'cue_launch',
  p_payload jsonb default '{}'::jsonb
)
returns public.action_journal
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.action_journal;
  v_actor uuid := auth.uid();
begin
  perform public.assert_project_role(p_project_id, array['owner', 'operator']);

  insert into public.action_journal (
    project_id,
    shared_show_id,
    actor_id,
    action_type,
    cue_id,
    payload
  )
  values (
    p_project_id,
    p_shared_show_id,
    v_actor,
    p_action_type,
    p_cue_id,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.acquire_live_control_lock(
  p_project_id uuid,
  p_session_id text,
  p_ttl_seconds integer default 15
)
returns public.live_control_locks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_expires_at timestamptz := v_now + make_interval(secs => greatest(p_ttl_seconds, 3));
  v_actor uuid := auth.uid();
  v_row public.live_control_locks;
begin
  perform public.assert_project_role(p_project_id, array['owner', 'operator']);

  insert into public.live_control_locks (
    project_id,
    holder_user_id,
    holder_session_id,
    acquired_at,
    heartbeat_at,
    expires_at
  )
  values (
    p_project_id,
    v_actor,
    p_session_id,
    v_now,
    v_now,
    v_expires_at
  )
  on conflict (project_id) do update
    set holder_user_id = excluded.holder_user_id,
        holder_session_id = excluded.holder_session_id,
        acquired_at = case
          when public.live_control_locks.holder_user_id = excluded.holder_user_id
            and public.live_control_locks.holder_session_id = excluded.holder_session_id
          then public.live_control_locks.acquired_at
          else excluded.acquired_at
        end,
        heartbeat_at = excluded.heartbeat_at,
        expires_at = excluded.expires_at,
        updated_at = v_now
  where public.live_control_locks.expires_at <= v_now
     or (
       public.live_control_locks.holder_user_id = excluded.holder_user_id
       and public.live_control_locks.holder_session_id = excluded.holder_session_id
     )
  returning * into v_row;

  if v_row.project_id is null then
    raise exception 'Lock already held for project %', p_project_id using errcode = '55P03';
  end if;

  return v_row;
end;
$$;

create or replace function public.heartbeat_live_control_lock(
  p_project_id uuid,
  p_session_id text,
  p_ttl_seconds integer default 15
)
returns public.live_control_locks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_row public.live_control_locks;
begin
  update public.live_control_locks
  set heartbeat_at = v_now,
      expires_at = v_now + make_interval(secs => greatest(p_ttl_seconds, 3)),
      updated_at = v_now
  where project_id = p_project_id
    and holder_user_id = auth.uid()
    and holder_session_id = p_session_id
  returning * into v_row;

  if v_row.project_id is null then
    raise exception 'Cannot heartbeat lock for project %', p_project_id using errcode = '55P03';
  end if;

  return v_row;
end;
$$;

create or replace function public.release_live_control_lock(
  p_project_id uuid,
  p_session_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.live_control_locks
  where project_id = p_project_id
    and holder_user_id = auth.uid()
    and holder_session_id = p_session_id;

  return found;
end;
$$;

grant execute on function public.sync_project_live_state(uuid, bigint, jsonb) to authenticated;
grant execute on function public.sync_shared_show_state(uuid, bigint, jsonb) to authenticated;
grant execute on function public.log_cue_action(uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.acquire_live_control_lock(uuid, text, integer) to authenticated;
grant execute on function public.heartbeat_live_control_lock(uuid, text, integer) to authenticated;
grant execute on function public.release_live_control_lock(uuid, text) to authenticated;
