import { join } from 'path'

// Detect WSL2 environment
function isWsl(): boolean {
  return !!process.env.WSL_DISTRO_NAME ||
    (process.platform === 'linux' &&
      Bun.file('/proc/version').size > 0 &&
      // Checked synchronously via env — WSL_DISTRO_NAME is the reliable signal
      false)
}

// Convert a Linux path to a Windows path via wslpath
async function toWindowsPath(linuxPath: string): Promise<string> {
  const proc = Bun.spawn(['wslpath', '-w', linuxPath], { stdout: 'pipe' })
  const output = await new Response(proc.stdout).text()
  return output.trim()
}

export async function openInBrowser(pathOrUrl: string): Promise<void> {
  if (isWsl()) {
    try {
      // URLs can be passed directly to cmd.exe start; file paths need wslpath
      const target = pathOrUrl.startsWith('http') ? pathOrUrl : await toWindowsPath(pathOrUrl)
      const proc = Bun.spawn(['cmd.exe', '/c', 'start', '', target], {
        stdout: 'ignore',
        stderr: 'ignore',
      })
      await proc.exited
      return
    } catch {
      // Fall through to xdg-open
    }
  }

  // Linux / macOS fallback
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open'
  const proc = Bun.spawn([opener, pathOrUrl], {
    stdout: 'ignore',
    stderr: 'ignore',
  })
  await proc.exited
}
