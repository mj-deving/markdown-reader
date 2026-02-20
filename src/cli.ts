#!/usr/bin/env bun
import { convertMarkdown, extractTitle } from './converter'
import { buildHtml } from './template'
import { openInBrowser } from './opener'
import { join, basename, extname } from 'path'

const VERSION = '0.1.0'

const HELP = `
md-reader — Render markdown as a beautiful HTML reading experience

Usage:
  md-reader <file.md> [options]

Options:
  --output <path>   Save HTML to a specific path (default: /tmp)
  --no-open         Convert but don't open in browser
  --version         Show version
  --help            Show this help

Examples:
  md-reader README.md
  md-reader docs/guide.md --no-open
  md-reader notes.md --output ~/Desktop/notes.html
`.trim()

// ── Arg parsing ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP)
  process.exit(0)
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(`md-reader v${VERSION}`)
  process.exit(0)
}

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
const inputFile = args.find(a => !a.startsWith('--') && a !== outputPath)

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

// ── Convert ───────────────────────────────────────────────────────────────────
const markdown = await file.text()
const titleFallback = basename(inputFile, '.md')
const title = extractTitle(markdown, titleFallback)

const htmlBody = await convertMarkdown(markdown)
const fullHtml = buildHtml(title, htmlBody)

// ── Write output ──────────────────────────────────────────────────────────────
const outFile = outputPath ?? join('/tmp', `md-reader-${titleFallback}-${Date.now()}.html`)
await Bun.write(outFile, fullHtml)

console.log(`→ ${outFile}`)

// ── Open in browser ───────────────────────────────────────────────────────────
if (!noOpen) {
  await openInBrowser(outFile)
}
