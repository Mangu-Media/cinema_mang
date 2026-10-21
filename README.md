# CINEMA

Script-to-screen production studio and a streaming house.

The CSE Orchestrator spine is intact: idempotent jobs, append-only `job_events`, artifacts under `jobs/{job_id}/...`. The pipeline writes the full floor packet — semantic frames, cinematic plan, breakdown, stripboard, lookbook, bible — then Watch puts finished originals next to public-domain classics.

## What this is

- **Floor** — ingest a script, keep a job id, watch the audit, open artifacts.
- **House (Watch)** — Netflix/Hulu/Tubi-style browse and play for CINEMA originals and U.S. public-domain classics only. No licensed studio catalog.
- **Auth off** — no accounts. My List, ratings, history, and resume live in this browser (`localStorage` key `cinema.stream.v1`).
- **Night Shift** — locked director animatic (`job_night_shift`) played from the floor packet.

Catalog sources for classics are Internet Archive identifiers. Missing stills fall back to VaultArt.

## Watch

The house is the TanStack Start app in `web/`:

- Home rows, Top 10, tonight lineup, Vault filters (decade, genre, origin, runtime)
- Title pages, people pages, search, My List, history, surprise
- Player: seek, speed, PiP, skip opening, next-up, Archive embed fallback
- Originals: Night Shift, Wet Down, The Last Reel, Sodium

Frontend only:

```bash
cd web && npm install && npm run dev
```

Vercel builds `web/` (root directory `web`). Set `VITE_AUTH_ENABLED=false`. Studio jobs persist when `DATABASE_URL` (Postgres/Neon) is set; without it the floor uses an ephemeral PGLite.

## Quickstart (orchestrator)

```bash
./setup.sh
docker compose up --build
```

- API: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Temporal: http://localhost:8080
- Web: `cd web && npm run dev`

Set `VITE_API_BASE` if the Python API is not on `http://localhost:8000`.

## Contract (do not break)

- Idempotency: POST `/v1/jobs` with an existing `job_id` returns current state. No restart.
- Audit: every transition appends to `job_events`.
- Artifacts: `raw_script`, `semantic_frames`, `cinematic_plan`, `breakdown`, `stripboard`, `lookbook`, `bible`
- Storage: S3 (Localstack in dev) keys from `artifact_key()`

## Watch catalog policy

Originals and public-domain / copyright-free pictures only. Do not add a copyrighted studio title because it is famous.

## Layout

```
src/cse_orchestrator/   FastAPI + Temporal worker
web/                    Floor + Watch (TanStack Start)
tests/                  idempotency
```
