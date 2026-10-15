
# Happy Birthday Naved 🎂

A cinematic 3D birthday website built with HTML, CSS, JavaScript and [Three.js](https://threejs.org/). It features a slowly rotating three-tier cake with flickering candles, golden particles, twinkling stars, falling confetti, mouse parallax, and a "Celebrate ✨" finale.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and library loading |
| `style.css` | Layout, typography, colors, responsive rules |
| `script.js` | 3D scene, confetti, animation sequence, buttons |
| `README.md` | This guide |

Three.js (r128) and the Cinzel / Cormorant Garamond fonts load from CDNs, so an internet connection is needed the first time you open the page.

## Run it locally

**Option 1 – double-click:** open `index.html` in Chrome, Edge, Firefox or Safari.

**Option 2 – local server (recommended):** from this folder run one of:

```bash
python3 -m http.server 8000
# or
npx serve
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a free account at [github.com](https://github.com) and click **New repository**. Name it something like `naved-birthday` and set it to **Public**.
2. Upload all four files (`index.html`, `style.css`, `script.js`, `README.md`) to the repository root using **Add file → Upload files**, then **Commit changes**.
   Or with Git:
   ```bash
   git init
   git add .
   git commit -m "Birthday website for Naved"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/naved-birthday.git
   git push -u origin main
   ```
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose branch **main** and folder **/ (root)**, then click **Save**.
5. Wait one to two minutes. Your site will be live at:
   `https://YOUR-USERNAME.github.io/naved-birthday/`
6. Share that link with Naved.

## Customize

- **Name:** edit the `<h1 class="name">` text and the `<title>` in `index.html`.
- **Wish message:** edit the `<p id="wish">` text in `index.html`.
- **Colors:** change the CSS variables at the top of `style.css` and the tier colors in `script.js` (the `tiers` array).
- **Timing:** adjust the `later(...)` delays inside `play()` in `script.js`.

## Notes

- Works on phones and desktops; the cake is always centered and sized to fit between the heading and the buttons.
- Respects the "reduce motion" system setting with calmer, lighter effects.
- If WebGL is unavailable, the page still shows the message, confetti and buttons without the 3D cake.
