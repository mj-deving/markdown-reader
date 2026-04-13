// browser-script.ts — Inline JavaScript for the enhanced browser HTML output
//
// Provides: TOC extraction, sidebar rendering, scroll spy, theme toggle,
// style preset cycling, keyboard shortcuts, progress bar, back-to-top button.
//
// This is exported as a string constant that gets inlined in a <script> tag.
// Must be vanilla JS (no imports, no TypeScript features at runtime).

export const BROWSER_SCRIPT = `
<script>
(function() {
  'use strict';

  // ── DOM references ──────────────────────────────────────────────────────
  var contentEl = document.getElementById('content');
  var tocSidebar = document.getElementById('toc-sidebar');
  var docTitle = document.getElementById('doc-title');
  var progressBar = document.getElementById('progress-bar');
  var sidebarToggle = document.getElementById('sidebar-toggle');
  var themeToggle = document.getElementById('theme-toggle');
  var styleToggle = document.getElementById('style-toggle');
  var styleLabel = document.getElementById('style-label');
  var backToTop = document.getElementById('back-to-top');

  if (!contentEl || !tocSidebar) return;

  // ── Style presets ───────────────────────────────────────────────────────
  // Must match STYLE_PRESETS in browser-styles.ts
  var PRESETS = ['default', 'latex', 'mono', 'newspaper'];
  var PRESET_LABELS = { default: 'Default', latex: 'LaTeX', mono: 'Mono', newspaper: 'News' };

  function getInitialStyle() {
    // Check localStorage first, then fall back to the body class set by CLI
    var stored = localStorage.getItem('md-reader-style');
    if (stored && PRESETS.indexOf(stored) !== -1) return stored;
    // Read initial style from body class (set by template via --style flag)
    for (var i = 0; i < PRESETS.length; i++) {
      if (document.body.classList.contains('style-' + PRESETS[i])) return PRESETS[i];
    }
    return 'default';
  }

  function applyStyle(preset) {
    // Remove all preset classes
    PRESETS.forEach(function(p) { document.body.classList.remove('style-' + p); });
    // Apply new preset
    document.body.classList.add('style-' + preset);
    localStorage.setItem('md-reader-style', preset);
    if (styleLabel) styleLabel.textContent = PRESET_LABELS[preset] || preset;
  }

  function cycleStyle() {
    var current = localStorage.getItem('md-reader-style') || 'default';
    var idx = PRESETS.indexOf(current);
    var next = PRESETS[(idx + 1) % PRESETS.length];
    applyStyle(next);
  }

  // Apply initial style (localStorage overrides CLI default)
  applyStyle(getInitialStyle());

  // ── Theme management ────────────────────────────────────────────────────
  var themeIconLight = document.getElementById('theme-icon-light');
  var themeIconDark = document.getElementById('theme-icon-dark');
  var themeIconSystem = document.getElementById('theme-icon-system');

  function getStoredTheme() {
    return localStorage.getItem('md-reader-theme') || 'system';
  }

  function applyTheme(mode) {
    localStorage.setItem('md-reader-theme', mode);
    if (mode === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
    if (themeIconLight) themeIconLight.style.display = mode === 'light' ? '' : 'none';
    if (themeIconDark) themeIconDark.style.display = mode === 'dark' ? '' : 'none';
    if (themeIconSystem) themeIconSystem.style.display = mode === 'system' ? '' : 'none';
  }

  function cycleTheme() {
    var current = getStoredTheme();
    var next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    applyTheme(next);
  }

  applyTheme(getStoredTheme());

  // ── Sidebar toggle ──────────────────────────────────────────────────────
  function toggleSidebar() {
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      document.body.classList.toggle('sidebar-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
  }

  // ── TOC: extract headings and build sidebar ─────────────────────────────
  function buildToc() {
    var article = contentEl.querySelector('article.prose');
    if (!article) return;

    var headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      tocSidebar.innerHTML = '<nav class="toc"><p class="toc-empty">No headings</p></nav>';
      return;
    }

    // Assign IDs to headings that don't have them
    headings.forEach(function(h, i) {
      if (!h.id) {
        var slug = h.textContent.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        h.id = slug || ('heading-' + i);
      }
    });

    // Find minimum heading level for normalization
    var minLevel = 6;
    headings.forEach(function(h) {
      var level = parseInt(h.tagName[1], 10);
      if (level < minLevel) minLevel = level;
    });

    // Build TOC nav
    var nav = document.createElement('nav');
    nav.className = 'toc';

    var title = document.createElement('div');
    title.className = 'toc-title';
    title.textContent = 'Contents';
    nav.appendChild(title);

    headings.forEach(function(h) {
      var level = parseInt(h.tagName[1], 10);
      var indent = Math.min(level - minLevel, 5);

      var link = document.createElement('a');
      link.className = 'toc-link toc-level-' + indent;
      link.setAttribute('data-heading-id', h.id);
      link.setAttribute('href', '#' + h.id);
      link.textContent = h.textContent.trim();
      link.tabIndex = 0;
      nav.appendChild(link);
    });

    tocSidebar.innerHTML = '';
    tocSidebar.appendChild(nav);
  }

  buildToc();

  // ── TOC click handler: smooth scroll to heading ─────────────────────────
  tocSidebar.addEventListener('click', function(e) {
    var target = e.target;
    var link = target.closest ? target.closest('a[data-heading-id]') : null;
    if (!link) return;

    e.preventDefault();
    var id = link.getAttribute('data-heading-id');
    if (id) {
      var heading = document.getElementById(id);
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // ── Scroll spy: highlight active TOC entry ──────────────────────────────
  function setupScrollSpy() {
    var tocLinks = document.querySelectorAll('.toc-link');
    var linkMap = {};
    tocLinks.forEach(function(link) {
      var id = link.getAttribute('data-heading-id');
      if (id) linkMap[id] = link;
    });

    var currentActive = null;
    var visibleHeadings = {};

    function setActive(headingId) {
      var link = linkMap[headingId];
      if (!link || link === currentActive) return;
      if (currentActive) currentActive.classList.remove('toc-active');
      link.classList.add('toc-active');
      currentActive = link;
      link.scrollIntoView({ block: 'nearest' });
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var id = entry.target.id;
        if (entry.isIntersecting) {
          visibleHeadings[id] = entry;
        } else {
          delete visibleHeadings[id];
        }
      });

      var topId = '';
      var topY = Infinity;
      for (var id in visibleHeadings) {
        var y = visibleHeadings[id].boundingClientRect.top;
        if (y < topY) {
          topY = y;
          topId = id;
        }
      }
      if (topId) setActive(topId);
    }, {
      root: contentEl,
      rootMargin: '0px 0px -80% 0px',
      threshold: 0
    });

    var article = contentEl.querySelector('article.prose');
    if (!article) return;

    var headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(function(h) {
      if (h.id) observer.observe(h);
    });

    if (headings.length > 0 && headings[0].id) {
      requestAnimationFrame(function() {
        if (!currentActive && headings[0].id) setActive(headings[0].id);
      });
    }
  }

  setupScrollSpy();

  // ── Progress bar ────────────────────────────────────────────────────────
  var progressRafPending = false;

  function updateProgressBar() {
    if (progressRafPending) return;
    progressRafPending = true;
    requestAnimationFrame(function() {
      var scrollTop = contentEl.scrollTop;
      var scrollHeight = contentEl.scrollHeight - contentEl.clientHeight;
      var percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      if (progressBar) progressBar.style.width = percent + '%';
      progressRafPending = false;
    });
  }

  contentEl.addEventListener('scroll', updateProgressBar, { passive: true });

  // ── Back-to-top button ──────────────────────────────────────────────────
  contentEl.addEventListener('scroll', function() {
    if (!backToTop) return;
    if (contentEl.scrollTop > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', function() {
      contentEl.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  function shouldHandleKeyboard() {
    var active = document.activeElement;
    if (!active) return true;
    var tag = active.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
    if (active.isContentEditable) return false;
    return true;
  }

  document.addEventListener('keydown', function(e) {
    if (!shouldHandleKeyboard()) return;

    switch (e.key) {
      case 'j':
        contentEl.scrollBy({ top: 60, behavior: 'smooth' });
        e.preventDefault();
        break;

      case 'k':
        contentEl.scrollBy({ top: -60, behavior: 'smooth' });
        e.preventDefault();
        break;

      case ' ':
        if (e.shiftKey) {
          contentEl.scrollBy({ top: -(contentEl.clientHeight * 0.85), behavior: 'smooth' });
        } else {
          contentEl.scrollBy({ top: contentEl.clientHeight * 0.85, behavior: 'smooth' });
        }
        e.preventDefault();
        break;

      case 'Home':
        contentEl.scrollTo({ top: 0, behavior: 'smooth' });
        e.preventDefault();
        break;

      case 'End':
        contentEl.scrollTo({ top: contentEl.scrollHeight, behavior: 'smooth' });
        e.preventDefault();
        break;

      case 'b':
        if (e.ctrlKey || e.metaKey) {
          toggleSidebar();
          e.preventDefault();
        }
        break;

      case '\\\\':
        if (e.ctrlKey || e.metaKey) {
          toggleSidebar();
          e.preventDefault();
        }
        break;

      case 'f':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          openFindOverlay();
        }
        break;

      case '=':
      case '+':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          applyZoom(getZoom() + ZOOM_STEP);
        }
        break;

      case '-':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          applyZoom(getZoom() - ZOOM_STEP);
        }
        break;

      case '0':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          applyZoom(ZOOM_DEFAULT);
        }
        break;
    }
  });

  // ── Zoom controls ───────────────────────────────────────────────────
  var ZOOM_STEP = 10;
  var ZOOM_MIN = 60;
  var ZOOM_MAX = 200;
  var ZOOM_DEFAULT = 100;

  function getZoom() {
    var z = parseInt(localStorage.getItem('md-reader-zoom') || '100', 10);
    return isNaN(z) ? ZOOM_DEFAULT : Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  }

  function applyZoom(percent) {
    percent = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, percent));
    localStorage.setItem('md-reader-zoom', String(percent));
    var article = contentEl.querySelector('article.prose');
    if (article) article.style.fontSize = percent + '%';
  }

  applyZoom(getZoom());

  // ── Find-in-page ──────────────────────────────────────────────────────
  var findOverlay = null;
  var findInput = null;
  var findCount = null;
  var findMatches = [];
  var findCurrentIdx = -1;

  function createFindOverlay() {
    if (findOverlay) return;
    findOverlay = document.createElement('div');
    findOverlay.id = 'find-overlay';
    findOverlay.innerHTML =
      '<input id="find-input" type="text" placeholder="Find in page..." autocomplete="off" />' +
      '<span id="find-count"></span>' +
      '<button id="find-prev" title="Previous (Shift+Enter)">&uarr;</button>' +
      '<button id="find-next" title="Next (Enter)">&darr;</button>' +
      '<button id="find-close" title="Close (Escape)">&times;</button>';
    document.body.appendChild(findOverlay);

    findInput = document.getElementById('find-input');
    findCount = document.getElementById('find-count');

    findInput.addEventListener('input', function() { doFind(findInput.value); });
    findInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) { navigateFind(-1); } else { navigateFind(1); }
      }
      if (e.key === 'Escape') { closeFindOverlay(); }
    });
    document.getElementById('find-prev').addEventListener('click', function() { navigateFind(-1); });
    document.getElementById('find-next').addEventListener('click', function() { navigateFind(1); });
    document.getElementById('find-close').addEventListener('click', closeFindOverlay);
  }

  function openFindOverlay() {
    createFindOverlay();
    findOverlay.classList.add('visible');
    findInput.focus();
    if (findInput.value) findInput.select();
  }

  function closeFindOverlay() {
    if (!findOverlay) return;
    findOverlay.classList.remove('visible');
    clearHighlights();
    findInput.blur();
  }

  function clearHighlights() {
    var marks = contentEl.querySelectorAll('mark.find-highlight');
    marks.forEach(function(m) {
      var parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
    findMatches = [];
    findCurrentIdx = -1;
    if (findCount) findCount.textContent = '';
  }

  function doFind(query) {
    clearHighlights();
    if (!query || query.length < 2) return;

    var article = contentEl.querySelector('article.prose');
    if (!article) return;

    // Walk text nodes and highlight matches
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE') {
        textNodes.push(node);
      }
    }

    var lowerQuery = query.toLowerCase();
    for (var i = 0; i < textNodes.length; i++) {
      var textNode = textNodes[i];
      var text = textNode.textContent;
      var lowerText = text.toLowerCase();
      var idx = lowerText.indexOf(lowerQuery);
      if (idx === -1) continue;

      // Split the text node and wrap the match in <mark>
      var before = text.substring(0, idx);
      var match = text.substring(idx, idx + query.length);
      var after = text.substring(idx + query.length);

      var mark = document.createElement('mark');
      mark.className = 'find-highlight';
      mark.textContent = match;

      var parent = textNode.parentNode;
      if (before) parent.insertBefore(document.createTextNode(before), textNode);
      parent.insertBefore(mark, textNode);
      if (after) parent.insertBefore(document.createTextNode(after), textNode);
      parent.removeChild(textNode);

      findMatches.push(mark);
      // Re-scan remaining text in the 'after' node
      if (after.toLowerCase().indexOf(lowerQuery) !== -1) {
        textNodes.splice(i + 1, 0, mark.nextSibling);
      }
    }

    if (findMatches.length > 0) {
      findCurrentIdx = 0;
      findMatches[0].classList.add('find-current');
      findMatches[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    updateFindCount();
  }

  function navigateFind(dir) {
    if (findMatches.length === 0) return;
    if (findCurrentIdx >= 0) findMatches[findCurrentIdx].classList.remove('find-current');
    findCurrentIdx = (findCurrentIdx + dir + findMatches.length) % findMatches.length;
    findMatches[findCurrentIdx].classList.add('find-current');
    findMatches[findCurrentIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
    updateFindCount();
  }

  function updateFindCount() {
    if (!findCount) return;
    if (findMatches.length === 0) {
      findCount.textContent = findInput && findInput.value.length >= 2 ? 'No matches' : '';
    } else {
      findCount.textContent = (findCurrentIdx + 1) + '/' + findMatches.length;
    }
  }

  // ── Anchor link interception: smooth scroll within content div ───────
  // In-page #hash links need to scroll the #content div, not the window,
  // since content is the scrollable container.
  contentEl.addEventListener('click', function(e) {
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href) return;

    // Handle in-page anchor links (#section)
    if (href.charAt(0) === '#') {
      e.preventDefault();
      var targetId = href.slice(1);
      var target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL hash without scrolling the window
        history.replaceState(null, '', href);
      }
      return;
    }

    // Handle .md file links — navigate to them (works in watch mode server)
    if (href.match(/\\.md(#.*)?$/) && !href.match(/^https?:\\/\\//)) {
      // Let the browser navigate naturally — watch mode server handles .md routes,
      // static mode has rewritten .md hrefs to .html at build time
      return;
    }
  });

  // On initial load, scroll to hash target if present
  if (window.location.hash) {
    var hashTarget = document.getElementById(window.location.hash.slice(1));
    if (hashTarget) {
      setTimeout(function() {
        hashTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // ── PDF export ────────────────────────────────────────────────────────
  var pdfExport = document.getElementById('pdf-export');
  if (pdfExport) {
    pdfExport.addEventListener('click', function() { window.print(); });
  }

  // ── Toolbar event wiring ────────────────────────────────────────────────
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (themeToggle) themeToggle.addEventListener('click', cycleTheme);
  if (styleToggle) styleToggle.addEventListener('click', cycleStyle);

  // Set document title in toolbar
  if (docTitle) {
    docTitle.textContent = document.title;
  }
})();
</script>`
