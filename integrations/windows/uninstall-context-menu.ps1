# uninstall-context-menu.ps1 — Remove md-reader's .md file association from Windows
#
# Reverses everything install-context-menu.ps1 created:
#   - Removes ProgID registry key (MdReader.MarkdownFile)
#   - Removes .md extension association
#   - Removes installed bat file
#
# Run from WSL2:
#   powershell.exe -ExecutionPolicy Bypass -File "$(wslpath -w integrations/windows/uninstall-context-menu.ps1)"

$ErrorActionPreference = "Stop"

# ── Configuration (must match install script) ─────────────────────────────────
$ProgId     = "MdReader.MarkdownFile"
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\md-reader"

# ── Remove ProgID ─────────────────────────────────────────────────────────────
$progIdKey = "HKCU:\Software\Classes\$ProgId"
if (Test-Path $progIdKey) {
    Remove-Item -Path $progIdKey -Recurse -Force
    Write-Host "Removed: $progIdKey"
} else {
    Write-Host "Already removed: $progIdKey" -ForegroundColor Yellow
}

# ── Remove .md association ────────────────────────────────────────────────────
# Remove our ProgID from OpenWithProgids
$openWithKey = "HKCU:\Software\Classes\.md\OpenWithProgids"
if (Test-Path $openWithKey) {
    $props = Get-ItemProperty -Path $openWithKey -ErrorAction SilentlyContinue
    if ($props.PSObject.Properties.Name -contains $ProgId) {
        Remove-ItemProperty -Path $openWithKey -Name $ProgId -Force
        Write-Host "Removed: $ProgId from OpenWithProgids"
    }
}

# If .md default was set to our ProgID, remove the key
# (This restores whatever was there before, or lets Windows pick a default)
$extKey = "HKCU:\Software\Classes\.md"
if (Test-Path $extKey) {
    $defaultVal = (Get-ItemProperty -Path $extKey -Name "(Default)" -ErrorAction SilentlyContinue)."(Default)"
    if ($defaultVal -eq $ProgId) {
        Remove-Item -Path $extKey -Recurse -Force
        Write-Host "Removed: $extKey (was set to $ProgId)"
    }
}

# ── Remove installed bat file ─────────────────────────────────────────────────
if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force
    Write-Host "Removed: $InstallDir"
} else {
    Write-Host "Already removed: $InstallDir" -ForegroundColor Yellow
}

# ── Notify Explorer of the change ─────────────────────────────────────────────
$code = @"
[System.Runtime.InteropServices.DllImport("shell32.dll")]
public static extern void SHChangeNotify(int wEventId, int uFlags, System.IntPtr dwItem1, System.IntPtr dwItem2);
"@
$shell = Add-Type -MemberDefinition $code -Name "ShellNotify" -Namespace "Win32" -PassThru
$shell::SHChangeNotify(0x08000000, 0x0000, [System.IntPtr]::Zero, [System.IntPtr]::Zero)

Write-Host ""
Write-Host "md-reader uninstalled successfully." -ForegroundColor Green
Write-Host ".md files will revert to their previous handler."
