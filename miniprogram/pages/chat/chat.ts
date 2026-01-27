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
    // Dream Metadata
    isMetadataVisible: false,
    moodOptions: ['焦虑', '恐惧', '喜悦', '悲伤', '困惑', '平静', '愤怒', '羞耻'],
    selectedMood: '',
    clarity: 3,
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

  // Metadata Handlers
  toggleMetadata() {
    this.setData({ isMetadataVisible: !this.data.isMetadataVisible });
  },
  selectMood(e: any) {
    this.setData({ selectedMood: e.currentTarget.dataset.mood });
  },
  onClarityChange(e: any) {
    this.setData({ clarity: e.detail.value });
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

    // Capture metadata at the moment of sending
    const currentMood = this.data.selectedMood;
    const currentClarity = this.data.clarity;

    // 1. 用户消息上屏
    this.addMessage({
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: content
    });
    // Hide panel if open
    this.setData({ inputValue: '', isStreaming: true, isMetadataVisible: false });

    // 2. AI 占位符
    const aiMsgId = `msg_${Date.now()}_a`;
    this.addMessage({
      id: aiMsgId,
      role: 'assistant',
      content: '', 
      thought: '', 
      isThoughtExpanded: true,
      isStreaming: true
    });

    let fullAnalysisText = ""; // Store full text for saving

    try {
      if (!wx.cloud.extend || !wx.cloud.extend.AI) {
        throw new Error('基础库版本过低，请在开发者工具详情-本地设置中切换到 3.7.1 以上版本');
      }

      const ai = wx.cloud.extend.AI;
      const model = ai.createModel('hunyuan-exp');

      // 严格构造消息队列
      let history = this.data.messages
        .filter(m => m.content && m.content.trim().length > 0)
        .map(m => ({ role: m.role, content: m.content }));

      if (history.length > 0 && history[0].role === 'assistant') {
        history.shift();
      }

      const finalMessages = [
        { role: 'system', content: `
你是一位深度的荣格流派心理分析师，代号"Aletheia"。你的任务是揭示用户潜意识的动力。
在回复用户之前，你必须先进行推理，并将推理过程用 <think> 和 </think> 标签包裹起来放在最前面。
` },
        ...history
      ];

      console.log('Sending Messages to AI (Stream):', finalMessages);

      const res = await model.streamText({
        data: {
          model: 'hunyuan-turbos-latest',
          messages: finalMessages
        }
      });
      
      let fullText = "";

      for await (let chunk of res.textStream) {
         fullText += chunk;
         fullAnalysisText = fullText; // Update accumulator
         
         // 实时解析 <think>
         let thought = "";
         let content = "";
         
         const thinkStart = fullText.indexOf('<think>');
         const thinkEnd = fullText.indexOf('</think>');
         
         if (thinkStart !== -1) {
             if (thinkEnd !== -1) {
                 // 思考结束
                 thought = fullText.substring(thinkStart + 7, thinkEnd);
                 content = fullText.substring(thinkEnd + 8);
             } else {
                 // 正在思考
                 thought = fullText.substring(thinkStart + 7);
                 content = ""; 
             }
         } else {
             // 没发现 think 标签，暂时当做正文
             content = fullText;
         }

         this.updateLastMessage({
             thought: thought,
             content: content
         });
      }

      // --- SAVE TO DB ---
      // Analysis complete. Save to Cloud DB.
      console.log("Saving dream to DB...");
      wx.cloud.callFunction({
        name: 'saveDream',
        data: {
          content: content,
          analysis: fullAnalysisText,
          mood: currentMood,
          clarity: currentClarity
        }
      }).then((res: any) => {
        console.log("Dream saved:", res);
        wx.showToast({ title: '梦境已记录', icon: 'success' });
      }).catch(err => {
        console.error("Failed to save dream:", err);
      });
      // ------------------

    } catch (err: any) {
      console.error('AI调用失败详情：', err);
      let errorMsg = err.message || JSON.stringify(err);
      this.updateLastMessage({
          thought: `[系统错误]\n${errorMsg}`,
          content: "连接中断，请检查网络或配置。"
      });
    } finally {
        this.setData({ isStreaming: false, scrollTarget: 'bottom-anchor' });
        this.updateLastMessage({ isStreaming: false });
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
