// browser-script.ts — Inline JavaScript for the enhanced browser HTML output
//
// Provides: TOC extraction, sidebar rendering, scroll spy, theme toggle,
// keyboard shortcuts, progress bar, back-to-top button.
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
  var backToTop = document.getElementById('back-to-top');

  if (!contentEl || !tocSidebar) return;

  // ── Theme management ────────────────────────────────────────────────────
  // Three-state cycle: light → dark → system
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
        // Create a slug from heading text, fall back to index
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

      // Pick the heading closest to the top
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

    // Edge case: highlight first heading for short documents
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
    }
  });

  // ── Toolbar event wiring ────────────────────────────────────────────────
  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (themeToggle) themeToggle.addEventListener('click', cycleTheme);

  // Set document title in toolbar
  if (docTitle) {
    docTitle.textContent = document.title;
  }
})();
</script>`
