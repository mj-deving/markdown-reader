// set-default.ts — Register md-reader as the default handler for .md files
//
// Linux: copies .desktop file to ~/.local/share/applications/ and runs xdg-mime
// WSL/Windows: runs the PowerShell registry script to set .md file association
// macOS: uses duti or manual instructions

import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { isWsl, toWindowsPath } from './opener'

// Path to integrations directory (relative to this source file in src/)
const PROJECT_ROOT = dirname(import.meta.dir)
const INTEGRATIONS_DIR = join(PROJECT_ROOT, 'integrations')

async function runCommand(cmd: string, args: string[]): Promise<{ ok: boolean; output: string }> {
  try {
    const proc = Bun.spawn([cmd, ...args], { stdout: 'pipe', stderr: 'pipe' })
    const exitCode = await proc.exited
    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    return { ok: exitCode === 0, output: stdout + stderr }
  } catch {
    return { ok: false, output: `Failed to run ${cmd}` }
  }
}

async function setupLinux(): Promise<void> {
  const desktopSource = join(INTEGRATIONS_DIR, 'linux', 'md-reader.desktop')
  const appsDir = join(process.env.HOME ?? '~', '.local', 'share', 'applications')
  const desktopTarget = join(appsDir, 'md-reader.desktop')

  if (!existsSync(desktopSource)) {
    console.error(`Error: Desktop file not found at ${desktopSource}`)
    console.error('Make sure you are running from the md-reader project directory.')
    process.exit(1)
  }

  if (!existsSync(appsDir)) {
    mkdirSync(appsDir, { recursive: true })
  }

  // Update the Exec line to use the current bun and cli.ts paths
  const bunPath = process.argv[0]
  const cliPath = join(import.meta.dir, 'cli.ts')
  const desktopContent = await Bun.file(desktopSource).text()
  const updatedContent = desktopContent.replace(
    /^Exec=.*$/m,
    `Exec=${bunPath} ${cliPath} %f`
  )
  await Bun.write(desktopTarget, updatedContent)
  console.log(`  Installed: ${desktopTarget}`)

  const result1 = await runCommand('xdg-mime', ['default', 'md-reader.desktop', 'text/markdown'])
  if (result1.ok) {
    console.log('  Set default for: text/markdown')
  } else {
    console.error('  Warning: xdg-mime failed for text/markdown')
  }

  const result2 = await runCommand('xdg-mime', ['default', 'md-reader.desktop', 'text/x-markdown'])
  if (result2.ok) {
    console.log('  Set default for: text/x-markdown')
  }

  await runCommand('update-desktop-database', [appsDir])

  console.log('\nmd-reader is now the default app for .md files.')
  console.log('Double-click any .md file in your file manager to open it.')
}

async function setupWindows(): Promise<void> {
  const psScript = join(INTEGRATIONS_DIR, 'windows', 'install-context-menu.ps1')

  if (!existsSync(psScript)) {
    console.error(`Error: PowerShell script not found at ${psScript}`)
    console.error('Make sure you are running from the md-reader project directory.')
    process.exit(1)
  }

  const winPath = await toWindowsPath(psScript)
  console.log('  Running Windows registry setup...')

  const psCommands = ['powershell.exe', '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe']
  for (const ps of psCommands) {
    const result = await runCommand(ps, ['-ExecutionPolicy', 'Bypass', '-File', winPath])
    if (result.ok) {
      console.log(result.output)
      console.log('\nmd-reader is now the default app for .md files in Windows.')
      console.log('Double-click any .md file in Explorer to open it.')
      return
    }
  }

  console.error('Error: Could not find powershell.exe')
  console.error('Run the script manually from PowerShell:')
  console.error(`  .\\install-context-menu.ps1`)
}

export async function setDefault(): Promise<void> {
  console.log('Setting md-reader as default handler for .md files...\n')

  if (isWsl()) {
    console.log('Detected WSL — setting up for both Linux and Windows:\n')
    console.log('── Linux (WSL) ──')
    await setupLinux()
    console.log('\n── Windows ──')
    await setupWindows()
  } else if (process.platform === 'linux') {
    await setupLinux()
  } else if (process.platform === 'darwin') {
    console.log('macOS: Use Finder > Get Info on a .md file > Open with > md-reader > Change All')
    console.log('Or install duti: brew install duti && duti -s com.md-reader .md all')
  } else {
    console.error('Unsupported platform. Manual setup required.')
    process.exit(1)
  }
}
