#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const toolkitRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pluginSourceDir = path.join(toolkitRoot, 'integrations', 'openclaw', 'mobile-tools');

const parseArgs = (argv) => {
  const [,, command = 'help', ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    const value = rest[index + 1];
    if (key.startsWith('--')) {
      options[key.slice(2)] = value ?? true;
      index += 1;
    }
  }
  return { command, options };
};

const print = (value) => process.stdout.write(`${value}\n`);

const buildMcpConfig = (bridgeUrl, bridgeSecret) => ({
  mcpServers: {
    'oclaw-mobile-toolkit': {
      command: 'node',
      args: [
        path.join(toolkitRoot, 'src', 'mcp-server.js'),
        '--bridge-url',
        bridgeUrl,
        '--bridge-secret',
        bridgeSecret,
      ],
    },
  },
});

const installOpenClawPlugin = (targetDir) => {
  const dest = path.join(targetDir, 'openclaw-extensions', 'mobile-tools');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(pluginSourceDir, dest, { recursive: true });
  return dest;
};

const installAgentAssets = (targetDir) => {
  const skillSource = path.join(toolkitRoot, 'skills', 'mobile-toolkit');
  const workflowSource = path.join(toolkitRoot, 'workflows');
  const skillsTarget = path.join(targetDir, 'mobile-toolkit-assets', 'skills', 'mobile-toolkit');
  const workflowsTarget = path.join(targetDir, 'mobile-toolkit-assets', 'workflows');
  fs.mkdirSync(path.dirname(skillsTarget), { recursive: true });
  fs.mkdirSync(path.dirname(workflowsTarget), { recursive: true });
  fs.rmSync(skillsTarget, { recursive: true, force: true });
  fs.rmSync(workflowsTarget, { recursive: true, force: true });
  fs.cpSync(skillSource, skillsTarget, { recursive: true });
  fs.cpSync(workflowSource, workflowsTarget, { recursive: true });
  return { skillsTarget, workflowsTarget };
};

const { command, options } = parseArgs(process.argv);
const bridgeUrl = options['bridge-url'] || 'http://127.0.0.1:8787/bridge';
const bridgeSecret = options['bridge-secret'] || 'change-me';

switch (command) {
  case 'openclaw-config':
    print(JSON.stringify({
      plugins: {
        entries: {
          'mobile-tools': {
            enabled: true,
            callbackUrl: bridgeUrl,
            secret: bridgeSecret,
            requestTimeoutMs: 120000,
          },
        },
      },
    }, null, 2));
    break;
  case 'claude-config':
  case 'codex-config':
    print(JSON.stringify(buildMcpConfig(bridgeUrl, bridgeSecret), null, 2));
    break;
  case 'install-openclaw-plugin': {
    const targetDir = options.target;
    if (!targetDir) {
      throw new Error('--target is required');
    }
    print(installOpenClawPlugin(path.resolve(targetDir)));
    break;
  }
  case 'install-agent-assets': {
    const targetDir = options.target;
    if (!targetDir) {
      throw new Error('--target is required');
    }
    print(JSON.stringify(installAgentAssets(path.resolve(targetDir)), null, 2));
    break;
  }
  default:
    print([
      'Usage:',
      '  node scripts/bootstrap.mjs openclaw-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret SECRET',
      '  node scripts/bootstrap.mjs claude-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret SECRET',
      '  node scripts/bootstrap.mjs codex-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret SECRET',
      '  node scripts/bootstrap.mjs install-openclaw-plugin --target /path/to/oclaw',
      '  node scripts/bootstrap.mjs install-agent-assets --target /path/to/output',
    ].join('\n'));
}
