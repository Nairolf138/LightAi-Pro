-- Collaboration version lineage + conflict metadata for guided merge and manual fallback traceability.

alter table public.shared_shows
  add column if not exists entity_version bigint not null default 0,
  add column if not exists last_conflict_at timestamptz,
  add column if not exists last_conflict_meta jsonb not null default '{}'::jsonb;

create table if not exists public.collaboration_entity_versions (
  id bigserial primary key,
  shared_show_id uuid not null references public.shared_shows(id) on delete cascade,
  entity_type text not null check (entity_type in ('cue', 'patch', 'preset')),
  entity_key text not null,
  version bigint not null,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  conflict_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (shared_show_id, entity_type, entity_key, version)
);

create index if not exists idx_collab_entity_versions_show_created
  on public.collaboration_entity_versions(shared_show_id, created_at desc);

alter table public.collaboration_entity_versions enable row level security;

create policy if not exists "collaboration_entity_versions_select_for_team"
on public.collaboration_entity_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.shared_shows ss
    where ss.id = shared_show_id
      and public.has_project_role(ss.project_id, array['owner', 'operator', 'viewer'])
  )
);

create policy if not exists "collaboration_entity_versions_insert_owner_or_operator"
on public.collaboration_entity_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shared_shows ss
    where ss.id = shared_show_id
      and public.has_project_role(ss.project_id, array['owner', 'operator'])
  )
);
