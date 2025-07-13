# Project Rules & Guidelines

> **Purpose:** Ensure **clean code**, **state‑of‑art design**, high security and predictable delivery across a distributed team of senior‑level developers.
> These rules are **binding** for every commit, pull‑request, automation run and deployment.

---

## 1. Core Principles

| Principle | Why it matters |
|-----------|----------------|
| **One file → One function / component** | Enforces SRP, simplifies testing & code review. |
| **Clean Architecture** | Domain‑driven, dependency‑inverted layers → maintainable over years. |
| **State‑of‑the‑Art Design & Fast Modern Tech** | End‑user WOW + performance (<100 ms P95 API). |
| **Fail‑Fast, Test‑First** | Bugs caught locally, not in prod. |
| **Docs == Code** | Up‑to‑date knowledge base; bus‑factor > 1. |

---

## 2. AI Behavior & Safety

1. **Never assume anything. If context or data is missing, ask clarifying questions immediately.**
2. **No hallucinated libraries / functions.** Use only verified, production‑ready packages.
3. **Validate file paths & module names** before referencing.
4. **No hard‑coded secrets.** Load via `.env` ⟶ `os.getenv()` / secret manager.
5. **Do not overwrite existing code** unless the change is explicitly scoped in `TASK.md`.

---

## 3. Development Workflow

1. **Task lifecycle**  
   `PLANNING.md` → high‑level roadmap • `TASK.md` → granular tasks.
   - Start: read both files; add new task if missing (date‑stamped).  
   - Finish: tick task ✅ & link PR.
2. **Branch naming**: `type/T{id}-{slug}` (e.g. `feat/T12-github-oauth`).
3. **Conventional Commits** with task ID `(Txx)`.
4. **Pull Requests** require:
   - ✅ green CI (lint + test + build)  
   - ≥ 1 senior reviewer approval.
5. **Continuous Delivery**  
   Every merged PR auto‑deploys to **`staging`**. Manual promote to **`prod`** after smoke tests.
6. **Documentation update** is part of *every* PR (README, CHANGELOG, or inline docs).

---

## 4. Technology Stack, Code Style & Conventions

### Authoritative Stack (must mirror `README.md`)

| Layer | Tech | Notes |
|-------|------|-------|
| **Frontend** | **Next.js 14** (App Router, React Server Components), **Tailwind CSS**, **tRPC** | TypeScript ≥ 5.0, Strict Mode |
| **Backend API** | **FastAPI** on Python 3.12 | Async, Pydantic v2 validation |
| **Orchestrator** | **LangGraph** | ingest → extract → summarize state machine |
| **LLMs** | **Claude 3 Haiku** (90 %) , **GPT‑4o** (10 %) | Cost vs quality split |
| **Data** | **Supabase Postgres + Storage**, **Chroma** vector DB | Use `asyncpg` or `SQLModel` if ORM needed |
| **Monitoring** | **Langfuse**, **Sentry** | Token + latency tracing, error capture |
| **CI/CD** | **GitHub Actions** → **Vercel** (FE) / **Fly.io** (BE) | Preview per PR, auto‑deploy staging |

### Style Rules

- **Python**
  - Formatter: `black` ; Linter: `ruff` ; Typing: `mypy --strict`.
  - Follow **PEP8** and use **type hints** everywhere.
  - Docstrings: Google style.
  - One public function per file.
- **TypeScript / React**
  - Formatter: `prettier` ; Linter: `ESLint @typescript-eslint`.
  - No implicit `any` ; enable `strictNullChecks`.
- **Validation & API contracts**
  - Use **Pydantic v2** for request/response models.
  - Treat OpenAPI schema as contract; run contract tests (`pytest`) per task.

### Directory & Import Rules

- **Domain layer** ← no imports from infra layers (Clean Architecture).
- Shared constants/types reside in `core/`.
- Public API surface documented in module `__init__.py`.

---

## 5. Testing & Quality Gates

| Layer | Tooling | Requirement |
|-------|---------|-------------|
| Unit | `pytest` + fakery | ≥ 90 % coverage on core logic |
| Contract / API | `pytest` + `httpx` | All endpoints, JSON schema validation |
| E2E (Web) | Playwright | Critical user flows |
| Static Analysis | `ruff`, `mypy --strict` | Zero errors/warnings |
| Performance | Locust / k6 | P95 latency < 100 ms for `/generate` |

- **Test‑every‑task**: each task PR must add/extend tests.
- **CI**: GitHub Actions matrix (linux, mac, win if sensible).

---

## 6. Deployment Pipeline

1. **Preview**: every PR deploys ephemeral environment (`vercel.dev`, `fly.dev` Preview App).
2. **Staging**: `main` branch → staging env; auto smoke‑tests.
3. **Production**: protected branch/tag ➜ manual promote.
4. **Versioning**: Semantic (MAJOR.MINOR.PATCH) via `release/*` branches + GitHub Releases.

---

## 7. Documentation

- **README.md** – quick‑start, stack, env vars.
- **RULES.md** (this file) – must stay current.
- **PLANNING.md** – high‑level design, diagrams.
- **CHANGELOG.md** – auto‑generated from Conventional Commits.
- **Code comments** for non‑obvious logic (`# Reason:`…).

---

## 8. Security & Compliance

- **Dependency pinning** in `requirements.txt` (backend) & `pnpm-lock.yaml` (frontend).
- **RenovateBot** auto PRs for updates; must pass tests before merge.
- **OWASP Top 10** review sprint each quarter.
- **Sentry** + **Langfuse** for observability; PII scrubber enabled.

---

## 9. Project Hygiene Checklist (per task)

1. [ ] Added/updated unit tests.
2. [ ] Updated documentation.
3. [ ] Lint & type‑check pass locally.
4. [ ] One file ⇢ one function/component.
5. [ ] No new secrets in code.
6. [ ] Feature deployed to staging & verified.
7. [ ] Task marked done in `TASK.md`.

---

## 10. Advanced Excellence Add‑Ons

### 10.1 Observability & Logging
- **Structured logging** (JSON) via `structlog` / `winston`; always include `trace_id`, `user_id` (hashed) and `request_id` for correlation.
- **OpenTelemetry** tracing across FE (Next.js) ➜ BE (FastAPI) ➜ database.
- **Log levels:** debug, info, warn, error, critical – no `print()`.

### 10.2 Accessibility & UX (A11y)
- Meet **WCAG 2.1 AA** contrast ratios; validate via `axe‑core` CI.
- All interactive elements keyboard‑navigable; ESLint plugin `jsx‑a11y` errors treated as build fails.
- Provide `aria‑label` / `aria‑description` on all SVG icons.

### 10.3 Performance Budgets
| Metric | Target |
|--------|--------|
| LCP (largest contentful paint) | < 1.2 s on 3G fast (web preview) |
| FID / INP | < 100 ms |
| API cold‑start | < 300 ms on Fly.io tiny |
| PDF generation | < 2 s (hot path), < 30 s (cold path, 50 MB repo) |

Automated Lighthouse & k6 run nightly; failure blocks merge next day.

### 10.4 Security Scanning
- **Static analysis:** `bandit`, `semgrep`; secrets scanning via **TruffleHog** – all in CI.
- **Dependency vulnerability:** GitHub Dependabot & `pip‑audit` / `npm‑audit` fail pipeline on severe CVEs.
- **Feature flags** for experimental endpoints; disabled by default in prod.
- **Branch protection:** signed commits, required reviews, status checks.

### 10.5 Architecture Decision Records (ADR)
- Each significant technical choice logged in `/docs/adr/ADR‑YYYY‑MM‑DD‑slug.md` (template included).
- ADR must be referenced in PR body when implemented.

---

> **Remember:** *Speed is feature*, ale **jakość > ilość**. Follow these rules and we ship state‑of‑art software, not tech‑debt. 🚀

