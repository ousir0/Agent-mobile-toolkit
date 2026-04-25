#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const parseArgs = (argv) => {
  const options = {
    bridgeUrl: 'http://127.0.0.1:8787/bridge',
    bridgeSecret: '',
    requestTimeoutMs: 120000,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    switch (key) {
      case '--bridge-url':
        options.bridgeUrl = value;
        index += 1;
        break;
      case '--bridge-secret':
        options.bridgeSecret = value || '';
        index += 1;
        break;
      case '--request-timeout-ms':
        options.requestTimeoutMs = Number(value);
        index += 1;
        break;
      default:
        break;
    }
  }
  return options;
};

const options = parseArgs(process.argv);

const invokeBridge = async (action, args = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.requestTimeoutMs);
  try {
    const response = await fetch(options.bridgeUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': options.bridgeSecret,
      },
      body: JSON.stringify({ action, args }),
      signal: controller.signal,
    });
    const text = await response.text();
    return text ? JSON.parse(text) : { content: [{ type: 'text', text: '' }] };
  } finally {
    clearTimeout(timer);
  }
};

const selectorSchema = z.object({
  text: z.string().optional(),
  resourceId: z.string().optional(),
  contentDescription: z.string().optional(),
  contentDesc: z.string().optional(),
  className: z.string().optional(),
  packageName: z.string().optional(),
  clickable: z.boolean().optional(),
  editable: z.boolean().optional(),
  enabled: z.boolean().optional(),
  exact: z.boolean().optional(),
  index: z.number().optional(),
}).strict();

const server = new McpServer({
  name: 'oclaw-mobile-toolkit',
  version: '0.1.0',
});

server.tool('mobile_list_devices', 'List connected mobile devices.', {}, async () => await invokeBridge('list_devices'));
server.tool(
  'mobile_read_state',
  'Read current UI state tree.',
  {
    deviceId: z.string().min(1),
    filter: z.boolean().optional(),
  },
  async (args) => await invokeBridge('read_state', args),
);
server.tool(
  'mobile_open_app',
  'Open Android app by package name.',
  {
    deviceId: z.string().min(1),
    packageName: z.string().min(1),
    activity: z.string().optional(),
    stopBeforeLaunch: z.boolean().optional(),
  },
  async (args) => await invokeBridge('open_app', args),
);
server.tool(
  'mobile_find_element',
  'Find UI elements by selector.',
  {
    deviceId: z.string().min(1),
    selector: selectorSchema,
    limit: z.number().min(1).max(20).optional(),
  },
  async (args) => await invokeBridge('find_element', args),
);
server.tool(
  'mobile_click_element',
  'Click a UI element by selector.',
  {
    deviceId: z.string().min(1),
    selector: selectorSchema,
  },
  async (args) => await invokeBridge('click_element', args),
);
server.tool(
  'mobile_input_text',
  'Input text to focused field or matched selector.',
  {
    deviceId: z.string().min(1),
    text: z.string(),
    clear: z.boolean().optional(),
    selector: selectorSchema.optional(),
  },
  async (args) => await invokeBridge('input_text', args),
);
server.tool(
  'mobile_capture_screen',
  'Capture current screenshot.',
  {
    deviceId: z.string().min(1),
    hideOverlay: z.boolean().optional(),
  },
  async (args) => await invokeBridge('capture_screen', args),
);

const transport = new StdioServerTransport();
await server.connect(transport);
