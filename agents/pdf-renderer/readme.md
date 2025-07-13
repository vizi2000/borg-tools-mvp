# PDF Renderer Agent

> **Engine:** [`@react-pdf/renderer`](https://react-pdf.org/)  
> **Fonts:** Inter (regular/bold) – wbudowane subsety, by trzymać rozmiar < 200 kB.

## 🎨 Design tokens

| Nazwa | Hex |
|-------|-----|
| `bg-dark` | `#0d0d0d` |
| `accent`  | `#39ff14` |
| `text`    | `#ffffff` |

## 🖼 Układ (A4)

1. **Header** – imię, rola, linki (ikony SVG inline)  
2. **Stack + Modernity bar** – grid 2×5, poziome paski siły  
3. **About** – blok hero (max 400 znaków)  
4. **Projects** – 3 karty, układ flex‑row  
5. **Timeline** – klasyczna lista pionowa

## 🏃‍♂️ CLI render

```bash
node render.js cv.json out.pdf
