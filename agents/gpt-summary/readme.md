# GPT‑Summary Agent

Tworzy 3‑4 zdaniowe „About Me” < 400 znaków, dopasowane do `target_role`.

## 🔑 Prompt (fragment)

System: "You are a senior CV copywriter…"
User: |
TARGET_ROLE: {context.target_role}
STACK: {skills list w/ levels}
KEY PROJECTS: {projects brief}
Write 3‑4 sentences (max 400 chars) in first‑person…