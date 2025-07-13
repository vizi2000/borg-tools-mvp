
---

## 2 / backend/README.md

```md
# Backend (FastAPI)

Odpowiada za:
1. autoryzację GitHub OAuth (wariant B – token w cookie HttpOnly),
2. maszynę stanów LangGraph,
3. render PDF i wysyłkę do Supabase Storage.

## ⚙️ Local setup

```bash
cd backend
cp ../.env.example .env
pip install -r requirements.txt
uvicorn main:app --reload
