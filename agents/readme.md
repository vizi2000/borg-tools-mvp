
---

## 3 / agents/README.md

```md
# Agents layer

Każdy *agent* to **pojedyncza, idempotentna funkcja** w łańcuchu LangGraph.  
Reguła: brak importów między agentami – czysta iniekcja dependencji.

| Katalog | Odpowiedzialność | Wejście ➜ Wyjście |
|---------|------------------|-------------------|
| `github-ingestor/` | pobiera repozytoria, języki, commity | `gh_token` ➜ `repos_json` |
| `linkedin-parser/` | (opc.) PDF/HTML LinkedIn ➜ parsowanie sekcji | `linkedin_pdf` ➜ `profile_json` |
| `claude-extractor/` | Claude 3: ekstrakcja skills / projects | `repos_json` ➜ `extracted_json` |
| `gpt-summary/` | GPT‑4o: 3‑zdaniowe „About Me” | `extracted_json` ➜ `about_text` |
| `pdf-renderer/` | React‑PDF: 1‑stronicowy CV PDF | `cv_json` ➜ `cv.pdf` |
| `storage-uploader/` | Upload PDF do Supabase / R2 | `cv.pdf` ➜ `public_url` |
