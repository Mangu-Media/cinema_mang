export const JOB_STATUSES = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const PIPELINE_STAGES = [
  "ingest",
  "semantic",
  "cinematic",
  "breakdown",
  "schedule",
  "look",
  "complete",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const ARTIFACT_NAMES = [
  "raw_script",
  "semantic_frames",
  "cinematic_plan",
  "breakdown",
  "schedule",
  "lookbook",
] as const;
export type ArtifactName = (typeof ARTIFACT_NAMES)[number];

export const EVENT_TYPES = [
  "JOB_CREATED",
  "JOB_QUEUED",
  "JOB_RUNNING",
  "ARTIFACT_WRITTEN",
  "JOB_SUCCEEDED",
  "JOB_FAILED",
  "USER_ACTION",
  "STAGE_STARTED",
  "STAGE_COMPLETED",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const SHOT_TYPES = [
  "WIDE",
  "MEDIUM",
  "CLOSE_UP",
  "EXTREME_CLOSE_UP",
  "INSERT",
  "POV",
  "TWO_SHOT",
  "OVER_SHOULDER",
  "AERIAL",
  "TRACKING",
] as const;
export type ShotType = (typeof SHOT_TYPES)[number];

export const CAMERA_MOVEMENTS = [
  "STATIC",
  "DOLLY_IN",
  "DOLLY_OUT",
  "PAN",
  "TILT",
  "STEADICAM",
  "HANDHELD",
  "CRANE",
  "TRACKING",
  "ZOOM",
] as const;
export type CameraMovement = (typeof CAMERA_MOVEMENTS)[number];

export const COVERAGE_ROLES = ["master", "coverage", "insert", "cutaway", "establishing"] as const;
export type CoverageRole = (typeof COVERAGE_ROLES)[number];

export const ENTITY_KINDS = [
  "character",
  "prop",
  "location",
  "vehicle",
  "wardrobe",
  "vfx",
] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const BREAKDOWN_CATEGORIES = [
  "CAST",
  "EXTRAS",
  "PROPS",
  "WARDROBE",
  "MAKEUP",
  "VEHICLES",
  "SFX",
  "VFX",
  "ANIMALS",
  "STUNTS",
  "SPECIAL_EQ",
  "SET_DRESSING",
  "GREENS",
  "MUSIC",
] as const;
export type BreakdownCategory = (typeof BREAKDOWN_CATEGORIES)[number];

export const SLUGLINE_KINDS = ["INT", "EXT", "INT/EXT", "EST"] as const;
export type SluglineKind = (typeof SLUGLINE_KINDS)[number];

export const COVERAGE_DENSITIES = ["economy", "standard", "full"] as const;
export type CoverageDensity = (typeof COVERAGE_DENSITIES)[number];

export type Camera = {
  focal_length_mm: number;
  movement: CameraMovement;
  height_m: number;
  target: string;
  angle: string;
};

export type Shot = {
  shot_index: number;
  shot_code: string;
  shot_type: ShotType;
  duration_s: number;
  camera: Camera;
  description: string;
  dialogue: string;
  coverage_role: CoverageRole;
  storyboard_prompt: string;
  scene_index: number;
};

export type SemanticFrame = {
  scene_index: number;
  heading: string;
  slugline_kind: SluglineKind;
  location: string;
  time_of_day: string;
  beats: string[];
  entities: {
    characters: string[];
    props: string[];
    locations: string[];
    vehicles: string[];
  };
  raw_excerpt: string;
  tone: string;
  synopsis: string;
  pages: number;
  duration_est_s: number;
};

export type CinematicPlan = {
  shots: Shot[];
  notes: string[];
  total_duration_s: number;
  coverage_density: CoverageDensity;
};

export type ParsedScene = {
  scene_index: number;
  heading: string;
  slugline_kind: SluglineKind;
  location: string;
  time_of_day: string;
  body: string;
  action: string[];
  dialogue_blocks: { character: string; parenthetical?: string; lines: string }[];
  transitions: string[];
};

export type PipelineParams = {
  genre: string;
  target_runtime_min: number;
  coverage_density: CoverageDensity;
  look: string;
};

export type BreakdownItemDraft = {
  scene_index: number;
  category: BreakdownCategory;
  name: string;
  notes: string;
  quantity: number;
};

export type ScheduleDayDraft = {
  day_index: number;
  label: string;
  location: string;
  notes: string;
  estimated_pages: number;
  estimated_hours: number;
  strips: {
    scene_index: number;
    pages: number;
    company_move: boolean;
  }[];
};

export type Lookbook = {
  title: string;
  logline: string;
  genre: string;
  visual_thesis: string;
  color_script: { scene_index: number; heading: string; palette: string[]; note: string }[];
  camera_grammar: string[];
  lighting_notes: string[];
  sound_notes: string[];
  references: string[];
};

export type ProductionPackage = {
  frames: SemanticFrame[];
  plan: CinematicPlan;
  breakdown: BreakdownItemDraft[];
  schedule: ScheduleDayDraft[];
  lookbook: Lookbook;
  entities: {
    kind: EntityKind;
    name: string;
    description: string;
    first_scene: number;
    meta: Record<string, string | number | boolean | null>;
  }[];
};

export type ProjectRow = {
  id: string;
  title: string;
  logline: string;
  genre: string;
  status: string;
  format: string;
  created_at: string;
  updated_at: string;
};

export type JobRow = {
  id: string;
  project_id: string;
  title: string;
  status: JobStatus;
  stage: PipelineStage;
  script_text: string;
  parameters: PipelineParams;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type SceneRow = {
  id: string;
  job_id: string;
  scene_index: number;
  heading: string;
  slugline_kind: string;
  location: string;
  time_of_day: string;
  synopsis: string;
  raw_text: string;
  beats: string[];
  tone: string;
  pages: number | string;
  duration_est_s: number;
};

export type EntityRow = {
  id: string;
  job_id: string;
  kind: string;
  name: string;
  description: string;
  first_scene: number;
  meta: Record<string, string | number | boolean | null>;
};

export type ShotRow = {
  id: string;
  job_id: string;
  scene_id: string;
  shot_index: number;
  shot_code: string;
  shot_type: string;
  duration_s: number | string;
  camera: Camera;
  description: string;
  dialogue: string;
  coverage_role: string;
  storyboard_prompt: string;
  storyboard_url: string | null;
};

export type BreakdownRow = {
  id: string;
  job_id: string;
  scene_id: string;
  category: string;
  name: string;
  notes: string;
  quantity: number;
};

export type ScheduleDayRow = {
  id: string;
  job_id: string;
  day_index: number;
  label: string;
  location: string;
  notes: string;
  estimated_pages: number | string;
  estimated_hours: number | string;
};

export type ScheduleStripRow = {
  id: string;
  day_id: string;
  job_id: string;
  scene_id: string;
  order_index: number;
  pages: number | string;
  company_move: boolean;
};

export type JobEventRow = {
  id: number;
  job_id: string;
  type: string;
  message: string;
  data: Record<string, string | number | boolean | null>;
  at: string;
};

export type ArtifactRow = {
  job_id: string;
  name: string;
  payload: Record<string, string | number | boolean | null | string[]>;
  created_at: string;
};

export type JobBundle = {
  job: JobRow;
  project: ProjectRow | null;
  scenes: SceneRow[];
  shots: ShotRow[];
  entities: EntityRow[];
  breakdown: BreakdownRow[];
  days: ScheduleDayRow[];
  strips: ScheduleStripRow[];
  events: JobEventRow[];
  artifacts: ArtifactRow[];
};

export const DEFAULT_PARAMS: PipelineParams = {
  genre: "neo-noir",
  target_runtime_min: 12,
  coverage_density: "standard",
  look: "sodium night / wet asphalt",
};
