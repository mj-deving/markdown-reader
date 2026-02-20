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

export async function openInBrowser(htmlPath: string): Promise<void> {
  if (isWsl()) {
    try {
      const winPath = await toWindowsPath(htmlPath)
      // Use cmd.exe /c start to open the file in the default Windows browser
      const proc = Bun.spawn(['cmd.exe', '/c', 'start', '', winPath], {
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
  const proc = Bun.spawn([opener, htmlPath], {
    stdout: 'ignore',
    stderr: 'ignore',
  })
  await proc.exited
}
