# Aletheia - 深度荣格心理分析师

这是一个基于微信小程序的深度心理分析应用，核心代号 "Aletheia"。
不同于普通的聊天机器人，Aletheia 扮演一位荣格流派的分析师，旨在揭示用户潜意识的动力，而非简单的算命或闲聊。

本项目集成了深度推理模型（Deep Reasoning），能够展示 AI 的思考过程（Chain of Thought）。

## ✨ 核心特性

*   **深度推理 (Chain of Thought)**: 引入 `<think>` 标签机制，在回复前展示 AI 的心理动力学推理过程。
*   **荣格流派分析**: 专注于意象分析、阴影探测和原型识别，严禁封建迷信，引导用户向内探索。
*   **流式响应 (Streaming)**: 支持打字机效果，将“思考过程”与“正式回复”分层渲染。
*   **双端支持**:
    *   **云开发模式**: 适合微信原生云开发环境 (Cloud Functions)。
    *   **本地服务器模式**: 提供基于 Express 的本地服务，支持 SSE (Server-Sent Events) 流式传输，方便对接 DeepSeek 等大模型 API。

## 📂 目录结构

*   `miniprogram/`: 小程序前端代码 (TypeScript + SCSS)。
    *   `pages/chat/`: 核心聊天页面，实现了流式消息渲染和思考过程展示。
*   `cloudfunctions/`: 微信云函数。
    *   `analyzeDream/`: 简单的云端推理接口 (主要用于演示或轻量级调用)。
*   `server/`: 本地 Node.js 后端服务。
    *   `index.js`: 代理 DeepSeek API，处理流式响应，包含 Prompt 工程。

## 🚀 快速开始

### 1. 小程序前端
1.  使用 **微信开发者工具** 导入项目根目录。
2.  AppID 修改为你的小程序 AppID (或使用测试号)。
3.  在 `project.config.json` 中确认根目录配置。

### 2. 后端服务 (推荐用于开发调试)
本项目包含一个独立的 Express 服务器，用于处理复杂的流式 API 请求。

进入 server 目录：
```bash
cd server
```

安装依赖：
```bash
npm install
```

配置环境变量：
在 `server` 目录下创建 `.env` 文件，填入你的 DeepSeek API Key：
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
PORT=8080
```
*如果未配置 Key，服务将自动进入**模拟模式**，返回预设的推理演示。*

启动服务：
```bash
npm start
```
服务默认运行在 `http://localhost:8080`。

### 3. 联调
确保小程序前端的请求地址指向本地服务器 (需在微信开发者工具中开启“不校验合法域名”)，或指向部署后的云函数。

## 🛠️ 技术栈
*   **前端**: WeChat Mini Program, TypeScript, SCSS
*   **后端**: Node.js, Express
*   **AI**: DeepSeek (R1/Reasoner), 提示词工程 (Prompt Engineering)

## ⚠️ 注意事项
*   本项目仅供学习和研究用途。
*   AI 回复仅供参考，不构成专业心理咨询建议。
