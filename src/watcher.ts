import { watch } from 'fs'
import { convertMarkdown, extractTitle } from './converter'
import { buildHtml } from './template'
import type { StylePreset } from './browser-styles'
import { openInBrowser } from './opener'
import { basename, resolve, join } from 'path'
import type { Server, ServerWebSocket } from 'bun'

// ── Live-reload client script injected into served HTML ──────────────────────
// Connects to the same host via WebSocket. On "reload" message, refreshes page.
// Reconnects automatically if the server restarts.
const RELOAD_SCRIPT = `
<script>
(function() {
  function connect() {
    var ws = new WebSocket('ws://' + location.host + '/__ws');
    ws.onmessage = function(e) { if (e.data === 'reload') location.reload(); };
    ws.onclose = function() { setTimeout(connect, 500); };
  }
  connect();
})();
</script>`

/**
 * Start watch mode: serve HTML over HTTP with WebSocket live-reload.
 *
 * - Reads and converts the markdown file on startup
 * - Serves the rendered HTML (with injected reload script) from memory
 * - Routes .md file requests to convert and serve linked markdown files
 * - Watches the source file for changes via fs.watch with debounce
 * - On change: re-converts and notifies all connected browsers to reload
 * - Ctrl+C gracefully shuts everything down
 */
export async function startWatchMode(inputFile: string, style: StylePreset = 'default'): Promise<void> {
  const absPath = resolve(inputFile)
  const sourceDir = resolve(inputFile, '..')
  const titleFallback = basename(inputFile, '.md')

  // ── Initial conversion ───────────────────────────────────────────────────
  let currentHtml = await convert(absPath, titleFallback, style)

  // ── Conversion cache for linked .md files (keyed by abs path) ────────
  const linkedCache = new Map<string, { mtime: number; html: string }>()

  // ── Track connected WebSocket clients ────────────────────────────────────
  const clients = new Set<ServerWebSocket<unknown>>()

  // ── HTTP + WebSocket server via Bun.serve ────────────────────────────────
  const server: Server = Bun.serve({
    port: 0, // Let OS pick an available port
    async fetch(req, server) {
      const url = new URL(req.url)

      // Reject requests from non-localhost origins (DNS rebinding protection)
      const host = req.headers.get('host')
      if (host && !host.startsWith('localhost:') && !host.startsWith('127.0.0.1:')) {
        return new Response('Forbidden', { status: 403 })
      }

      // WebSocket upgrade for the live-reload channel
      if (url.pathname === '/__ws') {
        const upgraded = server.upgrade(req)
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 400 })
        }
        return undefined as unknown as Response
      }

      // Route .md file requests — resolve relative to source directory
      if (url.pathname.endsWith('.md') && url.pathname !== '/') {
        const requestedPath = decodeURIComponent(url.pathname.slice(1)) // strip leading /
        const resolvedPath = resolve(sourceDir, requestedPath)

        // Security: ensure resolved path stays within source directory (trailing / prevents sibling match)
        if (!resolvedPath.startsWith(sourceDir + '/') && resolvedPath !== sourceDir) {
          return new Response('Forbidden: path traversal', { status: 403 })
        }

        try {
          const file = Bun.file(resolvedPath)
          if (!(await file.exists())) {
            return new Response(`Not found: ${requestedPath}`, { status: 404 })
          }

          // Check cache, re-convert if file changed (keyed by path, invalidated by mtime)
          const mtime = (await file.stat()).mtime?.getTime() ?? 0
          const cached = linkedCache.get(resolvedPath)
          let html: string
          if (cached && cached.mtime === mtime) {
            html = cached.html
          } else {
            html = await convert(resolvedPath, basename(requestedPath, '.md'), style)
            linkedCache.set(resolvedPath, { mtime, html })
          }

          return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        } catch (err) {
          return new Response('Error converting file', { status: 500 })
        }
      }

      // Serve the main (watched) file HTML for root and all other paths
      return new Response(currentHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    },
    websocket: {
      open(ws) { clients.add(ws) },
      close(ws) { clients.delete(ws) },
      message() { /* Client doesn't send messages */ },
    },
  })

  const serverUrl = `http://localhost:${server.port}`

  console.log(`\n  watching  ${absPath}`)
  console.log(`  serving  ${serverUrl}\n`)

  // ── Open browser ─────────────────────────────────────────────────────────
  await openInBrowser(serverUrl)

  // ── File watcher with debounce ───────────────────────────────────────────
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const watcher = watch(absPath, () => {
    // Debounce: fs.watch can fire multiple events for a single save
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      try {
        currentHtml = await convert(absPath, titleFallback, style)
        // Clear linked file cache on main file change (links may have changed)
        linkedCache.clear()
        const timestamp = new Date().toLocaleTimeString()
        console.log(`  ${timestamp}  re-converted`)

        // Notify all connected browsers
        for (const ws of clients) {
          ws.send('reload')
        }
      } catch (err) {
        console.error(`  error converting: ${err}`)
      }
    }, 150)
  })

  // ── Graceful shutdown on Ctrl+C ──────────────────────────────────────────
  const shutdown = () => {
    console.log('\n  shutting down...')
    watcher.close()
    if (debounceTimer) clearTimeout(debounceTimer)
    for (const ws of clients) { ws.close() }
    server.stop()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

// ── Helper: read file and convert to full HTML with reload script ───────────
async function convert(absPath: string, titleFallback: string, style: StylePreset = 'default'): Promise<string> {
  const markdown = await Bun.file(absPath).text()
  const title = extractTitle(markdown, titleFallback)
  const body = await convertMarkdown(markdown)
  return buildHtml(title, body, { style, injectScript: RELOAD_SCRIPT })
}
