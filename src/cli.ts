#!/usr/bin/env bun
import { convertMarkdown, extractTitle } from './converter'
import { buildHtml } from './template'
import { openInBrowser } from './opener'
import { startWatchMode } from './watcher'
import { findBrowser, exportPdf } from './pdf'
import { join, basename, extname, dirname, resolve } from 'path'

const VERSION = '0.2.0'

const HELP = `
md-reader — Render markdown as a beautiful HTML reading experience

Usage:
  md-reader <file.md> [options]

Options:
  --watch, -w       Watch for changes and live-reload in browser
  --pdf             Export as PDF (requires Chrome, Edge, or Chromium)
  --output <path>   Save HTML/PDF to a specific path
  --no-open         Convert but don't open in browser
  --version         Show version
  --help            Show this help

Examples:
  md-reader README.md
  md-reader README.md --watch
  md-reader README.md --pdf
  md-reader README.md --pdf --output ~/Desktop/readme.pdf
  md-reader docs/guide.md --no-open
`.trim()

// ── Arg parsing ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP)
  process.exit(0)
}

if (args.includes('--version')) {
  console.log(`md-reader v${VERSION}`)
  process.exit(0)
}

const watchMode = args.includes('--watch') || args.includes('-w')
const pdfMode = args.includes('--pdf')
const noOpen = args.includes('--no-open')
const outputIdx = args.indexOf('--output')
let outputPath: string | null = null
if (outputIdx !== -1) {
  outputPath = args[outputIdx + 1]
  if (!outputPath || outputPath.startsWith('--')) {
    console.error('Error: --output requires a path argument')
    process.exit(1)
  }
}

// First non-flag argument is the input file
const inputFile = args.find(a => !a.startsWith('--') && !a.startsWith('-w') && a !== outputPath)

if (!inputFile) {
  console.error('Error: No input file specified\n\nRun `md-reader --help` for usage.')
  process.exit(1)
}

// ── Validation ────────────────────────────────────────────────────────────────
if (extname(inputFile) !== '.md') {
  console.error(`Error: "${inputFile}" is not a markdown file (.md required)`)
  process.exit(1)
}

const file = Bun.file(inputFile)
if (!(await file.exists())) {
  console.error(`Error: File not found: "${inputFile}"`)
  process.exit(1)
}

// ── Watch mode: serve with live-reload ────────────────────────────────────────
if (watchMode) {
  await startWatchMode(inputFile)
} else {
  // ── Convert markdown to HTML ──────────────────────────────────────────────
  const markdown = await file.text()
  const titleFallback = basename(inputFile, '.md')
  const title = extractTitle(markdown, titleFallback)

  const htmlBody = await convertMarkdown(markdown)
  const fullHtml = buildHtml(title, htmlBody)

  if (pdfMode) {
    // ── PDF export mode ───────────────────────────────────────────────────
    const browser = findBrowser()
    if (!browser) {
      console.error(
        'Error: No headless browser found for PDF export.\n\n' +
        'Install one of:\n' +
        '  • Google Chrome  — https://google.com/chrome\n' +
        '  • Microsoft Edge — https://microsoft.com/edge\n' +
        '  • Chromium       — apt install chromium-browser'
      )
      process.exit(1)
    }

    // Default: same name as input, with .pdf extension, in same directory
    const pdfFile = outputPath ?? join(
      dirname(resolve(inputFile)),
      `${titleFallback}.pdf`
    )

    await exportPdf(fullHtml, pdfFile, browser)
    console.log(`→ ${pdfFile}`)

    if (!noOpen) {
      await openInBrowser(pdfFile)
    }
  } else {
    // ── HTML output mode ────────────────────────────────────────────────
    const outFile = outputPath ?? join('/tmp', `md-reader-${titleFallback}-${Date.now()}.html`)
    await Bun.write(outFile, fullHtml)

    console.log(`→ ${outFile}`)

    if (!noOpen) {
      await openInBrowser(outFile)
    }
  }
}
