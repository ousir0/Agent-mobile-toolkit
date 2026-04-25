#!/usr/bin/env node
import http from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer } from 'ws';
import { MobileBridge } from './mobile-bridge-core.js';

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
};

const parseArgs = (argv) => {
  const options = {
    host: '0.0.0.0',
    wsPort: 8765,
    httpPort: 8787,
    token: '',
    pluginSecret: '',
    rpcTimeoutMs: 15000,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--')) continue;
    switch (key) {
      case '--host':
        options.host = value;
        index += 1;
        break;
      case '--ws-port':
        options.wsPort = Number(value);
        index += 1;
        break;
      case '--http-port':
        options.httpPort = Number(value);
        index += 1;
        break;
      case '--token':
        options.token = value || '';
        index += 1;
        break;
      case '--plugin-secret':
        options.pluginSecret = value || '';
        index += 1;
        break;
      case '--rpc-timeout-ms':
        options.rpcTimeoutMs = Number(value);
        index += 1;
        break;
      default:
        break;
    }
  }
  return options;
};

export const createBridgeServer = (options = {}) => {
  const bridge = new MobileBridge({
    expectedToken: options.token,
    rpcTimeoutMs: options.rpcTimeoutMs,
  });

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        devices: bridge.listDevices(),
        wsEndpoint: `ws://${options.host}:${options.httpPort}/v1/providers/personal/join`,
      }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/devices') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ devices: bridge.listDevices() }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/bridge') {
      const secret = req.headers['x-mcp-bridge-secret'];
      if (options.pluginSecret && secret !== options.pluginSecret) {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ content: [{ type: 'text', text: 'Unauthorized mobile bridge request.' }], isError: true }));
        return;
      }

      try {
        const raw = await readBody(req);
        const payload = raw ? JSON.parse(raw) : {};
        const result = await bridge.runAction(payload.action, payload.args || {});
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
          isError: true,
        }));
      }
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    if (url.pathname !== '/v1/providers/personal/join') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    const normalizedHeaders = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value[0] : value || '']),
    );

    if (!bridge.validateHeaders(normalizedHeaders)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      bridge.registerConnection(ws, normalizedHeaders, url.pathname);
      wss.emit('connection', ws, req);
    });
  });

  return {
    bridge,
    httpServer,
    async start() {
      await new Promise((resolve) => httpServer.listen(options.httpPort, options.host, resolve));
      return this;
    },
    async stop() {
      for (const client of wss.clients) {
        client.close();
      }
      await new Promise((resolve, reject) => httpServer.close((error) => (error ? reject(error) : resolve())));
    },
  };
};

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMain) {
  const options = parseArgs(process.argv);
  const server = createBridgeServer(options);
  await server.start();
  console.log(`[oclaw-mobile-toolkit] ws://${options.host}:${options.httpPort}/v1/providers/personal/join`);
  console.log(`[oclaw-mobile-toolkit] http://127.0.0.1:${options.httpPort}/bridge`);
}
