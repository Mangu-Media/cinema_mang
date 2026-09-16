# CINEMA

Script-to-screen production studio and a streaming house.

The CSE Orchestrator spine is intact: idempotent jobs, append-only `job_events`, artifacts under `jobs/{job_id}/...`. The pipeline now writes the full floor packet — semantic frames, cinematic plan, breakdown, stripboard, lookbook, bible — then the web app puts finished originals next to public-domain classics.

## What this is

- **Floor** — ingest a script, keep a job id, watch the audit, open artifacts.
- **House (Watch)** — browse/play for CINEMA originals and copyright-free classics only. No studio catalog.
- **Auth off** — no accounts. My List and resume live in `localStorage` key `cinema.stream.v1`.
- **Night Shift** — locked director animatic (`job_night_shift`) played from the floor packet.

Catalog sources for classics are Internet Archive identifiers. Card art is local typography (VaultArt).

## Quickstart

```bash
./setup.sh
docker compose up --build
```

- API: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Temporal: http://localhost:8080
- Web: http://localhost:5173

Frontend only:

```bash
cd web && npm install && npm run dev
```

Set `VITE_API_BASE` if the API is not on `http://localhost:8000`.

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
web/                    Floor + Watch UI
tests/                  idempotency
```
