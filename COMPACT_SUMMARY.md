# BORG-TOOLS MVP - COMPACT SUMMARY

## 🎯 Project Overview
**One-click CV generator** converting GitHub/LinkedIn → Professional PDF  
**Stack**: Next.js 14 + FastAPI + LangGraph + Supabase  
**Design**: Neon Tech on Black (#0d0d0d bg, #39ff14 accent)

## 📊 Current Status: 75% Complete (Jan 15, 2025)

### ✅ COMPLETED
1. **Authentication System**
   - GitHub OAuth flow with JWT tokens
   - Secure session management
   - Frontend auth UI with error handling

2. **Database Integration**
   - Supabase schema deployed (users, cv_generations, auth_sessions, usage_stats)
   - UserRepository & AuthSessionRepository implemented
   - RLS policies configured

3. **Frontend Core**
   - Dashboard with CV generation form
   - Protected routes with auth context
   - Demo mode for testing

### 🔧 REMAINING TASKS
1. **Fix**: Frontend/backend auth response mismatch in `/api/auth/me`
2. **Implement**: CV generation endpoint `/api/cv/generate`
3. **Implement**: CV history endpoint `/api/cv/history`
4. **Connect**: LangGraph agents for AI processing

## 🚀 Quick Start
```bash
# Run everything on port 3333
docker-compose up --build

# Access
Frontend: http://localhost:3333
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
```

## 📁 Key Files Modified
- `backend/src/api/v1/endpoints/auth.py` - OAuth implementation
- `backend/src/core/supabase.py` - Database client
- `backend/src/repositories/*` - Data layer (complete)
- `src/app/dashboard/page.tsx` - Main UI
- `src/components/auth/auth-context.tsx` - Auth state

## 🎯 Next Sprint Focus
Transform GitHub/LinkedIn data → PDF using LangGraph pipeline:
1. GitHub API → Extract repos, languages, commits
2. Claude 3 Haiku → Parse technical skills
3. GPT-4o → Generate professional summary
4. React-PDF → Render "Neon Tech" design
5. Supabase Storage → Host PDF with 24h link

## 🔑 Environment Variables Needed
```env
# Frontend
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
JWT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENROUTER_API_KEY=
```

## 📈 Performance Targets
- API latency: <100ms (P95)
- PDF generation: <2s hot, <30s cold
- Frontend LCP: <1.2s on 3G
- PDF size: <200KB

## 🛠️ Development Commands
```bash
# Frontend
pnpm lint && pnpm typecheck

# Backend
black . && ruff . && mypy . --strict

# Testing
pnpm test
pytest
```

---
**Ready for CV Generation Pipeline Implementation** 🚀