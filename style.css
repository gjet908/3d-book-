
:root {
  --bg: #0a0908;
  --ivory: #efe1c4;
  --brass: #c9a769;
  --brass-dim: rgba(201, 167, 105, 0.55);
  --ink: #d9cdb3;
  --font-display: 'Cormorant Garamond', 'Iowan Old Style', serif;
  --font-ui: 'Inter', -apple-system, sans-serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--ink);
  overflow-x: hidden;
}

body {
  font-family: var(--font-ui);
  cursor: default;
}

/* The document is tall so the user can scroll; the canvas itself never moves */
.scroll-spacer {
  position: relative;
  width: 100%;
  height: 650vh;
  pointer-events: none;
}

#canvas-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background: var(--bg);
}

#webgl {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---------- Cinematic overlays ---------- */

.vignette {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%);
}

.grain {
  position: fixed;
  inset: -50px;
  z-index: 2;
  pointer-events: none;
  opacity: 0.035;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---------- UI chrome ---------- */

.ui-top {
  position: fixed;
  top: 32px;
  left: 36px;
  z-index: 5;
  pointer-events: none;
}

.ui-title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 18px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ivory);
  opacity: 0.85;
}

.ui-hint {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.ui-hint-label {
  font-family: var(--font-ui);
  font-weight: 300;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ink);
  opacity: 0.65;
}

.hint-rail {
  position: relative;
  width: 1px;
  height: 34px;
  background: rgba(217, 205, 179, 0.2);
  overflow: hidden;
}

.hint-dot {
  position: absolute;
  left: -1px;
  top: -8px;
  width: 3px;
  height: 8px;
  border-radius: 2px;
  background: var(--brass);
  animation: hintTravel 2.2s ease-in-out infinite;
}

@keyframes hintTravel {
  0%   { transform: translateY(0);    opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateY(42px); opacity: 0; }
}

.ui-finale {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -46%);
  z-index: 5;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  width: 90%;
  max-width: 520px;
}

.finale-text {
  margin: 0 0 26px;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(26px, 4vw, 38px);
  color: var(--ivory);
  letter-spacing: 0.01em;
}

.finale-btn {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ivory);
  background: transparent;
  border: 1px solid var(--brass-dim);
  padding: 15px 34px;
  cursor: pointer;
  transition: background 0.35s ease, color 0.35s ease, border-color 0.35s ease;
}

.finale-btn:hover,
.finale-btn:focus-visible {
  background: var(--brass);
  color: #14100d;
  border-color: var(--brass);
}

.finale-btn:focus-visible {
  outline: 2px solid var(--ivory);
  outline-offset: 3px;
}

/* ---------- Loader ---------- */

#loader {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.8s ease, visibility 0.8s ease;
}

#loader.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.loader-mark {
  display: flex;
  gap: 6px;
}

.loader-mark span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brass);
  opacity: 0.35;
  animation: loaderPulse 1.1s ease-in-out infinite;
}

.loader-mark span:nth-child(2) { animation-delay: 0.15s; }
.loader-mark span:nth-child(3) { animation-delay: 0.3s; }

@keyframes loaderPulse {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.4); }
}

/* ---------- Responsive ---------- */

@media (max-width: 768px) {
  .ui-top { top: 22px; left: 22px; }
  .ui-title { font-size: 14px; letter-spacing: 0.1em; }
  .ui-hint { bottom: 26px; }
  .finale-text { font-size: 24px; }
  .finale-btn { padding: 13px 26px; }
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .hint-dot { animation: none; opacity: 0.7; }
  #loader { transition: none; }
}
