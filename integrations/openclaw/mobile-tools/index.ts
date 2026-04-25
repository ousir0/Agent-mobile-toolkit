import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';

type MobileToolsPluginConfig = {
  callbackUrl: string;
  secret: string;
  requestTimeoutMs: number;
};

type ToolResultPayload = {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
  details?: unknown;
};

const DEFAULT_TIMEOUT_MS = 120_000;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

const parsePluginConfig = (value: unknown): MobileToolsPluginConfig => {
  const raw = isRecord(value) ? value : {};
  return {
    callbackUrl: typeof raw.callbackUrl === 'string' ? raw.callbackUrl.trim() : '',
    secret: typeof raw.secret === 'string' ? raw.secret.trim() : '',
    requestTimeoutMs:
      typeof raw.requestTimeoutMs === 'number' && Number.isFinite(raw.requestTimeoutMs) && raw.requestTimeoutMs > 0
        ? Math.max(1_000, Math.floor(raw.requestTimeoutMs))
        : DEFAULT_TIMEOUT_MS,
  };
};

const invokeMobileBridge = async (
  config: MobileToolsPluginConfig,
  action: string,
  args: Record<string, unknown>,
): Promise<ToolResultPayload> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(config.callbackUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': config.secret,
      },
      body: JSON.stringify({ action, args }),
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text.trim() ? JSON.parse(text) : {
      content: [{ type: 'text', text: 'Empty mobile bridge response.' }],
      isError: true,
    };

    if (!response.ok) {
      return {
        content: [{ type: 'text', text: `Mobile bridge HTTP ${response.status}: ${text || response.statusText}` }],
        isError: true,
      };
    }

    return payload as ToolResultPayload;
  } finally {
    clearTimeout(timer);
  }
};

const DeviceIdSchema = Type.String({
  description: '目标手机设备 ID。先用 mobile_list_devices 查看可用设备。',
  minLength: 1,
});

const SelectorSchema = Type.Object({
  text: Type.Optional(Type.String()),
  resourceId: Type.Optional(Type.String()),
  contentDescription: Type.Optional(Type.String()),
  contentDesc: Type.Optional(Type.String()),
  className: Type.Optional(Type.String()),
  packageName: Type.Optional(Type.String()),
  clickable: Type.Optional(Type.Boolean()),
  editable: Type.Optional(Type.Boolean()),
  enabled: Type.Optional(Type.Boolean()),
  exact: Type.Optional(Type.Boolean()),
  index: Type.Optional(Type.Number()),
}, { additionalProperties: false });

const plugin = {
  id: 'mobile-tools',
  name: 'Mobile Tools',
  description: 'Expose OClaw mobile runtime tools to OpenClaw agents.',
  configSchema: {
    parse(value: unknown): MobileToolsPluginConfig {
      return parsePluginConfig(value);
    },
  },
  register(api: OpenClawPluginApi) {
    const config = parsePluginConfig(api.pluginConfig);
    if (!config.callbackUrl || !config.secret) {
      api.logger.info('[mobile-tools] skipped: callbackUrl or secret not configured.');
      return;
    }

    api.registerTool({
      name: 'mobile_list_devices',
      label: 'Mobile List Devices',
      description: 'List available mobile devices managed by OClaw. Use this first before any mobile command.',
      parameters: Type.Object({}, { additionalProperties: false }),
      async execute(_id: string) {
        return invokeMobileBridge(config, 'list_devices', {});
      },
    });

    api.registerTool({
      name: 'mobile_read_state',
      label: 'Mobile Read State',
      description: 'Read the current UI state tree of a mobile device.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        filter: Type.Optional(Type.Boolean()),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'read_state', params);
      },
    });

    api.registerTool({
      name: 'mobile_open_app',
      label: 'Mobile Open App',
      description: 'Open an Android app by package name on a device.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        packageName: Type.String({ minLength: 1 }),
        activity: Type.Optional(Type.String()),
        stopBeforeLaunch: Type.Optional(Type.Boolean()),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'open_app', params);
      },
    });

    api.registerTool({
      name: 'mobile_tap_screen',
      label: 'Mobile Tap Screen',
      description: 'Tap a screen coordinate directly when selector-based automation is unavailable.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        x: Type.Number(),
        y: Type.Number(),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'tap', params);
      },
    });

    api.registerTool({
      name: 'mobile_swipe_screen',
      label: 'Mobile Swipe Screen',
      description: 'Swipe between two screen coordinates when selector-based automation is unavailable.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        startX: Type.Number(),
        startY: Type.Number(),
        endX: Type.Number(),
        endY: Type.Number(),
        duration: Type.Optional(Type.Number({ minimum: 0 })),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'swipe', params);
      },
    });

    api.registerTool({
      name: 'mobile_click_element',
      label: 'Mobile Click Element',
      description: 'Click a UI element on the device using a selector.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        selector: SelectorSchema,
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'click_element', params);
      },
    });

    api.registerTool({
      name: 'mobile_find_element',
      label: 'Mobile Find Element',
      description: 'Find UI nodes by selector before clicking or inputting, for more stable mobile automation flows.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        selector: SelectorSchema,
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20 })),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'find_element', params);
      },
    });

    api.registerTool({
      name: 'mobile_input_text',
      label: 'Mobile Input Text',
      description: 'Input text into the focused field or a matched UI element on the device.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        text: Type.String(),
        clear: Type.Optional(Type.Boolean()),
        selector: Type.Optional(SelectorSchema),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'input_text', params);
      },
    });

    api.registerTool({
      name: 'mobile_upload_file',
      label: 'Mobile Upload File',
      description: 'Upload a local file to the Android device as base64 data.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        path: Type.String({ minLength: 1 }),
        dataBase64: Type.String({ minLength: 1 }),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'upload_file', params);
      },
    });

    api.registerTool({
      name: 'mobile_capture_screen',
      label: 'Mobile Capture Screen',
      description: 'Capture the current device screenshot.',
      parameters: Type.Object({
        deviceId: DeviceIdSchema,
        hideOverlay: Type.Optional(Type.Boolean()),
      }, { additionalProperties: false }),
      async execute(_id: string, params: Record<string, unknown>) {
        return invokeMobileBridge(config, 'capture_screen', params);
      },
    });

    api.logger.info('[mobile-tools] registered mobile tool set.');
  },
};

export default plugin;
