# Agent Mobile Toolkit

[English README](./README.md)

把 Android 手机变成可复用的移动端工具节点，直接接入 Codex、OpenClaw、Claude 和其他兼容 MCP 的智能体运行时。

## ✨ 这是什么项目

Agent Mobile Toolkit 把整条移动端自动化链路打包进了一个仓库：

1. 📱 运行在手机上的 Android Portal APK
2. 🔌 运行在电脑上的反向 WebSocket bridge
3. 🧠 给 Codex / Claude 用的 MCP Server
4. 🛠️ 给 OpenClaw 用的插件、技能资产和 workflow 资产

这意味着你只需要接好一台手机，就能在多个智能体产品里复用同一套移动端能力，而不是每个产品单独做一遍接入。

## 🎯 典型场景

当你的智能体需要下面这些能力时，就适合用 Agent Mobile Toolkit：

1. 🔍 读取 Android 当前页面的 UI 树
2. 🚀 打开 App，执行移动端页面流转
3. 👆 按 selector 查找并点击控件
4. ⌨️ 在搜索框、表单、聊天输入框里输入文本
5. 📸 截图给模型做判断、校验和回放
6. 🔁 在 Codex、OpenClaw、Claude 之间复用同一套移动端 workflow

更具体的业务例子：

1. 📈 增长运营、线索捕获、移动端私域承接
2. 🧾 小红书搜索、内容采集、移动端任务流
3. 🤖 从 Codex 或 Claude 直接驱动 Android 自动化
4. 🧰 为 OpenClaw 风格项目统一分发工具、技能和 workflow

## 🧭 工作方式

```text
Android Portal APK
  -> Reverse WebSocket bridge
  -> MCP / OpenClaw integration
  -> Codex / OpenClaw / Claude
```

手机不是直接连智能体，而是先连本地 bridge，再由 bridge 暴露出稳定的 agent tools。

这种设计更容易部署，也更容易调试和复用。

## 🧩 支持的运行时

1. Codex，通过 MCP 接入
2. Claude，通过 MCP 接入
3. OpenClaw，通过本地插件回调模式接入

## 🛠️ 当前暴露的移动端工具

1. `mobile_list_devices`
2. `mobile_read_state`
3. `mobile_open_app`
4. `mobile_find_element`
5. `mobile_click_element`
6. `mobile_input_text`
7. `mobile_capture_screen`

这些工具是稳定的底层能力，可以继续往上封装场景 workflow。

## 📦 APK 下载

直接下载 APK：

1. [下载 Debug APK](https://github.com/ousir0/Agent-mobile-toolkit/releases/download/v0.1.0/com.droidrun.portal-0.6.4-debug.apk)

Release 页面：

1. [GitHub Releases](https://github.com/ousir0/Agent-mobile-toolkit/releases)

本地构建产物路径：

```text
app/build/outputs/apk/debug/com.droidrun.portal-0.6.4-debug.apk
```

## 🚀 快速开始

先安装依赖：

```bash
npm install
```

启动 bridge：

```bash
npm run bridge -- --host 0.0.0.0 --http-port 8787 --token 123456 --plugin-secret change-me
```

手机端自定义连接填写：

```text
WebSocket URL: ws://<你的局域网IP>:8787/v1/providers/personal/join
Token: 123456
```

注意：

1. 必须填完整的 WebSocket 地址
2. 必须带上 `/v1/providers/personal/join`
3. Token 单独填写，不要拼进 URL
4. 手机和电脑必须在同一个局域网

## 💬 对话里快速安装

如果你想直接让智能体帮你安装和接线，可以从这些话术开始。

Codex：

```text
帮我安装 https://github.com/ousir0/Agent-mobile-toolkit ，把这个项目的 MCP 配好，并把 Android 手机要填的 WebSocket 地址和 token 给我。
```

OpenClaw：

```text
帮我安装 https://github.com/ousir0/Agent-mobile-toolkit ，把 OpenClaw mobile plugin 配进当前项目，并启动本地 bridge。
```

Claude：

```text
帮我基于 https://github.com/ousir0/Agent-mobile-toolkit 生成可直接使用的 MCP 配置，用于本地移动端自动化。
```

## 🤖 Codex 接入

生成 Codex 的 MCP 配置：

```bash
node scripts/bootstrap.mjs codex-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

也可以直接注册 MCP：

```bash
codex mcp add agent-mobile-toolkit -- /opt/homebrew/bin/node /path/to/src/mcp-server.js --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

## 🧠 Claude 接入

生成 Claude 的 MCP 配置：

```bash
node scripts/bootstrap.mjs claude-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

## 🦀 OpenClaw 接入

生成 OpenClaw 插件配置：

```bash
node scripts/bootstrap.mjs openclaw-config --bridge-url http://127.0.0.1:8787/bridge --bridge-secret change-me
```

把 OpenClaw 插件安装到目标项目：

```bash
node scripts/bootstrap.mjs install-openclaw-plugin --target /path/to/oclaw
```

导出共享的 skills 和 workflows：

```bash
node scripts/bootstrap.mjs install-agent-assets --target /path/to/output
```

## 📁 项目结构

1. `app/` Android Portal 源码
2. `src/bridge-server.js` 反向连接 bridge
3. `src/mcp-server.js` 给 Codex / Claude 用的 MCP Server
4. `integrations/openclaw/mobile-tools/` OpenClaw 插件
5. `scripts/bootstrap.mjs` 配置和资产引导脚本
6. `skills/mobile-toolkit/` 可复用的 mobile skill 模板
7. `workflows/` 可复用的 workflow 模板

## ✅ 开发与验证

Node 侧测试：

```bash
npm test
```

Android 单测：

```bash
./gradlew test
```

Android Debug 构建：

```bash
./gradlew assembleDebug
```

## 📄 License

本项目基于 MIT License 发布。
