#!/usr/bin/env bun
import { convertMarkdown, extractTitle } from './converter'
import { buildHtml } from './template'
import { STYLE_PRESETS, type StylePreset } from './browser-styles'
import { openInBrowser } from './opener'
import { startWatchMode } from './watcher'
import { findBrowser, exportPdf } from './pdf'
import { setDefault } from './set-default'
import { join, basename, extname, dirname, resolve } from 'path'

const VERSION = '0.4.0'

const HELP = `
md-reader — Render markdown as a beautiful HTML reading experience

Usage:
  md-reader <file.md> [options]
  md-reader --set-default

Options:
  --watch, -w       Watch for changes and live-reload in browser
  --pdf             Export as PDF (requires Chrome, Edge, or Chromium)
  --output <path>   Save HTML/PDF to a specific path
  --style <name>    Set reading style: default, latex, mono, newspaper
  --no-open         Convert but don't open in browser
  --set-default     Register md-reader as the default app for .md files
  --version         Show version
  --help            Show this help

Examples:
  md-reader README.md
  md-reader README.md --watch
  md-reader README.md --style latex
  md-reader README.md --pdf
  md-reader README.md --pdf --output ~/Desktop/readme.pdf
  md-reader docs/guide.md --no-open
  md-reader --set-default
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

if (args.includes('--set-default')) {
  await setDefault()
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

// Parse --style flag
const styleIdx = args.indexOf('--style')
let style: StylePreset = 'default'
if (styleIdx !== -1) {
  const styleArg = args[styleIdx + 1]
  if (!styleArg || styleArg.startsWith('--')) {
    console.error('Error: --style requires a name: default, latex, mono, newspaper')
    process.exit(1)
  }
  if (!STYLE_PRESETS.includes(styleArg as StylePreset)) {
    console.error(`Error: Unknown style "${styleArg}". Available: ${STYLE_PRESETS.join(', ')}`)
    process.exit(1)
  }
  style = styleArg as StylePreset
}

// First non-flag argument is the input file (skip values for --output and --style)
const flagValues = new Set([outputPath, style !== 'default' ? args[styleIdx + 1] : null].filter(Boolean))
const inputFile = args.find(a => !a.startsWith('--') && !a.startsWith('-w') && !flagValues.has(a))

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
  await startWatchMode(inputFile, style)
} else {
  // ── Convert markdown to HTML ──────────────────────────────────────────────
  const markdown = await file.text()
  const titleFallback = basename(inputFile, '.md')
  const title = extractTitle(markdown, titleFallback)

  const htmlBody = await convertMarkdown(markdown)
  const fullHtml = buildHtml(title, htmlBody, { style })

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
    const outDir = outputPath ? dirname(resolve(outputPath)) : '/tmp'
    const outFile = outputPath ?? join('/tmp', `md-reader-${titleFallback}-${Date.now()}.html`)

    // Pre-convert linked .md files and rewrite hrefs in the HTML
    const rewrittenHtml = await convertLinkedFiles(fullHtml, resolve(inputFile), outDir, style)
    await Bun.write(outFile, rewrittenHtml)

    console.log(`→ ${outFile}`)

    if (!noOpen) {
      await openInBrowser(outFile)
    }
  }
}

// ── Linked .md file conversion for static HTML mode ───────────────────────────
// Scans rendered HTML for relative .md links, converts each linked file to HTML,
// writes them alongside the output, and rewrites hrefs to point to the HTML files.
// One level deep only — linked files' own .md links are not recursively followed.
async function convertLinkedFiles(
  html: string,
  sourceAbsPath: string,
  outDir: string,
  style: StylePreset,
): Promise<string> {
  const sourceDir = dirname(sourceAbsPath)
  const mdLinkRegex = /(<a\s[^>]*href=")([^"]*\.md)(#[^"]*)?(")/g
  const visited = new Set<string>([sourceAbsPath]) // cycle detection

  // Collect unique .md links
  const links: Array<{ relPath: string; absPath: string }> = []
  let match: RegExpExecArray | null
  while ((match = mdLinkRegex.exec(html)) !== null) {
    const relPath = match[2]
    if (relPath.match(/^https?:\/\//)) continue
    const absLinkedPath = resolve(sourceDir, relPath)
    // Path traversal guard — only allow files within the source directory tree
    if (!absLinkedPath.startsWith(sourceDir + '/')) continue
    if (visited.has(absLinkedPath)) continue
    visited.add(absLinkedPath)
    links.push({ relPath, absPath: absLinkedPath })
  }

  // Convert linked files in parallel
  const timestamp = Date.now()
  const rewrites = new Map<string, string>()
  await Promise.all(links.map(async (link) => {
    try {
      const file = Bun.file(link.absPath)
      if (!(await file.exists())) {
        console.error(`  warning: linked file not found: ${link.relPath}`)
        return
      }
      const markdown = await file.text()
      const title = extractTitle(markdown, basename(link.relPath, '.md'))
      const body = await convertMarkdown(markdown)
      const linkedHtml = buildHtml(title, body, { style })

      const outName = `md-reader-${basename(link.relPath, '.md')}-${timestamp}.html`
      const outPath = join(outDir, outName)
      await Bun.write(outPath, linkedHtml)
      rewrites.set(link.relPath, outName)
    } catch (err) {
      console.error(`  warning: failed to convert ${link.relPath}: ${err}`)
    }
  }))

  if (rewrites.size === 0) return html

  // Single-pass rewrite of .md hrefs to generated HTML filenames
  return html.replace(mdLinkRegex, (full, prefix, relPath, anchor, suffix) => {
    const outName = rewrites.get(relPath)
    if (!outName) return full
    const newHref = outDir === '/tmp' ? `/tmp/${outName}` : outName
    return `${prefix}${newHref}${anchor || ''}${suffix}`
  })
}
