import { memoryService, MemoryContext } from '../../services/memory.service';
import { conversationService, ChatMessage } from '../../services/conversation.service';

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
    // 对话相关
    conversationId: '',
    isNewConversation: true,
    // Dream Metadata
    isMetadataVisible: false,
    moodOptions: ['焦虑', '恐惧', '喜悦', '悲伤', '困惑', '平静', '愤怒'],
    selectedMood: '困惑',
    clarity: 3,
    // 导航栏高度
    navBarHeight: 0,
  },

  onLoad(options: any) {
    if (options.conversationId) {
      // 继续历史对话
      this.setData({ 
        conversationId: options.conversationId,
        isNewConversation: false 
      });
      this.loadConversation(options.conversationId);
    } else {
      // 新建对话
      this.setData({ isNewConversation: true });
      this.addMessage({
        id: 'system_welcome',
        role: 'assistant',
        content: '我是 Aletheia。请告诉我，此刻你心中正压抑着什么？',
        thought: '初始化荣格心理模型...\n校准潜意识参数...',
        isThoughtExpanded: false,
        isStreaming: false
      });
    }
  },

  /**
   * 加载历史对话
   */
  async loadConversation(conversationId: string) {
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 加载对话信息
      const conversation = await conversationService.getConversation(conversationId);
      if (!conversation) {
        throw new Error('对话不存在');
      }
      
      // 加载消息列表
      const messages = await conversationService.getMessages(conversationId);
      
      // 转换消息格式
      const formattedMessages: Message[] = messages.map((msg: ChatMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        thought: msg.thought,
        isThoughtExpanded: msg.isThoughtExpanded || false,
        isStreaming: false
      }));
      
      // 如果没有消息，添加欢迎消息
      if (formattedMessages.length === 0) {
        formattedMessages.push({
          id: 'system_welcome',
          role: 'assistant',
          content: '我是 Aletheia。请告诉我，此刻你心中正压抑着什么？',
          thought: '初始化荣格心理模型...\n校准潜意识参数...',
          isThoughtExpanded: false,
          isStreaming: false
        });
      }
      
      this.setData({
        messages: formattedMessages,
        selectedMood: conversation.mood || '',
        clarity: conversation.clarity || 3
      });
      
      // 滚动到底部
      this.scrollToBottom();
      
    } catch (err) {
      console.error('加载对话失败:', err);
      wx.showToast({ title: '加载失败', icon: 'error' });
      // 加载失败时显示欢迎消息
      this.addMessage({
        id: 'system_welcome',
        role: 'assistant',
        content: '我是 Aletheia。请告诉我，此刻你心中正压抑着什么？',
        thought: '初始化荣格心理模型...\n校准潜意识参数...',
        isThoughtExpanded: false,
        isStreaming: false
      });
    } finally {
      wx.hideLoading();
    }
  },

  // Metadata Handlers
  toggleMetadata() {
    this.setData({ isMetadataVisible: !this.data.isMetadataVisible });
    wx.vibrateShort({ type: 'light' });
  },
  selectMood(e: any) {
    this.setData({ selectedMood: e.currentTarget.dataset.mood });
    wx.vibrateShort({ type: 'light' });
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
    wx.vibrateShort({ type: 'light' });
  },

  onLongPressMessage(e: any) {
    const id = e.currentTarget.dataset.id;
    const message = this.data.messages.find(msg => msg.id === id);
    
    if (!message || message.role === 'system' || message.id === 'system_welcome') {
      return;
    }
    
    wx.showActionSheet({
      itemList: ['复制', '删除'],
      success: (res: any) => {
        if (res.tapIndex === 0) {
          this.copyMessage(message.content);
        } else if (res.tapIndex === 1) {
          this.deleteMessage(id);
        }
      }
    });
  },

  copyMessage(content: string) {
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success', duration: 1500 });
      }
    });
  },

  deleteMessage(id: string) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条消息吗？',
      success: (res: any) => {
        if (res.confirm) {
          const messages = this.data.messages.filter(msg => msg.id !== id);
          this.setData({ messages });
          wx.vibrateShort({ type: 'medium' });
          wx.showToast({ title: '已删除', icon: 'success', duration: 1500 });
        }
      }
    });
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

  scrollToBottom() {
    this.setData({ scrollTarget: 'bottom-anchor' });
  },

  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || this.data.isStreaming) return;

;

    // 触觉反馈
    wx.vibrateShort({ type: 'light' });

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

      // --- Memory Injection Start (Optimized) ---
      let memoryContext = "";
      let memoryData: MemoryContext | null = null;
      
      try {
        memoryData = await memoryService.loadMemoryContext(content);
        memoryContext = memoryData.text;
        
        // 如果有相关记忆，打印日志
        if (memoryData.relatedDreams.length > 0) {
          console.log(`[Memory] 加载了 ${memoryData.relatedDreams.length} 条相关梦境`);
          console.log(`[Memory] 反复出现的意象:`, memoryData.recurrentSymbols);
          console.log(`[Memory] 情绪趋势:`, memoryData.emotionTrend);
        }
      } catch (err) {
        console.error("[Memory] 加载记忆失败:", err);
        // 失败时继续，不使用记忆
      }
      // --- Memory Injection End ---

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(memoryContext, memoryData);
      
      const finalMessages = [
        { role: 'system', content: systemPrompt },
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
      // Analysis complete. Save to Cloud DB and Conversation History.
      console.log("[SAVE DEBUG] ========== 开始保存流程 ==========");
      console.log("[SAVE DEBUG] 当前状态:", {
        isNewConversation: this.data.isNewConversation,
        conversationId: this.data.conversationId,
        messagesCount: this.data.messages.length
      });
      
      try {
        // 1. 保存到对话历史
        let currentConversationId = this.data.conversationId;
        
        if (this.data.isNewConversation) {
          console.log("[SAVE DEBUG] 创建新对话...");
          console.log("[SAVE DEBUG] 参数:", { content: content.substring(0, 30), currentMood, currentClarity });
          
          try {
            currentConversationId = await conversationService.createConversation(
              content,
              currentMood,
              currentClarity
            );
            console.log("[SAVE DEBUG] 新对话创建成功, ID:", currentConversationId);
            
            this.setData({
              conversationId: currentConversationId,
              isNewConversation: false
            });
            console.log("[SAVE DEBUG] 状态已更新");
          } catch (createErr: any) {
            console.error("[SAVE DEBUG] 创建对话失败:", createErr);
            throw createErr;
          }
        } else {
          console.log("[SAVE DEBUG] 使用现有对话, ID:", currentConversationId);
        }
        
        // 2. 保存所有消息到对话历史
        console.log("[SAVE DEBUG] 准备保存消息, 消息数量:", this.data.messages.length);
        
        // 过滤掉空消息和系统欢迎消息
        const validMessages = this.data.messages.filter(msg => {
          const isValid = msg.content && msg.content.trim().length > 0 && msg.id !== 'system_welcome';
          if (!isValid) {
            console.log("[SAVE DEBUG] 过滤掉消息:", { id: msg.id, role: msg.role, hasContent: !!msg.content });
          }
          return isValid;
        });
        
        console.log("[SAVE DEBUG] 有效消息数量:", validMessages.length);
        
        const messagesToSave: ChatMessage[] = validMessages.map((msg, index) => {
          const saveMsg = {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            thought: msg.thought,
            isThoughtExpanded: msg.isThoughtExpanded,
            timestamp: Date.now() + index // 添加index确保时间戳唯一
          };
          console.log("[SAVE DEBUG] 消息准备:", { id: saveMsg.id, role: saveMsg.role, contentLength: saveMsg.content && saveMsg.content.length });
          return saveMsg;
        });
        
        console.log("[SAVE DEBUG] 开始调用 saveMessages, conversationId:", currentConversationId);
        
        try {
          await conversationService.saveMessages(currentConversationId, messagesToSave);
          console.log("[SAVE DEBUG] saveMessages 调用成功");
        } catch (saveMsgErr: any) {
          console.error("[SAVE DEBUG] saveMessages 失败:", saveMsgErr);
          throw saveMsgErr;
        }
        
        // 3. 保存到梦境数据库（原有的梦境记录功能）
        console.log("[SAVE DEBUG] 开始保存到梦境数据库...");
        
        wx.cloud.callFunction({
          name: 'saveDream',
          data: {
            content: content,
            analysis: fullAnalysisText,
            mood: currentMood,
            clarity: currentClarity
          }
        }).then((res: any) => {
          console.log("[SAVE DEBUG] saveDream 结果:", res);
          if (res.result && res.result.success) {
            const summary = res.result.summary || '梦境已记录';
            wx.showToast({ 
              title: `已记录:${summary.substring(0, 6)}${summary.length > 6 ? '...' : ''}`, 
              icon: 'none',
              duration: 2000
            });
            
            // 更新用户统计
            wx.cloud.callFunction({
              name: 'updateUser',
              data: { action: 'recordDream' }
            }).catch(err => {
              console.error("[SAVE DEBUG] 更新用户统计失败:", err);
            });
            
            // 触发全局事件通知首页刷新
            const app = getApp<IAppOption>();
            if (app.globalData) {
              app.globalData.refreshDreamList = true;
            }
          } else {
            console.error("[SAVE DEBUG] saveDream 返回失败:", res.result);
          }
        }).catch(err => {
          console.error("[SAVE DEBUG] saveDream 调用失败:", err);
        });
        
      } catch (convErr: any) {
        console.error("[SAVE DEBUG] 保存流程出错:", convErr);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
      console.log("[SAVE DEBUG] ========== 保存流程结束 ==========");
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

  /**
   * 导航栏高度就绪回调
   */
  onNavBarHeightReady(e: any) {
    const { totalHeight } = e.detail;
    this.setData({ navBarHeight: totalHeight });
  },

  /**
   * 构建系统提示词
   */
  buildSystemPrompt(memoryContext: string, memoryData: MemoryContext | null): string {
    let prompt = `你是荣格心理分析师Aletheia。分析梦境，揭示潜意识。

规则：
1. 严禁算命、预测吉凶
2. 用荣格概念（阴影、阿尼玛、原型）分析
3. <think>内写推理，外面写结论
4. 回复控制在300字内，简洁直接
5. 不要客套话、问候语、总结性废话`;

    // 添加记忆上下文（精简版）
    if (memoryContext && memoryData && memoryData.relatedDreams.length > 0) {
      prompt += `\n\n历史梦境：${memoryData.relatedDreams.length}次。`;
      if (memoryData.recurrentSymbols.length > 0) {
        prompt += `反复意象：${memoryData.recurrentSymbols.slice(0, 2).join('、')}。`;
      }
    }

    return prompt;
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
