# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Borg-Tools MVP is a one-click CV generator for developers that converts GitHub/LinkedIn profiles into professional PDFs with a "Neon Tech on Black" design. Built with Next.js 14, FastAPI, and LangGraph.

## Common Development Commands

### Local Development (Docker - REQUIRED)
```bash
# Build and start all services on port 3333
docker-compose up --build   # http://localhost:3333

# Stop all services
docker-compose down

# View logs
docker-compose logs frontend
docker-compose logs backend
```

### Frontend (Next.js)
```bash
# Install dependencies
pnpm i

# Development server (use Docker instead for full stack)
pnpm dev                    # http://localhost:3000

# Code quality
pnpm lint                   # ESLint & Prettier
pnpm typecheck             # TypeScript type checking

# Testing
pnpm test                   # Playwright E2E + vitest unit tests
pnpm run coverage          # Coverage report
```

### Backend (FastAPI)
```bash
# Setup Python environment
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Development server
uvicorn main:app --reload   # http://localhost:8000

# Code quality
black .                     # Format Python code
ruff .                      # Lint Python code
mypy . --strict            # Type check Python code

# Testing
pytest                      # Run all backend tests
pytest -q                   # Run tests quietly
pytest -k "test_name"       # Run specific test
```

## High-Level Architecture

### System Flow
```
GitHub/LinkedIn → FastAPI → LangGraph → AI Agents → PDF → Supabase Storage
```

### Key Components

1. **Frontend (/)** - Next.js 14 App Router
   - OAuth integration with GitHub
   - tRPC for type-safe API calls
   - Tailwind CSS with "Neon Tech on Black" theme

2. **Backend (/backend)** - FastAPI
   - Async Python 3.12 with Pydantic v2
   - Orchestrates CV generation pipeline
   - Integrates with GitHub API and LinkedIn parsing

3. **AI Agents (/agents)** - LangGraph state machine
   - `claude-extractor/` - Claude 3 Haiku for data extraction
   - `gpt-summary/` - GPT-4o for professional summaries
   - `linkedin-parser/` - LinkedIn profile parsing
   - `pdf-renderer/` - React-PDF generation
   - `storage-uploader/` - Supabase storage management

4. **Storage**
   - Supabase Postgres for user data
   - Supabase Storage for generated PDFs (24h share links)
   - Chroma vector DB for embeddings

### Design System
- Theme: "Neon Tech on Black" (#0d0d0d background, #39ff14 accent)
- Typography: Space Grotesk (display), Inter (body)
- Single-page PDF, ATS-ready, <200KB

## Critical Development Rules

1. **Docker-First Development** - ALWAYS use `docker-compose up --build` for local testing on port 3333
2. **Deploy After Every Change** - After each feature/component, deploy locally and test at http://localhost:3333
3. **One file = One function/component** - Enforce single responsibility
4. **Clean Architecture** - Domain layer has no infrastructure imports
5. **Test-First** - Add tests for every new feature
6. **Type Safety** - TypeScript strict mode, mypy --strict for Python
7. **No hardcoded secrets** - Use environment variables

## Task Management

- Tasks tracked in `TASK.md` with date stamps
- Branch naming: `type/T{id}-{slug}` (e.g., `feat/T12-github-oauth`)
- Commit format: `type(scope): message (Txx)`
- All PRs require green CI and ≥1 review

## Performance Targets

- API P95 latency: <100ms
- PDF generation: <2s (hot), <30s (cold)
- Frontend LCP: <1.2s on 3G

## Security Requirements

- OAuth tokens in secure storage only
- API rate limiting enforced
- Input validation with Pydantic v2
- No PII in logs (Sentry PII scrubber enabled)