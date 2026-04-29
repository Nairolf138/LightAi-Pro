-- Resilience guardrails for collaboration: conflict diagnostics, stale lock cleanup,
-- and offline/reconnect recovery journal support.

create table if not exists public.collaboration_incidents (
  id bigserial primary key,
  project_id uuid references public.projects(id) on delete cascade,
  shared_show_id uuid references public.shared_shows(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  severity text not null check (severity in ('sev1', 'sev2', 'sev3')),
  category text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  happened_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_collab_incidents_project_happened_at
  on public.collaboration_incidents(project_id, happened_at desc);

alter table public.collaboration_incidents enable row level security;

create policy if not exists "collaboration_incidents_select_for_team"
on public.collaboration_incidents
for select
to authenticated
using (public.has_project_role(project_id, array['owner', 'operator', 'viewer']));

create policy if not exists "collaboration_incidents_insert_owner_or_operator"
on public.collaboration_incidents
for insert
to authenticated
with check (
  (actor_id is null or actor_id = auth.uid())
  and public.has_project_role(project_id, array['owner', 'operator'])
);

create or replace function public.recover_collaboration_state(
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
  v_lock public.live_control_locks;
begin
  -- Recovery path after process crash/reconnect: reacquire lock if expired or currently owned by same actor/session.
  v_lock := public.acquire_live_control_lock(p_project_id, p_session_id, p_ttl_seconds);

  insert into public.collaboration_incidents (project_id, actor_id, severity, category, summary, details)
  values (
    p_project_id,
    auth.uid(),
    'sev3',
    'recovery',
    'Collaboration recovery flow executed',
    jsonb_build_object('session_id', p_session_id, 'ttl_seconds', p_ttl_seconds)
  );

  return v_lock;
end;
$$;

grant execute on function public.recover_collaboration_state(uuid, text, integer) to authenticated;
