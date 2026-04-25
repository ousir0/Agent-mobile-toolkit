import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createBridgeServer } from '../src/bridge-server.js';

const servers = [];

const listen = async (server) => {
  await server.start();
  servers.push(server);
  return server;
};

afterEach(async () => {
  while (servers.length) {
    const server = servers.pop();
    await server.stop();
  }
});

const connectFakeDevice = async ({ port, token, deviceId = 'device-1' }) => {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/v1/providers/personal/join`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Device-ID': deviceId,
      'X-Device-Name': 'Pixel Test',
      'X-Device-Country': 'CN',
    },
  });

  socket.on('message', (raw) => {
    const payload = JSON.parse(raw.toString());
    if (payload.method === 'state') {
      socket.send(JSON.stringify({ id: payload.id, status: 'success', result: { package: 'com.demo', nodes: [{ text: '搜索' }] } }));
      return;
    }
    if (payload.method === 'ui/input') {
      socket.send(JSON.stringify({ id: payload.id, status: 'success', result: { ok: true, method: 'ui/input' } }));
      return;
    }
    if (payload.method === 'screenshot') {
      socket.send(JSON.stringify({ id: payload.id, status: 'success', result: 'ZmFrZS1wbmc=' }));
      return;
    }
    socket.send(JSON.stringify({ id: payload.id, status: 'success', result: { ok: true, method: payload.method, params: payload.params } }));
  });

  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });

  return socket;
};

describe('bridge server', () => {
  it('lists connected devices over HTTP bridge action', async () => {
    const server = await listen(createBridgeServer({
      host: '127.0.0.1',
      wsPort: 8875,
      httpPort: 8876,
      token: 'abc123',
      pluginSecret: 'secret',
    }));

    const socket = await connectFakeDevice({ port: 8876, token: 'abc123' });
    expect(server.bridge.listDevices()).toHaveLength(1);

    const response = await fetch('http://127.0.0.1:8876/bridge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': 'secret',
      },
      body: JSON.stringify({ action: 'list_devices', args: {} }),
    });
    const payload = await response.json();
    expect(payload.content[0].text).toContain('device-1');
    socket.close();
  });

  it('forwards read_state and input_text to connected device', async () => {
    await listen(createBridgeServer({
      host: '127.0.0.1',
      wsPort: 8975,
      httpPort: 8976,
      token: 'bridge-token',
      pluginSecret: 'plugin-secret',
    }));

    const socket = await connectFakeDevice({ port: 8976, token: 'bridge-token' });

    const stateRes = await fetch('http://127.0.0.1:8976/bridge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': 'plugin-secret',
      },
      body: JSON.stringify({ action: 'read_state', args: { deviceId: 'device-1', filter: false } }),
    });
    const statePayload = await stateRes.json();
    expect(statePayload.content[0].text).toContain('com.demo');

    const inputRes = await fetch('http://127.0.0.1:8976/bridge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': 'plugin-secret',
      },
      body: JSON.stringify({
        action: 'input_text',
        args: {
          deviceId: 'device-1',
          text: 'hello',
          selector: { text: '搜索' },
        },
      }),
    });
    const inputPayload = await inputRes.json();
    expect(inputPayload.details.result.method).toBe('ui/input');
    socket.close();
  });

  it('forwards tap, swipe, and upload_file to connected device', async () => {
    await listen(createBridgeServer({
      host: '127.0.0.1',
      wsPort: 9075,
      httpPort: 9076,
      token: 'bridge-token',
      pluginSecret: 'plugin-secret',
    }));

    const socket = await connectFakeDevice({ port: 9076, token: 'bridge-token' });

    const tapRes = await fetch('http://127.0.0.1:9076/bridge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': 'plugin-secret',
      },
      body: JSON.stringify({ action: 'tap', args: { deviceId: 'device-1', x: 120, y: 340 } }),
    });
    const tapPayload = await tapRes.json();
    expect(tapPayload.details.result.method).toBe('tap');

    const swipeRes = await fetch('http://127.0.0.1:9076/bridge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': 'plugin-secret',
      },
      body: JSON.stringify({
        action: 'swipe',
        args: { deviceId: 'device-1', startX: 100, startY: 200, endX: 300, endY: 400, duration: 500 },
      }),
    });
    const swipePayload = await swipeRes.json();
    expect(swipePayload.details.result.method).toBe('swipe');

    const uploadRes = await fetch('http://127.0.0.1:9076/bridge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcp-bridge-secret': 'plugin-secret',
      },
      body: JSON.stringify({
        action: 'upload_file',
        args: { deviceId: 'device-1', path: '/sdcard/Pictures/test.png', dataBase64: 'ZmFrZQ==' },
      }),
    });
    const uploadPayload = await uploadRes.json();
    expect(uploadPayload.details.result.method).toBe('files/upload');
    socket.close();
  });
});
