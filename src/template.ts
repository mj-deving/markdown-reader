import { CSS } from './styles'
import { BROWSER_CSS, type StylePreset } from './browser-styles'
import { BROWSER_SCRIPT } from './browser-script'

// SVG icons for toolbar buttons (inline, no external requests)
const ICON_SIDEBAR = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="2" width="14" height="12" rx="2"/><line x1="5.5" y1="2" x2="5.5" y2="14"/></svg>'
const ICON_STYLE = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><text x="2" y="13" font-size="14" font-weight="700" font-family="serif" fill="currentColor" stroke="none">A</text><text x="10" y="13" font-size="10" font-weight="400" font-family="serif" fill="currentColor" stroke="none" opacity="0.5">a</text></svg>'
const ICON_THEME_LIGHT = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="3.05" y1="3.05" x2="4.46" y2="4.46"/><line x1="11.54" y1="11.54" x2="12.95" y2="12.95"/><line x1="3.05" y1="12.95" x2="4.46" y2="11.54"/><line x1="11.54" y1="4.46" x2="12.95" y2="3.05"/></svg>'
const ICON_THEME_DARK = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13.5 9.5a5.5 5.5 0 1 1-7-7 4.5 4.5 0 0 0 7 7z"/></svg>'
const ICON_THEME_SYSTEM = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="8" rx="1.5"/><line x1="5" y1="13" x2="11" y2="13"/><line x1="8" y1="11" x2="8" y2="13"/></svg>'
const ICON_BACK_TO_TOP = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="13" x2="8" y2="4"/><polyline points="4,7 8,3 12,7"/></svg>'
const ICON_PDF = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 1h5.5L13 4.5V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/><polyline points="9,1 9,5 13,5"/><text x="4.5" y="12" font-size="5.5" font-weight="700" font-family="sans-serif" fill="currentColor" stroke="none">PDF</text></svg>'

// Mermaid diagram rendering — CDN script + initialization
// Only included when mermaid code blocks are detected in the rendered HTML.
// Converts <pre><code class="language-mermaid"> blocks into rendered SVG diagrams.
const MERMAID_SCRIPT = `
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>
<script>
(function() {
  'use strict';

  // Detect theme: check data-theme attribute or prefers-color-scheme
  function getMermaidTheme() {
    var theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'default';
    // System preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'default';
  }

  // Find all mermaid code blocks and convert them to diagram containers
  var blocks = document.querySelectorAll('pre > code[class*="language-mermaid"]');
  if (blocks.length === 0) return;

  blocks.forEach(function(code, i) {
    var pre = code.parentElement;
    var container = document.createElement('div');
    container.className = 'mermaid';
    container.textContent = code.textContent;
    pre.parentElement.replaceChild(container, pre);
  });

  // Initialize mermaid with theme-aware config
  mermaid.initialize({
    startOnLoad: true,
    theme: getMermaidTheme(),
    securityLevel: 'strict',
    fontFamily: 'inherit'
  });

  // Re-render on theme change (observe data-theme attribute)
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'data-theme') {
        mermaid.initialize({ theme: getMermaidTheme() });
        // Re-render all diagrams
        document.querySelectorAll('.mermaid').forEach(function(el) {
          var svg = el.querySelector('svg');
          if (svg) {
            // Store original source and re-render
            var source = el.getAttribute('data-mermaid-source');
            if (source) {
              el.removeAttribute('data-processed');
              el.innerHTML = source;
            }
          }
        });
        mermaid.run();
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Store original source for theme re-rendering
  document.querySelectorAll('.mermaid').forEach(function(el) {
    el.setAttribute('data-mermaid-source', el.textContent);
  });
})();
<\/script>`

/**
 * Build a full HTML page from a rendered body.
 *
 * Enhanced layout with sidebar TOC, toolbar, style presets, theme toggle,
 * scroll spy, keyboard shortcuts, and progress bar.
 *
 * @param title - Document title for <title> tag and toolbar display
 * @param body - Rendered HTML body from converter
 * @param options.style - Initial style preset (default: 'default')
 * @param options.injectScript - Extra script to inject (e.g. watch mode reload)
 */
export function buildHtml(
  title: string,
  body: string,
  options: { style?: StylePreset; injectScript?: string } = {},
): string {
  const style = options.style ?? 'default'
  const hasMermaid = body.includes('language-mermaid')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>${CSS}</style>
  <style>${BROWSER_CSS}</style>
</head>
<body class="style-${style}">
  <div id="toolbar">
    <button id="sidebar-toggle" title="Toggle sidebar (Ctrl+B)" aria-label="Toggle sidebar">${ICON_SIDEBAR}</button>
    <span id="doc-title"></span>
    <button id="style-toggle" title="Switch reading style" aria-label="Switch reading style">${ICON_STYLE}</button>
    <span id="style-label"></span>
    <button id="theme-toggle" title="Toggle theme" aria-label="Toggle theme">
      <span id="theme-icon-light" style="display:none">${ICON_THEME_LIGHT}</span>
      <span id="theme-icon-dark" style="display:none">${ICON_THEME_DARK}</span>
      <span id="theme-icon-system">${ICON_THEME_SYSTEM}</span>
    </button>
    <button id="pdf-export" title="Export as PDF (Ctrl+P)" aria-label="Export as PDF">${ICON_PDF}</button>
    <div id="progress-bar"></div>
  </div>

  <div id="toc-sidebar"></div>

  <div id="content">
    <article class="prose">
      ${body}
    </article>
  </div>

  <button id="back-to-top" title="Back to top" aria-label="Back to top">${ICON_BACK_TO_TOP}</button>
${BROWSER_SCRIPT}
${hasMermaid ? MERMAID_SCRIPT : ''}
${options.injectScript ?? ''}
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
