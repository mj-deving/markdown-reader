# markdown-reader

CLI tool and desktop app that renders markdown files as a beautiful HTML reading experience.

Dark/light theme, GitHub Flavored Markdown, syntax highlighting, live reload, PDF export — all self-contained with zero external requests.

## Features

- **Self-contained HTML** — all CSS inlined, no external dependencies
- **Dark and light themes** — follows your system preference
- **GitHub Flavored Markdown** — tables, task lists, strikethrough, autolinks
- **Syntax highlighting** — via highlight.js with theme-matched colors
- **Live reload** — `--watch` mode with WebSocket hot-refresh
- **PDF export** — `--pdf` via headless Chrome/Edge/Chromium
- **Desktop app** — native Tauri window with TOC sidebar and file watching
- **OS integration** — right-click "Open with" on Windows and Linux

## Installation

### CLI (requires Bun)

```bash
# Clone and link globally
git clone https://github.com/mj-deving/markdown-reader.git
cd markdown-reader
bun install
bun link
```

Now `md-reader` is available system-wide:

```bash
md-reader README.md
```

### Desktop App (pre-built installers)

Download the latest release from [GitHub Releases](https://github.com/mj-deving/markdown-reader/releases):

| Platform | File | Install |
|----------|------|---------|
| Windows | `md-reader_*_x64-setup.exe` | Run the installer |
| Windows | `md-reader_*_x64_en-US.msi` | `msiexec /i md-reader_*.msi` |
| Linux (Debian/Ubuntu) | `md-reader_*_amd64.deb` | `sudo dpkg -i md-reader_*.deb` |
| Linux (any) | `md-reader_*_amd64.AppImage` | `chmod +x *.AppImage && ./*.AppImage` |

> **Windows SmartScreen:** The installers are not code-signed, so Windows may show a "Windows protected your PC" warning. Click **More info** then **Run anyway** to proceed. This is normal for open-source software without a paid code-signing certificate.

### OS "Open With" Integration

#### Windows (right-click context menu)

From WSL2:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "$(wslpath -w integrations/windows/install-context-menu.ps1)"
```

This registers `.md` files to open with md-reader via the right-click menu. To remove:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "$(wslpath -w integrations/windows/uninstall-context-menu.ps1)"
```

#### Linux (XDG MIME association)

```bash
cp integrations/linux/md-reader.desktop ~/.local/share/applications/
xdg-mime default md-reader.desktop text/markdown
```

## Usage

```
md-reader <file.md> [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--watch`, `-w` | Watch for changes and live-reload in browser |
| `--pdf` | Export as PDF (requires Chrome, Edge, or Chromium) |
| `--output <path>` | Save HTML/PDF to a specific path |
| `--no-open` | Convert but don't open in browser |
| `--version` | Show version |
| `--help` | Show help |

### Examples

```bash
# Open rendered markdown in browser
md-reader README.md

# Live-reload while editing
md-reader README.md --watch

# Export to PDF
md-reader README.md --pdf

# Export PDF to specific path
md-reader README.md --pdf --output ~/Desktop/readme.pdf

# Convert only, don't open browser
md-reader docs/guide.md --no-open
```

## Development

```bash
# Prerequisites: Bun 1.3+, Rust (for Tauri app)
bun install

# Run CLI directly
bun run src/cli.ts README.md

# Tauri desktop app (requires Rust + system deps)
cd tauri-app
npm install
npx tauri dev -- -- ../README.md
```

## Tech Stack

- **Runtime:** Bun + TypeScript
- **Markdown:** unified + remark-parse + remark-gfm + remark-rehype + rehype-highlight + rehype-stringify
- **Desktop:** Tauri v2 (Rust backend + WebView frontend)
- **CI/CD:** GitHub Actions — tag push triggers cross-platform release builds

---

**Author:** Marius Jonathan Jauernik
