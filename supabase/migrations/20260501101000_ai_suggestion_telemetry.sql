create table if not exists public.ai_suggestion_events (
  id bigserial primary key,
  created_at timestamptz not null default timezone('utc', now()),
  event_type text not null check (event_type in (
    'ai_suggestion_shown',
    'ai_suggestion_applied',
    'ai_suggestion_edited',
    'ai_suggestion_rejected',
    'ai_suggestion_session_outcome'
  )),
  operator_pseudo_id text not null,
  session_id text not null,
  suggestion_id text not null,
  cue_id text,
  context jsonb not null default '{}'::jsonb,
  model_version text not null,
  ruleset_version text not null,
  runtime_version text not null,
  feature_flags jsonb not null default '{}'::jsonb,
  latency_ms integer,
  patch_error_count_before integer,
  patch_error_count_after integer
);

create index if not exists idx_ai_suggestion_events_created_at on public.ai_suggestion_events(created_at desc);
create index if not exists idx_ai_suggestion_events_type on public.ai_suggestion_events(event_type, created_at desc);
create index if not exists idx_ai_suggestion_events_session on public.ai_suggestion_events(session_id, created_at desc);

alter table public.ai_suggestion_events enable row level security;

create policy if not exists "ai_suggestion_events_insert_authenticated"
on public.ai_suggestion_events
for insert
to authenticated
with check (true);

create policy if not exists "ai_suggestion_events_select_authenticated"
on public.ai_suggestion_events
for select
to authenticated
using (true);

create or replace function public.prune_ai_suggestion_events(retention_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_rows integer;
begin
  delete from public.ai_suggestion_events
  where created_at < timezone('utc', now()) - make_interval(days => retention_days);

  get diagnostics deleted_rows = row_count;
  return deleted_rows;
end;
$$;

create or replace view public.ai_suggestion_kpi_dashboard as
with base as (
  select * from public.ai_suggestion_events
),
aggregated as (
  select
    count(*) filter (where event_type = 'ai_suggestion_shown') as shown_count,
    count(*) filter (where event_type = 'ai_suggestion_applied') as applied_count,
    count(*) filter (where event_type = 'ai_suggestion_edited') as edited_count,
    count(*) filter (where event_type = 'ai_suggestion_rejected') as rejected_count,
    avg(greatest(0, coalesce(patch_error_count_before, 0) - coalesce(patch_error_count_after, 0))) as patch_errors_reduced,
    avg(latency_ms) filter (where latency_ms is not null) as avg_latency_ms
  from base
)
select
  shown_count,
  applied_count,
  edited_count,
  rejected_count,
  case when shown_count = 0 then 0 else round((applied_count::numeric / shown_count::numeric) * 100, 2) end as acceptance_rate_percent,
  case when applied_count = 0 then 0 else round((edited_count::numeric / applied_count::numeric) * 100, 2) end as retouch_rate_percent,
  coalesce(patch_errors_reduced, 0)::numeric(10,2) as patch_errors_reduced_avg,
  coalesce(avg_latency_ms, 0)::numeric(10,2) as avg_time_saved_ms
from aggregated;
