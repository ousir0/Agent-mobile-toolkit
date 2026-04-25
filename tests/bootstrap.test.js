import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';

const bootstrapScript = path.join(process.cwd(), 'scripts', 'bootstrap.mjs');

describe('bootstrap script', () => {
  it('prints Codex MCP config', () => {
    const output = execFileSync('node', [
      bootstrapScript,
      'codex-config',
      '--bridge-url',
      'http://127.0.0.1:8787/bridge',
      '--bridge-secret',
      'abc123',
    ], { encoding: 'utf8' });
    const parsed = JSON.parse(output);
    expect(parsed.mcpServers['oclaw-mobile-toolkit'].args).toContain('abc123');
  });

  it('installs openclaw plugin into target project', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oclaw-mobile-toolkit-'));
    fs.mkdirSync(path.join(tempDir, 'openclaw-extensions'), { recursive: true });

    const output = execFileSync('node', [
      bootstrapScript,
      'install-openclaw-plugin',
      '--target',
      tempDir,
    ], { encoding: 'utf8' }).trim();

    expect(output).toContain(path.join(tempDir, 'openclaw-extensions', 'mobile-tools'));
    expect(fs.existsSync(path.join(tempDir, 'openclaw-extensions', 'mobile-tools', 'openclaw.plugin.json'))).toBe(true);
  });
});
