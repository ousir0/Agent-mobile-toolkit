# OClaw Mobile Toolkit

这是一个独立的 mobile tool 项目，用来把 Android Portal、反向连接 bridge、OpenClaw 插件和 Codex / Claude 的 MCP 接入整合到一个仓库里。

## 目标

1. 手机端继续使用 Android Portal 反向连接能力。
2. 桌面侧提供一个统一 bridge，把手机动作暴露给 OpenClaw / Codex / Claude。
3. 提供一套可复用的安装脚本、技能模板、workflow 模板，方便后续分发。

## 目录

1. `app/`
   Android Portal 源码。
2. `src/bridge-server.js`
   反向连接 bridge，负责接收手机 WebSocket 和处理 `/bridge` HTTP 回调。
3. `src/mcp-server.js`
   给 Codex / Claude 用的 MCP server。
4. `integrations/openclaw/mobile-tools/`
   OpenClaw 插件。
5. `skills/mobile-toolkit/`
   通用 skill 模板。
6. `workflows/`
   初始化 workflow 模板。

## 快速启动

```bash
npm install
npm run bridge -- --host 0.0.0.0 --ws-port 8765 --http-port 8787 --token 123456 --plugin-secret change-me
```

手机端自定义链接填写：

```text
WebSocket URL: ws://<你的局域网IP>:8787/v1/providers/personal/join
Token: 123456
```

说明：
1. 手机端现在需要的是完整 WebSocket 地址，带上 `/v1/providers/personal/join`。
2. token 单独填写，不拼到 URL 里。

## 生成接入配置

OpenClaw：

```bash
node scripts/bootstrap.mjs openclaw-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

Codex：

```bash
node scripts/bootstrap.mjs codex-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

Claude：

```bash
node scripts/bootstrap.mjs claude-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

把 OpenClaw 插件安装到目标项目：

```bash
node scripts/bootstrap.mjs install-openclaw-plugin --target /path/to/oclaw
```

导出 skill / workflow 资产：

```bash
node scripts/bootstrap.mjs install-agent-assets --target /path/to/output
```

## 自动化测试

Node bridge / bootstrap 测试：

```bash
npm test
```

Android 单元测试：

```bash
./gradlew test
```

## 兼容说明

1. OpenClaw 走插件回调模式。
2. Codex / Claude 走 MCP。
3. 手机端协议兼容当前 Portal 的 reverse WebSocket JSON-RPC。
