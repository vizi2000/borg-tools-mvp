
---

## 9 / agents/storage‑uploader/README.md

```md
# Storage Uploader Agent

Wysyła wygenerowany PDF do **Supabase Storage** (lub Cloudflare R2) 
i zwraca publiczny URL.

## 📦 Env

| Zmienna | Opis |
|---------|------|
| `SUPABASE_URL` | URL projektu |
| `SUPABASE_SERVICE_ROLE` | Secret Key (service role) |
| `SUPABASE_BUCKET` | np. `cv-pdfs` |

## 🖥 Przykład

```bash
python agents/storage-uploader/main.py out.pdf
# → https://cv-files.supabase.co/storage/v1/object/public/cv-pdfs/wojciech-cv.pdf
