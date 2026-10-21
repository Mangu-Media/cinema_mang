import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { DEFAULT_PARAMS, type JobBundle, type JobRow, type PipelineParams, type ProjectRow } from "@/lib/cse/types";
import { buildProduction } from "@/lib/cse/production";
import {
  LAST_REEL_LOGLINE,
  LAST_REEL_TITLE,
  NIGHT_SHIFT_LOGLINE,
  NIGHT_SHIFT_SCRIPT,
  NIGHT_SHIFT_TITLE,
} from "@/lib/cse/seed-script";
import { generateStill, runAiProduction } from "./ai";
import { appendEvent, persistPackage, setJobState, upsertArtifact } from "./persist";

const SEED_PROJECT = "proj_night_shift";
const SEED_JOB = "job_night_shift";
const DEV_PROJECT = "proj_last_reel";

async function seedIfNeeded() {
  const sql = await getSql();
  const existing = await sql<{ id: string }>`select id from projects where id = ${SEED_PROJECT}`;
  if (existing.length) return;

  await sql`
    insert into projects (id, title, logline, genre, status, format)
    values (
      ${SEED_PROJECT}, ${NIGHT_SHIFT_TITLE}, ${NIGHT_SHIFT_LOGLINE},
      ${"neo-noir"}, ${"preproduction"}, ${"short"}
    )
  `;
  await sql`
    insert into projects (id, title, logline, genre, status, format)
    values (
      ${DEV_PROJECT}, ${LAST_REEL_TITLE}, ${LAST_REEL_LOGLINE},
      ${"mystery"}, ${"development"}, ${"feature"}
    )
  `;

  const params: PipelineParams = {
    genre: "neo-noir",
    target_runtime_min: 12,
    coverage_density: "standard",
    look: "sodium night / wet asphalt",
  };

  await sql`
    insert into jobs (id, project_id, title, status, stage, script_text, parameters)
    values (
      ${SEED_JOB}, ${SEED_PROJECT}, ${NIGHT_SHIFT_TITLE},
      ${"SUCCEEDED"}, ${"complete"}, ${NIGHT_SHIFT_SCRIPT}, ${JSON.stringify(params)}::jsonb
    )
  `;
  await upsertArtifact(SEED_JOB, "raw_script", { text: NIGHT_SHIFT_SCRIPT });
  await appendEvent(SEED_JOB, "JOB_CREATED", "Seed production created");
  await appendEvent(SEED_JOB, "JOB_QUEUED", "Pipeline queued");
  await appendEvent(SEED_JOB, "JOB_RUNNING", "Semantic analysis started");
  const pkg = buildProduction(NIGHT_SHIFT_SCRIPT, params, NIGHT_SHIFT_TITLE);
  await persistPackage(SEED_JOB, pkg, params, NIGHT_SHIFT_TITLE);
  await appendEvent(SEED_JOB, "ARTIFACT_WRITTEN", "semantic_frames stored", { artifact: "semantic_frames" });
  await appendEvent(SEED_JOB, "ARTIFACT_WRITTEN", "cinematic_plan stored", { artifact: "cinematic_plan" });
  await appendEvent(SEED_JOB, "ARTIFACT_WRITTEN", "breakdown stored", { artifact: "breakdown" });
  await appendEvent(SEED_JOB, "ARTIFACT_WRITTEN", "schedule stored", { artifact: "schedule" });
  await appendEvent(SEED_JOB, "STAGE_COMPLETED", "Lookbook locked");
  await appendEvent(SEED_JOB, "JOB_SUCCEEDED", "Script-to-screen lock");
}

export const bootstrapStudio = createServerFn({ method: "GET" }).handler(async () => {
  await seedIfNeeded();
  return { ok: true as const };
});

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  await seedIfNeeded();
  const sql = await getSql();
  return sql<ProjectRow>`select * from projects order by updated_at desc`;
});

export const listJobs = createServerFn({ method: "GET" }).handler(async () => {
  await seedIfNeeded();
  const sql = await getSql();
  return sql<JobRow>`select * from jobs order by updated_at desc`;
});

export const getJobBundle = createServerFn({ method: "GET" })
  .validator((input: { jobId: string }) => input)
  .handler(async ({ data }): Promise<JobBundle | null> => {
    await seedIfNeeded();
    const sql = await getSql();
    const jobs = await sql<JobRow>`select * from jobs where id = ${data.jobId}`;
    const job = jobs[0];
    if (!job) return null;
    const projects = await sql<ProjectRow>`select * from projects where id = ${job.project_id}`;
    const [scenes, shots, entities, breakdown, days, strips, events, artifacts] = await Promise.all([
      sql`select * from scenes where job_id = ${data.jobId} order by scene_index asc`,
      sql`select * from shots where job_id = ${data.jobId} order by shot_index asc`,
      sql`select * from entities where job_id = ${data.jobId} order by first_scene asc, name asc`,
      sql`select * from breakdown_items where job_id = ${data.jobId} order by category asc, name asc`,
      sql`select * from schedule_days where job_id = ${data.jobId} order by day_index asc`,
      sql`select * from schedule_strips where job_id = ${data.jobId} order by order_index asc`,
      sql`select * from job_events where job_id = ${data.jobId} order by id asc`,
      sql`select * from artifacts where job_id = ${data.jobId}`,
    ]);
    return {
      job,
      project: projects[0] ?? null,
      scenes: scenes as JobBundle["scenes"],
      shots: shots as JobBundle["shots"],
      entities: entities as JobBundle["entities"],
      breakdown: breakdown as JobBundle["breakdown"],
      days: days as JobBundle["days"],
      strips: strips as JobBundle["strips"],
      events: events as JobBundle["events"],
      artifacts: artifacts as JobBundle["artifacts"],
    };
  });

export const listEntities = createServerFn({ method: "GET" }).handler(async () => {
  await seedIfNeeded();
  const sql = await getSql();
  return sql<{
    id: string;
    job_id: string;
    kind: string;
    name: string;
    description: string;
    first_scene: number;
    job_title: string;
  }>`
    select e.id, e.job_id, e.kind, e.name, e.description, e.first_scene, j.title as job_title
    from entities e
    join jobs j on j.id = e.job_id
    order by e.kind, e.name
  `;
});

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export const createProject = createServerFn({ method: "POST" })
  .validator((input: { title: string; logline?: string; genre?: string; format?: string }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = newId("proj");
    await sql`
      insert into projects (id, title, logline, genre, status, format)
      values (
        ${id}, ${data.title.trim() || "Untitled"}, ${data.logline ?? ""},
        ${data.genre ?? ""}, ${"development"}, ${data.format ?? "short"}
      )
    `;
    return { id };
  });

export const submitJob = createServerFn({ method: "POST" })
  .validator(
    (input: {
      jobId?: string;
      projectId?: string;
      title?: string;
      scriptText: string;
      parameters?: Partial<PipelineParams>;
    }) => input,
  )
  .handler(async ({ data }) => {
    await seedIfNeeded();
    const sql = await getSql();
    const script = data.scriptText.trim();
    if (!script) throw new Error("Provide a script");

    const jobId = data.jobId?.trim() || newId("job");
    const existing = await sql<JobRow>`select * from jobs where id = ${jobId}`;
    if (existing[0] && existing[0].status !== "PENDING") {
      return { job_id: jobId, status: existing[0].status, idempotent: true as const };
    }

    let projectId = data.projectId;
    if (!projectId) {
      projectId = newId("proj");
      await sql`
        insert into projects (id, title, logline, genre, status, format)
        values (
          ${projectId}, ${data.title?.trim() || "Untitled production"}, ${""},
          ${data.parameters?.genre ?? "drama"}, ${"preproduction"}, ${"short"}
        )
      `;
    }

    const params: PipelineParams = { ...DEFAULT_PARAMS, ...data.parameters };
    if (!existing[0]) {
      await sql`
        insert into jobs (id, project_id, title, status, stage, script_text, parameters)
        values (
          ${jobId}, ${projectId}, ${data.title?.trim() || "Untitled"},
          ${"PENDING"}, ${"ingest"}, ${script}, ${JSON.stringify(params)}::jsonb
        )
      `;
      await appendEvent(jobId, "JOB_CREATED", "Job created");
    }

    await upsertArtifact(jobId, "raw_script", { text: script });
    await appendEvent(jobId, "ARTIFACT_WRITTEN", "Raw script stored", { artifact: "raw_script" });
    await appendEvent(jobId, "JOB_QUEUED", "Job queued for processing");
    return { job_id: jobId, status: "PENDING" as const, idempotent: false as const };
  });

export const runPipeline = createServerFn({ method: "POST" })
  .validator((input: { jobId: string; useAi?: boolean }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const jobs = await sql<JobRow>`select * from jobs where id = ${data.jobId}`;
    const job = jobs[0];
    if (!job) throw new Error("Job not found");

    const params = {
      ...DEFAULT_PARAMS,
      ...(typeof job.parameters === "object" && job.parameters ? job.parameters : {}),
    } as PipelineParams;

    await setJobState(data.jobId, { status: "RUNNING", stage: "semantic", error: null });
    await appendEvent(data.jobId, "JOB_RUNNING", "Status set to RUNNING");
    await appendEvent(data.jobId, "STAGE_STARTED", "Semantic analysis started");

    try {
      const result =
        data.useAi === false
          ? { pkg: buildProduction(job.script_text, params, job.title), source: "heuristic" as const }
          : await runAiProduction(job.script_text, params, job.title);

      await persistPackage(data.jobId, result.pkg, params, job.title);
      await appendEvent(data.jobId, "ARTIFACT_WRITTEN", "semantic_frames stored", {
        source: result.source,
      });
      await appendEvent(data.jobId, "ARTIFACT_WRITTEN", "cinematic_plan stored");
      await appendEvent(data.jobId, "STAGE_COMPLETED", "Breakdown and schedule written");
      await appendEvent(data.jobId, "STAGE_COMPLETED", "Lookbook locked", { source: result.source });
      await setJobState(data.jobId, { status: "SUCCEEDED", stage: "complete" });
      await appendEvent(data.jobId, "JOB_SUCCEEDED", "Script-to-screen lock");
      return { ok: true as const, source: result.source, shots: result.pkg.plan.shots.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pipeline failed";
      await setJobState(data.jobId, { status: "FAILED", error: message });
      await appendEvent(data.jobId, "JOB_FAILED", message);
      return { ok: false as const, error: message };
    }
  });

export const generateShotStill = createServerFn({ method: "POST" })
  .validator((input: { shotId: string }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      job_id: string;
      storyboard_prompt: string;
      storyboard_url: string | null;
    }>`select id, job_id, storyboard_prompt, storyboard_url from shots where id = ${data.shotId}`;
    const shot = rows[0];
    if (!shot) throw new Error("Shot not found");
    if (shot.storyboard_url) return { url: shot.storyboard_url, cached: true as const };

    const existing = await sql<{ n: number }>`
      select count(*)::int as n from shots
      where job_id = ${shot.job_id} and storyboard_url is not null
    `;
    if ((existing[0]?.n ?? 0) >= 4) {
      return { url: null, error: "Still cap reached (4 per production)" };
    }

    const url = await generateStill(shot.storyboard_prompt);
    if (!url) return { url: null, error: "Image generation unavailable" };
    await sql`update shots set storyboard_url = ${url} where id = ${shot.id}`;
    return { url, cached: false as const };
  });

export const studioStats = createServerFn({ method: "GET" }).handler(async () => {
  await seedIfNeeded();
  const sql = await getSql();
  const jobs = await sql<{ n: number }>`select count(*)::int as n from jobs`;
  const scenes = await sql<{ n: number }>`select count(*)::int as n from scenes`;
  const shots = await sql<{ n: number }>`select count(*)::int as n from shots`;
  const locked = await sql<{ n: number }>`select count(*)::int as n from jobs where status = 'SUCCEEDED'`;
  return {
    jobs: jobs[0]?.n ?? 0,
    scenes: scenes[0]?.n ?? 0,
    shots: shots[0]?.n ?? 0,
    locked: locked[0]?.n ?? 0,
  };
});
