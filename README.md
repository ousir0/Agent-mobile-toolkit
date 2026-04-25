# Agent Mobile Toolkit

Agent Mobile Toolkit is a standalone mobile bridge project for AI agents.

It turns an Android phone into a reusable automation endpoint that can be connected to Codex, OpenClaw, Claude, or any MCP-compatible agent runtime.

## What it solves

Most agent runtimes can call browser tools, local shell tools, or APIs, but they still lack a clean, reusable mobile execution layer.

This project fills that gap by packaging four pieces together:

1. An Android Portal app that runs on the phone
2. A reverse WebSocket bridge that the phone connects to
3. An MCP server for Codex and Claude
4. An OpenClaw plugin plus bootstrap assets for workflows and skills

The result is simple:

1. Install the APK on an Android phone
2. Start the local bridge on your computer
3. Connect the phone with a custom WebSocket address
4. Let your agent call mobile tools directly

## Typical scenarios

Use Agent Mobile Toolkit when you want an agent to:

1. Read the current mobile UI tree
2. Open an app on Android
3. Find and click elements by selector
4. Input text into search bars, forms, or chat boxes
5. Capture screenshots for reasoning or verification
6. Build repeatable mobile workflows that can be shared across projects

Typical examples:

1. Xiaohongshu search and content collection
2. Mobile growth operations and lead capture flows
3. Android task automation from Codex or Claude
4. OpenClaw-based tool distribution and workflow initialization

## How it works

The phone does not connect to Codex directly.

Instead, the connection path is:

```text
Android Portal APK
  -> Reverse WebSocket bridge
  -> MCP / OpenClaw integration
  -> Codex / OpenClaw / Claude
```

This makes the project easier to deploy, easier to debug, and easier to reuse across different agent products.

## Project structure

1. `app/`
   Android Portal source code
2. `src/bridge-server.js`
   Reverse bridge server that accepts phone connections and exposes `/bridge`
3. `src/mcp-server.js`
   MCP server for Codex and Claude
4. `integrations/openclaw/mobile-tools/`
   OpenClaw plugin
5. `scripts/bootstrap.mjs`
   Bootstrap generator for Codex, Claude, OpenClaw, skills, and workflows
6. `skills/mobile-toolkit/`
   Reusable mobile skill template
7. `workflows/`
   Reusable workflow templates

## Supported runtimes

1. Codex through MCP
2. Claude through MCP
3. OpenClaw through local plugin callback mode

## Mobile tools exposed

The bridge currently exposes tools such as:

1. `mobile_list_devices`
2. `mobile_read_state`
3. `mobile_open_app`
4. `mobile_find_element`
5. `mobile_click_element`
6. `mobile_input_text`
7. `mobile_capture_screen`

These are intended to be the stable base layer for higher-level mobile workflows.

## Quick start

Install dependencies:

```bash
npm install
```

Start the bridge:

```bash
npm run bridge -- --host 0.0.0.0 --http-port 8787 --token 123456 --plugin-secret change-me
```

Phone custom connection:

```text
WebSocket URL: ws://<your-lan-ip>:8787/v1/providers/personal/join
Token: 123456
```

Notes:

1. The phone must use a full WebSocket URL
2. The URL must include `/v1/providers/personal/join`
3. The token is entered separately, not appended to the URL
4. The phone and computer must be on the same LAN

## APK

This repository contains the Android Portal source code and can build the APK locally.

Debug APK output path:

```text
app/build/outputs/apk/debug/
```

Typical file name:

```text
com.droidrun.portal-0.6.4-debug.apk
```

Build the APK locally:

```bash
./gradlew assembleDebug
```

Run Android tests:

```bash
./gradlew test
```

## Codex setup

Generate Codex MCP config:

```bash
node scripts/bootstrap.mjs codex-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

Or register the MCP server directly:

```bash
codex mcp add agent-mobile-toolkit -- /opt/homebrew/bin/node /path/to/src/mcp-server.js --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

## Claude setup

Generate Claude MCP config:

```bash
node scripts/bootstrap.mjs claude-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

## OpenClaw setup

Generate OpenClaw plugin config:

```bash
node scripts/bootstrap.mjs openclaw-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

Install the OpenClaw plugin into a target project:

```bash
node scripts/bootstrap.mjs install-openclaw-plugin --target /path/to/oclaw
```

Export shared skills and workflows:

```bash
node scripts/bootstrap.mjs install-agent-assets --target /path/to/output
```

## Why this repo exists

This repo is designed as a project-level mobile toolkit, not just a one-off demo app.

The intention is:

1. Build once
2. Distribute to multiple agent runtimes
3. Reuse the same phone bridge, skill assets, workflow assets, and integration scripts

That makes it suitable for teams that want one mobile automation layer across Codex, OpenClaw, Claude, or future agent products.

## Development and verification

Node bridge tests:

```bash
npm test
```

Android tests:

```bash
./gradlew test
```

Android debug build:

```bash
./gradlew assembleDebug
```

## License

This project is released under the MIT License.
