// Detect WSL2 environment
export function isWsl(): boolean {
  return !!process.env.WSL_DISTRO_NAME ||
    (process.platform === 'linux' &&
      Bun.file('/proc/version').size > 0 &&
      // Checked synchronously via env — WSL_DISTRO_NAME is the reliable signal
      false)
}

// Convert a Linux path to a Windows path via wslpath
export async function toWindowsPath(linuxPath: string): Promise<string> {
  const proc = Bun.spawn(['wslpath', '-w', linuxPath], { stdout: 'pipe' })
  const output = await new Response(proc.stdout).text()
  return output.trim()
}

async function tryOpen(command: string, args: string[]): Promise<boolean> {
  try {
    const proc = Bun.spawn([command, ...args], {
      stdout: 'ignore',
      stderr: 'ignore',
    })
    return (await proc.exited) === 0
  } catch {
    return false
  }
}

export async function openInBrowser(pathOrUrl: string): Promise<void> {
  if (isWsl()) {
    // URLs can be passed directly to cmd.exe start; file paths need wslpath
    const target = pathOrUrl.startsWith('http') ? pathOrUrl : await toWindowsPath(pathOrUrl)

    // PATH may not include Windows binaries in hardened WSL setups.
    const cmdCandidates = [
      'cmd.exe',
      '/mnt/c/Windows/System32/cmd.exe',
      '/mnt/c/Windows/Sysnative/cmd.exe',
    ]
    for (const cmd of cmdCandidates) {
      if (await tryOpen(cmd, ['/c', 'start', '', target])) {
        return
      }
    }

    // Some WSL distros provide wslview as a browser bridge.
    if (await tryOpen('wslview', [pathOrUrl])) {
      return
    }
  }

  // Linux / macOS fallback
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open'
  await tryOpen(opener, [pathOrUrl])
}
