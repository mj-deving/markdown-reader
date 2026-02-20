// main.ts — Tauri app frontend orchestrator
//
// Receives markdown content from Rust backend via IPC,
// renders it through the unified pipeline (reused from CLI),
// and manages the TOC sidebar. Listens for file-changed events
// from the Rust file watcher for live-reload.

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { convertMarkdown } from '../../src/converter'
import { CSS } from '../../src/styles'
import { buildToc } from './toc'
import './app.css'

// ── Inject the markdown styles ───────────────────────────────────────────────
const styleEl = document.createElement('style')
styleEl.textContent = CSS
document.head.appendChild(styleEl)

// ── DOM references ───────────────────────────────────────────────────────────
const contentEl = document.getElementById('content')!
const tocSidebar = document.getElementById('toc-sidebar')!

// ── Render markdown into the content area + update TOC ───────────────────────
async function render(markdown: string): Promise<void> {
  const html = await convertMarkdown(markdown)
  contentEl.innerHTML = `<article class="prose">${html}</article>`

  // Add IDs to headings for TOC anchor links
  const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading, i) => {
    if (!heading.id) {
      heading.id = `heading-${i}`
    }
  })

  // Build and inject TOC
  const tocHtml = buildToc(contentEl)
  tocSidebar.innerHTML = tocHtml
}

// ── Initial load: ask Rust for the file content ──────────────────────────────
async function init(): Promise<void> {
  try {
    const markdown = await invoke<string>('read_file')
    await render(markdown)
  } catch (err) {
    contentEl.innerHTML = `<article class="prose">
      <h1>Error</h1>
      <p>Could not load file: ${String(err)}</p>
    </article>`
  }
}

// ── Live-reload: listen for file changes from Rust watcher ───────────────────
listen<string>('file-changed', async (event) => {
  await render(event.payload)
})

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

init()
