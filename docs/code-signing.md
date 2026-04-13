---
summary: "Windows/macOS code signing setup for md-reader installers"
read_when: ["code signing", "SmartScreen", "certificate", "signing"]
---

# Code Signing for md-reader

## Why

Windows SmartScreen blocks unsigned executables. Users see "Windows protected your PC" when opening unsigned .msi/.exe installers. Code signing establishes publisher trust and eliminates this warning.

## Certificate Options

### 1. OV (Organization Validation) Code Signing Certificate

- **Cost:** ~$200-400/year
- **Providers:** DigiCert, Sectigo, GlobalSign
- **SmartScreen:** Immediate trust after signing
- **Process:** Requires business verification (registered company/LLC)

### 2. EV (Extended Validation) Code Signing Certificate

- **Cost:** ~$400-700/year
- **Providers:** DigiCert, Sectigo
- **SmartScreen:** Immediate trust, highest confidence
- **Process:** Stricter verification, requires hardware token (USB key)
- **Note:** EV certs cannot be used in CI without HSM — the private key lives on a hardware token

### 3. Free Alternative: SignPath Foundation

- **Cost:** Free for open-source projects
- **URL:** https://signpath.org
- **Process:** Apply with GitHub repo, get free OV signing via their CI integration
- **SmartScreen:** Builds trust over time via Microsoft's reputation system

### Recommended Path

For an open-source project like md-reader, **SignPath Foundation** is the best starting point — free OV signing for open-source. If that doesn't work out, a standard OV certificate from Sectigo (~$200/year) is the most cost-effective paid option.

## CI Integration

### GitHub Actions Workflow Changes

Add to `.github/workflows/release.yml` for the Windows build job:

```yaml
# After building the .msi/.exe
- name: Sign Windows executables
  if: runner.os == 'Windows'
  env:
    CERTIFICATE_BASE64: ${{ secrets.CODE_SIGNING_CERT }}
    CERTIFICATE_PASSWORD: ${{ secrets.CODE_SIGNING_PASSWORD }}
  run: |
    # Decode certificate from base64
    echo $CERTIFICATE_BASE64 | base64 -d > cert.pfx

    # Sign .exe
    & "C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe" sign `
      /f cert.pfx /p $CERTIFICATE_PASSWORD `
      /tr http://timestamp.digicert.com /td sha256 /fd sha256 `
      path\to\md-reader.exe

    # Sign .msi
    & signtool sign /f cert.pfx /p $CERTIFICATE_PASSWORD `
      /tr http://timestamp.digicert.com /td sha256 /fd sha256 `
      path\to\md-reader.msi

    # Cleanup
    Remove-Item cert.pfx
```

### GitHub Secrets Required

- `CODE_SIGNING_CERT` — Base64-encoded .pfx certificate file
- `CODE_SIGNING_PASSWORD` — Password for the .pfx file

### Tauri Built-in Signing

Tauri v2 supports Windows code signing natively via `tauri.conf.json`:

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "...",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

See: https://v2.tauri.app/distribute/sign/windows/

## macOS Code Signing

macOS signing requires an Apple Developer account ($99/year) and is handled by Tauri's build system when the `APPLE_SIGNING_IDENTITY` environment variable is set. See: https://v2.tauri.app/distribute/sign/macos/
