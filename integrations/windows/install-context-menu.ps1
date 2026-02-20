# install-context-menu.ps1 — Register md-reader as a .md handler in Windows
#
# Creates registry entries under HKCU (no admin required) so that .md files
# can be opened with md-reader via right-click context menu or double-click.
#
# Run from WSL2:
#   powershell.exe -ExecutionPolicy Bypass -File "$(wslpath -w integrations/windows/install-context-menu.ps1)"
#
# Or from PowerShell directly:
#   .\install-context-menu.ps1

$ErrorActionPreference = "Stop"

# ── Configuration ─────────────────────────────────────────────────────────────
$ProgId     = "MdReader.MarkdownFile"
$AppName    = "md-reader"
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\md-reader"
$BatSource  = Join-Path $PSScriptRoot "md-reader.bat"
$BatTarget  = Join-Path $InstallDir "md-reader.bat"

# ── Copy bat wrapper to install directory ─────────────────────────────────────
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}
Copy-Item -Path $BatSource -Destination $BatTarget -Force
Write-Host "Copied: $BatTarget"

# ── Register ProgID ───────────────────────────────────────────────────────────
# HKCU:\Software\Classes\MdReader.MarkdownFile
$progIdKey = "HKCU:\Software\Classes\$ProgId"
New-Item -Path $progIdKey -Force | Out-Null
Set-ItemProperty -Path $progIdKey -Name "(Default)" -Value "Markdown File (md-reader)"

# shell\open\command → our bat wrapper
$commandKey = "$progIdKey\shell\open\command"
New-Item -Path $commandKey -Force | Out-Null
Set-ItemProperty -Path $commandKey -Name "(Default)" -Value "`"$BatTarget`" `"%1`""

# Friendly app name shown in "Open with" dialog
$appKey = "$progIdKey\Application"
New-Item -Path $appKey -Force | Out-Null
Set-ItemProperty -Path $appKey -Name "ApplicationName" -Value $AppName

# ── Associate .md extension with our ProgID ───────────────────────────────────
# HKCU:\Software\Classes\.md
$extKey = "HKCU:\Software\Classes\.md"
New-Item -Path $extKey -Force | Out-Null
Set-ItemProperty -Path $extKey -Name "(Default)" -Value $ProgId

# Add to OpenWithProgids so it appears in "Open with" even if another app is default
$openWithKey = "$extKey\OpenWithProgids"
New-Item -Path $openWithKey -Force | Out-Null
Set-ItemProperty -Path $openWithKey -Name $ProgId -Value ([byte[]]@()) -Type Binary

# ── Notify Explorer of the change ─────────────────────────────────────────────
# SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, 0, 0) refreshes shell cache
$code = @"
[System.Runtime.InteropServices.DllImport("shell32.dll")]
public static extern void SHChangeNotify(int wEventId, int uFlags, System.IntPtr dwItem1, System.IntPtr dwItem2);
"@
$shell = Add-Type -MemberDefinition $code -Name "ShellNotify" -Namespace "Win32" -PassThru
$shell::SHChangeNotify(0x08000000, 0x0000, [System.IntPtr]::Zero, [System.IntPtr]::Zero)

Write-Host ""
Write-Host "md-reader registered successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:"
Write-Host "  1. Right-click any .md file in Explorer"
Write-Host "  2. Choose 'Open with' > 'md-reader'"
Write-Host "  3. Or double-click .md files to open with md-reader"
Write-Host ""
Write-Host "To uninstall: run uninstall-context-menu.ps1"
