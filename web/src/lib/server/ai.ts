import { buildProduction } from "@/lib/cse/production";
import type { PipelineParams, ProductionPackage } from "@/lib/cse/types";

const MODEL = "grok-4.5";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence?.[1] ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in model response");
  return JSON.parse(body.slice(start, end + 1));
}

export async function runAiProduction(
  scriptText: string,
  params: PipelineParams,
  title: string,
): Promise<{ pkg: ProductionPackage; source: "grok" | "heuristic" }> {
  const fallback = () => ({ pkg: buildProduction(scriptText, params, title), source: "heuristic" as const });
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return fallback();

  const excerpt = scriptText.slice(0, 12000);
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 3500,
        messages: [
          {
            role: "system",
            content:
              "You are the Cinematic Singularity Engine planner. Return ONLY JSON matching the ProductionPackage shape: {frames, plan, breakdown, schedule, lookbook, entities}. Frames have scene_index, heading, slugline_kind (INT|EXT|INT/EXT|EST), location, time_of_day, beats[], entities{characters,props,locations,vehicles}, raw_excerpt, tone, synopsis, pages, duration_est_s. Plan has shots[] (shot_index, shot_code like 1A, shot_type WIDE|MEDIUM|CLOSE_UP|EXTREME_CLOSE_UP|INSERT|POV|TWO_SHOT|OVER_SHOULDER|AERIAL|TRACKING, duration_s, camera{focal_length_mm,movement,height_m,target,angle}, description, dialogue, coverage_role master|coverage|insert|cutaway|establishing, storyboard_prompt, scene_index), notes[], total_duration_s, coverage_density. Keep shots <= 36. Be precise, production-ready, no copyrighted titles.",
          },
          {
            role: "user",
            content: JSON.stringify({ title, params, script: excerpt }),
          },
        ],
      }),
    });
    if (!res.ok) return fallback();
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(text) as ProductionPackage;
    if (!parsed?.frames?.length || !parsed?.plan?.shots?.length) return fallback();
    // Fill any missing derived sections from the heuristic engine.
    const base = buildProduction(scriptText, params, title);
    return {
      source: "grok",
      pkg: {
        frames: parsed.frames,
        plan: parsed.plan,
        breakdown: parsed.breakdown?.length ? parsed.breakdown : base.breakdown,
        schedule: parsed.schedule?.length ? parsed.schedule : base.schedule,
        lookbook: parsed.lookbook ?? base.lookbook,
        entities: parsed.entities?.length ? parsed.entities : base.entities,
      },
    };
  } catch {
    return fallback();
  }
}

export async function generateStill(prompt: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: prompt.slice(0, 800),
      n: 1,
      resolution: "1k",
      response_format: "url",
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { url?: string }[] };
  return body.data?.[0]?.url ?? null;
}
