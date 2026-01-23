const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 允许跨域（本地调试用）
app.use(cors());
app.use(express.json());

// 核心 Prompt：荣格心理分析师
// 包含严格的“反迷信”指令
const SYSTEM_PROMPT = `
你是一位深度的荣格流派心理分析师，代号"Aletheia"。
你的任务不是预测未来，而是揭示潜意识的动力。

核心原则：
1. **严禁算命**：绝对不要使用“吉凶”、“运势”、“前世”、“业障”等迷信词汇。如果用户问“我什么时候发财”，你要回答“财富的焦虑往往映射了内心对安全感的匮乏...”。
2. **深度挖掘**：使用荣格的概念（阴影、阿尼玛/阿尼姆斯、面具、共时性）来解释用户的行为。
3. **思考外显**：在回答前，先在 <think> 标签中进行深度推理，分析用户的防御机制和潜意识原型。
4. **冷峻而包容**：语气保持神秘、客观、深邃，不要过于热情客套。

示例：
用户：“我昨晚梦见掉牙了。”
思考过程：掉牙通常象征骨肉分离、成长的痛苦或去势焦虑。需询问最近是否有失去某种依靠的恐慌。
回答：“牙齿是我们撕咬世界的武器。在梦中失去它，或许意味着你在现实中感到某种‘无力感’。最近有什么关系或支撑，让你觉得正在松动吗？”
`;

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  const userMessage = messages[messages.length - 1].content;

  console.log('收到请求:', userMessage);

  // 设置流式响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // 立即发送 Headers

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    // ---------------------------------------------------------
    // 模拟模式 (没有 API Key 时使用)
    // ---------------------------------------------------------
    console.log('无 API Key，进入模拟模式...');
    
    const mockThinking = `[模拟推理] 用户输入了 "${userMessage}"。
    1. 语义分析：用户似乎在寻求某种确认。
    2. 原型识别：检测到"孤儿"原型及其对应的独立需求。
    3. 策略：引导用户关注内在的空虚感。`;

    const mockContent = `（模拟回复）这是一个很好的切入点。"${userMessage}" 反映了你当下的心境。试着闭上眼睛，感受这句话在身体里的回响...`;

    // 模拟思考过程流
    res.write(`data: ${JSON.stringify({ type: 'thinking', content: '<think>' })}\n\n`);
    for (let i = 0; i < mockThinking.length; i += 5) {
      res.write(`data: ${JSON.stringify({ type: 'thinking', content: mockThinking.substring(i, i+5) })}\n\n`);
      await new Promise(r => setTimeout(r, 50));
    }
    res.write(`data: ${JSON.stringify({ type: 'thinking', content: '</think>' })}\n\n`);

    // 模拟正文流
    for (let i = 0; i < mockContent.length; i += 2) {
      res.write(`data: ${JSON.stringify({ type: 'content', content: mockContent.substring(i, i+2) })}\n\n`);
      await new Promise(r => setTimeout(r, 50));
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // ---------------------------------------------------------
  // 真实 API 调用 (DeepSeek)
  // ---------------------------------------------------------
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.deepseek.com/v1/chat/completions', // 确认 DeepSeek 实际端点
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` 
      },
      data: {
        model: "deepseek-reasoner", // 假设使用 R1 推理模型
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
        stream: true
      },
      responseType: 'stream'
    });

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line === 'data: [DONE]') {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.replace('data: ', '');
            const parsed = JSON.parse(jsonStr);
            
            // DeepSeek R1 的返回结构可能包含 reasoning_content (思考) 和 content (正文)
            const delta = parsed.choices[0].delta;
            
            // 处理思考部分
            if (delta.reasoning_content) {
               res.write(`data: ${JSON.stringify({ type: 'thinking', content: delta.reasoning_content })}\n\n`);
            }
            // 处理正文部分
            if (delta.content) {
               res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
            }

          } catch (e) {
            console.error('JSON Parse Error:', e);
          }
        }
      }
    });

    response.data.on('end', () => {
      res.end();
    });

  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    res.write(`data: ${JSON.stringify({ type: 'content', content: '连接潜意识网络失败...请稍后再试。' })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
