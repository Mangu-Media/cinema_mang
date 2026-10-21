-- CSE Orchestrator schema — productions, jobs, artifacts, events, and derived cinema data.
-- Unowned rows (no user_id): world-readable studio data for this auth-off app.

create table if not exists projects (
  id text primary key,
  title text not null,
  logline text not null default '',
  genre text not null default '',
  status text not null default 'development',
  format text not null default 'short',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id text primary key,
  project_id text not null,
  title text not null,
  status text not null default 'PENDING',
  stage text not null default 'ingest',
  script_text text not null default '',
  parameters jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_project_id_idx on jobs (project_id);
create index if not exists jobs_status_idx on jobs (status);
create index if not exists jobs_updated_at_idx on jobs (updated_at desc);

create table if not exists artifacts (
  job_id text not null,
  name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (job_id, name)
);

create table if not exists job_events (
  id serial primary key,
  job_id text not null,
  type text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

create index if not exists job_events_job_id_idx on job_events (job_id, id);

create table if not exists scenes (
  id text primary key,
  job_id text not null,
  scene_index int not null,
  heading text not null,
  slugline_kind text not null default 'INT',
  location text not null default '',
  time_of_day text not null default '',
  synopsis text not null default '',
  raw_text text not null default '',
  beats jsonb not null default '[]'::jsonb,
  tone text not null default '',
  pages numeric not null default 0,
  duration_est_s int not null default 0
);

create index if not exists scenes_job_id_idx on scenes (job_id, scene_index);

create table if not exists entities (
  id text primary key,
  job_id text not null,
  kind text not null,
  name text not null,
  description text not null default '',
  first_scene int not null default 1,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists entities_job_id_idx on entities (job_id, kind);

create table if not exists shots (
  id text primary key,
  job_id text not null,
  scene_id text not null,
  shot_index int not null,
  shot_code text not null,
  shot_type text not null,
  duration_s numeric not null default 4,
  camera jsonb not null default '{}'::jsonb,
  description text not null default '',
  dialogue text not null default '',
  coverage_role text not null default 'coverage',
  storyboard_prompt text not null default '',
  storyboard_url text
);

create index if not exists shots_job_id_idx on shots (job_id, shot_index);
create index if not exists shots_scene_id_idx on shots (scene_id);

create table if not exists breakdown_items (
  id text primary key,
  job_id text not null,
  scene_id text not null,
  category text not null,
  name text not null,
  notes text not null default '',
  quantity int not null default 1
);

create index if not exists breakdown_job_id_idx on breakdown_items (job_id, category);

create table if not exists schedule_days (
  id text primary key,
  job_id text not null,
  day_index int not null,
  label text not null,
  location text not null default '',
  notes text not null default '',
  estimated_pages numeric not null default 0,
  estimated_hours numeric not null default 0
);

create index if not exists schedule_days_job_id_idx on schedule_days (job_id, day_index);

create table if not exists schedule_strips (
  id text primary key,
  day_id text not null,
  job_id text not null,
  scene_id text not null,
  order_index int not null,
  pages numeric not null default 1,
  company_move boolean not null default false
);

create index if not exists schedule_strips_job_id_idx on schedule_strips (job_id, order_index);
