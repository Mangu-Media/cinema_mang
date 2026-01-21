#!/usr/bin/env bash
# /app/setup.sh
set -euo pipefail

###############################################################################
# Jules Bootstrap Script: "bootstrap once, snapshot forever"
# - Idempotent: safe to run repeatedly
# - Non-interactive: no prompts
# - Auto-detects: Node package manager, Python deps, Supabase, Prisma, Django
###############################################################################

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

export CI=1
export DEBIAN_FRONTEND=noninteractive
export PIP_NO_INPUT=1
export PIP_DISABLE_PIP_VERSION_CHECK=1
export npm_config_audit=false
export npm_config_fund=false
export npm_config_update_notifier=false

log()  { printf "\n\033[1m==> %s\033[0m\n" "$*"; }
warn() { printf "\033[33m[warn]\033[0m %s\n" "$*" >&2; }
die()  { printf "\033[31m[error]\033[0m %s\n" "$*" >&2; exit 1; }
has()  { command -v "$1" >/dev/null 2>&1; }

maybe_sudo() { if has sudo; then sudo -n "$@"; else "$@"; fi; }

run_quiet() { # show output only on failure
  local out
  if ! out="$("$@" 2>&1)"; then
    printf "%s\n" "$out" >&2
    return 1
  fi
}

###############################################################################
# 1) System dependencies (best-effort)
###############################################################################
install_system_deps() {
  log "System deps (best-effort)"
  if has apt-get; then
    maybe_sudo apt-get update -y
    maybe_sudo apt-get install -y ca-certificates curl git jq build-essential || warn "apt-get install failed (continuing)"
  elif has apk; then
    maybe_sudo apk add --no-interactive ca-certificates curl git jq build-base || warn "apk add failed (continuing)"
  elif has dnf; then
    maybe_sudo dnf install -y ca-certificates curl git jq make gcc gcc-c++ || warn "dnf install failed (continuing)"
  elif has yum; then
    maybe_sudo yum install -y ca-certificates curl git jq make gcc gcc-c++ || warn "yum install failed (continuing)"
  else
    warn "No supported system package manager found; skipping system deps"
  fi
}

###############################################################################
# 2) Env files
###############################################################################
write_env_example() {
  log "Writing .env.example (safe overwrite)"
  cat > .env.example <<'EOF'
# Copy to .env (setup.sh creates .env only if missing)
NODE_ENV=development

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database
DATABASE_URL=

# Redis
REDIS_URL=
EOF
}

write_env_if_missing() {
  [[ -f .env ]] && return 0
  log "Creating .env from injected Jules env vars (only if missing)"
  : > .env

  # Default NODE_ENV if not present
  if [[ -z "${NODE_ENV:-}" ]]; then
    printf "NODE_ENV=development\n" >> .env
  else
    printf "NODE_ENV=%s\n" "$NODE_ENV" >> .env
  fi

  # Allowlist common keys (avoid dumping everything)
  local keys=(
    "SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "DATABASE_URL"
    "REDIS_URL"
    "OPENAI_API_KEY"
  )

  for k in "${keys[@]}"; do
    # shellcheck disable=SC2154
    local v="${!k-}"
    [[ -z "$v" ]] && continue
    printf "%s=%s\n" "$k" "$v" >> .env
  done
}

###############################################################################
# 3) Node deps (auto-detect pm)
###############################################################################
enable_corepack() {
  has corepack && run_quiet corepack enable || true
}

detect_node_pm() {
  [[ -f package.json ]] || { echo "none"; return 0; }
  if [[ -f bun.lockb || -f bun.lock ]] && has bun; then echo "bun"; return 0; fi
  if [[ -f pnpm-lock.yaml ]]; then echo "pnpm"; return 0; fi
  if [[ -f yarn.lock ]]; then echo "yarn"; return 0; fi
  echo "npm"
}

install_node_deps() {
  [[ -f package.json ]] || return 0

  local pm
  pm="$(detect_node_pm)"
  log "Node deps ($pm)"

  case "$pm" in
    bun)
      run_quiet bun install --no-progress || bun install --no-progress
      ;;
    pnpm)
      enable_corepack
      if ! has pnpm && has corepack; then run_quiet corepack prepare pnpm@latest --activate || true; fi
      if has pnpm; then
        run_quiet pnpm install --frozen-lockfile || pnpm install
      else
        warn "pnpm-lock.yaml found but pnpm unavailable; falling back to npm"
        run_quiet npm ci || npm install --legacy-peer-deps || npm install
      fi
      ;;
    yarn)
      enable_corepack
      if ! has yarn && has corepack; then run_quiet corepack prepare yarn@stable --activate || true; fi
      if has yarn; then
        run_quiet yarn install --immutable || yarn install --frozen-lockfile || yarn install
      else
        warn "yarn.lock found but yarn unavailable; falling back to npm"
        run_quiet npm ci || npm install --legacy-peer-deps || npm install
      fi
      ;;
    npm)
      run_quiet npm ci || npm install --legacy-peer-deps || npm install
      ;;
    *)
      ;;
  esac
}

###############################################################################
# 4) Python deps (venv + pip/poetry)
###############################################################################
setup_python() {
  local py="python3"
  has python3 || py="python"

  if ! has "$py"; then
    warn "Python not found; skipping Python setup"
    return 0
  fi

  [[ -f requirements.txt || -f pyproject.toml ]] || return 0

  log "Python deps (.venv)"
  if [[ ! -d .venv ]]; then
    run_quiet "$py" -m venv .venv || die "Failed to create venv"
  fi

  # shellcheck disable=SC1091
  source .venv/bin/activate

  run_quiet python -m pip install -U pip setuptools wheel || true

  if [[ -f requirements.txt ]]; then
    run_quiet pip install -r requirements.txt || die "pip install -r requirements.txt failed"
  elif [[ -f pyproject.toml ]]; then
    if [[ -f poetry.lock ]]; then
      if ! has poetry; then run_quiet pip install poetry || die "Failed to install poetry"; fi
      run_quiet poetry config virtualenvs.create false --local || true
      run_quiet poetry install --no-interaction --no-ansi || die "poetry install failed"
    else
      run_quiet pip install . || die "pip install . failed"
    fi
  fi
}

###############################################################################
# 5) Supabase CLI (best-effort)
###############################################################################
supabase_project_detected() {
  [[ -d supabase || -f supabase/config.toml ]]
}

supabase_cmd() {
  if has supabase; then
    supabase "$@"
  elif [[ -x node_modules/.bin/supabase ]]; then
    node_modules/.bin/supabase "$@"
  elif has npx && [[ -f package.json ]]; then
    npx --yes supabase "$@"
  else
    return 127
  fi
}

ensure_supabase_cli() {
  supabase_project_detected || return 0
  supabase_cmd --version >/dev/null 2>&1 && return 0

  log "Supabase CLI (best-effort)"
  if [[ -f package.json ]] && has npm; then
    run_quiet npm install --save-dev supabase || warn "Could not install supabase locally"
  fi

  supabase_cmd --version >/dev/null 2>&1 && return 0

  if has npm; then
    run_quiet npm install -g supabase || warn "Could not install supabase globally"
  fi
}

###############################################################################
# 6) Migrations / build (best-effort)
###############################################################################
run_migrations() {
  log "Migrations (best-effort)"

  # Supabase local reset often needs Docker; don't fail snapshot if unavailable
  if supabase_project_detected && supabase_cmd --version >/dev/null 2>&1; then
    supabase_cmd db reset --local >/dev/null 2>&1 || warn "Supabase db reset skipped/failed (Docker may be unavailable)"
  fi

  # Prisma
  if [[ -f prisma/schema.prisma && -f package.json ]] && has npx; then
    npx --yes prisma generate >/dev/null 2>&1 || warn "prisma generate skipped/failed"
    npx --yes prisma migrate deploy >/dev/null 2>&1 || warn "prisma migrate deploy skipped/failed"
  fi

  # Django
  if [[ -f manage.py && -d .venv ]]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
    python manage.py migrate --noinput >/dev/null 2>&1 || warn "django migrate skipped/failed"
  fi
}

run_build() {
  [[ -f package.json ]] || return 0
  if has npm; then
    # Only run if build script exists
    if has jq && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
      log "Build (best-effort)"
      npm run build >/dev/null 2>&1 || warn "npm run build failed/skipped"
    fi
  fi
}

###############################################################################
# 7) Validation
###############################################################################
validate() {
  log "Validation"
  has node   && node -v || true
  has npm    && npm -v || true
  has bun    && bun -v || true
  has pnpm   && pnpm -v || true
  has yarn   && yarn -v || true
  has python3 && python3 -V || has python && python -V || true

  if [[ -d .venv ]]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
    python -c "import sys; print('venv:', sys.prefix)" || true
  fi

  supabase_cmd --version >/dev/null 2>&1 && supabase_cmd --version || true
}

main() {
  log "=== Jules Setup Script Starting ==="
  log "Root: $ROOT_DIR"

  install_system_deps
  write_env_example
  write_env_if_missing

  install_node_deps
  setup_python
  ensure_supabase_cli

  run_migrations
  run_build
  validate

  log "=== Setup Complete. Ready for Snapshot ==="
}

main "$@"
