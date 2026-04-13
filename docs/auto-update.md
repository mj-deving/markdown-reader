---
summary: "Tauri auto-update plugin setup for md-reader desktop app"
read_when: ["auto-update", "updater", "tauri update", "self-update"]
---

# Auto-Update for md-reader Desktop App

## Overview

Tauri v2 provides `tauri-plugin-updater` for in-app self-updating. When configured, the app checks for new versions on startup and prompts the user to update.

## Setup Steps

### 1. Add the Plugin

```bash
cd tauri-app
cargo add tauri-plugin-updater -F tauri-plugin-updater/rustls-tls
bun add @tauri-apps/plugin-updater
```

### 2. Configure in tauri.conf.json

```json
{
  "plugins": {
    "updater": {
      "pubkey": "<YOUR_PUBLIC_KEY>",
      "endpoints": [
        "https://github.com/mj-deving/markdown-reader/releases/latest/download/latest.json"
      ]
    }
  }
}
```

### 3. Generate Signing Keys

Tauri updates must be signed (separate from code signing — this is for update integrity):

```bash
bunx @tauri-apps/cli signer generate -w ~/.tauri/md-reader.key
```

This generates a keypair. The public key goes in `tauri.conf.json`, the private key is a GitHub secret.

### 4. Update CI Workflow

Add to `.github/workflows/release.yml`:

```yaml
env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_KEY_PASSWORD }}
```

The Tauri build automatically generates the `latest.json` manifest and `.sig` signature files when these env vars are set.

### 5. Frontend Integration

```typescript
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

async function checkForUpdates() {
  const update = await check()
  if (update) {
    console.log(`Update available: ${update.version}`)
    await update.downloadAndInstall()
    await relaunch()
  }
}

// Check on app startup (non-blocking)
checkForUpdates().catch(console.error)
```

## Update Server Options

### 1. GitHub Releases (Recommended)

- Free, no infrastructure needed
- The CI workflow already creates GitHub Releases on tag push
- Tauri's GitHub endpoint format works out of the box
- **Endpoint:** `https://github.com/mj-deving/markdown-reader/releases/latest/download/latest.json`

### 2. Static File Server

- Host `latest.json` + installers on any HTTPS server (S3, Cloudflare R2, etc.)
- Full control over rollout timing
- Can implement staged rollouts by serving different `latest.json` to different users

### 3. Tauri Update Server (CrabNebula)

- Managed service by the Tauri team
- Dashboard for release management
- Analytics on update adoption
- **URL:** https://crabnebula.dev

## Recommended Path

Start with **GitHub Releases** — zero additional infrastructure, works with the existing CI pipeline. Just add the updater plugin, generate keys, and configure the endpoint.

## References

- https://v2.tauri.app/plugin/updater/
- https://v2.tauri.app/distribute/updater/
