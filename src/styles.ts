// All CSS is self-contained — no external URLs, works fully offline
export const CSS = `
/* ── Reset & Base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
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

@media (prefers-color-scheme: dark) {
  :root {
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
}

html { font-size: 17px; }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter',
    'Helvetica Neue', Arial, sans-serif;
  line-height: 1.75;
  padding: 2rem 1rem 6rem;
  -webkit-font-smoothing: antialiased;
}

/* ── Prose container ─────────────────────────────────────── */
article.prose {
  max-width: 700px;
  margin: 0 auto;
}

/* ── Headings ────────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
  color: var(--fg);
  font-weight: 700;
  line-height: 1.3;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
h1 { font-size: 2.1rem; margin-top: 0; border-bottom: 2px solid var(--border); padding-bottom: 0.4rem; }
h2 { font-size: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; }
h3 { font-size: 1.2rem; }
h4 { font-size: 1rem; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Paragraphs & spacing ────────────────────────────────── */
p { margin-bottom: 1.25rem; }
p:last-child { margin-bottom: 0; }

/* ── Links ───────────────────────────────────────────────── */
a { color: var(--link); text-decoration: underline; text-underline-offset: 3px; }
a:hover { color: var(--link-hover); }

/* ── Inline code ─────────────────────────────────────────── */
code:not(pre code) {
  background: var(--code-bg);
  color: var(--code-fg);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.88em;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
}

/* ── Code blocks ─────────────────────────────────────────── */
pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.1rem 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
}
pre code {
  background: none;
  padding: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
  color: inherit;
}

/* ── Blockquotes ─────────────────────────────────────────── */
blockquote {
  border-left: 4px solid var(--blockquote-border);
  background: var(--blockquote-bg);
  margin: 1.5rem 0;
  padding: 0.75rem 1.25rem;
  border-radius: 0 6px 6px 0;
  color: var(--fg-muted);
  font-style: italic;
}
blockquote p { margin-bottom: 0; }

/* ── Lists ───────────────────────────────────────────────── */
ul, ol { padding-left: 1.75rem; margin-bottom: 1.25rem; }
li { margin-bottom: 0.3rem; }
li > ul, li > ol { margin-top: 0.3rem; margin-bottom: 0; }

/* ── Tables ──────────────────────────────────────────────── */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.92rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
thead { background: var(--table-header-bg); }
th {
  text-align: left;
  padding: 0.65rem 0.9rem;
  font-weight: 600;
  border-bottom: 2px solid var(--border);
}
td {
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--border);
}
tr:nth-child(even) td { background: var(--table-row-alt); }
tr:last-child td { border-bottom: none; }

/* ── Horizontal rule ─────────────────────────────────────── */
hr { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }

/* ── Images ──────────────────────────────────────────────── */
img { max-width: 100%; border-radius: 6px; margin: 1rem 0; }

/* ── Strong & Em ─────────────────────────────────────────── */
strong { font-weight: 700; }
em { font-style: italic; }

/* ── highlight.js theme — light ─────────────────────────── */
.hljs { color: #24292e; background: var(--code-bg); }
.hljs-comment, .hljs-punctuation { color: #6a737d; }
.hljs-attr, .hljs-keyword, .hljs-selector-tag { color: #d73a49; }
.hljs-string, .hljs-attr-value { color: #032f62; }
.hljs-number, .hljs-literal { color: #005cc5; }
.hljs-title, .hljs-type { color: #6f42c1; }
.hljs-built_in, .hljs-variable, .hljs-params { color: #e36209; }
.hljs-meta { color: #005cc5; }
.hljs-tag { color: #22863a; }
.hljs-name, .hljs-selector-id, .hljs-selector-class { color: #6f42c1; }
.hljs-addition { background: #f0fff4; color: #22863a; }
.hljs-deletion { background: #ffeef0; color: #b31d28; }

/* ── highlight.js theme — dark ──────────────────────────── */
@media (prefers-color-scheme: dark) {
  .hljs { color: #e2e8f0; }
  .hljs-comment, .hljs-punctuation { color: #7f848e; }
  .hljs-attr, .hljs-keyword, .hljs-selector-tag { color: #f97583; }
  .hljs-string, .hljs-attr-value { color: #9ecbff; }
  .hljs-number, .hljs-literal { color: #79b8ff; }
  .hljs-title, .hljs-type { color: #b392f0; }
  .hljs-built_in, .hljs-variable, .hljs-params { color: #ffab70; }
  .hljs-meta { color: #79b8ff; }
  .hljs-tag { color: #85e89d; }
  .hljs-name, .hljs-selector-id, .hljs-selector-class { color: #b392f0; }
  .hljs-addition { background: #1a2a1a; color: #85e89d; }
  .hljs-deletion { background: #2a1a1a; color: #f97583; }
}
`;
