#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 not found"
    exit 1
fi

cd "$ROOT_DIR"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -e ".[dev]"

if command -v npm >/dev/null 2>&1; then
    cd "$ROOT_DIR/web"
    npm install
else
    echo "npm not found; skipping web install"
fi

cd "$ROOT_DIR"
pre-commit install || true

echo "Done.
Next:
docker compose up --build
"
