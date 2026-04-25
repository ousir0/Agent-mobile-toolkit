# Mobile Bootstrap Workflow

1. 启动 bridge：

```bash
npm run bridge -- --host 0.0.0.0 --ws-port 8765 --http-port 8787 --token 123456 --plugin-secret change-me
```

2. 手机端填写：

```text
WebSocket URL: ws://<你的局域网IP>:8787/v1/providers/personal/join
Token: 123456
```

3. 给 OpenClaw 生成插件配置：

```bash
node scripts/bootstrap.mjs openclaw-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

4. 给 Codex / Claude 生成 MCP 配置：

```bash
node scripts/bootstrap.mjs codex-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
node scripts/bootstrap.mjs claude-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```
