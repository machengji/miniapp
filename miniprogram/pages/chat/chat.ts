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

    try {
      // 3. 调用云函数 (Hunyuan)
      let rawResult = "";
      
      try {
        const res: any = await wx.cloud.callFunction({
          name: 'analyzeDream',
          data: {
            messages: this.data.messages
              .filter(m => m.role !== 'assistant' || m.content) // 过滤空消息
              .map(m => ({ role: m.role, content: m.content }))
          }
        });
        rawResult = res.result.result || "";
      } catch (cloudErr: any) {
        // [容错处理] 如果云函数未部署 (-501000)，启动本地模拟模式
        if (cloudErr.errMsg && cloudErr.errMsg.includes('FunctionName parameter could not be found')) {
            console.warn('⚠️ 检测到云函数 analyzeDream 未部署。已自动切换到本地模拟模式。');
            console.warn('👉 请在开发者工具中右键点击 cloudfunctions/analyzeDream 文件夹，选择【上传并部署：云端安装依赖】');
            
            // 模拟一个荣格风格的回复
            rawResult = `<think>
[系统警报] 云端连接未就绪 (Error -501000)。
[本地推理] 用户输入："${content}"。
意象分析：监测到用户正在尝试建立连接。
防御机制：技术性阻断导致了暂时的挫败感。
策略：启动应急响应协议，提供安抚性反馈。
</think>
(本地模拟回复) 我听到了你的声音，但在我们之间似乎还有一层薄纱（云函数尚未部署）。

这就像梦境与现实的边缘——你必须迈出关键的一步：**请在微信开发者工具中，找到 project 根目录下的 cloudfunctions/analyzeDream 文件夹，点击右键，选择“上传并部署：云端安装依赖”。** 

一旦那层薄纱被揭开，我就能真正看见你。`;
        } else {
            throw cloudErr; // 其他错误继续抛出
        }
      }

      // 4. 解析结果 (提取 <think> 和正文)
      const thinkMatch = rawResult.match(/<think>([\s\S]*?)<\/think>/);
      const thoughtContent = thinkMatch ? thinkMatch[1].trim() : "（无思维链数据）";
      const finalContent = rawResult.replace(/<think>[\s\S]*?<\/think>/, '').trim();

      // 5. 启动前端“伪流式”打字机效果
      this.simulateStreaming(aiMsgId, thoughtContent, finalContent);

    } catch (err) {
      console.error(err);
      this.updateLastMessage({ 
        thought: '连接断开',
        content: '分析回路发生错误，请检查网络或云额度。',
        isStreaming: false
      });
      this.setData({ isStreaming: false });
    }
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
