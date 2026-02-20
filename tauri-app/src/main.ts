// main.ts — Tauri app frontend orchestrator
//
// Receives markdown from Rust backend via IPC, renders through the unified
// pipeline (shared with CLI), manages TOC sidebar, toolbar, theme, keyboard
// shortcuts, and live-reload transitions.

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { convertMarkdown } from '../../src/converter'
import { CSS } from '../../src/styles'
import { buildToc, setupScrollSpy } from './toc'
import './app.css'

// ── Inject the markdown styles ───────────────────────────────────────────────
const styleEl = document.createElement('style')
styleEl.textContent = CSS
document.head.appendChild(styleEl)

// ── DOM references ───────────────────────────────────────────────────────────
const contentEl = document.getElementById('content')!
const tocSidebar = document.getElementById('toc-sidebar')!
const filenameEl = document.getElementById('filename')!
const progressBar = document.getElementById('progress-bar')!
const sidebarToggle = document.getElementById('sidebar-toggle')!
const themeToggle = document.getElementById('theme-toggle')!

// ── State ────────────────────────────────────────────────────────────────────
let scrollSpyObserver: IntersectionObserver | null = null
let isTransitioning = false
let pendingMarkdown: string | null = null

// ── Theme management ─────────────────────────────────────────────────────────
// Three-state cycle: light → dark → system
type ThemeMode = 'light' | 'dark' | 'system'

const themeIconLight = document.getElementById('theme-icon-light')!
const themeIconDark = document.getElementById('theme-icon-dark')!
const themeIconSystem = document.getElementById('theme-icon-system')!

function getStoredTheme(): ThemeMode {
  return (localStorage.getItem('md-reader-theme') as ThemeMode) || 'system'
}

function applyTheme(mode: ThemeMode): void {
  localStorage.setItem('md-reader-theme', mode)

  // Update the html[data-theme] attribute
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  // Update icon visibility
  themeIconLight.style.display = mode === 'light' ? '' : 'none'
  themeIconDark.style.display = mode === 'dark' ? '' : 'none'
  themeIconSystem.style.display = mode === 'system' ? '' : 'none'
}

function cycleTheme(): void {
  const current = getStoredTheme()
  const next: ThemeMode =
    current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
  applyTheme(next)
}

// Apply stored theme immediately
applyTheme(getStoredTheme())

// ── Sidebar toggle ───────────────────────────────────────────────────────────
function toggleSidebar(): void {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (isMobile) {
    document.body.classList.toggle('sidebar-open')
  } else {
    document.body.classList.toggle('sidebar-collapsed')
  }
}

// ── Progress bar ─────────────────────────────────────────────────────────────
let progressRafPending = false

function updateProgressBar(): void {
  if (progressRafPending) return
  progressRafPending = true
  requestAnimationFrame(() => {
    const scrollTop = contentEl.scrollTop
    const scrollHeight = contentEl.scrollHeight - contentEl.clientHeight
    const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
    progressBar.style.width = `${percent}%`
    progressRafPending = false
  })
}

contentEl.addEventListener('scroll', updateProgressBar, { passive: true })

// ── Scroll position preservation ─────────────────────────────────────────────
// Capture the nearest visible heading ID before re-render,
// then scroll to it after swap (content offsets may shift).

function getNearestVisibleHeadingId(): string | null {
  const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const scrollTop = contentEl.scrollTop
  let closestId: string | null = null
  let closestDist = Infinity

  headings.forEach((heading) => {
    if (!heading.id) return
    const dist = Math.abs(
      (heading as HTMLElement).offsetTop - scrollTop,
    )
    if (dist < closestDist) {
      closestDist = dist
      closestId = heading.id
    }
  })

  return closestId
}

function restoreScrollPosition(headingId: string | null): void {
  if (!headingId) return
  const heading = document.getElementById(headingId)
  if (heading) {
    heading.scrollIntoView({ block: 'start' })
  }
}

// ── Rendering pipeline ───────────────────────────────────────────────────────
// Off-screen DOM build: createElement + innerHTML + replaceChildren()
// Atomic swap so IntersectionObserver never sees empty container.

async function render(
  markdown: string,
  isLiveReload: boolean = false,
): Promise<void> {
  // If we're mid-transition, coalesce — keep latest markdown
  if (isTransitioning) {
    pendingMarkdown = markdown
    return
  }

  const savedHeadingId = isLiveReload ? getNearestVisibleHeadingId() : null

  // Build article off-screen
  const html = await convertMarkdown(markdown)
  const article = document.createElement('article')
  article.className = 'prose'
  article.innerHTML = html

  // Assign IDs to headings for TOC anchor links
  const headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading, i) => {
    if (!heading.id) {
      heading.id = `heading-${i}`
    }
  })

  if (isLiveReload) {
    // Animated transition: fade out → swap → fade in
    await fadeTransition(article, savedHeadingId)
  } else {
    // Initial load: atomic swap, no animation
    removeSkeleton()
    contentEl.replaceChildren(article)
    rebuildTocAndSpy()
    restoreScrollPosition(savedHeadingId)
  }

  // Update filename display from document title
  filenameEl.textContent = document.title

  // Update progress bar for new content
  updateProgressBar()
}

/**
 * Fade out current content, swap in new article, fade in.
 * Uses transitionend + 200ms timeout fallback for reliability.
 */
async function fadeTransition(
  newArticle: HTMLElement,
  savedHeadingId: string | null,
): Promise<void> {
  isTransitioning = true

  // Disconnect observer during swap
  if (scrollSpyObserver) {
    scrollSpyObserver.disconnect()
    scrollSpyObserver = null
  }

  const current = contentEl.querySelector('article.prose')

  if (current) {
    // Fade out
    current.classList.add('transitioning')
    current.classList.add('fade-enter')
    current.classList.add('fade-active')

    await waitForTransition(current as HTMLElement, 200)
  }

  // Swap: atomic replacement
  contentEl.replaceChildren(newArticle)
  rebuildTocAndSpy()
  restoreScrollPosition(savedHeadingId)

  // Fade in
  newArticle.classList.add('fade-enter', 'transitioning')
  // Force reflow before removing fade-enter to trigger transition
  void newArticle.offsetHeight
  newArticle.classList.add('fade-active')
  newArticle.classList.remove('fade-enter')

  await waitForTransition(newArticle, 200)

  newArticle.classList.remove('fade-active', 'transitioning')
  isTransitioning = false

  // Process coalesced render if a save arrived mid-transition
  if (pendingMarkdown !== null) {
    const md = pendingMarkdown
    pendingMarkdown = null
    await render(md, true)
  }
}

/**
 * Wait for a CSS transition to end, with a timeout fallback.
 * Returns a promise that resolves after the transition or timeout.
 */
function waitForTransition(el: HTMLElement, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false
    const done = () => {
      if (resolved) return
      resolved = true
      el.removeEventListener('transitionend', done)
      resolve()
    }
    el.addEventListener('transitionend', done, { once: true })
    setTimeout(done, timeoutMs)
  })
}

// ── TOC + scroll spy lifecycle ───────────────────────────────────────────────

function rebuildTocAndSpy(): void {
  buildToc(contentEl, tocSidebar)
  scrollSpyObserver = setupScrollSpy(contentEl)
}

// ── Remove loading skeleton ──────────────────────────────────────────────────

function removeSkeleton(): void {
  const skeleton = contentEl.querySelector('.skeleton')
  if (skeleton) skeleton.remove()
}

// ── Keyboard shortcuts ───────────────────────────────────────────────────────
// Block only when focused on INPUT/TEXTAREA/SELECT/contentEditable
// (not just activeElement === body — that's too restrictive)

function shouldHandleKeyboard(): boolean {
  const active = document.activeElement
  if (!active) return true
  const tag = active.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false
  if ((active as HTMLElement).isContentEditable) return false
  return true
}

document.addEventListener('keydown', (e) => {
  if (!shouldHandleKeyboard()) return

  switch (e.key) {
    case 'j':
      contentEl.scrollBy({ top: 60, behavior: 'smooth' })
      e.preventDefault()
      break

    case 'k':
      contentEl.scrollBy({ top: -60, behavior: 'smooth' })
      e.preventDefault()
      break

    case ' ':
      if (e.shiftKey) {
        contentEl.scrollBy({
          top: -(contentEl.clientHeight * 0.85),
          behavior: 'smooth',
        })
      } else {
        contentEl.scrollBy({
          top: contentEl.clientHeight * 0.85,
          behavior: 'smooth',
        })
      }
      e.preventDefault()
      break

    case 'Home':
      contentEl.scrollTo({ top: 0, behavior: 'smooth' })
      e.preventDefault()
      break

    case 'End':
      contentEl.scrollTo({ top: contentEl.scrollHeight, behavior: 'smooth' })
      e.preventDefault()
      break

    case 'b':
      if (e.ctrlKey || e.metaKey) {
        toggleSidebar()
        e.preventDefault()
      }
      break

    case '\\':
      if (e.ctrlKey || e.metaKey) {
        toggleSidebar()
        e.preventDefault()
      }
      break
  }
})

// ── Toolbar event wiring ─────────────────────────────────────────────────────
sidebarToggle.addEventListener('click', toggleSidebar)
themeToggle.addEventListener('click', cycleTheme)

// ── TOC click handler: smooth scroll to heading ──────────────────────────────
tocSidebar.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const link = target.closest('a[data-heading-id]') as HTMLAnchorElement | null
  if (link) {
    e.preventDefault()
    const id = link.getAttribute('data-heading-id')
    if (id) {
      const heading = document.getElementById(id)
      heading?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
})

// ── Initial load ─────────────────────────────────────────────────────────────
// Skeleton is already visible in index.html (before this script runs).
// We ask Rust for the file, then render — skeleton is removed on success.

async function init(): Promise<void> {
  try {
    const markdown = await invoke<string>('read_file')
    await render(markdown, false)
  } catch (err) {
    removeSkeleton()
    const article = document.createElement('article')
    article.className = 'prose'
    const h1 = document.createElement('h1')
    h1.textContent = 'Error'
    const p = document.createElement('p')
    p.textContent = `Could not load file: ${String(err)}`
    article.append(h1, p)
    contentEl.replaceChildren(article)
  }
}

// ── Live-reload: listen for file changes from Rust watcher ───────────────────
// No frontend debounce — Rust already debounces at 100ms.
listen<string>('file-changed', async (event) => {
  await render(event.payload, true)
})

init()
