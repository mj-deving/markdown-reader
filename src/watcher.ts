import { watch } from 'fs'
import { convertMarkdown, extractTitle } from './converter'
import { buildHtml } from './template'
import { openInBrowser } from './opener'
import { basename, resolve } from 'path'
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
 * - Watches the source file for changes via fs.watch with debounce
 * - On change: re-converts and notifies all connected browsers to reload
 * - Ctrl+C gracefully shuts everything down
 */
export async function startWatchMode(inputFile: string): Promise<void> {
  const absPath = resolve(inputFile)
  const titleFallback = basename(inputFile, '.md')

  // ── Initial conversion ───────────────────────────────────────────────────
  let currentHtml = await convert(absPath, titleFallback)

  // ── Track connected WebSocket clients ────────────────────────────────────
  const clients = new Set<ServerWebSocket<unknown>>()

  // ── HTTP + WebSocket server via Bun.serve ────────────────────────────────
  const server: Server = Bun.serve({
    port: 0, // Let OS pick an available port
    fetch(req, server) {
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

      // Serve the current HTML for everything else
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
        currentHtml = await convert(absPath, titleFallback)
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
async function convert(absPath: string, titleFallback: string): Promise<string> {
  const markdown = await Bun.file(absPath).text()
  const title = extractTitle(markdown, titleFallback)
  const body = await convertMarkdown(markdown)
  return buildHtml(title, body, RELOAD_SCRIPT)
}
