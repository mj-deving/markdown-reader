// browser-styles.ts — Enhanced browser shell CSS + switchable style presets
//
// Structure:
//   SHELL_CSS   — layout, toolbar, sidebar, TOC, scrollbar, etc. (constant)
//   PRESET_CSS  — typography presets scoped by body.style-<name> (switchable)
//   BROWSER_CSS — combined export (SHELL_CSS + PRESET_CSS)
//
// Adding a new preset: add a scoped block in PRESET_CSS, then register the
// name in STYLE_PRESETS and in browser-script.ts's style cycle array.
//
// Key constraint: styles.ts is shared with Tauri and must not change.
// All visual upgrades live here and layer on top via higher specificity.

/** Available style preset names, in cycle order */
export const STYLE_PRESETS = ['default', 'latex', 'mono', 'newspaper'] as const
export type StylePreset = (typeof STYLE_PRESETS)[number]

// ── Shell CSS: layout, toolbar, sidebar, shared chrome ────────────────────
const SHELL_CSS = `
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
/* Shell variables */
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

  /* Prose variables (from styles.ts — which only has @media, not data-theme) */
  --bg: #1a1b1e;
  --fg: #e5e7eb;
  --fg-muted: #9ca3af;
  --border: #374151;
  --code-bg: #2d2f36;
  --code-fg: #e2e8f0;
  --blockquote-border: #818cf8;
  --blockquote-bg: #1e1e2e;
  --link: #818cf8;
  --link-hover: #a5b4fc;
  --table-header-bg: #2d2f36;
  --table-row-alt: #232428;
  --accent: #818cf8;
}

/* hljs syntax highlighting — dark (explicit toggle) */
html[data-theme="dark"] .hljs { color: #e2e8f0; }
html[data-theme="dark"] .hljs-comment,
html[data-theme="dark"] .hljs-punctuation { color: #7f848e; }
html[data-theme="dark"] .hljs-attr,
html[data-theme="dark"] .hljs-keyword,
html[data-theme="dark"] .hljs-selector-tag { color: #f97583; }
html[data-theme="dark"] .hljs-string,
html[data-theme="dark"] .hljs-attr-value { color: #9ecbff; }
html[data-theme="dark"] .hljs-number,
html[data-theme="dark"] .hljs-literal { color: #79b8ff; }
html[data-theme="dark"] .hljs-title,
html[data-theme="dark"] .hljs-type { color: #b392f0; }
html[data-theme="dark"] .hljs-built_in,
html[data-theme="dark"] .hljs-variable,
html[data-theme="dark"] .hljs-params { color: #ffab70; }
html[data-theme="dark"] .hljs-meta { color: #79b8ff; }
html[data-theme="dark"] .hljs-tag { color: #85e89d; }
html[data-theme="dark"] .hljs-name,
html[data-theme="dark"] .hljs-selector-id,
html[data-theme="dark"] .hljs-selector-class { color: #b392f0; }
html[data-theme="dark"] .hljs-addition { background: #1a2a1a; color: #85e89d; }
html[data-theme="dark"] .hljs-deletion { background: #2a1a1a; color: #f97583; }

/* ── Light theme (explicit toggle) ───────────────────────────────────────── */
/* Shell variables */
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

  /* Prose variables (from styles.ts — which only has @media, not data-theme) */
  --bg: #ffffff;
  --fg: #1a1a2e;
  --fg-muted: #6b7280;
  --border: #e5e7eb;
  --code-bg: #f3f4f6;
  --code-fg: #374151;
  --blockquote-border: #6366f1;
  --blockquote-bg: #f5f3ff;
  --link: #4f46e5;
  --link-hover: #3730a3;
  --table-header-bg: #f9fafb;
  --table-row-alt: #f9fafb;
  --accent: #6366f1;
}

/* hljs syntax highlighting — light (explicit toggle) */
html[data-theme="light"] .hljs { color: #24292e; }
html[data-theme="light"] .hljs-comment,
html[data-theme="light"] .hljs-punctuation { color: #6a737d; }
html[data-theme="light"] .hljs-attr,
html[data-theme="light"] .hljs-keyword,
html[data-theme="light"] .hljs-selector-tag { color: #d73a49; }
html[data-theme="light"] .hljs-string,
html[data-theme="light"] .hljs-attr-value { color: #032f62; }
html[data-theme="light"] .hljs-number,
html[data-theme="light"] .hljs-literal { color: #005cc5; }
html[data-theme="light"] .hljs-title,
html[data-theme="light"] .hljs-type { color: #6f42c1; }
html[data-theme="light"] .hljs-built_in,
html[data-theme="light"] .hljs-variable,
html[data-theme="light"] .hljs-params { color: #e36209; }
html[data-theme="light"] .hljs-meta { color: #005cc5; }
html[data-theme="light"] .hljs-tag { color: #22863a; }
html[data-theme="light"] .hljs-name,
html[data-theme="light"] .hljs-selector-id,
html[data-theme="light"] .hljs-selector-class { color: #6f42c1; }
html[data-theme="light"] .hljs-addition { background: #f0fff4; color: #22863a; }
html[data-theme="light"] .hljs-deletion { background: #ffeef0; color: #b31d28; }

/* ── Body: CSS Grid shell ────────────────────────────────────────────────── */
body {
  display: grid;
  grid-template-rows: var(--toolbar-height) 1fr;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100vh;
  overflow: hidden;
  background: var(--canvas-bg);
  padding: 0;
}

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

html[data-theme="dark"] #toolbar button:hover {
  background: rgba(255, 255, 255, 0.08);
}

@media (prefers-color-scheme: dark) {
  #toolbar button:hover {
    background: rgba(255, 255, 255, 0.08);
  }
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

/* ── Style indicator label (shows current preset name) ───────────────────── */
#style-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--toolbar-text);
  opacity: 0.7;
  pointer-events: none;
  white-space: nowrap;
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

/* ── Page-on-canvas base: shared across all presets ──────────────────────── */
#content article.prose {
  max-width: 720px;
  margin: 0 auto;
  background: var(--page-bg);
  box-shadow: var(--page-shadow);
  border-radius: 3px;
  padding: 3.5rem 4rem 4.5rem;
  contain: content;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── TOC styling ─────────────────────────────────────────────────────────── */
.toc { padding: 0 0.75rem; }

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

.toc-link.toc-active {
  border-left-color: var(--toc-active-border);
  background: var(--toc-active-bg);
  color: var(--toc-active-color);
}

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
#toc-sidebar::-webkit-scrollbar { width: 8px; }

#content::-webkit-scrollbar-track,
#toc-sidebar::-webkit-scrollbar-track { background: var(--scrollbar-track); }

#content::-webkit-scrollbar-thumb,
#toc-sidebar::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }

#content::-webkit-scrollbar-thumb:hover,
#toc-sidebar::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

/* ── Focus-visible ───────────────────────────────────────────────────────── */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
#toolbar button:focus-visible { outline-offset: -2px; }
.toc-link:focus-visible { outline-offset: -1px; }

/* ── MathML ──────────────────────────────────────────────────────────────── */
math { font-size: 1em; }
math[display="block"] { display: block; text-align: center; margin: 1.5rem 0; font-size: 1.1em; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  body { grid-template-columns: 1fr; }

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

  body.sidebar-open #toc-sidebar { transform: translateX(0); }
  #content { grid-column: 1 / -1; }
  #content article.prose { padding: 2rem 1.5rem 3rem; }
}

/* ── Print ───────────────────────────────────────────────────────────────── */
@media print {
  body { display: block; background: #fff; }
  #toolbar, #toc-sidebar, #progress-bar, #back-to-top { display: none !important; }
  #content { height: auto; overflow: visible; padding: 0; background: #fff; }
  #content article.prose { max-width: none; box-shadow: none; padding: 0; border-radius: 0; }
}
`

// ── Style presets: typography + prose styling scoped by body class ─────────
const PRESET_CSS = `
/* ═══════════════════════════════════════════════════════════════════════════
   PRESET: DEFAULT — Clean sans-serif, modern web typography
   ═══════════════════════════════════════════════════════════════════════════ */
body.style-default {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter',
    'Helvetica Neue', Arial, sans-serif;
}

body.style-default #content article.prose {
  font-family: inherit;
  font-size: 17px;
  line-height: 1.75;
  font-feature-settings: 'kern' 1;
}

body.style-default #content article.prose h1,
body.style-default #content article.prose h2,
body.style-default #content article.prose h3,
body.style-default #content article.prose h4,
body.style-default #content article.prose h5,
body.style-default #content article.prose h6 {
  font-family: inherit;
}

body.style-default #content article.prose h1 {
  font-size: 2.1rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0.4rem;
  line-height: 1.3;
}

body.style-default #content article.prose h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.25rem;
  line-height: 1.3;
}

body.style-default #content article.prose h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

body.style-default #content article.prose h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

body.style-default #content article.prose p {
  margin-bottom: 1.25rem;
}

body.style-default #content article.prose a {
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

body.style-default #content article.prose blockquote {
  border-radius: 0 6px 6px 0;
}

body.style-default #content article.prose pre {
  border-radius: 8px;
}

body.style-default #content article.prose hr {
  margin: 2.5rem 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRESET: LATEX — Academic serif typography, LaTeX-inspired
   ═══════════════════════════════════════════════════════════════════════════ */
body.style-latex {
  font-family: 'Latin Modern Roman', 'Palatino Linotype', Palatino,
    'Book Antiqua', Georgia, 'Times New Roman', serif;
}

body.style-latex #content article.prose {
  font-family: inherit;
  font-size: 18px;
  line-height: 1.8;
  font-feature-settings: 'liga' 1, 'calt' 1, 'kern' 1;
  hyphens: auto;
  -webkit-hyphens: auto;
}

body.style-latex #content article.prose h1,
body.style-latex #content article.prose h2,
body.style-latex #content article.prose h3,
body.style-latex #content article.prose h4,
body.style-latex #content article.prose h5,
body.style-latex #content article.prose h6 {
  font-family: inherit;
  border: none;
  padding-bottom: 0;
}

body.style-latex #content article.prose h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 1.2rem;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

body.style-latex #content article.prose h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 2.8rem;
  margin-bottom: 0.8rem;
  letter-spacing: -0.005em;
  line-height: 1.25;
}

body.style-latex #content article.prose h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2.2rem;
  margin-bottom: 0.6rem;
  line-height: 1.3;
}

body.style-latex #content article.prose h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.8rem;
  margin-bottom: 0.5rem;
  font-variant: small-caps;
  text-transform: none;
  letter-spacing: 0.03em;
  color: var(--fg);
}

body.style-latex #content article.prose p {
  margin-bottom: 1.3rem;
}

body.style-latex #content article.prose a {
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

body.style-latex #content article.prose blockquote {
  font-style: italic;
  border-radius: 0;
  padding: 0.8rem 1.5rem;
  margin: 1.8rem 0;
}

body.style-latex #content article.prose pre {
  border-radius: 4px;
  margin: 1.8rem 0;
}

body.style-latex #content article.prose table {
  font-size: 0.9rem;
  border-radius: 4px;
}

body.style-latex #content article.prose hr {
  margin: 3rem auto;
  max-width: 200px;
}

body.style-latex #content article.prose img {
  display: block;
  margin: 1.5rem auto;
  border-radius: 3px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRESET: MONO — Terminal/hacker aesthetic, monospace-forward
   ═══════════════════════════════════════════════════════════════════════════ */
body.style-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
    'SF Mono', Menlo, Consolas, monospace;
}

body.style-mono #content article.prose {
  font-family: inherit;
  font-size: 15px;
  line-height: 1.7;
  font-feature-settings: 'liga' 1, 'calt' 1;
  max-width: 760px;
  padding: 2.5rem 3rem 3.5rem;
}

body.style-mono #content article.prose h1,
body.style-mono #content article.prose h2,
body.style-mono #content article.prose h3,
body.style-mono #content article.prose h4,
body.style-mono #content article.prose h5,
body.style-mono #content article.prose h6 {
  font-family: inherit;
  border: none;
  padding-bottom: 0;
  letter-spacing: -0.02em;
}

body.style-mono #content article.prose h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 1rem;
  line-height: 1.25;
}

body.style-mono #content article.prose h1::before {
  content: '# ';
  color: var(--accent);
  font-weight: 400;
}

body.style-mono #content article.prose h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 0.7rem;
  line-height: 1.3;
}

body.style-mono #content article.prose h2::before {
  content: '## ';
  color: var(--accent);
  font-weight: 400;
}

body.style-mono #content article.prose h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

body.style-mono #content article.prose h3::before {
  content: '### ';
  color: var(--accent);
  font-weight: 400;
}

body.style-mono #content article.prose h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

body.style-mono #content article.prose p {
  margin-bottom: 1.1rem;
}

body.style-mono #content article.prose a {
  text-decoration: none;
  border-bottom: 1px dashed var(--link);
  transition: border-color 0.15s, color 0.15s;
}

body.style-mono #content article.prose a:hover {
  border-bottom-style: solid;
}

body.style-mono #content article.prose blockquote {
  border-left-width: 3px;
  border-radius: 0;
  font-style: normal;
  padding: 0.6rem 1.2rem;
  margin: 1.5rem 0;
}

body.style-mono #content article.prose code:not(pre code) {
  font-size: 0.92em;
  padding: 0.1em 0.35em;
  border-radius: 3px;
}

body.style-mono #content article.prose pre {
  border-radius: 3px;
  border: 1px solid var(--border);
  margin: 1.5rem 0;
}

body.style-mono #content article.prose table {
  font-size: 0.88rem;
  border-radius: 3px;
}

body.style-mono #content article.prose hr {
  margin: 2rem 0;
  border-top-style: dashed;
}

body.style-mono #content article.prose img {
  display: block;
  margin: 1.2rem auto;
  border-radius: 2px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRESET: NEWSPAPER — Classic editorial print typography
   ═══════════════════════════════════════════════════════════════════════════ */
body.style-newspaper {
  font-family: Georgia, 'Times New Roman', 'Noto Serif', 'DejaVu Serif', serif;
}

body.style-newspaper #content article.prose {
  font-family: inherit;
  font-size: 17.5px;
  line-height: 1.7;
  font-feature-settings: 'liga' 1, 'kern' 1;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  max-width: 680px;
}

/* Drop cap on the first paragraph after h1 */
body.style-newspaper #content article.prose h1 + p::first-letter {
  float: left;
  font-size: 3.6em;
  line-height: 0.8;
  padding-right: 0.08em;
  margin-top: 0.05em;
  font-weight: 700;
  color: var(--fg);
}

body.style-newspaper #content article.prose h1,
body.style-newspaper #content article.prose h2,
body.style-newspaper #content article.prose h3,
body.style-newspaper #content article.prose h4,
body.style-newspaper #content article.prose h5,
body.style-newspaper #content article.prose h6 {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter',
    'Helvetica Neue', Arial, sans-serif;
  border: none;
  padding-bottom: 0;
}

body.style-newspaper #content article.prose h1 {
  font-size: 2.4rem;
  font-weight: 900;
  margin-top: 0;
  margin-bottom: 0.3rem;
  letter-spacing: -0.02em;
  line-height: 1.1;
  text-align: center;
}

/* Byline / subtitle feel: muted text under h1 */
body.style-newspaper #content article.prose h1 + p:not(:first-letter) {
  /* the drop cap paragraph still starts normally */
}

body.style-newspaper #content article.prose h2 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-top: 2.5rem;
  margin-bottom: 0.6rem;
  letter-spacing: -0.01em;
  line-height: 1.2;
  border-bottom: 3px solid var(--fg);
  padding-bottom: 0.2rem;
}

body.style-newspaper #content article.prose h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.3;
}

body.style-newspaper #content article.prose h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.4rem;
  font-style: italic;
  color: var(--fg);
}

body.style-newspaper #content article.prose p {
  margin-bottom: 1.1rem;
}

body.style-newspaper #content article.prose a {
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

body.style-newspaper #content article.prose blockquote {
  border-left-width: 3px;
  border-left-color: var(--fg);
  border-radius: 0;
  background: transparent;
  font-style: italic;
  font-size: 1.1em;
  padding: 0.5rem 1.5rem;
  margin: 2rem 0;
  color: var(--fg);
}

body.style-newspaper #content article.prose pre {
  border-radius: 0;
  margin: 1.5rem 0;
}

body.style-newspaper #content article.prose table {
  font-size: 0.88rem;
  border-radius: 0;
}

body.style-newspaper #content article.prose hr {
  margin: 2.5rem auto;
  max-width: 120px;
  border-top: 2px solid var(--fg);
}

body.style-newspaper #content article.prose img {
  display: block;
  margin: 1.5rem auto;
  border-radius: 0;
}

/* ── Smooth transition when switching presets ─────────────────────────────── */
#content article.prose {
  transition: font-size 0.3s ease, line-height 0.3s ease;
}
`

/** Combined CSS: shell + all presets */
export const BROWSER_CSS = SHELL_CSS + PRESET_CSS
