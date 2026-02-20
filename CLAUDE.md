# CLAUDE.md — markdown-reader

## What This Is

CLI tool and Tauri v2 desktop app that renders markdown files as a beautiful HTML reading experience.

**Owner:** Marius
**GitHub:** [mj-deving/markdown-reader](https://github.com/mj-deving/markdown-reader)
**Created:** 2026-02-20

## Tech Stack

- **Runtime:** Bun 1.3.9 + TypeScript
- **Markdown pipeline:** unified + remark-parse + remark-gfm + remark-rehype + rehype-sanitize + rehype-highlight + rehype-stringify
- **Desktop:** Tauri v2 (Rust backend + WebView frontend)
- **Output:** Self-contained HTML (all CSS inlined, zero external requests)
- **Global binary:** `~/.bun/bin/md-reader` (via `bun link`)
- **CI/CD:** GitHub Actions — tag push triggers cross-platform release builds

## Conventions

- Commit messages: clear "why", prefixed by area when helpful
- Every session should end with a commit capturing the work done
- Code comments: thorough — document interfaces and logic
- File naming: kebab-case

## Session Workflow

1. Read this file on session start for project context
2. Do the work
3. Commit with a descriptive message at session end
4. Push to GitHub

## Project Structure

```
.
├── CLAUDE.md                # This file — project context for Isidore
├── README.md                # Public-facing documentation
├── package.json             # Bun deps + bin: md-reader → src/cli.ts
├── tsconfig.json
├── bun.lock
├── src/
│   ├── cli.ts               # Entry point: arg parsing, orchestration
│   ├── converter.ts         # unified markdown → HTML body pipeline (shared with Tauri)
│   ├── template.ts          # Wraps body in full HTML page
│   ├── styles.ts            # Self-contained CSS (dark/light, hljs themes)
│   ├── watcher.ts           # --watch live-reload server (Bun.serve + WebSocket)
│   ├── pdf.ts               # --pdf export via headless Chrome/Edge/Chromium
│   └── opener.ts            # WSL2-aware browser opener (cmd.exe + wslpath)
├── tauri-app/               # Tauri v2 desktop application
│   ├── src/                 # Frontend TypeScript (runs in WebView)
│   │   ├── main.ts          # Orchestrator: receives markdown, renders, manages TOC
│   │   ├── toc.ts           # Heading extraction + sidebar renderer
│   │   └── app.css          # Two-panel layout (sidebar + content)
│   ├── src-tauri/           # Rust backend
│   │   ├── Cargo.toml       # tauri, tauri-plugin-fs, notify
│   │   └── src/main.rs      # File I/O, file watching, IPC commands
│   ├── index.html           # WebView entry point
│   ├── vite.config.ts       # Bundles unified pipeline + styles from ../src/
│   └── package.json         # Frontend deps
├── integrations/
│   ├── windows/             # Right-click "Open with" (registry + bat wrapper)
│   └── linux/               # XDG .desktop MIME association
├── .github/workflows/
│   └── release.yml          # CI/CD: tag push → build .deb/.AppImage/.msi/.exe → GitHub Release
├── test/
│   └── fixture.md           # GFM feature test fixture
└── .sessions/               # Session docs (gitignored)
```

## Security

- `rehype-sanitize` strips dangerous HTML (custom schema preserves className for syntax highlighting)
- CI actions SHA-pinned (not mutable tag refs)
- Tauri CSP: `script-src 'self'`, empty capabilities (minimal permissions)
- Watch mode validates Host header (DNS rebinding protection)
- All process spawning uses array args (no shell injection)
- Error handlers use textContent/DOM API (no innerHTML XSS)

## Current State

**Status:** v1.0.0 shipped — UX overhaul implemented, pending runtime test
**Last session:** 2026-02-20 — UX overhaul implemented (toolbar, theme, scroll spy, keyboard nav)

**Usage:**
```bash
md-reader README.md              # convert + open in browser
md-reader README.md --watch      # live-reload in browser
md-reader README.md --pdf        # export as PDF
md-reader file.md --no-open      # convert only, print path
md-reader file.md --output ~/Desktop/out.html
```

**Desktop app:** Download installers from [GitHub Releases](https://github.com/mj-deving/markdown-reader/releases) (.deb, .AppImage, .msi, .exe)

## Open Items

- [x] Implement UX overhaul (plan at `tauri-app/Plans/drifting-beaming-planet.md`)
- [ ] Runtime test UX overhaul, then tag v1.1.0
- [ ] Design proper app icons (currently solid-color placeholders)
- [ ] Consider code signing for future releases (SmartScreen)
- [ ] Tauri auto-update plugin for future versions
