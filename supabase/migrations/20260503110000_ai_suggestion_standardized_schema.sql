alter table public.ai_suggestion_events
  add column if not exists event_version text not null default '1.0',
  add column if not exists show_id text not null default 'main-show',
  add column if not exists model text not null default 'unknown',
  add column if not exists variant text not null default 'default',
  add column if not exists outcome text not null default 'shown';

create index if not exists idx_ai_suggestion_events_outcome on public.ai_suggestion_events(outcome, created_at desc);
create index if not exists idx_ai_suggestion_events_show on public.ai_suggestion_events(show_id, created_at desc);
