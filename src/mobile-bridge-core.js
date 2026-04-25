import crypto from 'node:crypto';

const DEFAULT_RPC_TIMEOUT_MS = 15000;

const json = (value) => JSON.stringify(value, null, 2);

const maskToken = (token) => {
  if (!token) return '';
  if (token.length <= 6) return `${token.slice(0, 2)}***`;
  return `${token.slice(0, 3)}***${token.slice(-2)}`;
};

const toBase64 = (value) => Buffer.from(value, 'utf8').toString('base64');

const createToolPayload = (text, extra = {}) => ({
  content: [{ type: 'text', text }],
  ...extra,
});

export class MobileBridge {
  constructor(options = {}) {
    this.expectedToken = (options.expectedToken || '').trim();
    this.rpcTimeoutMs = Math.max(1000, options.rpcTimeoutMs || DEFAULT_RPC_TIMEOUT_MS);
    this.sessions = new Map();
  }

  validateHeaders(headers) {
    if (!this.expectedToken) return true;
    return headers.authorization === `Bearer ${this.expectedToken}`;
  }

  registerConnection(socket, headers = {}, path = '') {
    const deviceId = headers['x-device-id'] || headers['x-device-name'] || crypto.randomUUID();
    const session = {
      id: deviceId,
      name: headers['x-device-name'] || deviceId,
      country: headers['x-device-country'] || '',
      userId: headers['x-user-id'] || '',
      path,
      tokenMasked: maskToken(headers.authorization?.replace(/^Bearer\s+/i, '') || ''),
      connectedAt: Date.now(),
      lastSeenAt: Date.now(),
      socket,
      pending: new Map(),
    };

    this.sessions.set(deviceId, session);

    socket.on('message', (raw) => {
      session.lastSeenAt = Date.now();
      this.#handleMessage(session, raw);
    });

    socket.on('close', () => {
      for (const pending of session.pending.values()) {
        pending.reject(new Error(`Device "${deviceId}" disconnected`));
      }
      session.pending.clear();
      this.sessions.delete(deviceId);
    });

    socket.on('error', (error) => {
      for (const pending of session.pending.values()) {
        pending.reject(error instanceof Error ? error : new Error(String(error)));
      }
      session.pending.clear();
    });

    return session;
  }

  listDevices() {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      name: session.name,
      country: session.country,
      userId: session.userId,
      path: session.path,
      connectedAt: session.connectedAt,
      lastSeenAt: session.lastSeenAt,
      tokenMasked: session.tokenMasked,
      status: 'online',
      platform: 'android',
      provider: 'droidrun-reverse',
    }));
  }

  getDevice(deviceId) {
    const session = this.sessions.get(deviceId);
    if (!session) {
      throw new Error(`Device "${deviceId}" is not connected`);
    }
    return session;
  }

  async execute(deviceId, method, params = {}) {
    const session = this.getDevice(deviceId);
    const requestId = crypto.randomUUID();
    const payload = { id: requestId, method, params };

    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        session.pending.delete(requestId);
        reject(new Error(`RPC timeout after ${this.rpcTimeoutMs}ms: ${method}`));
      }, this.rpcTimeoutMs);

      session.pending.set(requestId, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });

      session.socket.send(JSON.stringify(payload), (error) => {
        if (error) {
          clearTimeout(timer);
          session.pending.delete(requestId);
          reject(error);
        }
      });
    });
  }

  async runAction(action, args = {}) {
    switch (action) {
      case 'list_devices': {
        const devices = this.listDevices();
        return createToolPayload(devices.length ? json(devices) : 'No mobile devices are currently connected.', {
          details: { devices },
        });
      }
      case 'read_state':
        return await this.#forward(action, args.deviceId, 'state', {
          filter: typeof args.filter === 'boolean' ? args.filter : false,
        });
      case 'open_app':
        return await this.#forward(action, args.deviceId, 'app', {
          packageName: args.packageName,
          activity: args.activity,
          stopBeforeLaunch: args.stopBeforeLaunch ?? false,
        });
      case 'find_element':
        return await this.#forward(action, args.deviceId, 'ui/find', {
          selector: args.selector || {},
          limit: args.limit ?? 10,
        });
      case 'click_element':
        return await this.#forward(action, args.deviceId, 'ui/click', {
          selector: args.selector || {},
        });
      case 'input_text': {
        const hasSelector = !!args.selector;
        return await this.#forward(action, args.deviceId, hasSelector ? 'ui/input' : 'keyboard/set_text', {
          selector: args.selector,
          base64_text: toBase64(String(args.text || '')),
          clear: args.clear ?? true,
        });
      }
      case 'capture_screen':
        return await this.#forward(action, args.deviceId, 'screenshot', {
          hideOverlay: args.hideOverlay ?? true,
        });
      case 'list_packages':
        return await this.#forward(action, args.deviceId, 'packages', {});
      default:
        throw new Error(`Unsupported mobile action: ${action}`);
    }
  }

  #handleMessage(session, raw) {
    let parsed;
    try {
      parsed = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
    } catch {
      return;
    }

    if (parsed?.id && session.pending.has(parsed.id)) {
      const pending = session.pending.get(parsed.id);
      session.pending.delete(parsed.id);
      if (parsed.status === 'error') {
        pending.reject(new Error(parsed.error || 'Unknown device error'));
        return;
      }
      pending.resolve(parsed.result);
    }
  }

  async #forward(action, deviceId, method, params) {
    const result = await this.execute(String(deviceId || ''), method, params);
    const text =
      typeof result === 'string'
        ? result
        : json(result);
    return createToolPayload(text, {
      details: {
        action,
        deviceId,
        method,
        result,
      },
    });
  }
}
