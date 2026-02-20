# CLAUDE.md — markdown-reader

## What This Is

CLI tool that renders markdown files as a beautiful HTML reading experience

**Owner:** Marius Jonathan Jauernik
**GitHub:** [mj-deving/markdown-reader](https://github.com/mj-deving/markdown-reader)
**Created:** 2026-02-20

## Tech Stack

- **Runtime:** Bun 1.3.9 + TypeScript
- **Markdown pipeline:** unified + remark-parse + remark-gfm + remark-rehype + rehype-highlight + rehype-stringify
- **Output:** Self-contained HTML (all CSS inlined, zero external requests)
- **Global binary:** `~/.bun/bin/md-reader` (via `bun link`)

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
├── CLAUDE.md          # This file — project context for Isidore
├── README.md          # Public-facing documentation
├── package.json       # Bun deps + bin: md-reader → src/cli.ts
├── tsconfig.json
├── bun.lock
├── src/
│   ├── cli.ts         # Entry point: arg parsing, orchestration
│   ├── converter.ts   # unified markdown → HTML body pipeline
│   ├── template.ts    # Wraps body in full HTML page
│   ├── styles.ts      # Self-contained CSS (dark/light, hljs themes)
│   └── opener.ts      # WSL2-aware browser opener (cmd.exe + wslpath)
├── test/
│   └── fixture.md     # GFM feature test fixture
└── .sessions/         # Session docs (gitignored)
```

## Current State

**Status:** v0.1.0 complete — shipped 2026-02-20
**Last session:** 2026-02-20 — built full v0.1.0 CLI (11/11 ISC passing, 267ms conversion)

**Usage:**
```bash
md-reader README.md              # convert + open in browser
md-reader file.md --no-open     # convert only, print path
md-reader file.md --output ~/Desktop/out.html
```

**Next steps (v2):**
- `--watch` mode for live reload
- PDF export via headless browser
