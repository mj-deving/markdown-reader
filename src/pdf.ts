import { existsSync, unlinkSync } from 'fs'

// ── Browser discovery ────────────────────────────────────────────────────────
// Searches standard install locations for a Chromium-based browser that
// supports --headless --print-to-pdf. Returns the first match or null.

/** Candidate browser paths by platform */
const CANDIDATES: string[] = [
  // WSL2 → Windows-side browsers
  '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
  '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
]

/**
 * Find a headless-capable Chromium browser on the system.
 * Returns the full path or null if none found.
 */
export function findBrowser(): string | null {
  for (const candidate of CANDIDATES) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

// ── Detect WSL2 ──────────────────────────────────────────────────────────────
function isWsl(): boolean {
  return !!process.env.WSL_DISTRO_NAME
}

// ── Convert path for Chrome on Windows (WSL2) ───────────────────────────────
async function toWindowsPath(linuxPath: string): Promise<string> {
  const proc = Bun.spawn(['wslpath', '-w', linuxPath], { stdout: 'pipe' })
  const output = await new Response(proc.stdout).text()
  return output.trim()
}

/**
 * Export an HTML file to PDF using a headless Chromium browser.
 *
 * Flow: write temp HTML → Chrome --print-to-pdf → clean up temp HTML.
 * On WSL2, paths are converted to Windows format since the browser runs on Windows.
 */
export async function exportPdf(
  htmlContent: string,
  pdfPath: string,
  browserPath: string,
): Promise<void> {
  // Write HTML to a temp file (Chrome needs a file path, not stdin)
  const tmpHtml = `/tmp/md-reader-pdf-${Date.now()}.html`
  await Bun.write(tmpHtml, htmlContent)

  try {
    // On WSL2, convert both paths to Windows format for the Windows-side browser
    const htmlArg = isWsl() ? await toWindowsPath(tmpHtml) : `file://${tmpHtml}`
    const pdfArg = isWsl() ? await toWindowsPath(pdfPath) : pdfPath

    const args = [
      browserPath,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--run-all-compositor-stages-before-draw',
      `--print-to-pdf=${pdfArg}`,
      // Use print media type so our @media print CSS kicks in
      htmlArg,
    ]

    const proc = Bun.spawn(args, {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const exitCode = await proc.exited

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(`Browser exited with code ${exitCode}: ${stderr.trim()}`)
    }
  } finally {
    // Always clean up the temp HTML file
    try { unlinkSync(tmpHtml) } catch { /* ignore */ }
  }
}
