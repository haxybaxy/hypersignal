set shell := ["zsh", "-cu"]

api := "apps/api"

# List recipes
default:
    @just --list

# One-time setup: pnpm via corepack, JS deps, Python deps
setup:
    corepack enable
    corepack prepare pnpm@10.34.5 --activate
    pnpm install
    uv sync --project {{api}}

# Run API and web dev servers together
dev:
    pnpm run dev

# Run only the web dev server (http://localhost:5173)
dev-web:
    pnpm run dev:web

# Run only the API dev server (http://localhost:8000)
dev-api:
    pnpm run dev:api

# Lint both apps
lint:
    pnpm run lint

# Format both apps
fmt:
    pnpm run fmt

# Type-check both apps
typecheck:
    pnpm run typecheck

# Run both test suites
test:
    pnpm run test

# Lint, type-check and test everything
check:
    pnpm run check

# Build and start the Docker Compose stack (web on :8080, api on :8000)
up:
    docker compose up --build -d

# Stop the Docker Compose stack
down:
    docker compose down

# Tail Docker Compose logs
logs:
    docker compose logs -f
