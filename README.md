# CSE Orchestrator (Script-to-Screen)

## Quickstart (local dev)

1. Bootstrap:
   ```bash
   ./setup.sh
   ```

2. Run infra + services:
   ```bash
   docker compose up --build
   ```

3. Open:
   * API docs: http://localhost:8000/docs
   * Temporal UI: http://localhost:8080
   * Web UI: http://localhost:5173

## Notes
* **Idempotency**: submitting an existing `job_id` returns current state (no restart).
* **Audit log**: every state transition appends to `job_events` (append-only).
* **Storage**: artifacts stored in S3 (Localstack in dev) under `jobs/{job_id}/...`.
