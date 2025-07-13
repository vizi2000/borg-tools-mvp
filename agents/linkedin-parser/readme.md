
---

## 5 / agents/linkedin‑parser/README.md

```md
# LinkedIn Parser Agent  *(opcjonalny)*

> **Uwaga**: oficjalne API LinkedIn wymaga heavy‑review.  
> MVP używa **uploadu PDF profilu** i parsuje go OCR‑em.

## 🔍 Funkcje
1. Wyodrębnia imię + nazwisko, nagłówek („Headline”), lokalizację.
2. Szuka sekcji **About**, **Experience**.
3. Buduje wektor kluczowych słów dla Claude’a.

## 🖇 Wejścia
| Nazwa | Typ | Opis |
|-------|-----|------|
| `linkedin_pdf` | bytes | surowy upload PDF |

## 🗂 Wyjście
```json
{
  "headline": "Co‑Founder & CTO at Xpress Delivery",
  "location": "Wrocław, Poland",
  "about": "…",
  "keywords": ["logistics", "last‑mile", "startups"]
}
