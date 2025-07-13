# Borg‑Tools MVP

  

> **One‑click CV generator for developers.** Input = GitHub / LinkedIn profile → Output = single‑page PDF in **“Neon Tech on Black”** style. Built with Next.js 14, FastAPI & LangGraph.

---

## 📌 Table of Contents

1. [Overview](#overview)  •  [Features](#features)
2. [Architecture](#architecture)  •  [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)  •  [Environment Vars](#environment-variables)
4. [State‑of‑the‑Art Design System](#state-of-the-art-cv-design-system)
5. [Testing](#testing)  •  [CI / CD](#ci--cd)
6. [Contributing](#contributing)  •  [License](#license)

---

## Overview

Borg‑Tools MVP generuje profesjonalne CV z Twoich danych GitHub/LinkedIn w < 30 s (koszt ≤ 0,05 €) i hostuje PDF w Supabase Storage. Projekt służy jako **portfolio** i początek komercyjnego SaaS‑a.

## 🔄 Current Status (January 13, 2025)

**✅ AUTHENTICATION SYSTEM COMPLETE** (60% project completion)
- Complete GitHub OAuth implementation with JWT tokens  
- Frontend sign-in flow with error handling and visual testing validation
- Ready for database integration phase

### Features

- 🔗 **OAuth GitHub** – 1‑click import repozytoriów, języków, commitów.
- 🤖 **AI Orchestration (LangGraph)** – Claude 3 Haiku (ekstrakcja faktów) + GPT‑4o (summary).
- 🎨 **Single‑page PDF** – „Neon Tech on Black”, ATS‑ready, 200 kB, dark‑mode.
- 💾 **Supabase Storage** – share‑link ważny 24 h.
- 📊 **Observability** – Langfuse token tracing, Sentry error capture.

---

## Architecture

```mermaid
graph TD
  subgraph Frontend
    A[Next.js 14<br/>Tailwind / tRPC]
  end
  subgraph Backend
    B[FastAPI]
    C[GitHub Ingestor]
    D[LinkedIn Parser]
    E[LangGraph]
    F[Claude 3 Haiku]
    G[GPT‑4o]
    H[PDF Renderer]
  end
  subgraph Storage
    S[Supabase (Postgres + Storage)]
    V[Chroma DB]
  end
  A -- tRPC --> B
  B --> C
  B --> D
  C --> E
  D --> E
  E --> F
  E --> G
  E --> H
  H --> S
  E --> V
```

---

## Tech Stack

| Layer        | Tech                                             | Notes                        |
| ------------ | ------------------------------------------------ | ---------------------------- |
| Frontend     | **Next.js 14**, Tailwind CSS, tRPC, TypeScript 5 | App Router, RSC              |
| Backend API  | **FastAPI** (3.12)                               | Async, Pydantic v2           |
| Orchestrator | **LangGraph**                                    | ingest → extract → summarize |
| LLMs         | Claude 3 Haiku (90 %) • GPT‑4o (10 %)            | Cost vs quality              |
| Data         | Supabase (Postgres + Storage) • Chroma vector    | GitHub OAuth out‑of‑box      |
| CI/CD        | GitHub Actions ➜ Vercel (FE) / Fly.io (BE)       | Preview per PR               |

---

## Getting Started

### Prerequisites

- Node 20 + pnpm 8
- Python 3.12 + Poetry (or venv/pip)
- Supabase account (free tier)

### Local Dev

```bash
# 1. Clone & install
git clone <repository-url>
cd borg-tools-mvp
pnpm install

# 2. Environment setup
cp .env.example .env
# Fill in your API keys and configuration

# 2. Frontend (Next.js)
pnpm dev  # http://localhost:3000

# 3. Backend (FastAPI)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000
```

Open the app → „Login with GitHub” → „Generate CV”.

### Scripts

```bash
pnpm lint        # ESLint & Prettier
pnpm test        # Playwright FE + vitest unit tests
pytest           # backend tests
```

---

## Environment Variables

Create `` (root) and `` (frontend):

```dotenv
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Anthropic / OpenAI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Supabase
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE=
SUPABASE_BUCKET=cv-pdfs
```

> Full reference → [`RULES.md`](RULES.md)

---

## State‑of‑the‑Art CV Design System

### Leitmotif & Identity

| Element      | Value                                      | Why                     |
| ------------ | ------------------------------------------ | ----------------------- |
| Theme        | **Neon Tech on Black** (#0d0d0d ⇆ #39ff14) | High contrast, dev vibe |
| Brand Device | 4 px neon bar                              | Memorable               |

### Grid & Spacing

*12‑column*, 16 pt gutter (PDF) / 24 px (web); baseline 4 pt.

### Typography

Display: Space Grotesk 24 pt • H1: Inter Bold 16 pt • Body: Inter 10 pt.

### Colors

`primary` #39ff14 • `primary‑soft` #83ff8e (40 %) • `bg` #0d0d0d • `text` #fff.

### Components

Header • Stack Radar • About Me • Top Projects • Timeline.

### React‑PDF Key Styles

```jsx
const styles = StyleSheet.create({...});
```

### Checklist

- PDF ≤ 200 kB, 1 font request
- Contrast ≥ AA
- ATS parse passes
- Lighthouse perf/a11y = 100

---

## Testing

```bash
pytest -q            # backend unit/contract tests
pnpm test            # frontend unit/E2E
pnpm run coverage    # coverage summary
```

Coverage gate: **≥ 90 %** core logic.

---

## CI / CD

- **GitHub Actions**: lint → test → build → deploy preview.
- Merge to `main` ⇒ auto‑deploy **staging**.
- Manual promote to **production** (tag `release/*`).

Observability: Langfuse traces + Sentry errors; OpenTelemetry tracing across FE/BE.

---

## Contributing

We follow **Clean Architecture** & "One file → One function" rule.\
Before PR:

1. Read [`RULES.md`](RULES.md).
2. Open task in `TASK.md`.
3. Add tests & docs.\
   PR template will check all items.

---

## License

[MIT](LICENSE) © 2025 Borg‑Tools.

---

## Acknowledgements

- [Linear.app](https://linear.app) for design inspiration.
- [React‑PDF](https://react-pdf.org/) – PDF renderer.
- [LangGraph](https://github.com/langchain-ai/langgraph) – state machine orchestration.

