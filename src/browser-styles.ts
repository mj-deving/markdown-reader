// browser-styles.ts — Enhanced browser shell CSS
//
// Adds: sidebar TOC, toolbar, page-on-canvas, LaTeX-like typography,
// theme toggle, progress bar, responsive layout. Overrides styles.ts
// via higher specificity (same pattern as Tauri app.css).
//
// Key constraint: styles.ts is shared with Tauri and must not change.
// All visual upgrades live here and layer on top.

export const BROWSER_CSS = `
/* ── CSS Variables ────────────────────────────────────────────────────────── */
:root {
  --sidebar-width: 260px;
  --toolbar-height: 42px;

  /* Canvas: warm reading environment */
  --canvas-bg: #f4f3f1;
  --page-bg: #ffffff;
  --page-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04);

  /* Toolbar */
  --toolbar-bg: #ffffff;
  --toolbar-border: #e5e7eb;
  --toolbar-text: #6b7280;

  /* Sidebar */
  --sidebar-bg: #f8f9fa;
  --sidebar-border: #e5e7eb;

  /* TOC */
  --toc-link-color: #4b5563;
  --toc-link-hover: #1f2937;
  --toc-title-color: #374151;
  --toc-active-bg: rgba(99, 102, 241, 0.08);
  --toc-active-border: #6366f1;
  --toc-active-color: #4338ca;

  /* Accent */
  --accent: #6366f1;

  /* Scrollbar */
  --scrollbar-thumb: rgba(0, 0, 0, 0.15);
  --scrollbar-thumb-hover: rgba(0, 0, 0, 0.28);
  --scrollbar-track: transparent;

  /* Back-to-top */
  --btt-bg: rgba(255, 255, 255, 0.9);
  --btt-color: #6b7280;
  --btt-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* ── Dark theme (system preference) ──────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root {
    --canvas-bg: #111113;
    --page-bg: #1a1a1e;
    --page-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);

    --toolbar-bg: #1a1a1e;
    --toolbar-border: #2d2d32;
    --toolbar-text: #9ca3af;

    --sidebar-bg: #16161a;
    --sidebar-border: #2d2d32;

    --toc-link-color: #9ca3af;
    --toc-link-hover: #e5e7eb;
    --toc-title-color: #d1d5db;
    --toc-active-bg: rgba(129, 140, 248, 0.12);
    --toc-active-border: #818cf8;
    --toc-active-color: #a5b4fc;

    --scrollbar-thumb: rgba(255, 255, 255, 0.12);
    --scrollbar-thumb-hover: rgba(255, 255, 255, 0.22);

    --btt-bg: rgba(30, 30, 34, 0.9);
    --btt-color: #9ca3af;
    --btt-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
}

/* ── Dark theme (explicit toggle) ────────────────────────────────────────── */
html[data-theme="dark"] {
  --canvas-bg: #111113;
  --page-bg: #1a1a1e;
  --page-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);

  --toolbar-bg: #1a1a1e;
  --toolbar-border: #2d2d32;
  --toolbar-text: #9ca3af;

  --sidebar-bg: #16161a;
  --sidebar-border: #2d2d32;

  --toc-link-color: #9ca3af;
  --toc-link-hover: #e5e7eb;
  --toc-title-color: #d1d5db;
  --toc-active-bg: rgba(129, 140, 248, 0.12);
  --toc-active-border: #818cf8;
  --toc-active-color: #a5b4fc;

  --scrollbar-thumb: rgba(255, 255, 255, 0.12);
  --scrollbar-thumb-hover: rgba(255, 255, 255, 0.22);

  --btt-bg: rgba(30, 30, 34, 0.9);
  --btt-color: #9ca3af;
  --btt-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* ── Light theme (explicit toggle) ───────────────────────────────────────── */
html[data-theme="light"] {
  --canvas-bg: #f4f3f1;
  --page-bg: #ffffff;
  --page-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04);

  --toolbar-bg: #ffffff;
  --toolbar-border: #e5e7eb;
  --toolbar-text: #6b7280;

  --sidebar-bg: #f8f9fa;
  --sidebar-border: #e5e7eb;

  --toc-link-color: #4b5563;
  --toc-link-hover: #1f2937;
  --toc-title-color: #374151;
  --toc-active-bg: rgba(99, 102, 241, 0.08);
  --toc-active-border: #6366f1;
  --toc-active-color: #4338ca;

  --scrollbar-thumb: rgba(0, 0, 0, 0.15);
  --scrollbar-thumb-hover: rgba(0, 0, 0, 0.28);

  --btt-bg: rgba(255, 255, 255, 0.9);
  --btt-color: #6b7280;
  --btt-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* ── Body: CSS Grid shell ────────────────────────────────────────────────── */
body {
  display: grid;
  grid-template-rows: var(--toolbar-height) 1fr;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100vh;
  overflow: hidden;
  background: var(--canvas-bg);
  /* Override styles.ts body padding */
  padding: 0;
  /* Override styles.ts font to serif for LaTeX feel */
  font-family: 'Latin Modern Roman', 'Palatino Linotype', Palatino,
    'Book Antiqua', Georgia, 'Times New Roman', serif;
}

/* Sidebar collapsed: content spans full width */
body.sidebar-collapsed #content {
  grid-column: 1 / -1;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
#toolbar {
  grid-column: 1 / -1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  height: var(--toolbar-height);
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
  position: relative;
  z-index: 20;
  -webkit-user-select: none;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter',
    'Helvetica Neue', Arial, sans-serif;
}

#toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--toolbar-text);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-size: 1rem;
}

#toolbar button:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--toc-link-hover);
}

html[data-theme="dark"] #toolbar button:hover,
html[data-theme="dark"] #toolbar button:hover {
  background: rgba(255, 255, 255, 0.08);
}

@media (prefers-color-scheme: dark) {
  #toolbar button:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

#toolbar button[title]::after {
  content: none;
}

#doc-title {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--toolbar-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

/* ── Progress Bar ────────────────────────────────────────────────────────── */
#progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0%;
  background: var(--accent);
  transition: width 100ms;
  pointer-events: none;
}

/* ── TOC Sidebar ─────────────────────────────────────────────────────────── */
#toc-sidebar {
  grid-row: 2;
  grid-column: 1;
  width: var(--sidebar-width);
  height: calc(100vh - var(--toolbar-height));
  overflow-y: auto;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  padding: 1rem 0;
  transition: transform 0.25s ease;
  z-index: 10;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter',
    'Helvetica Neue', Arial, sans-serif;
}

/* Sidebar collapse: slide out */
body.sidebar-collapsed #toc-sidebar {
  transform: translateX(-100%);
  position: absolute;
  top: var(--toolbar-height);
  left: 0;
}

/* ── Content area ────────────────────────────────────────────────────────── */
#content {
  grid-row: 2;
  grid-column: 2;
  height: calc(100vh - var(--toolbar-height));
  overflow-y: auto;
  padding: 2.5rem 1.5rem 4rem;
  background: var(--canvas-bg);
}

/* ── Page-on-canvas: article as a "printed page" ─────────────────────────── */
#content article.prose {
  max-width: 720px;
  margin: 0 auto;
  background: var(--page-bg);
  box-shadow: var(--page-shadow);
  border-radius: 3px;
  padding: 3.5rem 4rem 4.5rem;
  contain: content;

  /* LaTeX-like typography */
  font-family: inherit;
  font-size: 18px;
  line-height: 1.8;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'liga' 1, 'calt' 1, 'kern' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  hyphens: auto;
  -webkit-hyphens: auto;
}

/* ── Heading overrides: LaTeX style (no borders, clean hierarchy) ─────────── */
#content article.prose h1,
#content article.prose h2,
#content article.prose h3,
#content article.prose h4,
#content article.prose h5,
#content article.prose h6 {
  font-family: inherit;
  border: none;
  padding-bottom: 0;
}

#content article.prose h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 1.2rem;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

#content article.prose h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 2.8rem;
  margin-bottom: 0.8rem;
  letter-spacing: -0.005em;
  line-height: 1.25;
}

#content article.prose h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2.2rem;
  margin-bottom: 0.6rem;
  line-height: 1.3;
}

#content article.prose h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.8rem;
  margin-bottom: 0.5rem;
  font-variant: small-caps;
  text-transform: none;
  letter-spacing: 0.03em;
  color: var(--fg);
}

/* ── Paragraphs ──────────────────────────────────────────────────────────── */
#content article.prose p {
  margin-bottom: 1.3rem;
  text-align: left;
}

/* ── Links in prose: scholarly style ─────────────────────────────────────── */
#content article.prose a {
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: color 0.15s;
}

/* ── Blockquotes: elegant serif italic ───────────────────────────────────── */
#content article.prose blockquote {
  font-style: italic;
  border-radius: 0;
  padding: 0.8rem 1.5rem;
  margin: 1.8rem 0;
}

/* ── Code blocks: slightly inset from prose ──────────────────────────────── */
#content article.prose pre {
  border-radius: 4px;
  margin: 1.8rem 0;
}

/* ── Lists ───────────────────────────────────────────────────────────────── */
#content article.prose ul,
#content article.prose ol {
  margin-bottom: 1.3rem;
}

#content article.prose li {
  margin-bottom: 0.35rem;
}

/* ── Tables ──────────────────────────────────────────────────────────────── */
#content article.prose table {
  font-size: 0.9rem;
  border-radius: 4px;
}

/* ── Horizontal rules: subtle ────────────────────────────────────────────── */
#content article.prose hr {
  margin: 3rem auto;
  max-width: 200px;
  border-top-color: var(--border);
}

/* ── Images: centered with subtle frame ──────────────────────────────────── */
#content article.prose img {
  display: block;
  margin: 1.5rem auto;
  border-radius: 3px;
}

/* ── TOC styling ─────────────────────────────────────────────────────────── */
.toc {
  padding: 0 0.75rem;
}

.toc-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--toc-title-color);
  padding: 0 0.75rem;
  margin-bottom: 0.75rem;
}

.toc-link {
  display: block;
  padding: 0.3rem 0.75rem;
  font-size: 0.83rem;
  line-height: 1.4;
  color: var(--toc-link-color);
  text-decoration: none;
  border-radius: 4px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.toc-link:hover {
  color: var(--toc-link-hover);
  background: rgba(0, 0, 0, 0.04);
}

@media (prefers-color-scheme: dark) {
  .toc-link:hover { background: rgba(255, 255, 255, 0.05); }
}
html[data-theme="dark"] .toc-link:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* TOC active state */
.toc-link.toc-active {
  border-left-color: var(--toc-active-border);
  background: var(--toc-active-bg);
  color: var(--toc-active-color);
}

/* TOC hierarchy: indent + visual weight per level */
.toc-level-0 { padding-left: 0.75rem; font-weight: 600; font-size: 0.85rem; }
.toc-level-1 { padding-left: 1.5rem; font-weight: 500; font-size: 0.84rem; }
.toc-level-2 { padding-left: 2.25rem; font-weight: 400; font-size: 0.82rem; opacity: 0.8; }
.toc-level-3 { padding-left: 3rem; font-weight: 400; font-size: 0.78rem; opacity: 0.65; }
.toc-level-4 { padding-left: 3.75rem; font-weight: 400; font-size: 0.78rem; opacity: 0.6; }
.toc-level-5 { padding-left: 4.5rem; font-weight: 400; font-size: 0.76rem; opacity: 0.55; }

.toc-empty {
  color: var(--toc-link-color);
  font-size: 0.85rem;
  font-style: italic;
  padding: 0 0.75rem;
}

/* ── Back-to-top button ──────────────────────────────────────────────────── */
#back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--toolbar-border);
  background: var(--btt-bg);
  color: var(--btt-color);
  box-shadow: var(--btt-shadow);
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.25s, transform 0.25s;
  pointer-events: none;
  z-index: 30;
}

#back-to-top.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

#back-to-top:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* ── Custom scrollbar ────────────────────────────────────────────────────── */
#content::-webkit-scrollbar,
#toc-sidebar::-webkit-scrollbar {
  width: 8px;
}

#content::-webkit-scrollbar-track,
#toc-sidebar::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

#content::-webkit-scrollbar-thumb,
#toc-sidebar::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

#content::-webkit-scrollbar-thumb:hover,
#toc-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* ── Focus-visible accessibility ─────────────────────────────────────────── */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

#toolbar button:focus-visible {
  outline-offset: -2px;
}

.toc-link:focus-visible {
  outline-offset: -1px;
}

/* ── MathML: ensure math elements display correctly ──────────────────────── */
math {
  font-size: 1em;
}

math[display="block"] {
  display: block;
  text-align: center;
  margin: 1.5rem 0;
  font-size: 1.1em;
}

/* ── Responsive: sidebar overlay on narrow windows ───────────────────────── */
@media (max-width: 768px) {
  body {
    grid-template-columns: 1fr;
  }

  #toc-sidebar {
    position: fixed;
    top: var(--toolbar-height);
    left: 0;
    width: var(--sidebar-width);
    height: calc(100vh - var(--toolbar-height));
    transform: translateX(-100%);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
    z-index: 30;
  }

  body.sidebar-open #toc-sidebar {
    transform: translateX(0);
  }

  #content {
    grid-column: 1 / -1;
  }

  #content article.prose {
    padding: 2rem 1.5rem 3rem;
  }
}

/* ── Print: clean output ─────────────────────────────────────────────────── */
@media print {
  body {
    display: block;
    background: #fff;
  }

  #toolbar, #toc-sidebar, #progress-bar, #back-to-top {
    display: none !important;
  }

  #content {
    height: auto;
    overflow: visible;
    padding: 0;
    background: #fff;
  }

  #content article.prose {
    max-width: none;
    box-shadow: none;
    padding: 0;
    border-radius: 0;
  }
}
`
