# Aletheia 云开发AI快速接入指南

> 3分钟接入，3行代码调用，立即可用的大模型能力

---

## ⚡ 3分钟快速开始

### Step 1: 开通云开发AI（1分钟）

1. 登录 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目 → 点击"云开发"按钮
3. 进入"扩展功能" → 找到"AI" → 点击"安装"
4. 选择模型套餐：
   - **免费试用版**：混元 100万次 + DeepSeek-R1 10万次
   - **按量付费版**：混元 ¥0.001/次，DeepSeek-R1 ¥0.005/次

```
┌─────────────────────────────────────────┐
│  云开发控制台                            │
│  ├── 数据库                             │
│  ├── 存储                               │
│  ├── 云函数                             │
│  └── 扩展功能  ◄── 点击这里               │
│       └── AI  ◄── 开通AI能力             │
└─────────────────────────────────────────┘
```

### Step 2: 配置基础库（1分钟）

```json
// project.config.json
{
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": true,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "useIsolateContext": true,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "disableUseStrict": false,
    "minifyWXML": true,
    "showES6CompileOption": false,
    "useCompilerPlugins": false
  },
  "libVersion": "3.7.1",  // ← 确保基础库 >= 3.7.1
  "appid": "your-appid",
  "projectname": "aletheia",
  "description": "荣格梦境分析师",
  "condition": {}
}
```

### Step 3: 3行代码接入（1分钟）

```typescript
// pages/chat/chat.ts
Page({
  async sendMessage() {
    // ========== 核心代码开始 ==========
    const ai = wx.cloud.extend.AI;                           // 第1行
    const model = ai.createModel('hunyuan-exp');              // 第2行
    const res = await model.streamText({                      // 第3行
      data: {
        model: 'hunyuan-turbos-latest',
        messages: [
          { role: 'system', content: '你是荣格心理分析师' },
          { role: 'user', content: '我梦见自己在飞' }
        ]
      }
    });
    // ========== 核心代码结束 ==========

    // 流式接收回复
    for await (const chunk of res.textStream) {
      console.log('收到:', chunk);
    }
  }
});
```

🎉 **完成！** 现在运行小程序，即可体验AI对话。

---

## 📦 完整示例代码

### 示例1: 基础对话（非流式）

```typescript
// 适合快速问答场景
async quickChat(userInput: string): Promise<string> {
  const ai = wx.cloud.extend.AI;
  const model = ai.createModel('hunyuan-exp');
  
  const result = await model.generateText({
    model: 'hunyuan-turbos-latest',
    messages: [
      { role: 'user', content: userInput }
    ]
  });
  
  return result.text || '';
}

// 使用
const answer = await quickChat('梦见掉牙是什么意思？');
console.log(answer); // "牙齿象征..."
```

### 示例2: 打字机效果（流式）

```typescript
// 适合聊天界面，实时显示
Page({
  data: {
    messages: [],
    currentReply: '',
    isTyping: false
  },

  async streamChat(userInput: string) {
    this.setData({ isTyping: true, currentReply: '' });
    
    const ai = wx.cloud.extend.AI;
    const model = ai.createModel('hunyuan-exp');
    
    const res = await model.streamText({
      data: {
        model: 'hunyuan-turbos-latest',
        messages: [
          { role: 'user', content: userInput }
        ]
      }
    });

    // 实时更新UI
    for await (const chunk of res.textStream) {
      this.setData({
        currentReply: this.data.currentReply + chunk
      });
    }
    
    this.setData({ isTyping: false });
  }
});
```

### 示例3: 深度推理（DeepSeek-R1）

```typescript
// 适合复杂分析，展示思考过程
Page({
  data: {
    thinking: '',      // AI的思考过程
    content: '',       // 最终回复
    isThinking: false
  },

  async deepAnalyze(dream: string) {
    this.setData({ isThinking: true, thinking: '', content: '' });
    
    const ai = wx.cloud.extend.AI;
    const model = ai.createModel('deepseek-r1');
    
    const res = await model.streamText({
      data: {
        model: 'deepseek-r1',
        messages: [{
          role: 'system',
          content: '你是荣格分析师。分析前用<think>标签展示推理过程。'
        }, {
          role: 'user',
          content: dream
        }]
      }
    });

    let fullText = '';
    for await (const chunk of res.textStream) {
      fullText += chunk;
      
      // 实时解析<think>标签
      const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        this.setData({ 
          thinking: thinkMatch[1],
          content: fullText.replace(/<think>[\s\S]*?<\/think>/, '')
        });
      }
    }
    
    this.setData({ isThinking: false });
  }
});
```

### 示例4: 带历史记忆的多轮对话

```typescript
// miniprogram/services/chat.service.ts

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class ChatService {
  private history: ChatMessage[] = [];
  private readonly MAX_HISTORY = 20;

  async chat(userInput: string, onChunk?: (text: string) => void): Promise<string> {
    // 添加用户消息到历史
    this.history.push({ role: 'user', content: userInput });
    
    // 截断历史，避免过长
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(-this.MAX_HISTORY);
    }

    // 构造完整消息（带系统提示）
    const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: '你是Aletheia，荣格流派梦境分析师。'
      },
      ...this.history
    ];

    // 调用AI
    const ai = wx.cloud.extend.AI;
    const model = ai.createModel('hunyuan-exp');
    
    const res = await model.streamText({
      data: {
        model: 'hunyuan-turbos-latest',
        messages
      }
    });

    // 收集完整回复
    let fullReply = '';
    for await (const chunk of res.textStream) {
      fullReply += chunk;
      onChunk?.(chunk); // 回调用于实时更新UI
    }

    // 添加AI回复到历史
    this.history.push({ role: 'assistant', content: fullReply });
    
    return fullReply;
  }

  clearHistory() {
    this.history = [];
  }
}

export const chatService = new ChatService();
```

### 示例5: 云函数中调用AI

```javascript
// cloudfunctions/analyzeDream/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { dreamContent, userId } = event;

  // 3行代码调用AI
  const ai = cloud.extend.AI;
  const model = ai.createModel('deepseek-r1');
  const result = await model.generateText({
    model: 'deepseek-r1',
    messages: [{
      role: 'system',
      content: '分析梦境，输出JSON格式：{symbol: string, meaning: string}'
    }, {
      role: 'user',
      content: dreamContent
    }]
  });

  // 解析结果并保存到数据库
  const db = cloud.database();
  await db.collection('dreams').add({
    data: {
      userId,
      content: dreamContent,
      analysis: result.text,
      createTime: db.serverDate()
    }
  });

  return { success: true, analysis: result.text };
};
```

---

## 🔧 进阶配置

### 配置参数说明

```typescript
interface ModelConfig {
  model: string;           // 模型版本
  messages: Message[];     // 对话消息
  temperature?: number;    // 创造性(0-2)，默认0.7
  max_tokens?: number;     // 最大输出长度，默认2048
  top_p?: number;         // 核采样，默认1
  frequency_penalty?: number;  // 频率惩罚(-2~2)
  presence_penalty?: number;   // 存在惩罚(-2~2)
}

// 示例
const config = {
  model: 'hunyuan-turbos-latest',
  messages: [...],
  temperature: 0.8,    // 更创造性
  max_tokens: 1024,    // 限制回复长度
  top_p: 0.9          // 更聚焦
};
```

### 错误处理

```typescript
async function safeChat(input: string): Promise<string> {
  try {
    const ai = wx.cloud.extend.AI;
    
    // 检查AI扩展是否可用
    if (!ai) {
      throw new Error('AI扩展未开通');
    }
    
    const model = ai.createModel('hunyuan-exp');
    const res = await model.generateText({
      model: 'hunyuan-turbos-latest',
      messages: [{ role: 'user', content: input }]
    });
    
    return res.text || '暂无回复';
    
  } catch (err: any) {
    console.error('AI调用失败:', err);
    
    // 常见错误处理
    if (err.message?.includes('quota')) {
      return 'AI额度已用完，请联系管理员';
    }
    if (err.message?.includes('timeout')) {
      return '响应超时，请重试';
    }
    if (err.message?.includes('rate limit')) {
      return '请求过于频繁，请稍后再试';
    }
    
    return '服务暂时不可用，请稍后再试';
  }
}
```

---

## 💡 最佳实践

### 1. 提示词工程（Prompt Engineering）

```typescript
// 好的系统提示词
const SYSTEM_PROMPT = `
你是一位深度的荣格流派心理分析师，代号"Aletheia"。

核心原则：
1. 严禁算命：绝对不要使用"吉凶"、"运势"、"前世"等迷信词汇
2. 深度挖掘：使用荣格的概念（阴影、阿尼玛/阿尼姆斯、面具、共时性）
3. 思考外显：在回答前，先在 <think> 标签中进行深度推理
4. 冷峻而包容：语气保持神秘、客观、深邃，不要过于热情客套

示例：
用户："我梦见掉牙了。"
思考：掉牙通常象征骨肉分离、成长的痛苦或去势焦虑。
回答："牙齿是我们撕咬世界的武器。在梦中失去它，或许意味着你在现实中感到某种'无力感'。"
`;
```

### 2. 性能优化

```typescript
// 使用防抖，避免频繁调用
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 输入框实时提示（防抖300ms）
const debouncedHint = debounce(async (input: string) => {
  const hint = await getAIHint(input);
  this.setData({ hint });
}, 300);
```

### 3. 用户体验优化

```typescript
Page({
  data: {
    messages: [],
    isLoading: false,
    loadingText: '',
    loadingDots: ''
  },

  // 加载动画
  startLoading() {
    this.setData({ isLoading: true, loadingText: '正在分析梦境' });
    
    // 动态省略号
    let dots = 0;
    this.loadingInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      this.setData({
        loadingDots: '.'.repeat(dots)
      });
    }, 500);
  },

  stopLoading() {
    clearInterval(this.loadingInterval);
    this.setData({ isLoading: false });
  },

  // 打字机效果
  async typewriterEffect(text: string, callback: (char: string) => void) {
    for (let i = 0; i < text.length; i++) {
      callback(text[i]);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
});
```

---

## 📊 模型选择指南

| 场景 | 推荐模型 | 原因 |
|------|----------|------|
| 日常对话 | hunyuan-turbos-latest | 极速响应，成本低 |
| 深度分析 | deepseek-r1 | 推理能力强，有思考过程 |
| 摘要生成 | hunyuan-exp | 中文理解好 |
| 创意写作 | hunyuan-exp + temperature: 1.0 | 更有创造性 |
| 代码辅助 | deepseek-v3 | 代码能力强 |

---

## 🆘 故障排查

### 问题1: `wx.cloud.extend.AI is undefined`

**原因**: 基础库版本过低  
**解决**:
1. 开发者工具 → 详情 → 本地设置
2. 调试基础库 → 选择 3.7.1 或以上
3. 重新编译

### 问题2: `AI额度已用完`

**解决**:
1. 登录云开发控制台
2. 扩展功能 → AI → 查看额度
3. 升级套餐或购买资源包

### 问题3: 流式响应卡顿

**优化**:
```typescript
// 使用 requestAnimationFrame 优化渲染
let buffer = '';
for await (const chunk of res.textStream) {
  buffer += chunk;
  
  // 每100ms或累积50字符更新一次UI
  if (buffer.length > 50 || Date.now() - lastUpdate > 100) {
    requestAnimationFrame(() => {
      this.setData({ reply: this.data.reply + buffer });
      buffer = '';
    });
    lastUpdate = Date.now();
  }
}
```

---

## 📚 相关资源

- [完整技术文档](./CLOUD_AI_SOLUTION.md)
- [商业化方案](./PRODUCT_PLAN.md)
- [微信云开发AI官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/basic/ai.html)
- [示例项目GitHub](https://github.com/your-repo/aletheia)

---

**有问题？** 欢迎提交 Issue 或联系：aletheia@example.com
