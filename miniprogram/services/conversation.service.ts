// conversation.service.ts - 对话历史管理服务

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  isThoughtExpanded?: boolean;
  timestamp: number;
}

export interface Conversation {
  _id?: string;
  _openid?: string;
  title: string;
  preview: string;
  messageCount: number;
  lastMessageTime: number;
  createTime: number;
  mood?: string;
  clarity?: number;
  isArchived?: boolean;
}

class ConversationService {
  private DB_NAME: string;
  private MSG_DB_NAME: string;

  constructor() {
    this.DB_NAME = 'conversations';
    this.MSG_DB_NAME = 'chat_messages';
  }

  /**
   * 创建新对话
   */
  async createConversation(firstMessage: string, mood?: string, clarity?: number): Promise<string> {
    const db = wx.cloud.database();
    const now = Date.now();
    
    const title = this.generateTitle(firstMessage);
    const preview = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
    
    const conversation: Omit<Conversation, '_id' | '_openid'> = {
      title,
      preview,
      messageCount: 0,
      lastMessageTime: now,
      createTime: now,
      mood,
      clarity,
      isArchived: false
    };
    
    const result = await db.collection(this.DB_NAME).add({ data: conversation });
    return result._id;
  }

  /**
   * 获取对话列表
   */
  async getConversations(limit: number = 20): Promise<Conversation[]> {
    const db = wx.cloud.database();
    
    const { data } = await db.collection(this.DB_NAME)
      .where({ isArchived: false })
      .orderBy('lastMessageTime', 'desc')
      .limit(limit)
      .get();
    
    return data as Conversation[];
  }

  /**
   * 获取单个对话
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const db = wx.cloud.database();
    
    try {
      const { data } = await db.collection(this.DB_NAME).doc(conversationId).get();
      return data as Conversation;
    } catch (err) {
      console.error('获取对话失败:', err);
      return null;
    }
  }

  /**
   * 保存消息
   */
  async saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const db = wx.cloud.database();
    
    // 保存消息
    await db.collection(this.MSG_DB_NAME).add({
      data: {
        conversationId,
        ...message,
        createTime: Date.now()
      }
    });
    
    // 更新对话的 lastMessageTime 和 messageCount
    await db.collection(this.DB_NAME).doc(conversationId).update({
      data: {
        lastMessageTime: Date.now(),
        messageCount: db.command.inc(1),
        preview: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
      }
    });
  }

  /**
   * 批量保存消息（用于保存完整对话）
   */
  async saveMessages(conversationId: string, messages: ChatMessage[]): Promise<void> {
    const db = wx.cloud.database();
    const now = Date.now();
    
    // 批量添加消息
    const batch = messages.map(msg => ({
      conversationId,
      ...msg,
      createTime: now
    }));
    
    // 云数据库不支持真正的批量插入，需要逐个添加
    for (const msg of batch) {
      await db.collection(this.MSG_DB_NAME).add({ data: msg });
    }
    
    // 更新对话统计
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      await db.collection(this.DB_NAME).doc(conversationId).update({
        data: {
          lastMessageTime: now,
          messageCount: messages.length,
          preview: lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
        }
      });
    }
  }

  /**
   * 获取对话的所有消息
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const db = wx.cloud.database();
    
    const { data } = await db.collection(this.MSG_DB_NAME)
      .where({ conversationId })
      .orderBy('timestamp', 'asc')
      .get();
    
    return data.map((item: any) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      thought: item.thought,
      isThoughtExpanded: item.isThoughtExpanded,
      timestamp: item.timestamp
    })) as ChatMessage[];
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const db = wx.cloud.database();
    
    // 删除所有相关消息
    const messages = await db.collection(this.MSG_DB_NAME)
      .where({ conversationId })
      .get();
    
    for (const msg of messages.data) {
      await db.collection(this.MSG_DB_NAME).doc(msg._id).remove();
    }
    
    // 删除对话
    await db.collection(this.DB_NAME).doc(conversationId).remove();
  }

  /**
   * 归档对话
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const db = wx.cloud.database();
    
    await db.collection(this.DB_NAME).doc(conversationId).update({
      data: { isArchived: true }
    });
  }

  /**
   * 生成对话标题
   */
  private generateTitle(content: string): string {
    const trimmedContent = content.trim();
    
    // 如果内容很短，直接返回
    if (trimmedContent.length <= 20) {
      return trimmedContent || '新对话';
    }
    
    // 尝试提取关键意象（如梦见...）
    const dreamPatterns = [
      /梦(?:见|到|里)([^，。！？]{2,10})/,
      /(?:看到|遇见|发现)([^，。！？]{2,10})/,
      /(?:在|去|回)([^，。！？]{2,10})/
    ];
    
    for (const pattern of dreamPatterns) {
      const match = trimmedContent.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 如果提取不到关键意象，返回前20个字符
    return trimmedContent.substring(0, 20) + '...';
  }
}

export const conversationService = new ConversationService();
