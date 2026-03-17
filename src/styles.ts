// All CSS is self-contained — no external URLs, works fully offline
export const CSS = `
/* ── Reset & Base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #ffffff;
  --fg: #1f2328;
  --fg-muted: #656d76;
  --border: #d0d7de;
  --code-bg: #f6f8fa;
  --code-fg: #1f2328;
  --blockquote-border: #d0d7de;
  --blockquote-bg: transparent;
  --link: #0969da;
  --link-hover: #0550ae;
  --table-header-bg: #f6f8fa;
  --table-row-alt: #f6f8fa;
  --accent: #0969da;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --fg: #e6edf3;
    --fg-muted: #8b949e;
    --border: #30363d;
    --code-bg: #161b22;
    --code-fg: #e6edf3;
    --blockquote-border: #30363d;
    --blockquote-bg: transparent;
    --link: #58a6ff;
    --link-hover: #79c0ff;
    --table-header-bg: #161b22;
    --table-row-alt: #161b22;
    --accent: #58a6ff;
  }
}

html { font-size: 16px; }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans',
    Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
  line-height: 1.5;
  padding: 2rem 1rem 6rem;
  -webkit-font-smoothing: antialiased;
  word-wrap: break-word;
}

/* ── Prose container ─────────────────────────────────────── */
article.prose {
  max-width: 700px;
  margin: 0 auto;
}

/* ── Headings ────────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
  color: var(--fg);
  font-weight: 600;
  line-height: 1.25;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}
h1 { font-size: 2em; margin-top: 0; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; margin-top: 1.5rem; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; color: var(--fg-muted); }

/* ── Paragraphs & spacing ────────────────────────────────── */
p { margin-bottom: 1rem; }
p:last-child { margin-bottom: 0; }

/* ── Links ───────────────────────────────────────────────── */
a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ── Inline code ─────────────────────────────────────────── */
code:not(pre code) {
  background: var(--code-bg);
  color: var(--code-fg);
  padding: 0.2em 0.4em;
  border-radius: 6px;
  font-size: 85%;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
}

/* ── Code blocks ─────────────────────────────────────────── */
pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0 0 1rem;
  font-size: 85%;
  line-height: 1.45;
}
pre code {
  background: transparent;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  color: inherit;
  font-size: 100%;
}

/* ── Blockquotes ─────────────────────────────────────────── */
blockquote {
  border-left: 0.25em solid var(--blockquote-border);
  background: var(--blockquote-bg);
  margin: 0 0 1rem;
  padding: 0 1em;
  color: var(--fg-muted);
}
blockquote p { margin-bottom: 0; }
blockquote > :first-child { margin-top: 0; }
blockquote > :last-child { margin-bottom: 0; }

/* ── Lists ───────────────────────────────────────────────── */
ul, ol { padding-left: 2em; margin-bottom: 1rem; }
li { margin-bottom: 0.25rem; }
li + li { margin-top: 0.25rem; }
li > ul, li > ol { margin-top: 0.25rem; margin-bottom: 0; }

/* ── Task lists (GFM checkboxes) ────────────────────────── */
li input[type="checkbox"] {
  margin-right: 0.5em;
  vertical-align: middle;
}

/* ── Tables ──────────────────────────────────────────────── */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1rem;
  border: 1px solid var(--border);
  overflow: hidden;
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
thead { background: var(--table-header-bg); }
th {
  text-align: left;
  padding: 6px 13px;
  font-weight: 600;
  border: 1px solid var(--border);
}
td {
  padding: 6px 13px;
  border: 1px solid var(--border);
}
tr:nth-child(2n) { background: var(--table-row-alt); }

/* ── Horizontal rule ─────────────────────────────────────── */
hr {
  border: none;
  height: 0.25em;
  background: var(--border);
  margin: 1.5rem 0;
  padding: 0;
}

/* ── Images ──────────────────────────────────────────────── */
img { max-width: 100%; box-sizing: content-box; }

/* ── Strong & Em ─────────────────────────────────────────── */
strong { font-weight: 700; }
em { font-style: italic; }

/* ── highlight.js theme — light (GitHub Light) ─────────── */
.hljs { color: #24292f; background: var(--code-bg); }
.hljs-comment, .hljs-punctuation { color: #6e7781; }
.hljs-attr, .hljs-keyword, .hljs-selector-tag { color: #cf222e; }
.hljs-string, .hljs-attr-value { color: #0a3069; }
.hljs-number, .hljs-literal { color: #0550ae; }
.hljs-title, .hljs-type { color: #8250df; }
.hljs-built_in, .hljs-variable, .hljs-params { color: #953800; }
.hljs-meta { color: #0550ae; }
.hljs-tag { color: #116329; }
.hljs-name, .hljs-selector-id, .hljs-selector-class { color: #8250df; }
.hljs-addition { background: #dafbe1; color: #116329; }
.hljs-deletion { background: #ffebe9; color: #82071e; }

/* ── highlight.js theme — dark (GitHub Dark) ───────────── */
@media (prefers-color-scheme: dark) {
  .hljs { color: #e6edf3; }
  .hljs-comment, .hljs-punctuation { color: #8b949e; }
  .hljs-attr, .hljs-keyword, .hljs-selector-tag { color: #ff7b72; }
  .hljs-string, .hljs-attr-value { color: #a5d6ff; }
  .hljs-number, .hljs-literal { color: #79c0ff; }
  .hljs-title, .hljs-type { color: #d2a8ff; }
  .hljs-built_in, .hljs-variable, .hljs-params { color: #ffa657; }
  .hljs-meta { color: #79c0ff; }
  .hljs-tag { color: #7ee787; }
  .hljs-name, .hljs-selector-id, .hljs-selector-class { color: #d2a8ff; }
  .hljs-addition { background: #12261e; color: #7ee787; }
  .hljs-deletion { background: #2d1215; color: #ff7b72; }
}

/* ── Print / PDF — always light theme ────────────────────── */
@media print {
  :root {
    --bg: #ffffff;
    --fg: #1f2328;
    --fg-muted: #656d76;
    --border: #d0d7de;
    --code-bg: #f6f8fa;
    --code-fg: #1f2328;
    --blockquote-border: #d0d7de;
    --blockquote-bg: transparent;
    --link: #0969da;
    --link-hover: #0550ae;
    --table-header-bg: #f6f8fa;
    --table-row-alt: #f6f8fa;
    --accent: #0969da;
  }
  .hljs { color: #24292f; }
  .hljs-comment, .hljs-punctuation { color: #6e7781; }
  .hljs-attr, .hljs-keyword, .hljs-selector-tag { color: #cf222e; }
  .hljs-string, .hljs-attr-value { color: #0a3069; }
  .hljs-number, .hljs-literal { color: #0550ae; }
  .hljs-title, .hljs-type { color: #8250df; }
  .hljs-built_in, .hljs-variable, .hljs-params { color: #953800; }
  .hljs-meta { color: #0550ae; }
  .hljs-tag { color: #116329; }
  .hljs-name, .hljs-selector-id, .hljs-selector-class { color: #8250df; }
  .hljs-addition { background: #dafbe1; color: #116329; }
  .hljs-deletion { background: #ffebe9; color: #82071e; }

  body { padding: 0; }
  article.prose { max-width: none; }
}
`;
