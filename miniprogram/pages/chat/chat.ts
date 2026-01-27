interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  isThoughtExpanded?: boolean;
  isStreaming?: boolean;
}

Page({
  data: {
    messages: [] as Message[],
    inputValue: '',
    scrollTarget: '',
    isStreaming: false,
  },

  onLoad() {
    this.addMessage({
      id: 'system_welcome',
      role: 'assistant',
      content: '我是 Aletheia。请告诉我，此刻你心中正压抑着什么？',
      thought: '初始化荣格心理模型...\n校准潜意识参数...',
      isThoughtExpanded: false,
      isStreaming: false
    });
  },

  onInput(e: any) {
    this.setData({ inputValue: e.detail.value });
  },

  toggleThought(e: any) {
    const id = e.currentTarget.dataset.id;
    const messages = this.data.messages.map(msg => {
      if (msg.id === id) {
        return { ...msg, isThoughtExpanded: !msg.isThoughtExpanded };
      }
      return msg;
    });
    this.setData({ messages });
  },

  addMessage(msg: Message) {
    this.setData({
      messages: [...this.data.messages, msg],
      scrollTarget: 'bottom-anchor'
    });
  },

  updateLastMessage(updates: Partial<Message>) {
    const messages = [...this.data.messages];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      messages[messages.length - 1] = { ...lastMsg, ...updates };
      this.setData({ messages });
    }
  },

  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || this.data.isStreaming) return;

    // 1. 用户消息上屏
    this.addMessage({
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: content
    });
    this.setData({ inputValue: '', isStreaming: true });

    // 2. AI 占位符 (显示"分析中...")
    const aiMsgId = `msg_${Date.now()}_a`;
    this.addMessage({
      id: aiMsgId,
      role: 'assistant',
      content: '', // 暂时为空，等待打字机效果
      thought: '正在连接潜意识网络 (Cloud AI)...', 
      isThoughtExpanded: true,
      isStreaming: true
    });

    let rawResult = "";

    try {
      // 3. 直接调用微信云开发 AI 能力 (需要基础库 3.7.1+)
      if (!wx.cloud.extend || !wx.cloud.extend.AI) {
        throw new Error('基础库版本过低，请在开发者工具详情-本地设置中切换到 3.7.1 以上版本');
      }

      const ai = wx.cloud.extend.AI;
      const model = ai.createModel('deepseek');

      const res = await model.generateText({
        model: 'deepseek-r1-0528',
        messages: [
          { role: 'system', content: `
你是一位深度的荣格流派心理分析师，代号"Aletheia"。你的任务是揭示用户潜意识的动力。
在回复用户之前，你必须先进行推理，并将推理过程用 <think> 和 </think> 标签包裹起来放在最前面。
` },
          ...this.data.messages
            .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content)) // 严格过滤
            .map(m => ({ role: m.role, content: m.content }))
        ]
      });
      
      console.log('AI Response:', res); // 调试日志

      if (res.choices && res.choices.length > 0) {
          rawResult = res.choices[0].message.content || "";
      } else {
          console.warn('AI 返回结构异常:', res);
          throw new Error('AI 返回了空内容');
      }

    } catch (err: any) {
      console.error('AI调用失败详情：', err);
      
      let errorMsg = err.message || JSON.stringify(err);
      let advice = "";
      
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          advice = "\n[关键提示] 401 鉴权失败。请前往微信云开发控制台 -> 设置 -> 扩展能力 / AI 智能体，确保已开启 AI 能力并获得 hunyuan-exp 权限。";
      }

      // 生成一个模拟的错误回复，包含 <think> 标签，以便前端展示
      rawResult = `<think>
[系统错误] 连接中断。
[错误详情] ${errorMsg}
[排查建议] 
1. 确保基础库版本 >= 3.7.1 (当前配置已尝试满足)。
2. 确保已在 MP 后台开通“AI 小程序成长计划”。${advice}
</think>
抱歉，我的意识暂时无法与云端同步。请检查你的网络连接或云开发权限配置。`;
    }

    // 4. 解析结果 (提取 <think> 和正文)
    const thinkMatch = rawResult.match(/<think>([\s\S]*?)<\/think>/);
    const thoughtContent = thinkMatch ? thinkMatch[1].trim() : "（无思维链数据）";
    const finalContent = rawResult.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    // 5. 启动前端“伪流式”打字机效果
    this.simulateStreaming(aiMsgId, thoughtContent, finalContent);
  },

  // 模拟打字机效果：先打思考，再打正文
  simulateStreaming(msgId: string, fullThought: string, fullContent: string) {
    let tIndex = 0;
    let cIndex = 0;

    // 清空占位符
    this.updateLastMessage({ thought: '', content: '' });

    // 定时器函数
    const typeWriter = () => {
      // 阶段1：输出思考
      if (tIndex < fullThought.length) {
        tIndex += 3; // 思考速度快一点
        const currentT = fullThought.substring(0, tIndex);
        this.updateLastMessage({ thought: currentT });
        setTimeout(typeWriter, 20);
        return;
      }

      // 阶段2：输出正文
      if (cIndex < fullContent.length) {
        cIndex += 1; // 正文速度正常
        const currentC = fullContent.substring(0, cIndex);
        this.updateLastMessage({ content: currentC });
        setTimeout(typeWriter, 50);
        return;
      }

      // 结束
      this.updateLastMessage({ isStreaming: false });
      this.setData({ isStreaming: false, scrollTarget: 'bottom-anchor' });
    };

    typeWriter();
  }
});
