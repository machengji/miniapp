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

      // --- Memory Injection Start ---
      let memoryContext = "";
      try {
        const db = wx.cloud.database();
        const res = await db.collection('dreams')
          .orderBy('createTime', 'desc')
          .limit(5)
          .get();
        
        const pastDreams = res.data;
        if (pastDreams.length > 0) {
          memoryContext = "\n\n【长期记忆档案 (Long-term Memory)】\n该用户之前的梦境记录如下（按时间倒序）：\n";
          pastDreams.forEach((d: any, i: number) => {
            // Format: 1. [Mood] Summary - Content snippet...
            const dateStr = d.createTime ? new Date(d.createTime).toLocaleDateString() : '未知日期';
            const snippet = d.content.length > 40 ? d.content.substring(0, 40) + "..." : d.content;
            memoryContext += `${i + 1}. [${dateStr}] [${d.mood || 'N/A'}] ${d.summary || '无题'}：${snippet}\n`;
          });
          memoryContext += "\n【对比分析指令】\n请务必将本次梦境与上述【长期记忆档案】进行横向对比。\n1. 寻找重复出现的意象（Recurrent Symbols）：是否有旧的意象再次出现？形态有何变化？\n2. 识别情绪曲线：用户的情绪是恶化了还是改善了？\n3. 在回复中显式地指出这些联系（例如：“这让你想起了上周那个关于...的梦...”）。";
        }
      } catch (err) {
        console.error("Failed to load memory context:", err);
        // Fail silently, proceed without memory
      }
      // --- Memory Injection End ---

      const finalMessages = [
        { role: 'system', content: `
你是一位深度的荣格流派心理分析师，代号"Aletheia"。你的任务是揭示用户潜意识的动力。
在回复用户之前，你必须先进行推理，并将推理过程用 <think> 和 </think> 标签包裹起来放在最前面。
${memoryContext}
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
        if (res.result && res.result.success) {
          const summary = res.result.summary || '梦境已记录';
          const keywords = res.result.keywords || [];
          wx.showToast({ 
            title: `已记录:${summary.substring(0, 6)}${summary.length > 6 ? '...' : ''}`, 
            icon: 'none',
            duration: 2000
          });
          
          // 更新用户统计（连续天数等）
          wx.cloud.callFunction({
            name: 'updateUser',
            data: { action: 'recordDream' }
          }).catch(err => {
            console.error("更新用户统计失败:", err);
          });
          
          // 触发全局事件通知首页刷新
          const app = getApp<IAppOption>();
          if (app.globalData) {
            app.globalData.refreshDreamList = true;
          }
        } else {
          console.error("Save returned error:", res);
          wx.showToast({ title: '保存失败', icon: 'error' });
        }
      }).catch(err => {
        console.error("Failed to save dream:", err);
        wx.showToast({ title: '保存失败', icon: 'error' });
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
