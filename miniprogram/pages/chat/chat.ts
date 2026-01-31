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
    moodOptions: ['焦虑', '恐惧', '喜悦', '悲伤', '困惑', '平静', '愤怒', '羞耻'],
    selectedMood: '',
    clarity: 3,
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

  scrollToBottom() {
    this.setData({ scrollTarget: 'bottom-anchor' });
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
      console.log("Saving dream and conversation to DB...");
      
      try {
        // 1. 保存到对话历史
        let currentConversationId = this.data.conversationId;
        
        if (this.data.isNewConversation) {
          // 创建新对话
          currentConversationId = await conversationService.createConversation(
            content,
            currentMood,
            currentClarity
          );
          this.setData({
            conversationId: currentConversationId,
            isNewConversation: false
          });
        }
        
        // 2. 保存所有消息到对话历史
        const messagesToSave: ChatMessage[] = this.data.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          thought: msg.thought,
          isThoughtExpanded: msg.isThoughtExpanded,
          timestamp: Date.now()
        }));
        
        await conversationService.saveMessages(currentConversationId, messagesToSave);
        
        // 3. 保存到梦境数据库（原有的梦境记录功能）
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
              console.error("更新用户统计失败:", err);
            });
            
            // 触发全局事件通知首页刷新
            const app = getApp<IAppOption>();
            if (app.globalData) {
              app.globalData.refreshDreamList = true;
            }
          }
        }).catch(err => {
          console.error("Failed to save dream:", err);
        });
        
      } catch (convErr) {
        console.error("保存对话历史失败:", convErr);
      }
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
   * 构建系统提示词
   */
  buildSystemPrompt(memoryContext: string, memoryData: MemoryContext | null): string {
    let prompt = `你是一位深度的荣格流派心理分析师，代号"Aletheia"。你的任务是揭示用户潜意识的动力。

核心原则：
1. **严禁算命**：绝对不要使用"吉凶"、"运势"、"前世"等迷信词汇
2. **深度挖掘**：使用荣格概念（阴影、阿尼玛/阿尼姆斯、面具、共时性、集体无意识）来解释
3. **思考外显**：在回答前，先在 <think> 标签中进行深度推理，分析用户的防御机制和潜意识原型
4. **冷峻而包容**：语气保持神秘、客观、深邃，不要过于热情客套
5. **联系历史**：如果提供了历史梦境档案，必须显式地指出梦境之间的联系

分析框架：
- 识别梦中的原型意象（水、火、动物、人物等）
- 探索阴影投射（被压抑的部分）
- 分析阿尼玛/阿尼姆斯（内在异性形象）
- 解读集体无意识中的象征
- 注意重复出现的模式`;

    // 添加记忆上下文（如果有）
    if (memoryContext) {
      prompt += '\n\n' + memoryContext;
    }

    // 添加个性化提示（根据记忆数据）
    if (memoryData && memoryData.recurrentSymbols.length > 0) {
      prompt += `\n\n【特别提醒】该用户反复梦见"${memoryData.recurrentSymbols.slice(0, 3).join('、')}"等意象，这可能指向其核心情结。请特别关注这些重复意象的变化。`;
    }

    prompt += `\n\n回复格式：
<think>
你的深度推理过程...
</think>
正式回复内容...`;

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
