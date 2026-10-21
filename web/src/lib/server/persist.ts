import { getSql } from "@/lib/db";
import { hashId } from "@/lib/cse/production";
import type {
  ArtifactName,
  EventType,
  JobStatus,
  PipelineParams,
  PipelineStage,
  ProductionPackage,
} from "@/lib/cse/types";

function asJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

export async function appendEvent(
  jobId: string,
  type: EventType,
  message: string,
  data: Record<string, string | number | boolean | null> = {},
) {
  const sql = await getSql();
  await sql`
    insert into job_events (job_id, type, message, data)
    values (${jobId}, ${type}, ${message}, ${asJson(data)}::jsonb)
  `;
}

export async function setJobState(
  jobId: string,
  patch: { status?: JobStatus; stage?: PipelineStage; error?: string | null },
) {
  const sql = await getSql();
  if (patch.status !== undefined && patch.stage !== undefined) {
    await sql`
      update jobs set status = ${patch.status}, stage = ${patch.stage},
        error_message = ${patch.error ?? null}, updated_at = now()
      where id = ${jobId}
    `;
  } else if (patch.status !== undefined) {
    await sql`
      update jobs set status = ${patch.status},
        error_message = ${patch.error ?? null}, updated_at = now()
      where id = ${jobId}
    `;
  } else if (patch.stage !== undefined) {
    await sql`
      update jobs set stage = ${patch.stage}, updated_at = now()
      where id = ${jobId}
    `;
  }
}

export async function upsertArtifact(jobId: string, name: ArtifactName, payload: unknown) {
  const sql = await getSql();
  await sql`
    insert into artifacts (job_id, name, payload)
    values (${jobId}, ${name}, ${asJson(payload)}::jsonb)
    on conflict (job_id, name) do update set payload = excluded.payload, created_at = now()
  `;
}

export async function persistPackage(
  jobId: string,
  pkg: ProductionPackage,
  params: PipelineParams,
  title: string,
) {
  const sql = await getSql();

  await sql`delete from shots where job_id = ${jobId}`;
  await sql`delete from breakdown_items where job_id = ${jobId}`;
  await sql`delete from schedule_strips where job_id = ${jobId}`;
  await sql`delete from schedule_days where job_id = ${jobId}`;
  await sql`delete from entities where job_id = ${jobId}`;
  await sql`delete from scenes where job_id = ${jobId}`;

  const sceneIds = new Map<number, string>();

  for (const frame of pkg.frames) {
    const id = hashId("sc", jobId, String(frame.scene_index));
    sceneIds.set(frame.scene_index, id);
    await sql`
      insert into scenes (
        id, job_id, scene_index, heading, slugline_kind, location, time_of_day,
        synopsis, raw_text, beats, tone, pages, duration_est_s
      ) values (
        ${id}, ${jobId}, ${frame.scene_index}, ${frame.heading}, ${frame.slugline_kind},
        ${frame.location}, ${frame.time_of_day}, ${frame.synopsis}, ${frame.raw_excerpt},
        ${asJson(frame.beats)}::jsonb, ${frame.tone}, ${frame.pages}, ${frame.duration_est_s}
      )
    `;
  }

  for (const ent of pkg.entities) {
    const id = hashId("ent", jobId, ent.kind, ent.name);
    await sql`
      insert into entities (id, job_id, kind, name, description, first_scene, meta)
      values (
        ${id}, ${jobId}, ${ent.kind}, ${ent.name}, ${ent.description},
        ${ent.first_scene}, ${asJson(ent.meta)}::jsonb
      )
    `;
  }

  for (const shot of pkg.plan.shots) {
    const sceneId = sceneIds.get(shot.scene_index) ?? hashId("sc", jobId, String(shot.scene_index));
    const id = hashId("sh", jobId, shot.shot_code);
    await sql`
      insert into shots (
        id, job_id, scene_id, shot_index, shot_code, shot_type, duration_s,
        camera, description, dialogue, coverage_role, storyboard_prompt
      ) values (
        ${id}, ${jobId}, ${sceneId}, ${shot.shot_index}, ${shot.shot_code}, ${shot.shot_type},
        ${shot.duration_s}, ${asJson(shot.camera)}::jsonb, ${shot.description}, ${shot.dialogue},
        ${shot.coverage_role}, ${shot.storyboard_prompt}
      )
    `;
  }

  for (const item of pkg.breakdown) {
    const sceneId = sceneIds.get(item.scene_index) ?? hashId("sc", jobId, String(item.scene_index));
    const id = hashId("bd", jobId, String(item.scene_index), item.category, item.name);
    await sql`
      insert into breakdown_items (id, job_id, scene_id, category, name, notes, quantity)
      values (${id}, ${jobId}, ${sceneId}, ${item.category}, ${item.name}, ${item.notes}, ${item.quantity})
    `;
  }

  for (const day of pkg.schedule) {
    const dayId = hashId("day", jobId, String(day.day_index));
    await sql`
      insert into schedule_days (
        id, job_id, day_index, label, location, notes, estimated_pages, estimated_hours
      ) values (
        ${dayId}, ${jobId}, ${day.day_index}, ${day.label}, ${day.location},
        ${day.notes}, ${day.estimated_pages}, ${day.estimated_hours}
      )
    `;
    let order = 0;
    for (const strip of day.strips) {
      const sceneId = sceneIds.get(strip.scene_index) ?? hashId("sc", jobId, String(strip.scene_index));
      const id = hashId("st", jobId, dayId, String(strip.scene_index), String(order));
      await sql`
        insert into schedule_strips (id, day_id, job_id, scene_id, order_index, pages, company_move)
        values (${id}, ${dayId}, ${jobId}, ${sceneId}, ${order}, ${strip.pages}, ${strip.company_move})
      `;
      order += 1;
    }
  }

  await upsertArtifact(jobId, "semantic_frames", { version: "1.0", frames: pkg.frames });
  await upsertArtifact(jobId, "cinematic_plan", { version: "1.0", plan: pkg.plan });
  await upsertArtifact(jobId, "breakdown", { items: pkg.breakdown });
  await upsertArtifact(jobId, "schedule", { days: pkg.schedule });
  await upsertArtifact(jobId, "lookbook", pkg.lookbook);

  void params;
  void title;
}
